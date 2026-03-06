namespace BlazorShadcn.Components.UI;

public sealed class TabsContext
{
    public required string? ActiveValue { get; init; }
    public required string Orientation { get; init; }
    public required string Variant { get; init; }
    public required Func<string, Task> ActivateAsync { get; init; }
}
