namespace BlazorShadcn.Components.UI;

public sealed class TooltipContext
{
    public required bool Open { get; set; }
    public required int DelayDuration { get; init; }
    public required Func<bool, Task> SetOpenAsync { get; init; }
}
