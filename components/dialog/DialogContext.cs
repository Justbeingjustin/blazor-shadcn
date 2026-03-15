namespace ShadcnBlazor.Components.UI;

public sealed class DialogContext
{
    public required bool Open { get; init; }
    public required Func<bool, Task> SetOpenAsync { get; init; }
}
