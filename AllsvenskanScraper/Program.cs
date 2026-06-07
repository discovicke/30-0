using System.Text.Json;
using AngleSharp;
using AngleSharp.Dom;
using Microsoft.Playwright;

namespace AllsvenskanScraper;

// Models

public class PlayerSeason
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Team { get; set; } = "";
    public int Season { get; set; }
    public string Nationality { get; set; } = "";
    public int Age { get; set; }
    public List<string> Positions { get; set; } = [];
    public List<string> BroadPositions { get; set; } = [];
    public int Minutes { get; set; }
    public bool IsGoalkeeper { get; set; }
    public int Games { get; set; }
    public int GamesStarted { get; set; }
    public PlayerStats Stats { get; set; } = [];
    public double? Ovr { get; set; }
}

public class PlayerStats : Dictionary<string, double>;

public class SeasonBaseline
{
    public int Season { get; set; }
    public string Position { get; set; } = "";
    public int PlayerCount { get; set; }
    public Dictionary<string, double> Averages { get; set; } = [];
    public Dictionary<string, double> Stdevs { get; set; } = [];
}

public class TeamEntry
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public List<int> Seasons { get; set; } = [];
}

// Main 

class Program
{
    static async Task Main(string[] args)
    {
        var headless = !args.Contains("--headed");
        var debug = args.Contains("--debug");
        var local = args.Contains("--local");
        var cleanArgs = args.Where(a => !a.StartsWith("--")).ToArray();
        var command = cleanArgs.Length > 0 ? cleanArgs[0].ToLower() : "help";

        switch (command)
        {
            case "scrape":
                await RunScrape(
                    cleanArgs.Length > 1 ? int.Parse(cleanArgs[1]) : 2025,
                    cleanArgs.Length > 2 ? int.Parse(cleanArgs[2]) : 2025,
                    headless, debug, local);
                break;
            case "compute":
                await RunCompute();
                break;
            case "all":
                await RunScrape(2025, 2001, headless, debug, local);
                await RunCompute();
                break;
            case "simulate":
            case "sim":
                var simFormation = cleanArgs.Length > 1 ? cleanArgs[1] : "4-3-3";
                RunSimulate(simFormation);
                break;
            case "batch":
                var batchFormation = cleanArgs.Length > 1 ? cleanArgs[1] : "4-3-3";
                var nSims = cleanArgs.Length > 2 ? int.Parse(cleanArgs[2]) : 100;
                var targetOvr = cleanArgs.Length > 3 ? int.Parse(cleanArgs[3]) : 0;
                RunBatchSimulate(batchFormation, nSims, targetOvr);
                break;
            case "draft":
                var draftFormation = cleanArgs.Length > 1 ? cleanArgs[1] : "4-3-3";
                var nDraftSims = cleanArgs.Length > 2 ? int.Parse(cleanArgs[2]) : 10000;
                var rerollMode = cleanArgs.Length > 3 ? int.Parse(cleanArgs[3]) : 0;
                RunDraftSimulate(draftFormation, nDraftSims, rerollMode);
                break;
            default:
                Console.WriteLine("Usage:");
                Console.WriteLine("  dotnet run -- scrape [startYear] [endYear] [--headed] [--debug] [--local]");
                Console.WriteLine("  dotnet run -- compute");
                Console.WriteLine("  dotnet run -- simulate [formation]");
                Console.WriteLine("  dotnet run -- batch [formation] [n]");
                Console.WriteLine("  dotnet run -- draft [formation] [n]");
                Console.WriteLine("  dotnet run -- all [--headed] [--debug] [--local]");
                Console.WriteLine();
                Console.WriteLine("Examples:");
                Console.WriteLine("  dotnet run -- scrape 2025           # live (kräver --headed för CF)");
                Console.WriteLine("  dotnet run -- scrape 2025 2025 --local  # läs från data/pages/2025/");
                Console.WriteLine("  dotnet run -- simulate 4-3-3            # testa säsongssimulation");
                Console.WriteLine("  dotnet run -- batch 4-3-3 100          # 100 simuleringar");
                Console.WriteLine("  dotnet run -- draft 4-3-3 10000        # 10k drafts");
                Console.WriteLine("  dotnet run -- all --local               # alla år lokalt");
                break;
        }
    }

