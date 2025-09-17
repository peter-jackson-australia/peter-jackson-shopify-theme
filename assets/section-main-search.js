(() => {
  const elements = {};
  const state = {
    isOpen: false,
    scrollY: 0,
  };

  const cacheElements = () => {
    elements.container = document.querySelector(".search-filter-container");
    elements.sidebar = document.querySelector(".search-filter-sidebar");
    elements.openBtn = document.querySelector(".search-controls__filter-button");
    elements.closeBtn = document.querySelector(".search-filter-close-btn");
    elements.overlay = document.querySelector(".search-filter-sidebar__overlay");
  };

  const lockScroll = () => {
    state.scrollY = window.scrollY;
    Object.assign(document.body.style, {
      position: "fixed",
      top: `-${state.scrollY}px`,
      width: "100%",
    });
  };

  const openFilter = () => {
    if (state.isOpen || !elements.container) return;

    lockScroll();
    state.isOpen = true;
    document.body.classList.add("search-filter-open");
    elements.container.style.display = "block";
  };

  const closeFilter = () => {
    if (!state.isOpen || !elements.container) return;

    elements.sidebar?.classList.add("closing");

    setTimeout(() => {
      state.isOpen = false;
      document.body.classList.remove("search-filter-open");
      elements.sidebar?.classList.remove("closing");
      elements.container.style.display = "none";

      document.documentElement.style.scrollBehavior = "auto";

      const savedScrollY = state.scrollY;
      Object.assign(document.body.style, {
        position: "",
        top: "",
        width: "",
      });
      window.scrollTo(0, savedScrollY);

      document.documentElement.style.scrollBehavior = "";
    }, 300);
  };

  const init = () => {
    cacheElements();

    if (!elements.container) return;

    elements.container.style.display = "none";

    elements.openBtn?.addEventListener("click", openFilter);
    elements.closeBtn?.addEventListener("click", closeFilter);
    elements.overlay?.addEventListener("click", closeFilter);

    document.addEventListener("menu-open", closeFilter);

    if (typeof window.closeFilter === "undefined") {
      window.closeFilter = closeFilter;
    }
  };

  if (document.querySelector("#AjaxinateContainer")) {
    new Ajaxinate({
      method: "scroll",
      container: "#AjaxinateContainer",
      pagination: "#AjaxinatePagination",
      offset: "100",
      loadingText:
        '<div style="margin:auto 0;display:flex;justify-content:center;align-items:center;padding:var(--space-m) 0;width:100%;height:1px;overflow:hidden"><svg fill=#E7E7E7 height=1 style=max-width:300px viewBox="0 0 100 1"width=100% xmlns=http://www.w3.org/2000/svg><style>.react{animation:moving 1s ease-in-out infinite;transform-origin:0 50%}@keyframes moving{0%{width:0%}50%{width:100%;transform:translateX(0)}100%{width:0;transform:translateX(100%)}}</style><rect class=react fill=#E7E7E7 height=1 width=100% /></svg></div>',
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
