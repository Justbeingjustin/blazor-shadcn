namespace BlazorShadcn.Components.UI;

public sealed class DropdownMenuSubGroupContext
{
    private Guid? _activeSubId;
    private event Action<Guid?>? ActiveSubChanged;

    public Guid? ActiveSubId => _activeSubId;

    public void Subscribe(Action<Guid?> handler) => ActiveSubChanged += handler;

    public void Unsubscribe(Action<Guid?> handler) => ActiveSubChanged -= handler;

    public Task SetActiveSubAsync(Guid? subId)
    {
        if (_activeSubId == subId)
        {
            return Task.CompletedTask;
        }

        _activeSubId = subId;
        ActiveSubChanged?.Invoke(_activeSubId);
        return Task.CompletedTask;
    }
}
