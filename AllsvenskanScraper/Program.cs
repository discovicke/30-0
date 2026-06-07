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
        var command = args.Length > 0 ? args[0].ToLower() : "help";

        switch (command)
        {
            case "scrape":
                await RunScrape(args.Length > 1 ? int.Parse(args[1]) : 2025,
                               args.Length > 2 ? int.Parse(args[2]) : 2025);
                break;
            case "compute":
                await RunCompute();
                break;
            case "all":
                await RunScrape(2025, 2001);
                await RunCompute();
                break;
            default:
                Console.WriteLine("Usage:");
                Console.WriteLine("  dotnet run -- scrape [startYear] [endYear]");
                Console.WriteLine("  dotnet run -- compute");
                Console.WriteLine("  dotnet run -- all");
                Console.WriteLine();
                Console.WriteLine("Examples:");
                Console.WriteLine("  dotnet run -- scrape 2025 2025    # only 2025");
                Console.WriteLine("  dotnet run -- scrape 2025 2014    # 2025-2014");
                Console.WriteLine("  dotnet run -- all                 # everything");
                break;
        }
    }

    static string GetDataDir()
    {
        // Navigate from bin/Debug/net10.0 to repo root /data
        return Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "data");
    }

    static async Task RunScrape(int startYear, int endYear)
    {
        var dataDir = GetDataDir();
        Directory.CreateDirectory(Path.Combine(dataDir, "players"));
        Directory.CreateDirectory(Path.Combine(dataDir, "teams"));
        Directory.CreateDirectory(Path.Combine(dataDir, "baselines"));

        var scraper = new FbrefScraper(dataDir);
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
            var players = JsonSerializer.Deserialize<List<PlayerSeason>>(json) ?? [];
            allPlayers.AddRange(players);
        }

        Console.WriteLine($"Loaded {allPlayers.Count} player-seasons for computation");

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

        // Calculate OVR
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

            player.Ovr = Math.Round(CalculateWeightedOvr(broadPos, normStats), 1);
            computed++;
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

    static double ZScoreToPercentile(double z)
    {
        var a1 = 0.254829592;
        var a2 = -0.284496736;
        var a3 = 1.421413741;
        var a4 = -1.453152027;
        var a5 = 1.061405429;
        var p = 0.3275911;

        var sign = z < 0 ? -1 : 1;
        z = Math.Abs(z);
        var t = 1.0 / (1.0 + p * z);
        var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.Exp(-z * z);
        return Math.Clamp(0.5 * (1.0 + sign * (1.0 - y)), 0, 1);
    }

    static double CalculateWeightedOvr(string pos, Dictionary<string, double> norm)
    {
        double S(string key) => norm.GetValueOrDefault(key, 50);

        return pos switch
        {
            "FW" => S("goals_per90") * 0.35
                  + S("assists_per90") * 0.15
                  + S("xg_per90") * 0.25
                  + S("xag_per90") * 0.10
                  + S("progressive_carries_per90") * 0.15,

            "MF" => S("goals_per90") * 0.15
                  + S("assists_per90") * 0.20
                  + S("xg_per90") * 0.10
                  + S("xag_per90") * 0.15
                  + S("progressive_carries_per90") * 0.10
                  + S("progressive_passes_per90") * 0.10
                  + S("tackles_won_per90") * 0.10
                  + S("interceptions_per90") * 0.10,

            "DF" => S("goals_per90") * 0.05
                  + S("assists_per90") * 0.05
                  + S("tackles_won_per90") * 0.25
                  + S("interceptions_per90") * 0.25
                  + S("progressive_passes_per90") * 0.15
                  + S("clearances_per90") * 0.10
                  + S("blocks_per90") * 0.10
                  + S("xg_per90") * 0.05,

            "GK" => S("save_pct") * 0.35
                  + S("clean_sheets_pct") * 0.25
                  + S("psxg_net") * 0.25
                  + S("crosses_stopped_pct") * 0.15,

            _ => norm.Values.Average()
        };
    }
}

// Scraper

public class FbrefScraper : IAsyncDisposable
{
    private readonly string _dataDir;
    private IPlaywright? _playwright;
    private IBrowser? _browser;
    private IBrowserContext? _context;
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = false,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public FbrefScraper(string dataDir)
    {
        _dataDir = dataDir;
    }

    private async Task EnsureBrowserAsync()
    {
        if (_context != null) return;
        _playwright = await Playwright.CreateAsync();
        _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = true
        });
        _context = await _browser.NewContextAsync(new BrowserNewContextOptions
        {
            UserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        });
    }

    public async Task<List<PlayerSeason>> ScrapeSeasonAsync(int year)
    {
        await EnsureBrowserAsync();
        var hasAdvanced = year >= 2014;
        var players = new Dictionary<string, PlayerSeason>();

        await ParseTableAsync(
            $"https://fbref.com/en/comps/29/{year}/stats/{year}-Allsvenskan-Stats",
            "stats_standard", year, players, ParseStandardRow);

        if (hasAdvanced)
        {
            await Task.Delay(4000);
            await ParseTableAsync(
                $"https://fbref.com/en/comps/29/{year}/shooting/{year}-Allsvenskan-Stats",
                "stats_shooting", year, players, ParseShootingRow);

            await Task.Delay(4000);
            await ParseTableAsync(
                $"https://fbref.com/en/comps/29/{year}/passing/{year}-Allsvenskan-Stats",
                "stats_passing", year, players, ParsePassingRow);

            await Task.Delay(4000);
            await ParseTableAsync(
                $"https://fbref.com/en/comps/29/{year}/defense/{year}-Allsvenskan-Stats",
                "stats_defense", year, players, ParseDefensiveRow);

            await Task.Delay(4000);
            await ParseTableAsync(
                $"https://fbref.com/en/comps/29/{year}/possession/{year}-Allsvenskan-Stats",
                "stats_possession", year, players, ParsePossessionRow);
        }

        await Task.Delay(4000);
        await ParseTableAsync(
            $"https://fbref.com/en/comps/29/{year}/keepers/{year}-Allsvenskan-Stats",
            "stats_keeper", year, players, ParseGkRow);

        if (hasAdvanced)
        {
            await Task.Delay(4000);
            await ParseTableAsync(
                $"https://fbref.com/en/comps/29/{year}/keepers/adv/{year}-Allsvenskan-Stats",
                "stats_keeper_adv", year, players, ParseGkAdvRow);
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
            await page.GotoAsync(url, new PageGotoOptions
            {
                WaitUntil = WaitUntilState.NetworkIdle,
                Timeout = 30000
            });
            return await page.ContentAsync();
        }
        finally
        {
            await page.CloseAsync();
        }
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
        catch (Exception ex)
        {
            Console.Error.WriteLine($"  Error fetching {url}: {ex.Message}");
        }
    }

    public async ValueTask DisposeAsync()
    {
        _context?.CloseAsync();
        _browser?.CloseAsync();
        _playwright?.Dispose();
    }

    // Row parsers 

    private void ParseStandardRow(IElement row, PlayerSeason player)
    {
        SetCellStr(row, "nationality", v => player.Nationality = v);
        SetCellInt(row, "age", v => player.Age = v);
        SetCellStr(row, "pos", v =>
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
        if (cell != null && int.TryParse(cell.TextContent.Trim(), out var val))
            set(val);
    }

    private static void SetCellDouble(IElement row, string dataStat, Action<double> set)
    {
        var cell = row.QuerySelector($"td[data-stat='{dataStat}']");
        if (cell != null)
        {
            var text = cell.TextContent.Trim();
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
