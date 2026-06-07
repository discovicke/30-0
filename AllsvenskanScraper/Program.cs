namespace AllsvenskanScraper;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hello World!");
    }
}

public class FbrefScraper
{
    private readonly HttpClient _http;

    // FBref kräver en riktig User-Agent annars blockeras du
    public FbrefScraper()
    {
        _http = new HttpClient();
        _http.DefaultRequestHeaders.Add("User-Agent",
            "Mozilla/5.0 (compatible; AllsvenskanGame/1.0)");
    }

    public async Task ScrapeSeasonAsync(int year)
    {
        // Hämta utespelares standardstats
        var outfieldUrl = $"https://fbref.com/en/comps/29/{year}/stats/{year}-Allsvenskan-Stats";
        // Hämta målvakter separat
        var keeperUrl = $"https://fbref.com/en/comps/29/{year}/keepers/{year}-Allsvenskan-Stats";

        var outfieldHtml = await _http.GetStringAsync(outfieldUrl);
        await Task.Delay(4000); // VIKTIGT: respektera rate limits, 4s minimum
        var keeperHtml = await _http.GetStringAsync(keeperUrl);

        var outfield = ParseOutfieldTable(outfieldHtml);
        var keepers = ParseKeeperTable(keeperHtml);

        await SaveToJsonAsync(year, outfield, keepers);
    }

    private List<PlayerSeason> ParseOutfieldTable(string html)
    {
        // AngleSharp parsar table#stats_standard
        // Kolumner: Player, Team, Pos, Age, MP, Min, Gls, Ast, xG, xAG, ...
    }
}