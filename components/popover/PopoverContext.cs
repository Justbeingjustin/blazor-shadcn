using Microsoft.AspNetCore.Components;

namespace ShadcnBlazor.Components.UI;

public sealed class PopoverContext
{
    public required string ContentId { get; init; }
    public required bool Open { get; init; }
    public required Func<bool, Task> SetOpenAsync { get; init; }
}
