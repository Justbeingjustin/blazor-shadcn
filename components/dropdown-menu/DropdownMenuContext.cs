namespace ShadcnBlazor.Components.UI;

public sealed class DropdownMenuContext
{
    public required bool Open { get; init; }
    public required Func<bool, Task> SetOpenAsync { get; init; }
}

