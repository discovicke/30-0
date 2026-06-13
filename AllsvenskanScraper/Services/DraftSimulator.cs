using System.Text.Json;

namespace AllsvenskanScraper;

public static class DraftSimulator
{
    public static void RunSimulate(string dataDir, string formation)
    {
        var gameDbPath = Path.Combine(dataDir, "game", "players.json");
        if (!File.Exists(gameDbPath))
        {
            Console.Error.WriteLine("No game database found. Run 'scrape' and 'compute' first.");
            var playersDir = Path.Combine(dataDir, "players");
            if (Directory.Exists(playersDir))
            {
                Console.WriteLine("Generating game database from player data...");
                OvrCalculator.GenerateGameDb(dataDir);
            }
            else
            {
                return;
            }
        }

        var json = File.ReadAllText(gameDbPath);
        var allCards = JsonSerializer.Deserialize<List<PlayerCard>>(json, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }) ?? [];

        if (allCards.Count == 0)
        {
            Console.Error.WriteLine("No players in game database.");
            return;
        }

        Console.WriteLine($"Loaded {allCards.Count} players for simulation");

        if (!SimulationEngine.Formations.ContainsKey(formation))
        {
            Console.Error.WriteLine($"Unknown formation '{formation}'. Available: {string.Join(", ", SimulationEngine.Formations.Keys)}");
            return;
        }

        var xi = BuildDreamTeam(allCards, formation);
        if (xi.Slots.Count < 11)
        {
            Console.Error.WriteLine($"Could only fill {xi.Slots.Count}/11 positions.");
            return;
        }

        Console.WriteLine($"\nDream Team XI ({formation}):");
        Console.WriteLine("  {0,-5} {1,-30} {2,-5}", "Slot", "Player", "OVR");
        Console.WriteLine("  {0,-5} {1,-30} {2,-5}", "----", "------", "---");
        var slots = SimulationEngine.Formations[formation];
        foreach (var slot in slots)
        {
            if (xi.Slots.TryGetValue(slot.Label, out var player))
                Console.WriteLine("  {0,-5} {1,-30} {2,-5:F1}", slot.Label, $"{player.Name} ({player.Team} {player.Season})", player.Ovr);
        }
        SimulationEngine.ComputeTeamRatings(xi);
        Console.WriteLine($"\n  Overall: {xi.Overall} | ATT {xi.Attack} MID {xi.Midfield} DEF {xi.Defence} GK {xi.GkRating}");

