window.blazorShadcnCarousel ??= (() => {
  const carousels = new Map();

  function getState(id) {
    return carousels.get(id) || null;
  }

  function getAxis(axis) {
    return axis === "y" ? "top" : "left";
  }

  function getScrollProp(axis) {
    return axis === "y" ? "scrollTop" : "scrollLeft";
  }

  function getMaxScroll(viewport, axis) {
    return axis === "y"
      ? Math.max(0, viewport.scrollHeight - viewport.clientHeight)
      : Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  }

  function getTrack(viewport) {
    return viewport.firstElementChild || null;
  }

  function getSlides(viewport) {
    const track = getTrack(viewport);
    return Array.from(track?.children || []);
  }

  function getSelectedIndex(positions, current) {
    if (!positions.length) {
      return 0;
    }

    let selectedIndex = 0;
    let smallestDistance = Math.abs(positions[0] - current);

    for (let i = 1; i < positions.length; i += 1) {
      const distance = Math.abs(positions[i] - current);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        selectedIndex = i;
      }
    }

    return selectedIndex;
  }

  function getSlidePositions(viewport, axis) {
    const viewportRect = viewport.getBoundingClientRect();

    return getSlides(viewport).map((slide) => {
      const anchor = slide.firstElementChild || slide;
      const slideRect = anchor.getBoundingClientRect();
      return axis === "y"
        ? slideRect.top - viewportRect.top + viewport.scrollTop
        : slideRect.left - viewportRect.left + viewport.scrollLeft;
    });
  }

  function notify(id) {
    const state = getState(id);
    if (!state) {
      return;
    }

    const viewport = state.viewport;
    const axis = state.axis;
    const current = viewport[getScrollProp(axis)];
    const max = getMaxScroll(viewport, axis);
    const positions = getSlidePositions(viewport, axis);
    const epsilon = 2;

    state.dotNet.invokeMethodAsync(
      "UpdateState",
      current > epsilon,
      current < max - epsilon,
      getSelectedIndex(positions, current),
      positions.length
    );
  }

  function scrollToPosition(viewport, axis, target) {
    viewport.scrollTo({
      [getAxis(axis)]: target,
      behavior: "smooth"
    });
  }

  function scrollToIndex(id, direction) {
    const state = getState(id);
    if (!state) {
      return;
    }

    const viewport = state.viewport;
    const axis = state.axis;
    const positions = getSlidePositions(viewport, axis);
    if (!positions.length) {
      return;
    }

    const scrollProp = getScrollProp(axis);
    const current = viewport[scrollProp];
    const epsilon = 2;
    let target = current;

    if (direction < 0) {
      for (let i = positions.length - 1; i >= 0; i -= 1) {
        if (positions[i] < current - epsilon) {
          target = positions[i];
          break;
        }
      }
    } else {
      for (let i = 0; i < positions.length; i += 1) {
        if (positions[i] > current + epsilon) {
          target = positions[i];
          break;
        }
      }
    }

    scrollToPosition(viewport, axis, target);
  }

  function scrollTo(id, index) {
    const state = getState(id);
    if (!state) {
      return;
    }

    const viewport = state.viewport;
    const positions = getSlidePositions(viewport, state.axis);
    if (!positions.length) {
      return;
    }

    const safeIndex = Math.min(Math.max(index, 0), positions.length - 1);
    scrollToPosition(viewport, state.axis, positions[safeIndex]);
  }

  function init(id, viewport, dotNet, axis) {
    dispose(id);

    const onScroll = () => notify(id);
    const onResize = () => notify(id);
    const resizeObserver = new ResizeObserver(onResize);

    viewport.addEventListener("scroll", onScroll, { passive: true });
    resizeObserver.observe(viewport);
    getSlides(viewport).forEach((slide) => resizeObserver.observe(slide));

    carousels.set(id, {
      viewport,
      dotNet,
      axis,
      onScroll,
      resizeObserver
    });

    notify(id);
  }

  function refresh(id, axis) {
    const state = getState(id);
    if (!state) {
      return;
    }

    state.axis = axis;
    notify(id);
  }

  function dispose(id) {
    const state = getState(id);
    if (!state) {
      return;
    }

    state.viewport.removeEventListener("scroll", state.onScroll);
    state.resizeObserver.disconnect();
    carousels.delete(id);
  }

  return {
    init,
    refresh,
    dispose,
    scrollTo,
    scrollPrev: (id) => scrollToIndex(id, -1),
    scrollNext: (id) => scrollToIndex(id, 1)
  };
})();
