using System.Text.Json;

namespace AllsvenskanScraper;

// Game models

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
    public string Position { get; set; } = ""; // broad position: GK, DF, MF, FW
    public List<string> SpecificPositions { get; set; } = []; // "GK", "CB", "ST" etc
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

// Simulation engine

public static class SimulationEngine
{
    private static readonly Random Rng = new();
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static readonly Dictionary<string, List<FormationSlot>> Formations = new()
    {
        ["4-3-3"] =
        [
            new() { Label = "GK", Position = "GK", SpecificPositions = ["GK"] },
            new() { Label = "LB", Position = "DF", SpecificPositions = ["CB", "CM"] },
            new() { Label = "CB1", Position = "DF", SpecificPositions = ["CB"] },
            new() { Label = "CB2", Position = "DF", SpecificPositions = ["CB"] },
            new() { Label = "RB", Position = "DF", SpecificPositions = ["CB", "CM"] },
            new() { Label = "CM1", Position = "MF", SpecificPositions = ["CM", "CDM", "CAM"] },
            new() { Label = "CM2", Position = "MF", SpecificPositions = ["CM", "CDM", "CAM"] },
            new() { Label = "CM3", Position = "MF", SpecificPositions = ["CM", "CDM", "CAM"] },
            new() { Label = "LW", Position = "FW", SpecificPositions = ["LW", "RW", "ST"] },
            new() { Label = "ST", Position = "FW", SpecificPositions = ["ST", "LW", "RW"] },
            new() { Label = "RW", Position = "FW", SpecificPositions = ["RW", "LW", "ST"] },
        ],
        ["4-4-2"] =
        [
            new() { Label = "GK", Position = "GK", SpecificPositions = ["GK"] },
            new() { Label = "LB", Position = "DF", SpecificPositions = ["CB", "CM"] },
            new() { Label = "CB1", Position = "DF", SpecificPositions = ["CB"] },
            new() { Label = "CB2", Position = "DF", SpecificPositions = ["CB"] },
            new() { Label = "RB", Position = "DF", SpecificPositions = ["CB", "CM"] },
            new() { Label = "LM", Position = "MF", SpecificPositions = ["CM", "LW", "CAM"] },
            new() { Label = "CM1", Position = "MF", SpecificPositions = ["CM", "CDM", "CAM"] },
            new() { Label = "CM2", Position = "MF", SpecificPositions = ["CM", "CDM", "CAM"] },
            new() { Label = "RM", Position = "MF", SpecificPositions = ["CM", "RW", "CAM"] },
            new() { Label = "ST1", Position = "FW", SpecificPositions = ["ST", "LW", "RW"] },
            new() { Label = "ST2", Position = "FW", SpecificPositions = ["ST", "LW", "RW"] },
        ],
        ["3-5-2"] =
        [
            new() { Label = "GK", Position = "GK", SpecificPositions = ["GK"] },
            new() { Label = "CB1", Position = "DF", SpecificPositions = ["CB"] },
            new() { Label = "CB2", Position = "DF", SpecificPositions = ["CB"] },
            new() { Label = "CB3", Position = "DF", SpecificPositions = ["CB"] },
            new() { Label = "LM", Position = "MF", SpecificPositions = ["CM", "LW", "CAM"] },
            new() { Label = "CM1", Position = "MF", SpecificPositions = ["CM", "CDM", "CAM"] },
            new() { Label = "CM2", Position = "MF", SpecificPositions = ["CM", "CDM", "CAM"] },
            new() { Label = "CM3", Position = "MF", SpecificPositions = ["CM", "CDM", "CAM"] },
            new() { Label = "RM", Position = "MF", SpecificPositions = ["CM", "RW", "CAM"] },
            new() { Label = "ST1", Position = "FW", SpecificPositions = ["ST", "LW", "RW"] },
            new() { Label = "ST2", Position = "FW", SpecificPositions = ["ST", "LW", "RW"] },
        ],
    };

