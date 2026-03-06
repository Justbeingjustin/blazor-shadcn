namespace BlazorShadcn.Components.UI;

public sealed record CalendarDayContext(
    DateOnly Date,
    bool IsInCurrentMonth,
    bool IsSelected,
    bool IsDisabled,
    bool IsToday);
