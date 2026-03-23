namespace ShadcnBlazor.Components.UI;

public sealed class SidebarContext
{
    public required bool Open { get; init; }
    public required bool OpenMobile { get; init; }
    public required string State { get; init; }
    public required Func<bool, Task> SetOpenAsync { get; init; }
    public required Func<bool, Task> SetOpenMobileAsync { get; init; }
    public required Func<Task> ToggleSidebarAsync { get; init; }
}
