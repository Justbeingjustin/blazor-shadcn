namespace BlazorShadcn.Components.UI;

internal sealed class AvatarContext
{
    private Func<Task>? _stateChanged;

    public bool IsImageLoaded { get; private set; }

    public void Configure(Func<Task> stateChanged)
    {
        _stateChanged = stateChanged;
    }

    public Task SetImageLoadedAsync(bool loaded)
    {
        if (IsImageLoaded == loaded)
        {
            return Task.CompletedTask;
        }

        IsImageLoaded = loaded;
        return _stateChanged is null ? Task.CompletedTask : _stateChanged();
    }
}
