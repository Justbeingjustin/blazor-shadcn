using System.Text;

namespace BlazorShadcn.Utilities;

/// <summary>
/// Minimal Tailwind "className" utilities.
///
/// In shadcn/ui, class strings are merged with tailwind-merge so user-provided classes can override
/// variant defaults (e.g. "bg-green-600" should override the variant's "bg-primary").
///
/// We don't attempt full tailwind-merge parity here; we implement the small set of merge-groups
/// we actively rely on in components (bg/text/border). Expand as needed when new conflicts appear.
/// </summary>
public static class Tw
{
    public static string Merge(params string?[] classes)
    {
        // Keep a stable output order but ensure the last class for a conflict group wins by
        // tombstoning the previous entry and appending the new one.
        var tokens = new List<string>();
        var lastIndexByKey = new Dictionary<string, int>(StringComparer.Ordinal);

        foreach (var chunk in classes)
        {
            if (string.IsNullOrWhiteSpace(chunk))
                continue;

            foreach (var token in chunk.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            {
                var key = GetMergeKey(token);
                if (key is null)
                {
                    tokens.Add(token);
                    continue;
                }

                if (lastIndexByKey.TryGetValue(key, out var prevIndex))
                    tokens[prevIndex] = ""; // tombstone

                lastIndexByKey[key] = tokens.Count;
                tokens.Add(token);
            }
        }

        if (tokens.Count == 0)
            return string.Empty;

        var sb = new StringBuilder(tokens.Count * 8);
        for (var i = 0; i < tokens.Count; i++)
        {
            var t = tokens[i];
            if (string.IsNullOrEmpty(t))
                continue;

            if (sb.Length > 0)
                sb.Append(' ');
            sb.Append(t);
        }

        return sb.ToString();
    }

    private static string? GetMergeKey(string token)
    {
        // Split into "variants:" prefix and the utility itself, but ignore ':' inside [...] blocks.
        var (variants, utility) = SplitVariants(token);

        // "!..." is Tailwind's important modifier (can appear after variants as well).
        var utilityForKey = utility.Length > 0 && utility[0] == '!' ? utility[1..] : utility;

        // Background color utilities.
        if (utilityForKey.StartsWith("bg-", StringComparison.Ordinal))
            return variants + "bg";

        // Border utilities: we only merge width vs color at a coarse level.
        if (utilityForKey == "border" ||
            utilityForKey is "border-0" or "border-2" or "border-4" or "border-8")
            return variants + "border-width";

        if (utilityForKey is "border-x" or "border-y" or "border-t" or "border-r" or "border-b" or "border-l" or "border-s" or "border-e")
            return variants + utilityForKey; // width per-side

        if (utilityForKey.StartsWith("border-", StringComparison.Ordinal))
        {
            // Side-specific border (e.g. border-t-red-500): treat as its own color group per side.
            if (utilityForKey.StartsWith("border-t-", StringComparison.Ordinal)) return variants + "border-t-color";
            if (utilityForKey.StartsWith("border-r-", StringComparison.Ordinal)) return variants + "border-r-color";
            if (utilityForKey.StartsWith("border-b-", StringComparison.Ordinal)) return variants + "border-b-color";
            if (utilityForKey.StartsWith("border-l-", StringComparison.Ordinal)) return variants + "border-l-color";
            if (utilityForKey.StartsWith("border-s-", StringComparison.Ordinal)) return variants + "border-s-color";
            if (utilityForKey.StartsWith("border-e-", StringComparison.Ordinal)) return variants + "border-e-color";
            if (utilityForKey.StartsWith("border-x-", StringComparison.Ordinal)) return variants + "border-x-color";
            if (utilityForKey.StartsWith("border-y-", StringComparison.Ordinal)) return variants + "border-y-color";

            return variants + "border-color";
        }

        // Text utilities: split size/alignment/wrap from color.
        if (utilityForKey.StartsWith("text-", StringComparison.Ordinal))
        {
            var rest = utilityForKey[5..];

            // text-[...] => font-size (arbitrary).
            if (rest.Length > 0 && rest[0] == '[')
                return variants + "text-size";

            // Common font-size tokens.
            if (rest is "xs" or "sm" or "base" or "lg" or "xl" or "2xl" or "3xl" or "4xl" or "5xl" or "6xl" or "7xl" or "8xl" or "9xl")
                return variants + "text-size";

            // Text alignment.
            if (rest is "left" or "right" or "center" or "justify" or "start" or "end")
                return variants + "text-align";

            // Text wrapping / balance utilities.
            if (rest is "balance" or "pretty" or "nowrap" or "wrap")
                return variants + "text-wrap";

            // Default: treat as text color.
            return variants + "text-color";
        }

        return null;
    }

    private static (string variants, string utility) SplitVariants(string token)
    {
        var bracketDepth = 0;
        var lastColon = -1;

        for (var i = 0; i < token.Length; i++)
        {
            var c = token[i];
            switch (c)
            {
                case '[':
                    bracketDepth++;
                    break;
                case ']':
                    if (bracketDepth > 0) bracketDepth--;
                    break;
                case ':':
                    if (bracketDepth == 0) lastColon = i;
                    break;
            }
        }

        if (lastColon < 0)
            return ("", token);

        return (token[..(lastColon + 1)], token[(lastColon + 1)..]);
    }
}

