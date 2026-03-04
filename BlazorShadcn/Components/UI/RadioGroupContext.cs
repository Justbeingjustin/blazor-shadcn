using Microsoft.AspNetCore.Components;

namespace BlazorShadcn.Components.UI;

internal sealed class RadioGroupContext
{
    private Func<Task>? _stateChanged;
    private EventCallback<string?> _valueChanged;
    private string _name = $"radio-group-{Guid.NewGuid().ToString("N", System.Globalization.CultureInfo.InvariantCulture)}";
    private bool _disabled;
    private bool _isControlled;
    private string? _controlledValue;
    private string? _uncontrolledValue;

    public string Name => _name;
    public bool Disabled => _disabled;
    private string? CurrentValue => _isControlled ? _controlledValue : _uncontrolledValue;

    public void Configure(
        string? name,
        bool disabled,
        string? value,
        EventCallback<string?> valueChanged,
        Func<Task> stateChanged)
    {
        if (!string.IsNullOrWhiteSpace(name))
        {
            _name = name;
        }

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

    public bool IsSelected(string? value)
        => !string.IsNullOrWhiteSpace(value) &&
           string.Equals(CurrentValue, value, StringComparison.Ordinal);

    public async Task SelectAsync(string? value, bool itemDisabled)
    {
        if (_disabled || itemDisabled || string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        if (_isControlled)
        {
            if (_valueChanged.HasDelegate)
            {
                await _valueChanged.InvokeAsync(value);
            }

            return;
        }

        if (string.Equals(_uncontrolledValue, value, StringComparison.Ordinal))
        {
            return;
        }

        _uncontrolledValue = value;

        if (_valueChanged.HasDelegate)
        {
            await _valueChanged.InvokeAsync(value);
        }

        if (_stateChanged is not null)
        {
            await _stateChanged.Invoke();
        }
    }
}