    public static List<AITeam> GetAllAITeams()
    {
        return
        [
            new() { Name = "Malmö", Strength = 85, Tier = "Elit" },
            new() { Name = "AIK Stockholm", Strength = 84, Tier = "Elit" },
            new() { Name = "Djurgården", Strength = 84, Tier = "Elit" },
            new() { Name = "Göteborg", Strength = 84, Tier = "Elit" },
            new() { Name = "Elfsborg", Strength = 82, Tier = "Stark" },
            new() { Name = "BK Häcken", Strength = 81, Tier = "Stark" },
            new() { Name = "Hammarby", Strength = 80, Tier = "Stark" },
            new() { Name = "Norrköping", Strength = 79, Tier = "Mellan" },
            new() { Name = "Helsingborg", Strength = 78, Tier = "Mellan" },
            new() { Name = "Kalmar", Strength = 77, Tier = "Mellan" },
            new() { Name = "Halmstad", Strength = 75, Tier = "Lägre" },
            new() { Name = "Örebro", Strength = 74, Tier = "Lägre" },
            new() { Name = "Sundsvall", Strength = 73, Tier = "Lägre" },
            new() { Name = "Gefle", Strength = 72, Tier = "Lägre" },
            new() { Name = "Mjällby", Strength = 72, Tier = "Lägre" },
        ];
    }

    public static void ComputeTeamRatings(TeamXI xi)
    {
        var slots = xi.Slots;
        var formation = Formations.GetValueOrDefault(xi.Formation, Formations["4-3-3"]);

        double attack = 0, midfield = 0, defence = 0, gk = 0;
        int attackN = 0, midfieldN = 0, defenceN = 0, gkN = 0;

        foreach (var slot in formation)
        {
            if (!slots.TryGetValue(slot.Label, out var player)) continue;

            switch (slot.Position)
            {
                case "FW":
                    attack += player.Ovr; attackN++;
                    break;
                case "MF":
                    midfield += player.Ovr; midfieldN++;
                    break;
                case "DF":
                    defence += player.Ovr; defenceN++;
                    break;
                case "GK":
                    gk += player.Ovr; gkN++;
                    break;
            }
        }

        xi.Attack = attackN > 0 ? Math.Round(attack / attackN, 1) : 50;
        xi.Midfield = midfieldN > 0 ? Math.Round(midfield / midfieldN, 1) : 50;
        xi.Defence = defenceN > 0 ? Math.Round(defence / defenceN, 1) : 50;
        xi.GkRating = gkN > 0 ? Math.Round(gk / gkN, 1) : 50;
        xi.Overall = Math.Round((xi.Attack + xi.Midfield + xi.Defence + xi.GkRating) / 4.0, 1);
    }

    public static MatchResult SimulateMatch(TeamXI user, AITeam ai, bool isUserHome, string formation)
    {
        ComputeTeamRatings(user);

        // Offence: attack (40%) + midfield (60%)
        // Defence: midfield (20%) + defence (50%) + GK (30%)
        var userOffence = user.Attack * 0.4 + user.Midfield * 0.6;
        var userDefence = user.Midfield * 0.2 + user.Defence * 0.5 + user.GkRating * 0.3;
        var userStrength = (userOffence + userDefence) / 2.0;

        var strengthRatio = Math.Max(userStrength / Math.Max(ai.Strength, 1), 0.1);
        var baseRate = 1.2;
        var exponent = 3.5;
        var homeBonus = 0.08;

        var userExpected = baseRate * Math.Pow(strengthRatio, exponent) + (isUserHome ? homeBonus : 0);
        var aiExpected = baseRate * Math.Pow(1.0 / strengthRatio, exponent) + (isUserHome ? 0 : homeBonus);

        userExpected = Math.Clamp(userExpected, 0.2, 6.0);
        aiExpected = Math.Clamp(aiExpected, 0.2, 6.0);

        var userGoals = Poisson(userExpected);
        var aiGoals = Poisson(aiExpected);

        var match = new MatchResult
        {
            HomeTeam = isUserHome ? "Your XI" : ai.Name,
            AwayTeam = isUserHome ? ai.Name : "Your XI",
            IsUserHome = isUserHome,
            HomeGoals = isUserHome ? userGoals : aiGoals,
            AwayGoals = isUserHome ? aiGoals : userGoals,
        };

        // Distribute goals to players
        var allGoals = new List<(bool isUser, int minute)>();
        for (var i = 0; i < userGoals; i++)
            allGoals.Add((true, Rng.Next(1, 91)));
        for (var i = 0; i < aiGoals; i++)
            allGoals.Add((false, Rng.Next(1, 91)));

        allGoals.Sort((a, b) => a.minute.CompareTo(b.minute));

        foreach (var (isUser, minute) in allGoals)
        {
            var goal = new GoalEvent { Minute = minute };

            if (isUser)
            {
                var (scorer, assistant) = PickGoalScorer(user, formation);
                goal.Scorer = scorer;
                goal.Assistant = assistant;
            }
            else
            {
                goal.Scorer = ai.Name;
            }

            match.Goals.Add(goal);
        }

        return match;
    }

