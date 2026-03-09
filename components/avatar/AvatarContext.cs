namespace ShadcnBlazor.Components.UI;

internal sealed class AvatarContext
{
    private Func<Task>? _stateChanged;

    public bool HasImageSource { get; private set; }

    public void Configure(Func<Task> stateChanged)
    {
        _stateChanged = stateChanged;
    }

    public Task SetHasImageSourceAsync(bool hasImageSource)
    {
        if (HasImageSource == hasImageSource)
        {
            return Task.CompletedTask;
        }

        HasImageSource = hasImageSource;
        return _stateChanged is null ? Task.CompletedTask : _stateChanged();
    }
}
