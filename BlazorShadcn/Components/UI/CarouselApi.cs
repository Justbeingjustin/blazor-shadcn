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
    public Task ScrollPrevAsync() => _carousel.ScrollPrevAsync();
    public Task ScrollNextAsync() => _carousel.ScrollNextAsync();
}