    public static MatchResult SimulateAIMatch(AITeam home, AITeam away)
    {
        var strengthRatio = Math.Max(home.Strength / Math.Max(away.Strength, 1), 0.1);
        var baseRate = 1.2;
        var exponent = 3.5;
        var homeBonus = 0.08;

        var homeExpected = baseRate * Math.Pow(strengthRatio, exponent) + homeBonus;
        var awayExpected = baseRate * Math.Pow(1.0 / strengthRatio, exponent);

        homeExpected = Math.Clamp(homeExpected, 0.2, 6.0);
        awayExpected = Math.Clamp(awayExpected, 0.2, 6.0);

        var homeGoals = Poisson(homeExpected);
        var awayGoals = Poisson(awayExpected);

        return new MatchResult
        {
            HomeTeam = home.Name,
            AwayTeam = away.Name,
            IsUserHome = false,
            HomeGoals = homeGoals,
            AwayGoals = awayGoals,
        };
    }

    public static SeasonResult SimulateSeason(TeamXI user, string formation)
    {
        // Reset season stats from any previous run
        user.GoalsFor = 0; user.GoalsAgainst = 0;
        user.Wins = 0; user.Draws = 0; user.Losses = 0; user.Points = 0;

        var userTeam = user;
        userTeam.Formation = formation;
        ComputeTeamRatings(userTeam);

        var aiTeams = GetAllAITeams();
        var matches = new List<MatchResult>();
        var goalScorers = new Dictionary<string, int>();
        var assists = new Dictionary<string, int>();
        var cleanSheets = new Dictionary<string, int>();

        // Each AI team plays twice (home/away) = 30 games for 16-team league
        foreach (var ai in aiTeams)
        {
            // Home
            var homeMatch = SimulateMatch(userTeam, ai, true, formation);
            matches.Add(homeMatch);

            if (homeMatch.UserCleanSheet == 1)
            {
                var gk = userTeam.Slots.GetValueOrDefault("GK");
                if (gk != null) cleanSheets[gk.Name] = cleanSheets.GetValueOrDefault(gk.Name, 0) + 1;
            }

            // Away
            var awayMatch = SimulateMatch(userTeam, ai, false, formation);
            matches.Add(awayMatch);

            if (awayMatch.UserCleanSheet == 1)
            {
                var gk = userTeam.Slots.GetValueOrDefault("GK");
                if (gk != null) cleanSheets[gk.Name] = cleanSheets.GetValueOrDefault(gk.Name, 0) + 1;
            }
        }

        // Simulate AI vs AI matches (each pair, home and away = 210 matches)
        for (var i = 0; i < aiTeams.Count; i++)
        {
            for (var j = i + 1; j < aiTeams.Count; j++)
            {
                matches.Add(SimulateAIMatch(aiTeams[i], aiTeams[j]));
                matches.Add(SimulateAIMatch(aiTeams[j], aiTeams[i]));
            }
        }

        // Aggregate user stats (only from user matches)
        var userMatches = matches.Where(m => m.HomeTeam == userTeam.Name || m.AwayTeam == userTeam.Name).ToList();
        foreach (var match in userMatches)
        {
            foreach (var goal in match.Goals)
            {
                // Track user goals/assists
                var isUserGoal = false;
                foreach (var slot in userTeam.Slots.Values)
                {
                    if (goal.Scorer == slot.Name) { isUserGoal = true; break; }
                }

                if (isUserGoal)
                {
                    goalScorers[goal.Scorer!] = goalScorers.GetValueOrDefault(goal.Scorer!, 0) + 1;
                    if (goal.Assistant != null)
                        assists[goal.Assistant] = assists.GetValueOrDefault(goal.Assistant, 0) + 1;
                }
            }

            if (match.IsUserHome)
            {
                userTeam.GoalsFor += match.HomeGoals;
                userTeam.GoalsAgainst += match.AwayGoals;
            }
            else
            {
                userTeam.GoalsFor += match.AwayGoals;
                userTeam.GoalsAgainst += match.HomeGoals;
            }
        }

        userTeam.Wins = userMatches.Count(m => m.IsUserHome ? m.HomeGoals > m.AwayGoals : m.AwayGoals > m.HomeGoals);
        userTeam.Losses = userMatches.Count(m => m.IsUserHome ? m.HomeGoals < m.AwayGoals : m.AwayGoals < m.HomeGoals);
        userTeam.Draws = userMatches.Count - userTeam.Wins - userTeam.Losses;
        userTeam.Points = userTeam.Wins * 3 + userTeam.Draws;

        // Compute AI team records
        foreach (var ai in aiTeams)
        {
            var aiMatches = matches.Where(m => m.HomeTeam == ai.Name || m.AwayTeam == ai.Name).ToList();
            foreach (var m in aiMatches)
            {
                if (m.HomeTeam == ai.Name)
                {
                    ai.GoalsFor += m.HomeGoals;
                    ai.GoalsAgainst += m.AwayGoals;
                }
                else
                {
                    ai.GoalsFor += m.AwayGoals;
                    ai.GoalsAgainst += m.HomeGoals;
                }
            }
            ai.Wins = aiMatches.Count(m => m.HomeTeam == ai.Name ? m.HomeGoals > m.AwayGoals : m.AwayGoals > m.HomeGoals);
            ai.Losses = aiMatches.Count(m => m.HomeTeam == ai.Name ? m.HomeGoals < m.AwayGoals : m.AwayGoals < m.HomeGoals);
            ai.Draws = aiMatches.Count - ai.Wins - ai.Losses;
            ai.Points = ai.Wins * 3 + ai.Draws;
        }

        // Build final table
        var allTeams = new List<AITeam>(aiTeams)
        {
            new()
            {
                Name = "Your XI",
                Strength = userTeam.Overall,
                GoalsFor = userTeam.GoalsFor,
                GoalsAgainst = userTeam.GoalsAgainst,
                Wins = userTeam.Wins,
                Draws = userTeam.Draws,
                Losses = userTeam.Losses,
                Points = userTeam.Points,
            }
        };

        allTeams.Sort((a, b) =>
        {
            var cmp = b.Points.CompareTo(a.Points);
            if (cmp != 0) return cmp;
            var gdA = a.GoalsFor - a.GoalsAgainst;
            var gdB = b.GoalsFor - b.GoalsAgainst;
            return gdB.CompareTo(gdA);
        });

        var userPosition = allTeams.FindIndex(t => t.Name == "Your XI") + 1;

        // Expected position based on OVR
        var allStrengths = aiTeams.Select(t => t.Strength).Concat(new[] { userTeam.Overall }).OrderByDescending(s => s).ToList();
        var userStrengthRank = allStrengths.IndexOf(userTeam.Overall);
        var expectedPos = 1.0 + userStrengthRank;
        var expectedPts = EstimateExpectedPoints(userTeam.Overall, aiTeams);

        // Awards
        var goldenBoot = goalScorers.OrderByDescending(kv => kv.Value).FirstOrDefault();
        var playmaker = assists.OrderByDescending(kv => kv.Value).FirstOrDefault();
        var goldenGlove = cleanSheets.OrderByDescending(kv => kv.Value).FirstOrDefault();
        

        // Player of the season: goals + assists combined
        var potScores = new Dictionary<string, int>();
        foreach (var kv in goalScorers) potScores[kv.Key] = kv.Value * 2;
        foreach (var kv in assists) potScores[kv.Key] = potScores.GetValueOrDefault(kv.Key, 0) + kv.Value;
        var potSeason = potScores.OrderByDescending(kv => kv.Value).FirstOrDefault();

        return new SeasonResult
        {
            UserTeam = new TeamXI
            {
                Name = userTeam.Name,
                Slots = new Dictionary<string, PlayerCard>(userTeam.Slots),
                Formation = userTeam.Formation,
                Attack = userTeam.Attack,
                Midfield = userTeam.Midfield,
                Defence = userTeam.Defence,
                GkRating = userTeam.GkRating,
                Overall = userTeam.Overall,
                GoalsFor = userTeam.GoalsFor,
                GoalsAgainst = userTeam.GoalsAgainst,
                Wins = userTeam.Wins,
                Draws = userTeam.Draws,
                Losses = userTeam.Losses,
                Points = userTeam.Points,
            },
            AiTeams = aiTeams.ToList(),
            Matches = matches,
            GoalScorers = goalScorers,
            Assists = assists,
            CleanSheets = cleanSheets,
            FinalPosition = userPosition,
            ExpectedPoints = expectedPts,
            ExpectedPosition = expectedPos,
            FinalTable = allTeams,
            GoldenBoot = goldenBoot.Key != null ? new SeasonAward { PlayerName = goldenBoot.Key, Goals = goldenBoot.Value } : null,
            Playmaker = playmaker.Key != null ? new SeasonAward { PlayerName = playmaker.Key, Assists = playmaker.Value } : null,
            GoldenGlove = goldenGlove.Key != null ? new SeasonAward { PlayerName = goldenGlove.Key, CleanSheets = goldenGlove.Value } : null,
            PlayerOfSeason = potSeason.Key != null ? new SeasonAward { PlayerName = potSeason.Key, Goals = goalScorers.GetValueOrDefault(potSeason.Key, 0), Assists = assists.GetValueOrDefault(potSeason.Key, 0) } : null,
        };
    }

