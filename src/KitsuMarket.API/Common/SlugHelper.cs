using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace KitsuMarket.API.Common;

public static class SlugHelper
{
    public static string GenerateSlug(string phrase)
    {
        if (string.IsNullOrWhiteSpace(phrase))
            return string.Empty;

        // Remove accents and diacritics
        string normalized = phrase.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();

        foreach (char c in normalized)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        string str = sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();

        // Replace invalid chars with space
        str = Regex.Replace(str, @"[^a-z0-9\s-]", "");

        // Convert multiple spaces into one space
        str = Regex.Replace(str, @"\s+", " ").Trim();

        // Cut and trim
        if (str.Length > 100)
            str = str.Substring(0, 100).Trim();

        // Replace spaces with hyphens
        str = Regex.Replace(str, @"\s", "-");

        // Remove duplicate hyphens
        str = Regex.Replace(str, @"-+", "-");

        return str;
    }
}
