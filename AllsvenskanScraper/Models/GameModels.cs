namespace AllsvenskanScraper;

public class PlayerCard
{
    public string Name { get; set; } = "";
    public int Season { get; set; }
    public string Team { get; set; } = "";
    public double Ovr { get; set; }
    public List<string> Positions { get; set; } = [];
    public string Id { get; set; } = "";
}

public class Squad
{
    public string Team { get; set; } = "";
    public int Season { get; set; }
    public List<SquadPlayer> Players { get; set; } = [];
}

public class SquadPlayer
{
    public string Name { get; set; } = "";
    public int Season { get; set; }
    public string Team { get; set; } = "";
    public double Ovr { get; set; }
    public List<string> Positions { get; set; } = [];
    public string Id { get; set; } = "";
}

public class FormationSlot
{
    public string Label { get; set; } = "";
    public string Position { get; set; } = "";
    public List<string> SpecificPositions { get; set; } = [];
}

public class TeamXI
{
    public string Name { get; set; } = "Your XI";
    public Dictionary<string, PlayerCard> Slots { get; set; } = [];
    public string Formation { get; set; } = "4-3-3";
    public double Attack { get; set; }
    public double Midfield { get; set; }
    public double Defence { get; set; }
    public double GkRating { get; set; }
    public double Overall { get; set; }
    public int GoalsFor { get; set; }
    public int GoalsAgainst { get; set; }
    public int Wins { get; set; }
    public int Draws { get; set; }
    public int Losses { get; set; }
    public int Points { get; set; }
}

public class AITeam
{
    public string Name { get; set; } = "";
    public double Strength { get; set; }
    public string Tier { get; set; } = "";
    public int GoalsFor { get; set; }
    public int GoalsAgainst { get; set; }
    public int Wins { get; set; }
    public int Draws { get; set; }
    public int Losses { get; set; }
    public int Points { get; set; }
}

public class TeamEntry
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public List<int> Seasons { get; set; } = [];
}