    private static int Poisson(double lambda)
    {
        if (lambda <= 0) return 0;
        var L = Math.Exp(-lambda);
        var k = 0;
        var p = 1.0;

        do
        {
            k++;
            p *= Rng.NextDouble();
        } while (p > L);

        return k - 1;
    }

    private static (string scorer, string? assistant) PickGoalScorer(TeamXI xi, string formation)
    {
        var slots = Formations.GetValueOrDefault(formation, Formations["4-3-3"]);
        var players = slots.Select(s => xi.Slots.GetValueOrDefault(s.Label)).Where(p => p != null).ToList()!;

        var positionWeights = new Dictionary<string, double>
        {
            ["FW"] = 0.50,
            ["MF"] = 0.30,
            ["DF"] = 0.18,
            ["GK"] = 0.005, // extremely rare (penalties only)
        };

        // Pick position for scorer
        var roll = Rng.NextDouble();
        var cumul = 0.0;
        var scorerPos = "";
        foreach (var (pos, w) in positionWeights)
        {
            cumul += w;
            if (roll <= cumul) { scorerPos = pos; break; }
        }
        if (string.IsNullOrEmpty(scorerPos)) scorerPos = "FW";

        // Pick a player in that position
        var candidates = slots
            .Select((s, i) => (s, i))
            .Where(x => x.s.Position == scorerPos && xi.Slots.ContainsKey(x.s.Label))
            .Select(x => xi.Slots[x.s.Label])
            .ToList();

        if (candidates.Count == 0)
        {
            candidates = players;
            scorerPos = players.FirstOrDefault()?.Positions.FirstOrDefault() ?? "FW";
        }

        var scorer = WeightedPick(candidates, p => p.Ovr);

        // Pick assistant (can be same position or different)
        var assistPosWeights = new Dictionary<string, double>
        {
            ["MF"] = 0.45,
            ["FW"] = 0.30,
            ["DF"] = 0.20,
            ["GK"] = 0.05,
        };

        roll = Rng.NextDouble();
        cumul = 0.0;
        var assistPos = "";
        foreach (var (pos, w) in assistPosWeights)
        {
            cumul += w;
            if (roll <= cumul) { assistPos = pos; break; }
        }
        if (string.IsNullOrEmpty(assistPos)) assistPos = "MF";

        var assistCandidates = slots
            .Where(x => x.Position == assistPos && xi.Slots.ContainsKey(x.Label))
            .Select(x => xi.Slots[x.Label])
            .Where(p => p.Name != scorer.Name)
            .ToList();

        if (assistCandidates.Count == 0)
            assistCandidates = players.Where(p => p.Name != scorer.Name).ToList();

        string? assistant = null;
        if (assistCandidates.Count > 0 && Rng.NextDouble() < 0.75) // 75% of goals have an assist
        {
            assistant = WeightedPick(assistCandidates, p => p.Ovr).Name;
        }

        return (scorer.Name, assistant);
    }

