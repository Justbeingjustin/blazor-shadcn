namespace BlazorShadcn.Components.UI;

public sealed class HoverCardContext
{
    public required bool Open { get; init; }
    public required Func<bool, Task> SetOpenAsync { get; init; }
}
