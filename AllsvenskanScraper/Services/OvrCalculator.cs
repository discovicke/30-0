using System.Text.Json;

namespace AllsvenskanScraper;

public static class OvrCalculator
{
    public static async Task RunCompute(string dataDir)
    {
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

            var teamFactor = ts.AvgOvr / leagueOvr;
            var adjustment = 1.0 + (1.0 - teamFactor) * 0.08;
            adjustment = Math.Clamp(adjustment, 0.85, 1.15);

            var broadPos = player.BroadPositions.Count > 0 ? player.BroadPositions[0] : "Unknown";
            if (broadPos == "DF" || broadPos == "GK")
            {
                var teamGoalRatio = ts.AvgGoalsPer90 / Math.Max(allPlayers
                    .Where(p => p.Season == player.Season && p.Minutes >= 500)
                    .Average(p => p.Stats.GetValueOrDefault("goals_per90", 0)), 0.01);
                if (teamGoalRatio > 1.15)
                    adjustment *= 0.97;
            }

            player.Ovr = Math.Round(player.Ovr.Value * adjustment, 1);
        }

        var allWithOvr = allPlayers.Where(p => p.Ovr.HasValue).ToList();
        if (allWithOvr.Count > 0)
        {
            var rawMin = allWithOvr.Min(p => p.Ovr!.Value);
            var rawMax = allWithOvr.Max(p => p.Ovr!.Value);

            foreach (var player in allWithOvr)
            {
                var scaled = 45.0 + player.Ovr!.Value * 0.45;
                player.Ovr = Math.Round(Math.Clamp(scaled, 40, 99), 1);
            }

            var finalMin = allWithOvr.Min(p => p.Ovr!.Value);
            var finalMax = allWithOvr.Max(p => p.Ovr!.Value);
            var finalAvg = allWithOvr.Average(p => p.Ovr!.Value);
            Console.WriteLine($"OVR range: {finalMin:F1} - {finalMax:F1} (avg {finalAvg:F1}), raw was {rawMin:F1} - {rawMax:F1}");
        }

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

    public static void GenerateGameDb(string dataDir)
    {
        var playersDir = Path.Combine(dataDir, "players");
        var outputPath = Path.Combine(dataDir, "game", "players.json");

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

    public static double ZScoreToPercentile(double z)
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

    public static double CalculateWeightedOvr(string pos, Dictionary<string, double> norm)
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
