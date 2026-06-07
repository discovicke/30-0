namespace AllsvenskanScraper;

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
