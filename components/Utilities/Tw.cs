using System.Text;

namespace BlazorShadcn.Utilities;

/// <summary>
/// Minimal Tailwind "className" utilities.
///
/// In shadcn/ui, class strings are merged with tailwind-merge so user-provided classes can override
/// variant defaults (for example "bg-green-600" should override the variant's "bg-primary").
///
/// We don't attempt full tailwind-merge parity here; we implement the small set of merge-groups
/// we actively rely on in components. Expand as needed when new conflicts appear.
/// </summary>
public static class Tw
{
    public static string Merge(params string?[] classes)
    {
        var tokens = new List<string>();
        var lastIndexByKey = new Dictionary<string, int>(StringComparer.Ordinal);

        foreach (var chunk in classes)
        {
            if (string.IsNullOrWhiteSpace(chunk))
            {
                continue;
            }

            foreach (var token in chunk.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            {
                var key = GetMergeKey(token);
                if (key is null)
                {
                    tokens.Add(token);
                    continue;
                }

                if (lastIndexByKey.TryGetValue(key, out var previousIndex))
                {
                    tokens[previousIndex] = string.Empty;
                }

                lastIndexByKey[key] = tokens.Count;
                tokens.Add(token);
            }
        }

        if (tokens.Count == 0)
        {
            return string.Empty;
        }

        var builder = new StringBuilder(tokens.Count * 8);
        for (var i = 0; i < tokens.Count; i++)
        {
            var token = tokens[i];
            if (string.IsNullOrEmpty(token))
            {
                continue;
            }

            if (builder.Length > 0)
            {
                builder.Append(' ');
            }

            builder.Append(token);
        }

        return builder.ToString();
    }

    private static string? GetMergeKey(string token)
    {
        var (variants, utility) = SplitVariants(token);
        var utilityForKey = utility.Length > 0 && utility[0] == '!' ? utility[1..] : utility;

        if (utilityForKey.StartsWith("bg-", StringComparison.Ordinal))
        {
            return variants + "bg";
        }

        if (utilityForKey == "border" ||
            utilityForKey is "border-0" or "border-2" or "border-4" or "border-8")
        {
            return variants + "border-width";
        }

        if (utilityForKey is "border-x" or "border-y" or "border-t" or "border-r" or "border-b" or "border-l" or "border-s" or "border-e")
        {
            return variants + utilityForKey;
        }

        if (utilityForKey.StartsWith("border-", StringComparison.Ordinal))
        {
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

        if (utilityForKey.StartsWith("text-", StringComparison.Ordinal))
        {
            var rest = utilityForKey[5..];

            if (rest.Length > 0 && rest[0] == '[')
            {
                return variants + "text-size";
            }

            if (rest is "xs" or "sm" or "base" or "lg" or "xl" or "2xl" or "3xl" or "4xl" or "5xl" or "6xl" or "7xl" or "8xl" or "9xl")
            {
                return variants + "text-size";
            }

            if (rest is "left" or "right" or "center" or "justify" or "start" or "end")
            {
                return variants + "text-align";
            }

            if (rest is "balance" or "pretty" or "nowrap" or "wrap")
            {
                return variants + "text-wrap";
            }

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
            var current = token[i];
            switch (current)
            {
                case '[':
                    bracketDepth++;
                    break;
                case ']':
                    if (bracketDepth > 0)
                    {
                        bracketDepth--;
                    }
                    break;
                case ':':
                    if (bracketDepth == 0)
                    {
                        lastColon = i;
                    }
                    break;
            }
        }

        if (lastColon < 0)
        {
            return (string.Empty, token);
        }

        return (token[..(lastColon + 1)], token[(lastColon + 1)..]);
    }
}
