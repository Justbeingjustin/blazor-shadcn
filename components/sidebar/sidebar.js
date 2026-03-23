window.blazorShadcnSidebar ??= (() => {
  let nextId = 0;
  const disposers = new Map();

  return {
    isMobile() {
      return window.matchMedia("(max-width: 767.98px)").matches;
    },
    registerShortcut(dotNetRef, key) {
      const shortcutKey = (key || "b").toLowerCase();
      const id = ++nextId;
      const handler = (event) => {
        const target = event.target;
        const tag = target?.tagName?.toLowerCase?.();
        const isEditable = tag === "input" || tag === "textarea" || target?.isContentEditable;

        if (isEditable) {
          return;
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === shortcutKey) {
          event.preventDefault();
          dotNetRef.invokeMethodAsync("ToggleFromShortcut");
        }
      };

      window.addEventListener("keydown", handler);
      disposers.set(id, () => window.removeEventListener("keydown", handler));
      return id;
    },
    dispose(id) {
      const dispose = disposers.get(id);
      if (!dispose) {
        return;
      }

      dispose();
      disposers.delete(id);
    }
  };
})();
