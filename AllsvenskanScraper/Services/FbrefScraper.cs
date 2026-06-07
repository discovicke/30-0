using System.Text.Json;
using AngleSharp;
using AngleSharp.Dom;
using Microsoft.Playwright;

namespace AllsvenskanScraper;

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

    private async Task EnsureBrowserAsync()
    {
        if (_context != null) return;
        _playwright = await Playwright.CreateAsync();
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

        SetStat(row, "gk_goals_against", "goals_against", player);
        SetStat(row, "gk_goals_against_per90", "goals_against_per90", player);
        SetStat(row, "gk_shots_on_target_against", "shots_on_target_against", player);
        SetStat(row, "gk_saves", "saves", player);
        SetStat(row, "gk_save_pct", "save_pct", player);
        SetStat(row, "gk_wins", "wins", player);
        SetStat(row, "gk_ties", "draws", player);
        SetStat(row, "gk_losses", "losses", player);
        SetStat(row, "gk_clean_sheets", "clean_sheets", player);
        SetStat(row, "gk_clean_sheets_pct", "clean_sheets_pct", player);
        SetStat(row, "gk_pens_att", "gk_pens_att", player);
        SetStat(row, "gk_pens_allowed", "gk_pens_allowed", player);
        SetStat(row, "gk_pens_saved", "gk_pens_saved", player);
        SetStat(row, "gk_pens_missed", "gk_pens_missed", player);
        SetStat(row, "gk_pens_save_pct", "save_pct_pens", player);

        if (player.Minutes == 0)
            SetCellInt(row, "gk_minutes", v => player.Minutes = v);
    }

    private void ParseGkAdvRow(IElement row, PlayerSeason player)
    {
        player.IsGoalkeeper = true;
        if (player.BroadPositions.Count == 0)
            player.BroadPositions = ["GK"];

        SetStat(row, "gk_psxg", "psxg", player);
        SetStat(row, "gk_psxg_per_shot_on_target", "psxg_per_shot_on_target", player);
        SetStat(row, "gk_psxg_plus_minus", "psxg_plus_minus", player);
        SetStat(row, "gk_psxg_net", "psxg_net", player);
        SetStat(row, "gk_goals_against_per90", "gk_goals_against_per90", player);
        SetStat(row, "gk_psxg_per90", "psxg_per90", player);
        SetStat(row, "gk_crosses", "crosses_faced", player);
        SetStat(row, "gk_crosses_stopped", "crosses_stopped", player);
        SetStat(row, "gk_crosses_stopped_pct", "crosses_stopped_pct", player);
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

    // Static helpers

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
