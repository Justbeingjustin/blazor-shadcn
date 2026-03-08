namespace ShadcnBlazor.Components.UI;

internal sealed class AccordionContext
{
    private readonly HashSet<string> _openItems = new(StringComparer.Ordinal);
    private Func<Task>? _stateChanged;

    public Accordion.AccordionType Type { get; private set; } = Accordion.AccordionType.Single;
    public bool Collapsible { get; private set; }

    public void Configure(Accordion.AccordionType type, bool collapsible, Func<Task> stateChanged)
    {
        Type = type;
        Collapsible = collapsible;
        _stateChanged = stateChanged;
    }

    public void InitializeDefaults(string? defaultValue, IEnumerable<string>? defaultValues)
    {
        _openItems.Clear();

        if (Type == Accordion.AccordionType.Single)
        {
            if (!string.IsNullOrWhiteSpace(defaultValue))
            {
                _openItems.Add(defaultValue);
            }

            return;
        }

        if (defaultValues is null)
        {
            return;
        }

        foreach (var value in defaultValues)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                _openItems.Add(value);
            }
        }
    }

    public bool IsOpen(string value) => _openItems.Contains(value);

    public async Task ToggleAsync(string value, bool disabled)
    {
        if (disabled || string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        if (Type == Accordion.AccordionType.Single)
        {
            if (_openItems.Contains(value))
            {
                if (Collapsible)
                {
                    _openItems.Clear();
                    await NotifyChangedAsync();
                }

                return;
            }

            _openItems.Clear();
            _openItems.Add(value);
            await NotifyChangedAsync();
            return;
        }

        if (_openItems.Contains(value))
        {
            _openItems.Remove(value);
        }
        else
        {
            _openItems.Add(value);
        }

        await NotifyChangedAsync();
    }

    private Task NotifyChangedAsync() => _stateChanged is null ? Task.CompletedTask : _stateChanged();
}

internal sealed class AccordionItemContext
{
    public required AccordionContext Root { get; init; }
    public required string Value { get; init; }
    public bool Disabled { get; init; }
    public required string TriggerId { get; init; }
    public required string ContentId { get; init; }
}
