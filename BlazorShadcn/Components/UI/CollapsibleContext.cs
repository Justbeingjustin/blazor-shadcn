namespace BlazorShadcn.Components.UI;

public sealed class CollapsibleContext
{
    public required Func<bool> GetOpen { get; init; }
    public required Func<Task> ToggleAsync { get; init; }
}
