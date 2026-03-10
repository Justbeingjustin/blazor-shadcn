namespace BlazorShadcn.Components.UI;

public sealed class ToggleGroupContext
{
    public required string Type { get; init; }
    public required HashSet<string> Values { get; init; }
    public required Func<string, Task> ToggleAsync { get; init; }
    public required string Variant { get; init; }
    public required string Size { get; init; }
    public required bool Disabled { get; init; }
}