    private static T WeightedPick<T>(List<T> items, Func<T, double> weight) where T : class
    {
        if (items.Count == 0) throw new ArgumentException("Cannot pick from empty list");
        if (items.Count == 1) return items[0];

        var totalWeight = items.Sum(weight);
        var roll = Rng.NextDouble() * totalWeight;
        var cumul = 0.0;

        foreach (var item in items)
        {
            cumul += weight(item);
            if (roll <= cumul) return item;
        }

        return items[^1];
    }

    private static int EstimateExpectedPoints(double userOvr, List<AITeam> aiTeams)
    {
        // Simple estimate based on OVR compared to league
        var leagueAvg = aiTeams.Average(t => t.Strength);
        var diff = userOvr - leagueAvg;
        return (int)Math.Round(45 + diff * 3.0); // baseline 45 pts, +3 per OVR point above average
    }

    public static void PrintSeasonResults(SeasonResult result)
    {
        var u = result.UserTeam;

        Console.WriteLine($"\n{'='.ToString().PadRight(60, '=')}");
        Console.WriteLine($"  {u.Name} — {u.Formation} | Overall {u.Overall}");
        Console.WriteLine($"  ATT {u.Attack}  MID {u.Midfield}  DEF {u.Defence}  GK {u.GkRating}");
        Console.WriteLine($"\n  Season: {u.Wins}-{u.Draws}-{u.Losses} | {u.Points} pts | {u.GoalsFor} GF, {u.GoalsAgainst} GA");
        var gd = u.GoalsFor - u.GoalsAgainst;
        var gdStr = gd >= 0 ? $"+{gd}" : $"{gd}";
        Console.WriteLine($"  GD: {gdStr}");
        var ordinal = Ordinal(result.FinalPosition);
        Console.WriteLine($"  Expected: {result.ExpectedPosition:F0}th ({result.ExpectedPoints} pts) -> Finished: {result.FinalPosition}{ordinal}");
        Console.WriteLine($"  {new string('=', 60)}");

        Console.WriteLine($"\n  FINAL TABLE:");
        Console.WriteLine("  {0,3} {1,-20} {2,4} {3,3} {4,3} {5,3} {6,3} {7,3} {8,4}", "#", "Team", "Pts", "W", "D", "L", "GF", "GA", "GD");
        Console.WriteLine("  {0,3} {1,-20} {2,4} {3,3} {4,3} {5,3} {6,3} {7,3} {8,4}", "---", "----", "---", "---", "---", "---", "---", "---", "---");

        for (var i = 0; i < result.FinalTable.Count; i++)
        {
            var t = result.FinalTable[i];
            var marker = t.Name == "Your XI" ? ">" : " ";
            var tGd = t.GoalsFor - t.GoalsAgainst;
            Console.WriteLine($"  {marker}{i + 1,2} {t.Name,-20} {t.Points,4} {t.Wins,3} {t.Draws,3} {t.Losses,3} {t.GoalsFor,3} {t.GoalsAgainst,3} {tGd,+4}");
        }

        Console.WriteLine($"\n  MATCH RESULTS (30 user games):");
        var userMatches = result.Matches.Where(m => m.HomeTeam == "Your XI" || m.AwayTeam == "Your XI").ToList();
        foreach (var m in userMatches)
        {
            var score = $"{m.HomeGoals}-{m.AwayGoals}";
            var scorerList = new List<string>();
            foreach (var g in m.Goals)
            {
                var s = g.Scorer;
                if (g.Assistant != null) s += $" ({g.Assistant})";
                scorerList.Add(s);
            }
            var scorers = string.Join(", ", scorerList);
            Console.WriteLine($"  {m.HomeTeam,-20} {score,-7} {m.AwayTeam}  {(scorers.Length > 0 ? "⚽ " + scorers : "")}");
        }

        Console.WriteLine($"\n  AWARDS:");
        if (result.GoldenBoot != null)
            Console.WriteLine($"  ⚽ Golden Boot: {result.GoldenBoot.PlayerName} ({result.GoldenBoot.Goals} goals)");
        if (result.Playmaker != null)
            Console.WriteLine($"  🎯 Playmaker: {result.Playmaker.PlayerName} ({result.Playmaker.Assists} assists)");
        if (result.GoldenGlove != null)
            Console.WriteLine($"  🧤 Golden Glove: {result.GoldenGlove.PlayerName} ({result.GoldenGlove.CleanSheets} clean sheets)");
        if (result.PlayerOfSeason != null)
            Console.WriteLine($"  🏆 Player of the Season: {result.PlayerOfSeason.PlayerName} ({result.PlayerOfSeason.Goals}G, {result.PlayerOfSeason.Assists}A)");
    }

    private static string Ordinal(int n) => n switch
    {
        1 => "st", 2 => "nd", 3 => "rd", _ => "th"
    };
}