    static string GetDataDir()
    {
        // Navigate from bin/Debug/net10.0 to repo root /data
        return Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "data");
    }

    static async Task RunScrape(int startYear, int endYear, bool headless = true, bool debug = false, bool local = false)
    {
        var dataDir = GetDataDir();
        Directory.CreateDirectory(Path.Combine(dataDir, "players"));
        Directory.CreateDirectory(Path.Combine(dataDir, "teams"));
        Directory.CreateDirectory(Path.Combine(dataDir, "baselines"));

        var debugDir = debug
            ? Directory.CreateDirectory(Path.Combine(dataDir, "debug")).FullName
            : null;

        var scraper = new FbrefScraper(dataDir, headless, local, debugDir);

        // Skapa pages-kataloger om --local används
        if (local)
        {
            for (var y = startYear; y >= endYear; y--)
                Directory.CreateDirectory(Path.Combine(dataDir, "pages", y.ToString()));
        }
        var allTeams = new Dictionary<string, TeamEntry>();

        var years = new List<int>();
        for (var y = startYear; y >= endYear; y--)
            years.Add(y);

        Console.WriteLine($"Scraping {years.Count} seasons: {string.Join(", ", years)}");
        Console.WriteLine();

        foreach (var year in years)
        {
            Console.WriteLine($"[{year}] Starting...");
            try
            {
                var players = await scraper.ScrapeSeasonAsync(year);

                if (players.Count == 0)
                {
                    Console.WriteLine($"[{year}] No players found (might be blocked)");
                    continue;
                }

                await scraper.SavePlayersAsync(year, players);

                foreach (var p in players)
                {
                    var teamId = p.Team.ToLower()
                        .Replace(" ", "-")
                        .Replace("/", "-")
                        .Replace("if", "")
                        .Replace("ff", "")
                        .Replace("bk", "")
                        .Replace("is", "")
                        .Replace("aif", "")
                        .Trim('-');
                    if (teamId.Length < 2) teamId = p.Team.ToLower().Replace(" ", "-");

                    if (!allTeams.ContainsKey(teamId))
                        allTeams[teamId] = new TeamEntry { Id = teamId, Name = p.Team };
                    if (!allTeams[teamId].Seasons.Contains(year))
                        allTeams[teamId].Seasons.Add(year);
                }

                Console.WriteLine($"[{year}] {players.Count} players saved");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[{year}] ERROR: {ex.Message}");
            }

            Console.WriteLine();
        }

        var teamsJson = JsonSerializer.Serialize(allTeams.Values.OrderBy(t => t.Name).ToList(),
            new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(Path.Combine(dataDir, "teams", "teams.json"), teamsJson);
        Console.WriteLine($"Teams saved: {allTeams.Count}");
        Console.WriteLine("Scrape complete!");
    }

    static async Task RunCompute()
    {
        var dataDir = GetDataDir();
        var playersDir = Path.Combine(dataDir, "players");

        if (!Directory.Exists(playersDir))
        {
            Console.Error.WriteLine("No data/players directory found. Run scrape first.");
            return;
        }

        var allPlayers = new List<PlayerSeason>();
        foreach (var file in Directory.GetFiles(playersDir, "*.json").OrderBy(f => f))
        {
            var json = await File.ReadAllTextAsync(file);
            var players = JsonSerializer.Deserialize<List<PlayerSeason>>(json, FbrefScraper.JsonOpts) ?? [];
            allPlayers.AddRange(players);
        }

        Console.WriteLine($"Loaded {allPlayers.Count} player-seasons for computation");

        // Compute derived per90 stats
        foreach (var p in allPlayers)
        {
            if (p.Minutes <= 0) continue;
            var factor = 90.0 / p.Minutes;

            if (p.Stats.TryGetValue("goals_pens", out var gp))
                p.Stats["goals_pens_per90"] = Math.Round(gp * factor, 4);
            if (p.Stats.TryGetValue("pens_att", out var pa))
                p.Stats["pens_att_per90"] = Math.Round(pa * factor, 4);
            if (p.Stats.TryGetValue("pens_made", out var pm))
                p.Stats["pens_made_per90"] = Math.Round(pm * factor, 4);
            if (p.Stats.TryGetValue("cards_yellow", out var cy))
                p.Stats["cards_yellow_per90"] = Math.Round(cy * factor, 4);
            if (p.Stats.TryGetValue("cards_red", out var cr))
                p.Stats["cards_red_per90"] = Math.Round(cr * factor, 4);
            if (p.Stats.TryGetValue("goals_against", out var ga))
                p.Stats["goals_against_per90"] = Math.Round(ga * factor, 4);
            if (p.Stats.TryGetValue("saves", out var sv))
                p.Stats["saves_per90"] = Math.Round(sv * factor, 4);
            if (p.Stats.TryGetValue("clean_sheets", out var cs))
                p.Stats["clean_sheets_per90"] = Math.Round(cs * factor, 4);
        }

        // Generate baselines
        var baselines = new List<SeasonBaseline>();
        var bySeasonPos = allPlayers
            .Where(p => p.Minutes >= 500)
            .GroupBy(p => (p.Season, Pos: p.BroadPositions.FirstOrDefault() ?? "Unknown"));

        foreach (var group in bySeasonPos)
        {
            var baseline = new SeasonBaseline
            {
                Season = group.Key.Season,
                Position = group.Key.Pos,
                PlayerCount = group.Count()
            };

            var statKeys = group.SelectMany(p => p.Stats.Keys).Distinct().ToList();
            foreach (var key in statKeys)
            {
                var vals = group.Select(p => p.Stats.GetValueOrDefault(key, 0)).ToList();
                var avg = vals.Average();
                var variance = vals.Select(v => Math.Pow(v - avg, 2)).Average();
                baseline.Averages[key] = Math.Round(avg, 4);
                baseline.Stdevs[key] = Math.Round(Math.Sqrt(variance), 4);
            }

            baselines.Add(baseline);
        }

        var blJson = JsonSerializer.Serialize(baselines, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(Path.Combine(dataDir, "baselines", "baselines.json"), blJson);
        Console.WriteLine($"Baselines saved: {baselines.Count} position-seasons");

        // Calculate raw OVR
        var computed = 0;
        foreach (var player in allPlayers)
        {
            if (player.Minutes < 500 || player.BroadPositions.Count == 0)
            {
                player.Ovr = null;
                continue;
            }

            var broadPos = player.BroadPositions[0];
            var bl = baselines.FirstOrDefault(b =>
                b.Season == player.Season && b.Position == broadPos);

            if (bl == null || bl.PlayerCount < 3)
            {
                player.Ovr = null;
                continue;
            }

            var normStats = new Dictionary<string, double>();
            foreach (var key in player.Stats.Keys)
            {
                if (!bl.Averages.ContainsKey(key) || bl.Stdevs[key] < 0.001)
                {
                    normStats[key] = 50;
                    continue;
                }
                var z = (player.Stats[key] - bl.Averages[key]) / bl.Stdevs[key];
                normStats[key] = Math.Clamp(ZScoreToPercentile(z) * 99, 1, 99);
            }

            var rawOvr = CalculateWeightedOvr(broadPos, normStats);
            player.Ovr = Math.Round(rawOvr, 1);
            computed++;
        }

        // Compute team strength and adjust OVR
        var teamSeasonStats = allPlayers
            .Where(p => p.Minutes >= 500 && p.Ovr.HasValue)
            .GroupBy(p => (p.Season, p.Team))
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var totalMin = g.Sum(p => p.Minutes);
                    return (
                        AvgGoalsPer90: g.Sum(p => p.Stats.GetValueOrDefault("goals_per90", 0) * p.Minutes) / (double)totalMin,
                        AvgOvr: g.Sum(p => p.Ovr!.Value * p.Minutes) / (double)totalMin
                    );
                });

        var seasonAvgOvr = allPlayers
            .Where(p => p.Minutes >= 500 && p.Ovr.HasValue)
            .GroupBy(p => p.Season)
            .ToDictionary(
                g => g.Key,
                g =>
                {
                    var totalMin = g.Sum(p => p.Minutes);
                    return g.Sum(p => p.Ovr!.Value * p.Minutes) / (double)totalMin;
                });

        foreach (var player in allPlayers)
        {
            if (!player.Ovr.HasValue) continue;

            var tsKey = (player.Season, player.Team);
            if (!teamSeasonStats.TryGetValue(tsKey, out var ts)) continue;
            if (!seasonAvgOvr.TryGetValue(player.Season, out var leagueOvr)) continue;

            // Compute team strength factor relative to league
            // teamFactor > 1 → stronger team, player benefits → slight discount
            // teamFactor < 1 → weaker team, player carries → bonus
            var teamFactor = ts.AvgOvr / leagueOvr;
            var adjustment = 1.0 + (1.0 - teamFactor) * 0.08;
            adjustment = Math.Clamp(adjustment, 0.85, 1.15);

            // For defenders: if team concedes more (proxy: more tackles), discount defensive stats
            var broadPos = player.BroadPositions.Count > 0 ? player.BroadPositions[0] : "Unknown";
            if (broadPos == "DF" || broadPos == "GK")
            {
                var teamGoalRatio = ts.AvgGoalsPer90 / Math.Max(allPlayers
                    .Where(p => p.Season == player.Season && p.Minutes >= 500)
                    .Average(p => p.Stats.GetValueOrDefault("goals_per90", 0)), 0.01);
                // If team scores a lot (strong attack), add slight discount for DF/GK
                if (teamGoalRatio > 1.15)
                    adjustment *= 0.97;
            }

            player.Ovr = Math.Round(player.Ovr.Value * adjustment, 1);
        }

        // Scale OVR to target display range
        var allWithOvr = allPlayers.Where(p => p.Ovr.HasValue).ToList();
        if (allWithOvr.Count > 0)
        {
            var rawMin = allWithOvr.Min(p => p.Ovr!.Value);
            var rawMax = allWithOvr.Max(p => p.Ovr!.Value);

            foreach (var player in allWithOvr)
            {
                // Linear scaling: worst → 50, best → 95, clamped
                var scaled = 45.0 + player.Ovr!.Value * 0.45;
                player.Ovr = Math.Round(Math.Clamp(scaled, 40, 99), 1);
            }

            var finalMin = allWithOvr.Min(p => p.Ovr!.Value);
            var finalMax = allWithOvr.Max(p => p.Ovr!.Value);
            var finalAvg = allWithOvr.Average(p => p.Ovr!.Value);
            Console.WriteLine($"OVR range: {finalMin:F1} – {finalMax:F1} (avg {finalAvg:F1}), raw was {rawMin:F1} – {rawMax:F1}");
        }

        // Save updated players with OVR
        var byYear = allPlayers.GroupBy(p => p.Season);
        foreach (var yearGroup in byYear)
        {
            var path = Path.Combine(playersDir, $"{yearGroup.Key}.json");
            var json = JsonSerializer.Serialize(yearGroup.ToList(),
                new JsonSerializerOptions { WriteIndented = false, PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            await File.WriteAllTextAsync(path, json);
        }

        Console.WriteLine($"OVR computed for {computed} players ({allPlayers.Count - computed} skipped, <500 min)");
        Console.WriteLine("Compute complete!");
    }

    static void RunSimulate(string formation)
    {
        var dataDir = GetDataDir();
        var gameDbPath = Path.Combine(dataDir, "game", "players.json");
        if (!File.Exists(gameDbPath))
        {
            Console.Error.WriteLine("No game database found. Run 'scrape' and 'compute' first.");

            // Try to generate it from player data
            var playersDir = Path.Combine(dataDir, "players");
            if (Directory.Exists(playersDir))
            {
                Console.WriteLine("Generating game database from player data...");
                var pythonScript = Path.Combine(dataDir, "..", "scripts", "export_game_db.py");
                // Fallback: use embedded logic
                GenerateGameDb(playersDir, gameDbPath);
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

        // Build a dream team: best available player per position
        if (!SimulationEngine.Formations.ContainsKey(formation))
        {
            Console.Error.WriteLine($"Unknown formation '{formation}'. Available: {string.Join(", ", SimulationEngine.Formations.Keys)}");
            return;
        }

        var xi = new TeamXI { Formation = formation };
        var slots = SimulationEngine.Formations[formation];

        foreach (var slot in slots)
        {
            var best = allCards
                .Where(p => p.Positions.Any(sp => slot.SpecificPositions.Contains(sp)))
                .OrderByDescending(p => p.Ovr)
                .FirstOrDefault();

            if (best != null)
            {
                xi.Slots[slot.Label] = best;
                allCards.Remove(best);
            }
        }

        if (xi.Slots.Count < 11)
        {
            Console.Error.WriteLine($"Could only fill {xi.Slots.Count}/11 positions.");
            return;
        }

        Console.WriteLine($"\nDream Team XI ({formation}):");
        Console.WriteLine("  {0,-5} {1,-30} {2,-5}", "Slot", "Player", "OVR");
        Console.WriteLine("  {0,-5} {1,-30} {2,-5}", "----", "------", "---");
        foreach (var slot in slots)
        {
            if (xi.Slots.TryGetValue(slot.Label, out var player))
                Console.WriteLine("  {0,-5} {1,-30} {2,-5:F1}", slot.Label, $"{player.Name} ({player.Team} {player.Season})", player.Ovr);
        }
        SimulationEngine.ComputeTeamRatings(xi);
        Console.WriteLine($"\n  Overall: {xi.Overall} | ATT {xi.Attack} MID {xi.Midfield} DEF {xi.Defence} GK {xi.GkRating}");

        // Simulate season
        Console.WriteLine($"\nSimulating 30-game Allsvenskan season...");
        var result = SimulationEngine.SimulateSeason(xi, formation);
        SimulationEngine.PrintSeasonResults(result);
    }

    static void RunBatchSimulate(string formation, int nSims, int targetOvr = 0)
    {
        var dataDir = GetDataDir();
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

        // Build dream team once
        var xi = new TeamXI { Formation = formation };
        var slots = SimulationEngine.Formations[formation];
        var cardsCopy = new List<PlayerCard>(allCards);
        foreach (var slot in slots)
        {
            var best = cardsCopy
                .Where(p => p.Positions.Any(sp => slot.SpecificPositions.Contains(sp)))
                .OrderByDescending(p => p.Ovr)
                .FirstOrDefault();
            if (best != null) { xi.Slots[slot.Label] = best; cardsCopy.Remove(best); }
        }
        if (xi.Slots.Count < 11) { Console.Error.WriteLine($"Could only fill {xi.Slots.Count}/11 positions."); return; }

        SimulationEngine.ComputeTeamRatings(xi);
        var baseOvr = xi.Overall;

        // Scale players to target OVR if requested
        if (targetOvr > 0 && Math.Abs(targetOvr - baseOvr) > 0.1)
        {
            var boost = targetOvr - baseOvr;
            // Apply boost directly to each player's OVR (not to copy since we won't rebuild)
            foreach (var slot in xi.Slots.Values)
            {
                slot.Ovr += boost;
            }
            SimulationEngine.ComputeTeamRatings(xi);
        }

        var effectiveOvr = xi.Overall;

        // Run simulations
        var results = new List<SeasonResult>();
        for (var i = 0; i < nSims; i++)
        {
            results.Add(SimulationEngine.SimulateSeason(xi, formation));
        }

        // Focus stats
        var undefeated = results.Count(r => r.UserTeam.Losses == 0);
        var bestResult = results.OrderByDescending(r => r.UserTeam.Points).ThenByDescending(r => r.UserTeam.GoalsFor - r.UserTeam.GoalsAgainst).First();
        var worstLosses = results.OrderBy(r => r.UserTeam.Losses).First();

        Console.WriteLine($"OVR {effectiveOvr:F1} | {nSims} sims | Obesegrade: {undefeated}/{nSims} ({100.0 * undefeated / nSims:F3}%)");
        Console.WriteLine($"  Bästa  : {bestResult.UserTeam.Wins}-{bestResult.UserTeam.Draws}-{bestResult.UserTeam.Losses} | {bestResult.UserTeam.Points}p | +{bestResult.UserTeam.GoalsFor - bestResult.UserTeam.GoalsAgainst}GD");
        Console.WriteLine($"  Minst förluster: {worstLosses.UserTeam.Wins}-{worstLosses.UserTeam.Draws}-{worstLosses.UserTeam.Losses} | {worstLosses.UserTeam.Points}p");
        Console.WriteLine();
    }

    static PlayerCard? SpinSlot(FormationSlot slot, List<Squad> squads, HashSet<string> usedIds, bool allowReroll, int rerollThreshold)
    {
        var rng = Random.Shared;

        PlayerCard? PickFromSquad()
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

        var first = PickFromSquad();
        if (first == null) return null;
        if (allowReroll && first.Ovr < rerollThreshold)
        {
            var second = PickFromSquad();
            if (second != null) return second;
        }
        return first;
    }

    static void RunDraftSimulate(string formation, int nSims, int rerollMode = 0)
    {
        var dataDir = GetDataDir();
        var squadsPath = Path.Combine(dataDir, "game", "squads.json");
        if (!File.Exists(squadsPath)) { Console.Error.WriteLine("No squads database."); return; }

        var squads = JsonSerializer.Deserialize<List<Squad>>(File.ReadAllText(squadsPath), new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }) ?? [];
        if (squads.Count == 0) { Console.Error.WriteLine("No squads."); return; }
        if (!SimulationEngine.Formations.ContainsKey(formation)) { Console.Error.WriteLine($"Unknown formation '{formation}'."); return; }

        var slots = SimulationEngine.Formations[formation];
        var rng = Random.Shared;
        var ovrs = new List<double>(nSims);

        var modeLabel = rerollMode switch
        {
            1 => "1 auto-reroll per slot (om <68 OVR)",
            3 => "3 strategiska rerolls totalt",
            _ => "inga rerolls"
        };

        for (var sim = 0; sim < nSims; sim++)
        {
            var xi = new TeamXI { Formation = formation };
            var usedIds = new HashSet<string>();

            if (rerollMode == 1)
            {
                // 1 auto-reroll per slot if best < 68
                foreach (var slot in slots)
                {
                    var pick = SpinSlot(slot, squads, usedIds, true, 68);
                    if (pick != null)
                    {
                        xi.Slots[slot.Label] = pick;
                        usedIds.Add(pick.Id);
                    }
                }
            }
            else if (rerollMode == 3)
            {
                // Baseline draft first
                foreach (var slot in slots)
                {
                    var pick = SpinSlot(slot, squads, usedIds, false, 0);
                    if (pick != null)
                    {
                        xi.Slots[slot.Label] = pick;
                        usedIds.Add(pick.Id);
                    }
                }

                // Reroll the 3 worst slots (by player OVR)
                for (var r = 0; r < 3; r++)
                {
                    var worstSlot = slots
                        .Where(s => xi.Slots.ContainsKey(s.Label))
                        .OrderBy(s => xi.Slots[s.Label].Ovr)
                        .FirstOrDefault();
                    if (worstSlot == null) break;

                    var oldId = xi.Slots[worstSlot.Label].Id;
                    usedIds.Remove(oldId);

                    var newPick = SpinSlot(worstSlot, squads, usedIds, false, 0);
                    if (newPick != null)
                    {
                        usedIds.Add(newPick.Id);
                        xi.Slots[worstSlot.Label] = newPick;
                    }
                    else
                    {
                        usedIds.Add(oldId);
                    }
                }
            }
            else
            {
                // Baseline: 1 spin per slot, pick best
                foreach (var slot in slots)
                {
                    var pick = SpinSlot(slot, squads, usedIds, false, 0);
                    if (pick != null)
                    {
                        xi.Slots[slot.Label] = pick;
                        usedIds.Add(pick.Id);
                    }
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
        Console.WriteLine($"\n  Sannolikhet att nå OVR:");
        Console.WriteLine($"  ≥86: {100.0 * p86 / nSims:F2}%");
        Console.WriteLine($"  ≥87: {100.0 * p87 / nSims:F2}%");
        Console.WriteLine($"  ≥88: {100.0 * p88 / nSims:F2}%");
        Console.WriteLine($"  ≥89: {100.0 * p89 / nSims:F2}%");
        Console.WriteLine();
    }

    static double Median(List<int> values)
    {
        var sorted = values.OrderBy(v => v).ToList();
        var n = sorted.Count;
        if (n % 2 == 1) return sorted[n / 2];
        return (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0;
    }

    static void GenerateGameDb(string playersDir, string outputPath)
    {
        var allPlayers = new List<PlayerCard>();
        foreach (var file in Directory.GetFiles(playersDir, "*.json").OrderBy(f => f))
        {
            var json = File.ReadAllText(file);
            var players = JsonSerializer.Deserialize<List<PlayerSeason>>(json, FbrefScraper.JsonOpts) ?? [];
            foreach (var p in players)
            {
                if (p.Ovr == null) continue;
                allPlayers.Add(new PlayerCard
                {
                    Name = p.Name,
                    Season = p.Season,
                    Team = p.Team,
                    Ovr = p.Ovr.Value,
                    Positions = p.Positions,
                    Id = p.Id
                });
            }
        }

        var dir = Path.GetDirectoryName(outputPath);
        if (dir != null) Directory.CreateDirectory(dir);
        File.WriteAllText(outputPath, JsonSerializer.Serialize(allPlayers, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
        Console.WriteLine($"Generated game database: {allPlayers.Count} players");
    }

    static double ZScoreToPercentile(double z)
    {
        var a1 = 0.254829592;
        var a2 = -0.284496736;
        var a3 = 1.421413741;
        var a4 = -1.453152027;
        var a5 = 1.061405429;
        var p = 0.3275911;

        var sign = z < 0 ? -1 : 1;
        var x = Math.Abs(z) / Math.Sqrt(2);
        var t = 1.0 / (1.0 + p * x);
        var erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.Exp(-x * x);
        return Math.Clamp(0.5 * (1.0 + sign * erf), 0, 1);
    }

    static double CalculateWeightedOvr(string pos, Dictionary<string, double> norm)
    {
        double S(string key) => norm.GetValueOrDefault(key, 50);

        var weightTable = pos switch
        {
            "FW" => new (string key, double w)[]
            {
                ("goals_per90", 0.30),
                ("assists_per90", 0.15),
                ("shots_on_target_per90", 0.15),
                ("goals_per_shot", 0.10),
                ("shots_on_target_pct", 0.08),
                ("tackles_won_per90", 0.07),
                ("goals_pens_per90", 0.05),
                ("interceptions_per90", 0.05),
                ("goals_per_shot_on_target", 0.05),
            },
            "MF" => new (string key, double w)[]
            {
                ("goals_per90", 0.15),
                ("assists_per90", 0.18),
                ("tackles_won_per90", 0.20),
                ("interceptions_per90", 0.15),
                ("shots_on_target_per90", 0.10),
                ("goals_per_shot", 0.05),
                ("shots_on_target_pct", 0.05),
                ("goals_pens_per90", 0.05),
                ("goals_per_shot_on_target", 0.04),
                ("crosses_per90", 0.03),
            },
            "DF" => new (string key, double w)[]
            {
                ("tackles_won_per90", 0.30),
                ("interceptions_per90", 0.25),
                ("goals_per90", 0.10),
                ("assists_per90", 0.10),
                ("goals_per_shot", 0.05),
                ("shots_on_target_per90", 0.05),
                ("shots_on_target_pct", 0.05),
                ("goals_per_shot_on_target", 0.05),
                ("goals_pens_per90", 0.05),
            },
            "GK" => new (string key, double w)[]
            {
                ("tackles_won_per90", 0.30),
                ("interceptions_per90", 0.25),
                ("assists_per90", 0.20),
                ("goals_per90", 0.15),
                ("shots_on_target_pct", 0.10),
            },
            _ => new (string key, double w)[] { }
        };

        double total = 0, totalWeight = 0;
        foreach (var (key, w) in weightTable)
        {
            if (norm.ContainsKey(key))
            {
                total += w * S(key);
                totalWeight += w;
            }
        }

        return totalWeight > 0 ? total / totalWeight : 50;
    }
}

// Scraper

public class FbrefScraper : IAsyncDisposable
{
    private readonly string _dataDir;
    private readonly bool _headless;
    private readonly bool _localMode;
    private readonly string? _debugDir;
    private bool _debugWritten;
    private IPlaywright? _playwright;
    private IBrowser? _browser;
    private IBrowserContext? _context;
    internal static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = false,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public FbrefScraper(string dataDir, bool headless = true, bool localMode = false, string? debugDir = null)
    {
        _dataDir = dataDir;
        _headless = headless;
        _localMode = localMode;
        _debugDir = debugDir;
    }

    private async Task EnsureBrowserAsync()
    {
        if (_context != null) return;
        _playwright = await Playwright.CreateAsync();

        // Använd systemets riktiga Chrome om möjligt (undviker Cloudflare-detektion)
        _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Channel = "chrome",
            Headless = _headless,
            Args = ["--disable-blink-features=AutomationControlled"]
        });
        _context = await _browser.NewContextAsync(new BrowserNewContextOptions
        {
            UserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Locale = "en-US"
        });
    }

    public async Task<List<PlayerSeason>> ScrapeSeasonAsync(int year)
    {
        var hasAdvanced = year >= 2014;
        var players = new Dictionary<string, PlayerSeason>();
        var pages = new List<(string url, string tableId, Action<IElement, PlayerSeason> parser)>();

        pages.Add((
            $"https://fbref.com/en/comps/29/{year}/stats/{year}-Allsvenskan-Stats",
            "stats_standard", ParseStandardRow));

        if (hasAdvanced)
        {
            pages.Add(($"https://fbref.com/en/comps/29/{year}/shooting/{year}-Allsvenskan-Stats",
                "stats_shooting", ParseShootingRow));
            pages.Add(($"https://fbref.com/en/comps/29/{year}/passing/{year}-Allsvenskan-Stats",
                "stats_passing", ParsePassingRow));
            pages.Add(($"https://fbref.com/en/comps/29/{year}/defense/{year}-Allsvenskan-Stats",
                "stats_defense", ParseDefensiveRow));
            pages.Add(($"https://fbref.com/en/comps/29/{year}/possession/{year}-Allsvenskan-Stats",
                "stats_possession", ParsePossessionRow));
        }

        if (hasAdvanced)
        {
            pages.Add(($"https://fbref.com/en/comps/29/{year}/misc/{year}-Allsvenskan-Stats",
                "stats_misc", ParseMiscRow));
            pages.Add(($"https://fbref.com/en/comps/29/{year}/playingtime/{year}-Allsvenskan-Stats",
                "stats_playing_time", ParsePlayingTimeRow));
        }

        pages.Add(($"https://fbref.com/en/comps/29/{year}/keepers/{year}-Allsvenskan-Stats",
            "stats_keeper", ParseGkRow));

        if (hasAdvanced)
        {
            pages.Add(($"https://fbref.com/en/comps/29/{year}/keepers/adv/{year}-Allsvenskan-Stats",
                "stats_keeper_adv", ParseGkAdvRow));
        }

        if (_localMode)
        {
            foreach (var (url, tableId, parser) in pages)
                await ParseTableLocalAsync(year, tableId, parser, players);
        }
        else
        {
            await EnsureBrowserAsync();
            for (var i = 0; i < pages.Count; i++)
            {
                var (url, tableId, parser) = pages[i];
                if (i > 0) await Task.Delay(4000);
                await ParseTableAsync(url, tableId, year, players, parser);
            }
        }

        foreach (var p in players.Values)
            p.Positions = PositionDeriver.Derive(p.BroadPositions, p.Stats, p.Season);

        return players.Values.ToList();
    }

    public async Task SavePlayersAsync(int year, List<PlayerSeason> players)
    {
        var path = Path.Combine(_dataDir, "players", $"{year}.json");
        var json = JsonSerializer.Serialize(players, JsonOpts);
        await File.WriteAllTextAsync(path, json);
    }

    private async Task<string> FetchPageAsync(string url)
    {
        await EnsureBrowserAsync();
        var page = await _context!.NewPageAsync();
        try
        {
            await page.AddInitScriptAsync(@"
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3] });
            ");

            await page.GotoAsync(url, new PageGotoOptions
            {
                WaitUntil = WaitUntilState.DOMContentLoaded,
                Timeout = 60000
            });

            // Vänta på att en riktig tabell dyker upp (max 120s)
            // Detta hanterar både automatisk och manuell Cloudflare-challenge
            var hasContent = false;
            for (var i = 0; i < 120; i++)
            {
                var table = await page.QuerySelectorAsync("table.stats_table, table#stats_standard");
                if (table != null) { hasContent = true; break; }
                await Task.Delay(1000);
            }

            if (!hasContent)
            {
                var title = await page.QuerySelectorAsync("title");
                var titleText = title != null ? await title.InnerTextAsync() : "?";
                Console.Error.WriteLine($"  [warn] Ingen tabell funnen efter 120s. Sidtitel: {titleText}");
            }

            // Debug: spara HTML för första URL
            if (_debugDir != null && !_debugWritten)
            {
                _debugWritten = true;
                var html = await page.ContentAsync();
                var name = url.Replace("https://", "").Replace("/", "_");
                var path = Path.Combine(_debugDir, $"{name}.html");
                await File.WriteAllTextAsync(path, html);
                Console.Error.WriteLine($"  [debug] Sparade HTML till {path}");
            }

            return await page.ContentAsync();
        }
        finally
        {
            await page.CloseAsync();
        }
    }

    // Hämta HTML från lokal fil (sparad manuellt från vanlig webbläsare)
    private string GetLocalHtmlPath(int year, string tableId)
        => Path.Combine(_dataDir, "pages", year.ToString(), $"{tableId}.html");

    private async Task ParseTableLocalAsync(int year, string tableId,
        Action<IElement, PlayerSeason> parseRow,
        Dictionary<string, PlayerSeason> players)
    {
        var dir = Path.Combine(_dataDir, "pages", year.ToString());
        if (!Directory.Exists(dir))
        {
            Console.Error.WriteLine($"  Table #{tableId}: katalogen {dir} finns inte");
            return;
        }

        // Läs alla .html-filer i katalogen och hitta den som innehåller rätt tabell-ID
        foreach (var file in Directory.GetFiles(dir, "*.html"))
        {
            var html = await File.ReadAllTextAsync(file);
            if (!html.Contains($"id=\"{tableId}\"")) continue;

            var config = Configuration.Default;
            var ctx = BrowsingContext.New(config);
            var doc = await ctx.OpenAsync(req => req.Content(html));
            var table = doc.QuerySelector($"table#{tableId}");
            if (table == null)
            {
                Console.Error.WriteLine($"  Table #{tableId} nämns i {file} men hittades inte");
                return;
            }
            ParseTableRows(table, year, players, parseRow);
            Console.WriteLine($"  -> {Path.GetFileName(file)} OK");
            return;
        }

        Console.Error.WriteLine($"  Table #{tableId} hittades inte i någon fil i {dir}");
    }

    private async Task ParseTableAsync(
        string url, string tableId, int year,
        Dictionary<string, PlayerSeason> players,
        Action<IElement, PlayerSeason> parseRow)
    {
        try
        {
            var html = await FetchPageAsync(url);
            var config = Configuration.Default;
            var context = BrowsingContext.New(config);
            var doc = await context.OpenAsync(req => req.Content(html));

            var table = doc.QuerySelector($"table#{tableId}");
            if (table == null)
            {
                Console.Error.WriteLine($"  Table #{tableId} not found at {url}");
                return;
            }

            ParseTableRows(table, year, players, parseRow);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"  Error fetching {url}: {ex.Message}");
        }
    }

    private void ParseTableRows(IElement table, int year,
        Dictionary<string, PlayerSeason> players,
        Action<IElement, PlayerSeason> parseRow)
    {
        var rows = table.QuerySelectorAll("tbody tr");
        foreach (var row in rows)
        {
            if (row.ClassList.Contains("spacer") ||
                row.ClassList.Contains("thead") ||
                row.ClassList.Contains("over_header") ||
                row.ClassList.Contains("totals") ||
                row.ClassList.Contains("partial_table"))
                continue;

            var playerCell = row.QuerySelector("td[data-stat='player']");
            if (playerCell == null) continue;

            var name = playerCell.TextContent.Trim();
            var teamCell = row.QuerySelector("td[data-stat='team']");
            var team = teamCell?.TextContent.Trim() ?? "";

            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(team))
                continue;

            var key = $"{name}|{team}|{year}";

            if (!players.TryGetValue(key, out var player))
            {
                player = new PlayerSeason
                {
                    Id = MakeId(name, team, year),
                    Name = name,
                    Team = team,
                    Season = year
                };
                players[key] = player;
            }

            parseRow(row, player);
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_context != null)
            await _context.CloseAsync();
        if (_browser != null)
            await _browser.CloseAsync();
        _playwright?.Dispose();
    }

    // Row parsers 

    private void ParseStandardRow(IElement row, PlayerSeason player)
    {
        SetCellStr(row, "nationality", v => player.Nationality = v);
        SetCellInt(row, "age", v => player.Age = v);
        SetCellStr(row, "position", v =>
        {
            var parts = v.Split(',').Select(p => p.Trim()).Where(p => p.Length > 0).ToList();
            player.BroadPositions = parts;
            player.IsGoalkeeper = parts.Contains("GK");
        });
        SetCellInt(row, "games", v => player.Games = v);
        SetCellInt(row, "games_starts", v => player.GamesStarted = v);
        SetCellInt(row, "minutes", v => player.Minutes = v);

        SetPer90(row, "goals", "goals_per90", player);
        SetPer90(row, "assists", "assists_per90", player);
        SetStat(row, "goals_pens", "goals_pens", player);
        SetStat(row, "pens_att", "pens_att", player);
        SetStat(row, "pens_made", "pens_made", player);
        SetStat(row, "cards_yellow", "cards_yellow", player);
        SetStat(row, "cards_red", "cards_red", player);

        SetPer90(row, "xg", "xg_per90", player);
        SetPer90(row, "assists_xg", "xag_per90", player);
        SetPer90(row, "npxg", "npxg_per90", player);
        SetStat(row, "progressive_carries", "progressive_carries", player);
        SetStat(row, "progressive_passes", "progressive_passes", player);
        SetStat(row, "progressive_runs", "progressive_runs", player);
    }

    private void ParseShootingRow(IElement row, PlayerSeason player)
    {
        SetPer90(row, "shots", "shots_per90", player);
        SetPer90(row, "shots_on_target", "shots_on_target_per90", player);
        SetStat(row, "shots_on_target_pct", "shots_on_target_pct", player);
        SetStat(row, "goals_per_shot", "goals_per_shot", player);
        SetStat(row, "goals_per_shot_on_target", "goals_per_shot_on_target", player);
        SetStat(row, "average_shot_distance", "average_shot_distance", player);
        SetStat(row, "shots_free_kicks", "shots_free_kicks", player);
        SetPer90(row, "xg", "xg_per90", player);
        SetPer90(row, "npxg", "npxg_per90", player);
        SetStat(row, "npxg_per_shot", "npxg_per_shot", player);
        SetStat(row, "goals_minus_xg", "goals_minus_xg", player);
    }

    private void ParsePassingRow(IElement row, PlayerSeason player)
    {
        SetStat(row, "passes_completed", "passes_completed", player);
        SetStat(row, "passes", "passes", player);
        SetStat(row, "passes_pct", "passes_pct", player);
        SetStat(row, "passes_total_distance", "passes_total_distance", player);
        SetStat(row, "passes_progressive_distance", "passes_progressive_distance", player);
        SetPer90(row, "assists", "assists_per90", player);
        SetPer90(row, "xg_assist", "xag_per90", player);
        SetStat(row, "pass_xa", "pass_xa", player);
        SetStat(row, "key_passes", "key_passes", player);
        SetPer90(row, "passes_into_final_third", "passes_into_final_third_per90", player);
        SetPer90(row, "passes_into_penalty_area", "passes_into_penalty_area_per90", player);
        SetPer90(row, "crosses_into_penalty_area", "crosses_into_penalty_area_per90", player);
        SetStat(row, "progressive_passes", "progressive_passes", player);
    }

    private void ParseDefensiveRow(IElement row, PlayerSeason player)
    {
        SetPer90(row, "tackles", "tackles_per90", player);
        SetPer90(row, "tackles_won", "tackles_won_per90", player);
        SetPer90(row, "tackles_def_3rd", "tackles_def_3rd_per90", player);
        SetPer90(row, "tackles_mid_3rd", "tackles_mid_3rd_per90", player);
        SetPer90(row, "tackles_att_3rd", "tackles_att_3rd_per90", player);
        SetPer90(row, "dribble_tackles", "dribble_tackles_per90", player);
        SetStat(row, "dribble_tackles_pct", "dribble_tackles_pct", player);
        SetPer90(row, "dribbled_past", "dribbled_past_per90", player);
        SetPer90(row, "blocks", "blocks_per90", player);
        SetPer90(row, "block_shots", "block_shots_per90", player);
        SetPer90(row, "block_passes", "block_passes_per90", player);
        SetPer90(row, "interceptions", "interceptions_per90", player);
        SetPer90(row, "clearances", "clearances_per90", player);
        SetStat(row, "errors", "errors", player);
    }

    private void ParsePossessionRow(IElement row, PlayerSeason player)
    {
        SetPer90(row, "touches", "touches_per90", player);
        SetPer90(row, "touches_def_pen_area", "touches_def_pen_area_per90", player);
        SetPer90(row, "touches_att_pen_area", "touches_att_pen_area_per90", player);
        SetPer90(row, "dribbles", "dribbles_per90", player);
        SetStat(row, "dribbles_succ_pct", "dribbles_succ_pct", player);
        SetPer90(row, "carries", "carries_per90", player);
        SetStat(row, "carries_total_distance", "carries_total_distance", player);
        SetStat(row, "carries_progressive_distance", "carries_progressive_distance", player);
        SetPer90(row, "progressive_carries", "progressive_carries_per90", player);
        SetPer90(row, "carries_into_final_third", "carries_into_final_third_per90", player);
        SetPer90(row, "carries_into_penalty_area", "carries_into_penalty_area_per90", player);
        SetPer90(row, "miscontrols", "miscontrols_per90", player);
        SetPer90(row, "dispossessed", "dispossessed_per90", player);
        SetPer90(row, "passes_received", "passes_received_per90", player);
        SetPer90(row, "progressive_passes_received", "progressive_passes_received_per90", player);
    }

    private void ParseGkRow(IElement row, PlayerSeason player)
    {
        player.IsGoalkeeper = true;
        if (player.BroadPositions.Count == 0)
            player.BroadPositions = ["GK"];

        SetStat(row, "goals_against", "goals_against", player);
        SetStat(row, "goals_against_per90", "goals_against_per90", player);
        SetStat(row, "shots_on_target_against", "shots_on_target_against", player);
        SetStat(row, "saves", "saves", player);
        SetStat(row, "save_pct", "save_pct", player);
        SetStat(row, "wins", "wins", player);
        SetStat(row, "draws", "draws", player);
        SetStat(row, "losses", "losses", player);
        SetStat(row, "clean_sheets", "clean_sheets", player);
        SetStat(row, "clean_sheets_pct", "clean_sheets_pct", player);
        SetStat(row, "pens_att", "gk_pens_att", player);
        SetStat(row, "pens_allowed", "gk_pens_allowed", player);
        SetStat(row, "pens_saved", "gk_pens_saved", player);
        SetStat(row, "pens_missed", "gk_pens_missed", player);
        SetStat(row, "save_pct_pens", "save_pct_pens", player);

        if (player.Minutes == 0)
            SetCellInt(row, "minutes", v => player.Minutes = v);
    }

    private void ParseGkAdvRow(IElement row, PlayerSeason player)
    {
        player.IsGoalkeeper = true;
        if (player.BroadPositions.Count == 0)
            player.BroadPositions = ["GK"];

        SetStat(row, "psxg", "psxg", player);
        SetStat(row, "psxg_per_shot_on_target", "psxg_per_shot_on_target", player);
        SetStat(row, "psxg_plus_minus", "psxg_plus_minus", player);
        SetStat(row, "psxg_net", "psxg_net", player);
        SetStat(row, "gk_goals_against_per90", "gk_goals_against_per90", player);
        SetStat(row, "psxg_per90", "psxg_per90", player);
        SetStat(row, "crosses", "crosses_faced", player);
        SetStat(row, "crosses_stopped", "crosses_stopped", player);
        SetStat(row, "crosses_stopped_pct", "crosses_stopped_pct", player);
    }

    private void ParseMiscRow(IElement row, PlayerSeason player)
    {
        SetPer90(row, "fouls", "fouls_per90", player);
        SetPer90(row, "fouled", "fouled_per90", player);
        SetPer90(row, "offsides", "offsides_per90", player);
        SetPer90(row, "crosses", "crosses_per90", player);
        SetPer90(row, "pens_won", "pens_won_per90", player);
        SetPer90(row, "pens_conceded", "pens_conceded_per90", player);
        SetStat(row, "cards_yellow", "cards_yellow", player);
        SetStat(row, "cards_red", "cards_red", player);
    }

    private void ParsePlayingTimeRow(IElement row, PlayerSeason player)
    {
        SetStat(row, "minutes_per90", "minutes_per90", player);
        SetStat(row, "minutes_midfield", "minutes_midfield", player);
        SetStat(row, "minutes_at_am", "minutes_at_am", player);
        SetStat(row, "minutes_at_fw", "minutes_at_fw", player);
    }

    // Helpers 

    private static string MakeId(string name, string team, int year)
    {
        var slug = name.ToLower()
            .Replace(" ", "-")
            .Replace(".", "")
            .Replace("'", "")
            .Replace("å", "a").Replace("ä", "a").Replace("ö", "o")
            .Replace("é", "e").Replace("è", "e").Replace("ü", "u");
        var teamSlug = team.ToLower()
            .Replace(" ", "-")
            .Replace("/", "-")
            .Replace("'", "");
        return $"{slug}-{teamSlug}-{year}";
    }

    private static void SetCellStr(IElement row, string dataStat, Action<string> set)
    {
        var cell = row.QuerySelector($"td[data-stat='{dataStat}']");
        if (cell != null)
        {
            var val = cell.TextContent.Trim();
            if (val.Length > 0)
                set(val);
        }
    }

    private static void SetCellInt(IElement row, string dataStat, Action<int> set)
    {
        var cell = row.QuerySelector($"td[data-stat='{dataStat}']");
        if (cell != null)
        {
            var text = cell.TextContent.Trim().Replace(",", "");
            if (int.TryParse(text, out var val))
                set(val);
        }
    }

    private static void SetCellDouble(IElement row, string dataStat, Action<double> set)
    {
        var cell = row.QuerySelector($"td[data-stat='{dataStat}']");
        if (cell != null)
        {
            var text = cell.TextContent.Trim().Replace(",", "");
            if (double.TryParse(text, System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var val))
                set(val);
        }
    }

    private static void SetStat(IElement row, string dataStat, string statKey, PlayerSeason player)
    {
        SetCellDouble(row, dataStat, v => player.Stats[statKey] = v);
    }

    private static void SetPer90(IElement row, string dataStat, string statKey, PlayerSeason player)
    {
        // Try the dedicated per90 column first
        var per90Cell = row.QuerySelector($"td[data-stat='{dataStat}_per90']");
        if (per90Cell != null)
        {
            var text = per90Cell.TextContent.Trim();
            if (double.TryParse(text, System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var val))
            {
                player.Stats[statKey] = Math.Round(val, 4);
                return;
            }
        }

        // Fallback: read raw, compute per90 if we have minutes
        var rawCell = row.QuerySelector($"td[data-stat='{dataStat}']");
        if (rawCell != null)
        {
            var text = rawCell.TextContent.Trim();
            if (double.TryParse(text, System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var rawVal)
                && player.Minutes > 0)
            {
                player.Stats[statKey] = Math.Round(rawVal / player.Minutes * 90, 4);
            }
        }
    }
}

// Position Derivation 

public static class PositionDeriver
{
    public static List<string> Derive(List<string> broadPositions, PlayerStats stats, int season)
    {
        var result = new List<string>();
        if (broadPositions.Count == 0) return ["Unknown"];

        var isVintage = season <= 2013;

        foreach (var bp in broadPositions)
        {
            switch (bp)
            {
                case "GK":
                    AddUnique(result, "GK");
                    break;

                case "DF":
                    if (isVintage)
                    {
                        AddUnique(result, "CB");
                    }
                    else
                    {
                        var goals = stats.GetValueOrDefault("goals_per90", 0);
                        var assists = stats.GetValueOrDefault("assists_per90", 0);
                        var carries = stats.GetValueOrDefault("progressive_carries_per90", 0);

                        if ((goals > 0.08 || assists > 0.1) && carries > 1.5)
                        {
                            AddUnique(result, "LB");
                            AddUnique(result, "RB");
                        }
                        else
                        {
                            AddUnique(result, "CB");
                        }
                    }
                    break;

                case "MF":
                    if (isVintage)
                    {
                        AddUnique(result, "CM");
                    }
                    else
                    {
                        var goals = stats.GetValueOrDefault("goals_per90", 0);
                        var assists = stats.GetValueOrDefault("assists_per90", 0);
                        var tackles = stats.GetValueOrDefault("tackles_won_per90", 0);
                        var interceptions = stats.GetValueOrDefault("interceptions_per90", 0);
                        var crosses = stats.GetValueOrDefault("crosses_into_penalty_area_per90", 0);

                        if (goals > 0.2 && assists > 0.15)
                            AddUnique(result, "CAM");
                        else if (assists > 0.2 && crosses > 1.5)
                        {
                            AddUnique(result, "LM");
                            AddUnique(result, "RM");
                        }
                        else if (tackles > 2.0 && interceptions > 1.5)
                            AddUnique(result, "CDM");
                        else
                            AddUnique(result, "CM");
                    }
                    break;

                case "FW":
                    if (isVintage)
                    {
                        AddUnique(result, "ST");
                    }
                    else
                    {
                        var xg = stats.GetValueOrDefault("xg_per90", 0);
                        var assists = stats.GetValueOrDefault("assists_per90", 0);
                        var carries = stats.GetValueOrDefault("progressive_carries_per90", 0);

                        if (xg > 0.4)
                            AddUnique(result, "ST");
                        else if (assists > 0.15 && carries > 2.5)
                        {
                            AddUnique(result, "LW");
                            AddUnique(result, "RW");
                        }
                        else
                        {
                            AddUnique(result, "ST");
                            if (assists > 0.1)
                            {
                                AddUnique(result, "LW");
                                AddUnique(result, "RW");
                            }
                        }
                    }
                    break;
            }
        }

        return result.Count > 0 ? result : ["Unknown"];
    }

    private static void AddUnique(List<string> list, string item)
    {
        if (!list.Contains(item))
            list.Add(item);
    }
}
