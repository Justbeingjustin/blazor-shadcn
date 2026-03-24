namespace ShadcnBlazor.Components.UI;

public sealed class CarouselContext
{
    public required Carousel Root { get; init; }
    public required Func<Carousel.CarouselOrientation> GetOrientation { get; init; }
}
