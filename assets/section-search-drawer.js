(function () {
  const searchDrawerState = {
    query: "",
    scrollY: 0,
    predictiveResults: null,
    searchTimeout: null,
    isLoading: false,
    currentController: null,
    subDrawerOpen: false,
    loadingTimeout: null,
    fadeTimeouts: [],
  };

  let elements = {};

  function setDisplay(el, show, opacity = "1") {
    if (!el) return;
    el.style.display = show ? "block" : "none";
    el.classList.toggle("hidden", !show);
    if (show && opacity) el.style.opacity = opacity;
  }

  function setOpacityWithDelay(el, opacity, callback) {
    if (!el) return;
    el.style.opacity = opacity;
    if (callback) setTimeout(callback, opacity === "0" ? 200 : 10);
  }

  function showDefaultContent(fade = false) {
    ["loading", "noResults", "results"].forEach((key) => setDisplay(elements[key], false));
    ["productResults", "collectionResults", "searchBtn"].forEach((key) => {
      if (elements[key]) elements[key].style.display = "none";
    });

    ["popularSearches", "subDrawerTrigger", "newArrivals"].forEach((key) => {
      if (elements[key]) {
        setDisplay(elements[key], true, fade ? "0" : "1");
        if (fade) setTimeout(() => (elements[key].style.opacity = "1"), 10);
      }
    });
  }

  function initSearchDrawer() {
    elements = {
      drawer: document.getElementById("searchDrawer"),
      container: document.querySelector(".search-drawer__container"),
      closeBtn: document.querySelector(".search-drawer__close"),
      searchInput: null,
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

    document.querySelectorAll(".faq-item__description[data-full-text]").forEach((desc) => {
      const text = desc.getAttribute("data-full-text");
      if (text) desc.textContent = text.length > 200 ? text.substring(0, 200) + "..." : text;
    });

    showDefaultContent();

    if (elements.closeBtn) elements.closeBtn.addEventListener("click", closeSearch);
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeSearch());
    if (elements.drawer) {
      elements.drawer.addEventListener("click", (e) => e.target === elements.drawer && closeSearch());
    }
    if (elements.container) {
      elements.container.addEventListener("click", (e) => e.stopPropagation());
    }
    if (elements.subDrawerTrigger) {
      elements.subDrawerTrigger.addEventListener("click", toggleSubDrawer);
    }
    if (elements.subDrawerBack) {
      elements.subDrawerBack.addEventListener("click", toggleSubDrawer);
    }
    if (elements.noResultsBtn) {
      elements.noResultsBtn.addEventListener("click", performSearch);
    }
    if (elements.searchBtn) {
      elements.searchBtn.addEventListener("click", performSearch);
    }

    window.toggleSearch = openSearch;
    window.closeSearch = closeSearch;

    setTimeout(() => {
      elements.searchInput = document.getElementById("search");
      if (elements.searchInput) {
        elements.searchInput.addEventListener("input", handleSearchInput);
      }
    }, 0);
  }

  function openSearch() {
    searchDrawerState.scrollY =
      document.body.style.position === "fixed" ? Math.abs(parseInt(document.body.style.top || "0")) : window.scrollY;

    if (document.body.style.position !== "fixed") {
      document.body.style.position = "fixed";
      document.body.style.top = `-${searchDrawerState.scrollY}px`;
      document.body.style.width = "100%";
    }

    document.body.classList.add("search-open");
    elements.drawer.classList.add("search-drawer--active");
    showDefaultContent();
    if (typeof window.closeMenu === "function") window.closeMenu(true);
    setTimeout(() => elements.searchInput && elements.searchInput.focus(), 400);
  }

  function closeSearch() {
    searchDrawerState.subDrawerOpen = false;
    searchDrawerState.query = "";
    searchDrawerState.predictiveResults = null;
    searchDrawerState.isLoading = false;

    if (elements.searchInput) elements.searchInput.value = "";
    elements.subDrawer.classList.remove("sub-drawer--active");
    showDefaultContent();
    document.body.classList.remove("search-open");
    elements.drawer.classList.remove("search-drawer--active");

    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, searchDrawerState.scrollY);
    document.documentElement.style.scrollBehavior = "";
  }

  function toggleSubDrawer() {
    searchDrawerState.subDrawerOpen = !searchDrawerState.subDrawerOpen;
    elements.subDrawer.classList.toggle("sub-drawer--active", searchDrawerState.subDrawerOpen);
  }

  function handleSearchInput(e) {
    const query = e.target.value;
    searchDrawerState.query = query;

    clearTimeout(searchDrawerState.searchTimeout);
    clearTimeout(searchDrawerState.loadingTimeout);
    searchDrawerState.fadeTimeouts.forEach((t) => clearTimeout(t));
    searchDrawerState.fadeTimeouts = [];

    if (searchDrawerState.currentController) {
      searchDrawerState.currentController.abort();
      searchDrawerState.currentController = null;
    }

    if (!query) {
      searchDrawerState.predictiveResults = null;
      searchDrawerState.isLoading = false;

      elements.loading.style.display = "none";
      elements.loading.classList.add("hidden");
      elements.loading.style.opacity = "0";

      ["noResults", "results"].forEach((key) => setDisplay(elements[key], false));
      ["productResults", "collectionResults", "searchBtn"].forEach((key) => {
        if (elements[key]) elements[key].style.display = "none";
      });

      ["popularSearches", "subDrawerTrigger", "newArrivals"].forEach((key) => {
        if (elements[key]) {
          elements[key].style.display = "block";
          elements[key].classList.remove("hidden");
          elements[key].style.opacity = "0";
          setTimeout(() => {
            if (elements[key]) elements[key].style.opacity = "1";
          }, 10);
        }
      });

      if (searchDrawerState.subDrawerOpen) toggleSubDrawer();
      return;
    }

    searchDrawerState.isLoading = true;

    ["popularSearches", "subDrawerTrigger", "newArrivals"].forEach((key) => {
      if (elements[key]) {
        elements[key].style.opacity = "0";
        const timeout = setTimeout(() => {
          if (elements[key]) {
            elements[key].style.display = "none";
            elements[key].classList.add("hidden");
          }
        }, 200);
        searchDrawerState.fadeTimeouts.push(timeout);
      }
    });

    ["noResults", "results"].forEach((key) => setDisplay(elements[key], false));
    ["productResults", "collectionResults", "searchBtn"].forEach((key) => {
      if (elements[key]) elements[key].style.display = "none";
    });

    searchDrawerState.loadingTimeout = setTimeout(() => {
      if (searchDrawerState.query) {
        setDisplay(elements.loading, true, "0");
        setOpacityWithDelay(elements.loading, "1");
      }
    }, 200);

    if (searchDrawerState.subDrawerOpen) toggleSubDrawer();

    searchDrawerState.searchTimeout = setTimeout(() => fetchPredictiveResults(query), 300);
  }

  async function fetchPredictiveResults(query) {
    try {
      searchDrawerState.currentController = new AbortController();
      const response = await fetch(
        `/search/suggest.json?q=${encodeURIComponent(
          query
        )}&resources[type]=product,collection&resources[limit]=5&resources[limit_scope]=each`,
        { signal: searchDrawerState.currentController.signal }
      );

      if (!response.ok) throw new Error("Response not ok");

      const data = await response.json();
      const results = { products: [], collections: [] };

      ["products", "collections"].forEach((type) => {
        const items = data.resources?.results?.[type];
        if (items) {
          items.forEach((item) => {
            let imageUrl = item.image ? item.image.replace(/width=\d+/, "width=150") : null;
            if (imageUrl && !imageUrl.includes("width=")) {
              imageUrl += (item.image.includes("?") ? "&" : "?") + "width=150";
            }

            results[type].push({
              id: item.id,
              url: item.url,
              title: item.title,
              image: imageUrl,
            });
          });
        }
      });

      results.collections = results.collections.slice(0, 3);
      searchDrawerState.predictiveResults = results;
      searchDrawerState.isLoading = false;

      setOpacityWithDelay(elements.loading, "0", () => {
        setDisplay(elements.loading, false);
        renderSearchResults();

        const hasResults = results.products.length || results.collections.length;
        if (!hasResults) {
          elements.noResultsBtn.textContent = `Search for '${query}'`;
          setDisplay(elements.noResults, true, "0");
          setOpacityWithDelay(elements.noResults, "1");
        } else {
          setDisplay(elements.results, true, "0");
          setOpacityWithDelay(elements.results, "1");
        }
      });
    } catch (error) {
      if (error.name !== "AbortError") {
        searchDrawerState.isLoading = false;
        setOpacityWithDelay(elements.loading, "0", () => setDisplay(elements.loading, false));
      }
    } finally {
      searchDrawerState.currentController = null;
    }
  }

  function renderSearchResults() {
    const results = searchDrawerState.predictiveResults;
    if (!results) return;

    ["product", "collection"].forEach((type) => {
      const list = elements[`${type}List`];
      const container = elements[`${type}Results`];
      const items = results[`${type}s`];

      list.innerHTML = "";

      if (items && items.length > 0) {
        items.forEach((item) => {
          const li = document.createElement("li");
          li.className = "predictive-search__item";
          li.innerHTML = `
              <a href="${item.url}" class="predictive-search__link">
                ${
                  type === "product"
                    ? `
                  <div class="predictive-search__image-container">
                    <img src="${item.image || ""}" alt="${item.title}" class="predictive-search__image" 
                      loading="lazy" width="40" height="40">
                  </div>`
                    : ""
                }
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
    if (hasResults) {
      elements.searchBtn.textContent = `Search for '${searchDrawerState.query}'`;
      elements.searchBtn.style.display = "block";
    } else {
      elements.searchBtn.style.display = "none";
    }
  }

  function performSearch() {
    if (searchDrawerState.query) {
      window.location.href = `{{ routes.search_url }}?q=${encodeURIComponent(
        searchDrawerState.query
      )}&type=product&options[prefix]=last`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearchDrawer);
  } else {
    initSearchDrawer();
  }
})();
