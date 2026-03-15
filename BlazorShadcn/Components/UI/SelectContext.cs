using Microsoft.AspNetCore.Components;

namespace BlazorShadcn.Components.UI;

internal sealed class SelectContext
{
    private readonly Dictionary<string, string?> _itemTexts = new(StringComparer.Ordinal);
    private readonly string _contentId = $"select-content-{Guid.NewGuid().ToString("N", System.Globalization.CultureInfo.InvariantCulture)}";
    private Func<Task>? _stateChanged;
    private EventCallback<string?> _valueChanged;
    private bool _disabled;
    private bool _isControlled;
    private bool _isOpen;
    private string? _controlledValue;
    private string? _uncontrolledValue;

    public bool Disabled => _disabled;
    public bool IsOpen => _isOpen;
    public string ContentId => _contentId;
    public string? CurrentValue => _isControlled ? _controlledValue : _uncontrolledValue;

    public string? SelectedText
    {
        get
        {
            var value = CurrentValue;
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return _itemTexts.TryGetValue(value, out var text) && !string.IsNullOrWhiteSpace(text)
                ? text
                : value;
        }
    }

    public void Configure(
        bool disabled,
        string? value,
        EventCallback<string?> valueChanged,
        Func<Task> stateChanged)
    {
        _disabled = disabled;
        _controlledValue = value;
        _valueChanged = valueChanged;
        _stateChanged = stateChanged;
        _isControlled = value is not null;
    }

    public void InitializeDefault(string? defaultValue)
    {
        _uncontrolledValue = defaultValue;
    }

    public void RegisterItem(string? value, string? text)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        _itemTexts[value] = text;
    }

    public bool IsSelected(string? value)
        => !string.IsNullOrWhiteSpace(value) &&
           string.Equals(CurrentValue, value, StringComparison.Ordinal);

    public async Task ToggleAsync()
    {
        if (_disabled)
        {
            return;
        }

        _isOpen = !_isOpen;
        await NotifyStateChangedAsync();
    }

    public async Task CloseAsync()
    {
        if (!_isOpen)
        {
            return;
        }

        _isOpen = false;
        await NotifyStateChangedAsync();
    }

    public async Task SelectAsync(string? value, string? text, bool itemDisabled)
    {
        if (_disabled || itemDisabled || string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        RegisterItem(value, text);
        _controlledValue = value;

        if (_isControlled)
        {
            if (_valueChanged.HasDelegate)
            {
                await _valueChanged.InvokeAsync(value);
            }

            _isOpen = false;
            await NotifyStateChangedAsync();
            return;
        }

        var valueChanged = !string.Equals(_uncontrolledValue, value, StringComparison.Ordinal);
        _uncontrolledValue = value;
        _isOpen = false;

        if (valueChanged && _valueChanged.HasDelegate)
        {
            await _valueChanged.InvokeAsync(value);
        }

        await NotifyStateChangedAsync();
    }

    private Task NotifyStateChangedAsync()
        => _stateChanged is null ? Task.CompletedTask : _stateChanged.Invoke();
}
