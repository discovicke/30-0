namespace AllsvenskanScraper;

public class GoalEvent
{
    public int Minute { get; set; }
    public string Scorer { get; set; } = "";
    public string? Assistant { get; set; }
    public bool IsPenalty { get; set; }
    public bool IsOwnGoal { get; set; }
}

public class MatchResult
{
    public string HomeTeam { get; set; } = "";
    public string AwayTeam { get; set; } = "";
    public bool IsUserHome { get; set; }
    public int HomeGoals { get; set; }
    public int AwayGoals { get; set; }
    public List<GoalEvent> Goals { get; set; } = [];

    public int? UserCleanSheet => IsUserHome ? (AwayGoals == 0 ? 1 : 0) : (HomeGoals == 0 ? 1 : 0);

    public string HomeScorers => string.Join(", ", Goals.Where(g => !g.IsOwnGoal).Select(g => g.Scorer));

    public string AwayScorers => string.Join(", ", Goals.Where(g => g.IsOwnGoal).Select(g => g.Scorer));
}

public class SeasonAward
{
    public string PlayerName { get; set; } = "";
    public int Goals { get; set; }
    public int Assists { get; set; }
    public int CleanSheets { get; set; }
    public string? Award { get; set; }
}

public class SeasonResult
{
    public TeamXI UserTeam { get; set; } = new();
    public List<AITeam> AiTeams { get; set; } = [];
    public List<MatchResult> Matches { get; set; } = [];
    public Dictionary<string, int> GoalScorers { get; set; } = [];
    public Dictionary<string, int> Assists { get; set; } = [];
    public Dictionary<string, int> CleanSheets { get; set; } = [];
    public int FinalPosition { get; set; }
    public int ExpectedPoints { get; set; }
    public double ExpectedPosition { get; set; }
    public List<AITeam> FinalTable { get; set; } = [];
    public SeasonAward? GoldenBoot { get; set; }
    public SeasonAward? Playmaker { get; set; }
    public SeasonAward? GoldenGlove { get; set; }
    public SeasonAward? PlayerOfSeason { get; set; }
}
