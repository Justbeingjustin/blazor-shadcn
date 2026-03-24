namespace BlazorShadcn.Components.UI;

public sealed class CarouselApi
{
    private readonly Carousel _carousel;

    internal CarouselApi(Carousel carousel)
    {
        _carousel = carousel;
    }

    public bool CanScrollPrev => _carousel.CanScrollPrev;
    public bool CanScrollNext => _carousel.CanScrollNext;
    public int SelectedIndex => _carousel.SelectedIndex;
    public int SlideCount => _carousel.SlideCount;
    public Task ScrollPrevAsync() => _carousel.ScrollPrevAsync();
    public Task ScrollNextAsync() => _carousel.ScrollNextAsync();
    public Task ScrollToAsync(int index) => _carousel.ScrollToAsync(index);
}
