(() => {
  const state = {
    query: "",
    scrollY: 0,
    isLoading: false,
    controller: null,
    subDrawerOpen: false,
    timeouts: { search: null, loading: null, fade: [] },
  };

  let dom = {};

  const initializeElements = () => {
    dom = {
      drawer: document.getElementById("searchDrawer"),
      container: document.querySelector(".search-drawer__container"),
      closeBtn: document.querySelector(".search-drawer__close"),
      searchInput: document.getElementById("search"),
      loading: document.getElementById("searchLoading"),
      noResults: document.getElementById("noResultsContainer"),
      noResultsBtn: document.getElementById("noResultsSearchButton"),
      results: document.getElementById("searchResultsContainer"),
      productResults: document.getElementById("productResults"),
      productList: document.getElementById("productResultsList"),
      collectionResults: document.getElementById("collectionResults"),
      collectionList: document.getElementById("collectionResultsList"),
      searchBtn: document.getElementById("searchResultsButton"),
      popularSearches: document.getElementById("popularSearches"),
      subDrawerTrigger: document.getElementById("subDrawerTrigger"),
      subDrawer: document.getElementById("subDrawer"),
      subDrawerBack: document.getElementById("subDrawerBack"),
      newArrivals: document.getElementById("newArrivals"),
    };
  };

  const toggleElement = (el, show, opacity = "1") => {
    if (!el) return;
    el.style.display = show ? "block" : "none";
    el.classList.toggle("hidden", !show);
    if (show && opacity) el.style.opacity = opacity;
  };

  const fadeElement = (el, opacity, callback) => {
    if (!el) return;
    el.style.opacity = opacity;
    if (callback) setTimeout(callback, opacity === "0" ? 200 : 10);
  };

  const toggleElements = (elements, show, fade = false) => {
    elements.forEach((key) => {
      if (dom[key]) {
        toggleElement(dom[key], show, fade ? "0" : "1");
        if (fade && show) setTimeout(() => (dom[key].style.opacity = "1"), 10);
      }
    });
  };

  const clearTimeouts = () => {
    clearTimeout(state.timeouts.search);
    clearTimeout(state.timeouts.loading);
    state.timeouts.fade.forEach(clearTimeout);
    state.timeouts.fade = [];
  };

  const abortCurrentRequest = () => {
    if (state.controller) {
      state.controller.abort();
      state.controller = null;
    }
  };

  const showDefaultContent = (fade = false) => {
    ["loading", "noResults", "results", "productResults", "collectionResults", "searchBtn"].forEach((key) =>
      toggleElement(dom[key], false)
    );
    toggleElements(["popularSearches", "subDrawerTrigger", "newArrivals"], true, fade);
  };

  const hideDefaultContent = () => {
    ["popularSearches", "subDrawerTrigger", "newArrivals"].forEach((key) => {
      if (dom[key]) {
        dom[key].style.opacity = "0";
        const timeout = setTimeout(() => {
          dom[key].style.display = "none";
          dom[key].classList.add("hidden");
        }, 200);
        state.timeouts.fade.push(timeout);
      }
    });
  };

  const openSearchDrawer = () => {
    state.scrollY =
      document.body.style.position === "fixed" ? Math.abs(parseInt(document.body.style.top || "0")) : window.scrollY;

    if (document.body.style.position !== "fixed") {
      Object.assign(document.body.style, {
        position: "fixed",
        top: `-${state.scrollY}px`,
        width: "100%",
      });
    }

    document.body.classList.add("search-open");
    dom.drawer.classList.add("search-drawer--active");
    showDefaultContent();
    if (window.closeMenu) window.closeMenu(true);
    setTimeout(() => dom.searchInput?.focus(), 400);
  };

  const closeSearchDrawer = () => {
    state.subDrawerOpen = false;
    state.query = "";
    state.isLoading = false;
    if (dom.searchInput) dom.searchInput.value = "";

    dom.subDrawer?.classList.remove("sub-drawer--active");
    showDefaultContent();
    document.body.classList.remove("search-open");
    dom.drawer?.classList.remove("search-drawer--active");

    document.documentElement.style.scrollBehavior = "auto";
    Object.assign(document.body.style, { position: "", top: "", width: "" });
    window.scrollTo(0, state.scrollY);
    document.documentElement.style.scrollBehavior = "";
  };

  const toggleSubDrawer = () => {
    state.subDrawerOpen = !state.subDrawerOpen;
    dom.subDrawer?.classList.toggle("sub-drawer--active", state.subDrawerOpen);
  };

  const performSearch = () => {
    if (state.query) {
      window.location.href = `/search?q=${encodeURIComponent(state.query)}&type=product&options[prefix]=last`;
    }
  };

  const renderSearchResults = (results) => {
    if (!results) return;

    [
      { type: "product", plural: "products", showImage: true },
      { type: "collection", plural: "collections", showImage: false },
    ].forEach(({ type, plural, showImage }) => {
      const list = dom[`${type}List`];
      const container = dom[`${type}Results`];
      const items = results[plural];

      if (!list || !container) return;
      list.innerHTML = "";

      if (items?.length > 0) {
        items.forEach((item) => {
          const li = document.createElement("li");
          li.className = "predictive-search__item";

          let imageHtml = "";
          if (showImage && item.image) {
            const baseUrl = item.image.replace(/width=\d+/, "");
            const separator = baseUrl.includes("?") ? "&" : "?";
            imageHtml = `
                  <div class="predictive-search__image-container">
                    <img src="${baseUrl}${separator}width=80" 
                      srcset="${baseUrl}${separator}width=80 1x, ${baseUrl}${separator}width=160 2x, ${baseUrl}${separator}width=240 3x"
                      alt="${item.title}" 
                      class="predictive-search__image" 
                      loading="eager" 
                      fetchpriority="high"
                      decoding="async"
                      width="40" 
                      height="40">
                  </div>`;
          }

          li.innerHTML = `
              <a href="${item.url}" class="predictive-search__link">
                ${imageHtml}
                <span class="predictive-search__text body">${item.title}</span>
              </a>`;
          list.appendChild(li);
        });
        container.style.display = "block";
      } else {
        container.style.display = "none";
      }
    });

    const hasResults = results.products.length || results.collections.length;
    if (dom.searchBtn) {
      dom.searchBtn.textContent = `Search for '${state.query}'`;
      dom.searchBtn.style.display = hasResults ? "block" : "none";
    }
  };

  const fetchSearchResults = async (query) => {
    try {
      state.controller = new AbortController();
      const response = await fetch(
        `/search/suggest.json?q=${encodeURIComponent(
          query
        )}&resources[type]=product,collection&resources[limit]=5&resources[limit_scope]=each`,
        { signal: state.controller.signal }
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      const results = { products: [], collections: [] };

      ["products", "collections"].forEach((type) => {
        const items = data.resources?.results?.[type] || [];
        results[type] = items.map((item, index) => {
          let imageUrl = null;
          if (item.image) {
            imageUrl = item.image.replace(/width=\d+/, "width=80");

            if (type === "products" && index < 3) {
              const link = document.createElement("link");
              link.rel = "preload";
              link.as = "image";
              link.href = imageUrl;
              document.head.appendChild(link);
            }
          }

          return {
            id: item.id,
            url: item.url,
            title: item.title,
            image: imageUrl,
          };
        });
      });

      results.collections = results.collections.slice(0, 3);
      state.isLoading = false;

      fadeElement(dom.loading, "0", () => {
        toggleElement(dom.loading, false);
        renderSearchResults(results);

        const hasResults = results.products.length || results.collections.length;
        if (!hasResults) {
          if (dom.noResultsBtn) dom.noResultsBtn.textContent = `Search for '${query}'`;
          toggleElement(dom.noResults, true, "0");
          fadeElement(dom.noResults, "1");
        } else {
          toggleElement(dom.results, true, "0");
          fadeElement(dom.results, "1");
        }
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        state.isLoading = false;
        fadeElement(dom.loading, "0", () => toggleElement(dom.loading, false));
      }
    } finally {
      state.controller = null;
    }
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    state.query = query;

    clearTimeouts();
    abortCurrentRequest();

    if (!query) {
      state.isLoading = false;
      toggleElement(dom.loading, false);
      ["noResults", "results", "productResults", "collectionResults", "searchBtn"].forEach((key) =>
        toggleElement(dom[key], false)
      );
      showDefaultContent(true);
      if (state.subDrawerOpen) toggleSubDrawer();
      return;
    }

    state.isLoading = true;
    hideDefaultContent();
    ["noResults", "results", "productResults", "collectionResults", "searchBtn"].forEach((key) =>
      toggleElement(dom[key], false)
    );

    state.timeouts.loading = setTimeout(() => {
      if (state.query) {
        toggleElement(dom.loading, true, "0");
        fadeElement(dom.loading, "1");
      }
    }, 200);

    if (state.subDrawerOpen) toggleSubDrawer();
    state.timeouts.search = setTimeout(() => fetchSearchResults(query), 300);
  };

  const attachEventListeners = () => {
    dom.closeBtn?.addEventListener("click", closeSearchDrawer);
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeSearchDrawer());
    dom.drawer?.addEventListener("click", (e) => e.target === dom.drawer && closeSearchDrawer());
    dom.container?.addEventListener("click", (e) => e.stopPropagation());

    dom.subDrawerTrigger?.addEventListener("click", toggleSubDrawer);
    dom.subDrawerBack?.addEventListener("click", toggleSubDrawer);

    dom.searchInput?.addEventListener("input", handleSearchInput);
    dom.noResultsBtn?.addEventListener("click", performSearch);
    dom.searchBtn?.addEventListener("click", performSearch);

    window.toggleSearch = openSearchDrawer;
    window.closeSearch = closeSearchDrawer;
  };

  const initialize = () => {
    initializeElements();

    document.querySelectorAll(".faq-item__description[data-full-text]").forEach((desc) => {
      const text = desc.getAttribute("data-full-text");
      if (text) desc.textContent = text.length > 200 ? `${text.substring(0, 200)}...` : text;
    });

    showDefaultContent();
    attachEventListeners();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
