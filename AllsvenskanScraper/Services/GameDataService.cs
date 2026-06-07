using System.Text.Json;

namespace AllsvenskanScraper;

public static class GameDataService
{
    public static void RunBuildPeak(string dataDir)
    {
        var squadsPath = Path.Combine(dataDir, "game", "squads.json");
        if (!File.Exists(squadsPath)) { Console.Error.WriteLine("No squads database found."); return; }

        var squads = JsonSerializer.Deserialize<List<Squad>>(File.ReadAllText(squadsPath), new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }) ?? [];
        Console.WriteLine($"Loaded {squads.Count} squads, {squads.Sum(s => s.Players.Count)} player entries");

        var peakByName = new Dictionary<string, SquadPlayer>(StringComparer.OrdinalIgnoreCase);
        foreach (var sq in squads)
        {
            foreach (var p in sq.Players)
            {
                if (!peakByName.ContainsKey(p.Name) || p.Ovr > peakByName[p.Name].Ovr)
                    peakByName[p.Name] = p;
            }
        }

        Console.WriteLine($"Unique players (by name): {peakByName.Count}");

        var peakSquads = new List<Squad>();
        foreach (var sq in squads)
        {
            var squadPeakPlayers = sq.Players
                .Select(p =>
                {
                    if (peakByName.TryGetValue(p.Name, out var peak))
                    {
                        return new SquadPlayer
                        {
                            Name = p.Name, Season = peak.Season, Team = peak.Team,
                            Ovr = peak.Ovr, Positions = new List<string>(peak.Positions),
                            Id = peak.Id
                        };
                    }
                    return p;
                })
                .ToList();

            peakSquads.Add(new Squad { Team = sq.Team, Season = sq.Season, Players = squadPeakPlayers });
        }

        var opts = new JsonSerializerOptions { WriteIndented = false, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        var peakSquadsPath = Path.Combine(dataDir, "game", "squads_peak.json");
        File.WriteAllText(peakSquadsPath, JsonSerializer.Serialize(peakSquads, opts));
        Console.WriteLine($"Written squads_peak.json ({peakSquads.Count} squads)");

        var peakPlayerList = peakByName.Values
            .Select(p => new PlayerCard
            {
                Name = p.Name, Season = p.Season, Team = p.Team,
                Ovr = p.Ovr, Positions = new List<string>(p.Positions), Id = p.Id
            })
            .OrderByDescending(p => p.Ovr)
            .ToList();

        var peakPlayersPath = Path.Combine(dataDir, "game", "players_peak.json");
        File.WriteAllText(peakPlayersPath, JsonSerializer.Serialize(peakPlayerList, opts));
        Console.WriteLine($"Written players_peak.json ({peakPlayerList.Count} players)");
        Console.WriteLine($"Peak OVR range: {peakPlayerList.Min(p => p.Ovr):F1} - {peakPlayerList.Max(p => p.Ovr):F1}");
    }
}
