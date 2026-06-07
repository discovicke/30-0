namespace AllsvenskanScraper;

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
                await OvrCalculator.RunCompute(GetDataDir());
                break;
            case "all":
                await RunScrape(2025, 2001, headless, debug, local);
                await OvrCalculator.RunCompute(GetDataDir());
                break;
            case "simulate":
            case "sim":
                var simFormation = cleanArgs.Length > 1 ? cleanArgs[1] : "4-3-3";
                DraftSimulator.RunSimulate(GetDataDir(), simFormation);
                break;
            case "batch":
                var batchFormation = cleanArgs.Length > 1 ? cleanArgs[1] : "4-3-3";
                var nSims = cleanArgs.Length > 2 ? int.Parse(cleanArgs[2]) : 100;
                var targetOvr = cleanArgs.Length > 3 ? int.Parse(cleanArgs[3]) : 0;
                DraftSimulator.RunBatchSimulate(GetDataDir(), batchFormation, nSims, targetOvr);
                break;
            case "draft":
                var draftFormation = cleanArgs.Length > 1 ? cleanArgs[1] : "4-3-3";
                var nDraftSims = cleanArgs.Length > 2 ? int.Parse(cleanArgs[2]) : 10000;
                var nRerolls = cleanArgs.Length > 3 ? int.Parse(cleanArgs[3]) : 0;
                var draftMode = cleanArgs.Length > 4 ? cleanArgs[4] : "season";
                DraftSimulator.RunDraftSimulate(GetDataDir(), draftFormation, nDraftSims, nRerolls, draftMode);
                break;
            case "build-peak":
                GameDataService.RunBuildPeak(GetDataDir());
                break;
            default:
                Console.WriteLine("Usage:");
                Console.WriteLine("  dotnet run -- scrape [startYear] [endYear] [--headed] [--debug] [--local]");
                Console.WriteLine("  dotnet run -- compute");
                Console.WriteLine("  dotnet run -- simulate [formation]");
                Console.WriteLine("  dotnet run -- batch [formation] [n] [targetOvr]");
                Console.WriteLine("  dotnet run -- draft [formation] [n] [rerolls] [season|peak]");
                Console.WriteLine("  dotnet run -- build-peak");
                Console.WriteLine("  dotnet run -- all [--headed] [--debug] [--local]");
                Console.WriteLine();
                Console.WriteLine("Examples:");
                Console.WriteLine("  dotnet run -- scrape 2025");
                Console.WriteLine("  dotnet run -- scrape 2025 2025 --local");
                Console.WriteLine("  dotnet run -- simulate 4-3-3");
                Console.WriteLine("  dotnet run -- batch 4-3-3 100");
                Console.WriteLine("  dotnet run -- draft 4-3-3 10000");
                Console.WriteLine("  dotnet run -- draft 4-3-3 10000 0 peak");
                Console.WriteLine("  dotnet run -- build-peak");
                Console.WriteLine("  dotnet run -- all --local");
                break;
        }
    }

    static string GetDataDir()
    {
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

        var teamsJson = System.Text.Json.JsonSerializer.Serialize(allTeams.Values.OrderBy(t => t.Name).ToList(),
            new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(Path.Combine(dataDir, "teams", "teams.json"), teamsJson);
        Console.WriteLine($"Teams saved: {allTeams.Count}");
        Console.WriteLine("Scrape complete!");
    }
}
