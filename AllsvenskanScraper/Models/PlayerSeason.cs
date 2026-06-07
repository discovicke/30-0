namespace AllsvenskanScraper;

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