        Console.WriteLine($"\nSimulating 30-game Allsvenskan season...");
        var result = SimulationEngine.SimulateSeason(xi, formation);
        SimulationEngine.PrintSeasonResults(result);
    }

    public static void RunBatchSimulate(string dataDir, string formation, int nSims, int targetOvr = 0)
    {
        var gameDbPath = Path.Combine(dataDir, "game", "players.json");
        if (!File.Exists(gameDbPath))
        {
            Console.Error.WriteLine("No game database found.");
            return;
        }

        var json = File.ReadAllText(gameDbPath);
        var allCards = JsonSerializer.Deserialize<List<PlayerCard>>(json, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }) ?? [];

        if (allCards.Count == 0) { Console.Error.WriteLine("No players."); return; }
        if (!SimulationEngine.Formations.ContainsKey(formation)) { Console.Error.WriteLine($"Unknown formation '{formation}'."); return; }

        var xi = BuildDreamTeam(allCards, formation);
        if (xi.Slots.Count < 11) { Console.Error.WriteLine($"Could only fill {xi.Slots.Count}/11 positions."); return; }

        SimulationEngine.ComputeTeamRatings(xi);
        var baseOvr = xi.Overall;

        if (targetOvr > 0 && Math.Abs(targetOvr - baseOvr) > 0.1)
        {
            var boost = targetOvr - baseOvr;
            foreach (var slot in xi.Slots.Values)
            {
                slot.Ovr += boost;
            }
            SimulationEngine.ComputeTeamRatings(xi);
        }

        var effectiveOvr = xi.Overall;

        var results = new List<SeasonResult>();
        for (var i = 0; i < nSims; i++)
        {
            results.Add(SimulationEngine.SimulateSeason(xi, formation));
        }

        var undefeated = results.Count(r => r.UserTeam.Losses == 0);
        var bestResult = results.OrderByDescending(r => r.UserTeam.Points).ThenByDescending(r => r.UserTeam.GoalsFor - r.UserTeam.GoalsAgainst).First();
        var worstLosses = results.OrderBy(r => r.UserTeam.Losses).First();

        Console.WriteLine($"OVR {effectiveOvr:F1} | {nSims} sims | Obesegrade: {undefeated}/{nSims} ({100.0 * undefeated / nSims:F3}%)");
        Console.WriteLine($"  Basta  : {bestResult.UserTeam.Wins}-{bestResult.UserTeam.Draws}-{bestResult.UserTeam.Losses} | {bestResult.UserTeam.Points}p | +{bestResult.UserTeam.GoalsFor - bestResult.UserTeam.GoalsAgainst}GD");
        Console.WriteLine($"  Minst forluster: {worstLosses.UserTeam.Wins}-{worstLosses.UserTeam.Draws}-{worstLosses.UserTeam.Losses} | {worstLosses.UserTeam.Points}p");
        Console.WriteLine();
    }

    public static void RunDraftSimulate(string dataDir, string formation, int nSims, int nRerolls, string mode)
    {
        var isPeak = mode == "peak";
        var squadsFile = isPeak ? "squads_peak.json" : "squads.json";
        var squadsPath = Path.Combine(dataDir, "game", squadsFile);
        if (!File.Exists(squadsPath)) { Console.Error.WriteLine($"No {squadsFile} found. Run 'build-peak' first if using peak mode."); return; }

        var squads = JsonSerializer.Deserialize<List<Squad>>(File.ReadAllText(squadsPath), new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }) ?? [];
        if (squads.Count == 0) { Console.Error.WriteLine("No squads."); return; }
        if (!SimulationEngine.Formations.ContainsKey(formation)) { Console.Error.WriteLine($"Unknown formation '{formation}'."); return; }

        var slots = SimulationEngine.Formations[formation];
        var rng = Random.Shared;
        var ovrs = new List<double>(nSims);
        var rerollThreshold = isPeak ? 75.0 : 68.0;

        var modeLabel = $"{mode}, {nRerolls} rerolls (troskel {rerollThreshold:F0})";

        for (var sim = 0; sim < nSims; sim++)
        {
            var xi = new TeamXI { Formation = formation };
            var usedIds = new HashSet<string>();
            var rerollsLeft = nRerolls;

            foreach (var slot in slots)
            {
                PlayerCard? pick = null;
                while (true)
                {
                    pick = SpinOne(slot, squads, usedIds, rng);
                    if (pick == null) break;
                    if (pick.Ovr >= rerollThreshold || rerollsLeft <= 0) break;
                    rerollsLeft--;
                }

                if (pick != null)
                {
                    xi.Slots[slot.Label] = pick;
                    usedIds.Add(pick.Id);
                }
            }

            SimulationEngine.ComputeTeamRatings(xi);
            ovrs.Add(xi.Overall);
        }

        ovrs.Sort();
        var min = ovrs[0];
        var max = ovrs[^1];
        var avg = ovrs.Average();
        var median = ovrs[nSims / 2];
        var p10 = ovrs[(int)(nSims * 0.1)];
        var p25 = ovrs[(int)(nSims * 0.25)];
        var p75 = ovrs[(int)(nSims * 0.75)];
        var p90 = ovrs[(int)(nSims * 0.9)];
        var p95 = ovrs[(int)(nSims * 0.95)];
        var p99 = ovrs[(int)(nSims * 0.99)];

        var p86 = ovrs.Count(o => o >= 86);
        var p87 = ovrs.Count(o => o >= 87);
        var p88 = ovrs.Count(o => o >= 88);
        var p89 = ovrs.Count(o => o >= 89);

        Console.WriteLine($"\n=== DRAFT: {nSims}x {formation} ({modeLabel}) ===\n");
        Console.WriteLine($"  Min : {min:F1}   P10 : {p10:F1}   P25 : {p25:F1}");
        Console.WriteLine($"  Medel: {avg:F1}  Median: {median:F1}");
        Console.WriteLine($"  P75 : {p75:F1}   P90 : {p90:F1}   P95 : {p95:F1}   P99 : {p99:F1}   Max : {max:F1}");
        Console.WriteLine($"\n  Sannolikhet att na OVR:");
        Console.WriteLine($"  >=86: {100.0 * p86 / nSims:F2}%");
        Console.WriteLine($"  >=87: {100.0 * p87 / nSims:F2}%");
        Console.WriteLine($"  >=88: {100.0 * p88 / nSims:F2}%");
        Console.WriteLine($"  >=89: {100.0 * p89 / nSims:F2}%");
        Console.WriteLine();
    }

    private static PlayerCard? SpinOne(FormationSlot slot, List<Squad> squads, HashSet<string> usedIds, Random rng)
    {
        var squad = squads[rng.Next(squads.Count)];
        var matches = squad.Players
            .Where(p => !usedIds.Contains(p.Id))
            .Where(p => p.Positions.Any(sp => slot.SpecificPositions.Contains(sp)))
            .ToList();
        if (matches.Count == 0) return null;
        var pick = matches.OrderByDescending(p => p.Ovr).First();
        return new PlayerCard
        {
            Name = pick.Name, Season = pick.Season, Team = pick.Team,
            Ovr = pick.Ovr, Positions = new List<string>(pick.Positions), Id = pick.Id
        };
    }

    private static TeamXI BuildDreamTeam(List<PlayerCard> allCards, string formation)
    {
        var xi = new TeamXI { Formation = formation };
        var slots = SimulationEngine.Formations[formation];
        var cardsCopy = new List<PlayerCard>(allCards);

        foreach (var slot in slots)
        {
            var best = cardsCopy
                .Where(p => p.Positions.Any(sp => slot.SpecificPositions.Contains(sp)))
                .OrderByDescending(p => p.Ovr)
                .FirstOrDefault();

            if (best != null)
            {
                xi.Slots[slot.Label] = best;
                cardsCopy.Remove(best);
            }
        }

        return xi;
    }
}
