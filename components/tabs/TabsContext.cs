using Microsoft.AspNetCore.Components;

namespace ShadcnBlazor.Components.UI;

internal sealed class TabsContext
{
    private readonly List<string> _orderedTriggers = [];
    private readonly Dictionary<string, bool> _disabledTriggers = new(StringComparer.Ordinal);
    private readonly Dictionary<string, Func<Task>> _focusCallbacks = new(StringComparer.Ordinal);
    private readonly string _baseId = $"tabs-{Guid.NewGuid():N}";
    private Func<Task>? _stateChanged;
    private EventCallback<string?> _valueChanged;
    private bool _isControlled;
    private string? _controlledValue;
    private string? _uncontrolledValue;

    public string Orientation { get; private set; } = "horizontal";
    public string Variant { get; private set; } = "default";
    public string? ActiveValue => _isControlled ? _controlledValue : _uncontrolledValue;

    public void Configure(
        string orientation,
        string variant,
        string? value,
        EventCallback<string?> valueChanged,
        Func<Task> stateChanged)
    {
        Orientation = orientation;
        Variant = variant;
        _controlledValue = value;
        _valueChanged = valueChanged;
        _stateChanged = stateChanged;
        _isControlled = value is not null || valueChanged.HasDelegate;
    }

    public void InitializeDefault(string? defaultValue)
    {
        _uncontrolledValue = defaultValue;
    }

    public void SetVariant(string? variant)
    {
        if (!string.IsNullOrWhiteSpace(variant))
        {
            Variant = variant;
        }
    }

    public void RegisterTrigger(string value, bool disabled, Func<Task> focusAsync)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        if (!_orderedTriggers.Contains(value, StringComparer.Ordinal))
        {
            _orderedTriggers.Add(value);
        }

        _disabledTriggers[value] = disabled;
        _focusCallbacks[value] = focusAsync;
    }

    public string GetTriggerId(string value) => $"{_baseId}-trigger-{value}";

    public string GetContentId(string value) => $"{_baseId}-content-{value}";

    public bool IsActive(string value)
        => string.Equals(ActiveValue, value, StringComparison.Ordinal);

    public async Task ActivateAsync(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || _disabledTriggers.GetValueOrDefault(value))
        {
            return;
        }

        var changed = !string.Equals(ActiveValue, value, StringComparison.Ordinal);
        _controlledValue = value;

        if (_isControlled)
        {
            if (changed && _valueChanged.HasDelegate)
            {
                await _valueChanged.InvokeAsync(value);
            }

            await NotifyStateChangedAsync();
            return;
        }

        _uncontrolledValue = value;

        if (changed && _valueChanged.HasDelegate)
        {
            await _valueChanged.InvokeAsync(value);
        }

        await NotifyStateChangedAsync();
    }

    public async Task FocusAdjacentAsync(string currentValue, int direction)
    {
        if (_orderedTriggers.Count == 0)
        {
            return;
        }

        var enabledValues = _orderedTriggers
            .Where(value => !_disabledTriggers.GetValueOrDefault(value))
            .ToArray();

        if (enabledValues.Length == 0)
        {
            return;
        }

        var currentIndex = Array.FindIndex(enabledValues, value => string.Equals(value, currentValue, StringComparison.Ordinal));
        var nextIndex = currentIndex >= 0
            ? (currentIndex + direction + enabledValues.Length) % enabledValues.Length
            : 0;

        await FocusAndActivateAsync(enabledValues[nextIndex]);
    }

    public Task FocusFirstAsync()
        => FocusBoundaryAsync(first: true);

    public Task FocusLastAsync()
        => FocusBoundaryAsync(first: false);

    private Task FocusBoundaryAsync(bool first)
    {
        var candidate = first
            ? _orderedTriggers.FirstOrDefault(value => !_disabledTriggers.GetValueOrDefault(value))
            : _orderedTriggers.LastOrDefault(value => !_disabledTriggers.GetValueOrDefault(value));

        return candidate is null ? Task.CompletedTask : FocusAndActivateAsync(candidate);
    }

    private async Task FocusAndActivateAsync(string value)
    {
        if (_focusCallbacks.TryGetValue(value, out var focusAsync))
        {
            await focusAsync.Invoke();
        }

        await ActivateAsync(value);
    }

    private Task NotifyStateChangedAsync()
        => _stateChanged is null ? Task.CompletedTask : _stateChanged.Invoke();
}
