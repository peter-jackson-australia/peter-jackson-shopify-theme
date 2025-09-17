(() => {
  const menuDrawer = {
    isOpen: false,
    currentLevel: 1,
    menuData: [],
    activeIndexes: [null, null],
    featuredImage: { url: "", alt: "" },
    filteredArticles: [],
    splideSlider: null,

    init() {
      this.updateHeaderHeight();
      this.setupObservers();
      this.loadMenuData();
      this.setupEventListeners();

      window.toggleNav = () => (this.isOpen ? this.closeMenu() : this.openMenu());
      window.closeMenu = () => this.closeMenu();
    },

    setupObservers() {
      const header = document.querySelector("#site-header");
      if (header) {
        new MutationObserver(() => this.updateHeaderHeight()).observe(header, {
          attributes: true,
          attributeFilter: ["class"],
        });
      }

      ["scroll", "resize"].forEach((e) => window.addEventListener(e, () => this.updateHeaderHeight()));

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this.closeMenu();
      });
    },

    loadMenuData() {
      const script = document.getElementById("menu-drawer-script");
      const menuDataEscaped = script?.getAttribute("data-menu-data");

      if (menuDataEscaped) {
        try {
          this.menuData = JSON.parse(this.decodeHtml(menuDataEscaped));
        } catch (e) {
          console.error("Failed to parse menu data:", e);
        }
      }
    },

    setupEventListeners() {
      document.querySelector(".menu-drawer__overlay")?.addEventListener("click", () => this.closeMenu());

      document
        .querySelectorAll(".menu-drawer__back")
        .forEach((btn) => btn.addEventListener("click", () => this.backLevel()));

      document.querySelectorAll("#menu-drawer__menu-1 .menu-drawer__button--has-submenu").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.openLevel(
            2,
            btn.dataset.menuTitle,
            parseInt(btn.dataset.menuIndex),
            btn.dataset.menuImage,
            btn.dataset.menuImageAlt
          );
        });
      });
    },

    updateHeaderHeight() {
      const header = document.querySelector("#site-header");
      const overlay = document.querySelector(".menu-drawer__overlay");
      const drawer = document.querySelector(".menu-drawer");

      if (!header || !overlay || !drawer) return;

      const isFixed = header.classList.contains("header-fixed");
      const top = isFixed ? "var(--space-xl)" : Math.max(0, header.getBoundingClientRect().bottom) + "px";

      overlay.style.top = drawer.style.top = top;
    },

    decodeHtml(text) {
      if (!text) return "";
      const textarea = document.createElement("textarea");
      textarea.innerHTML = text;
      return textarea.value;
    },

    toggleScrollLock(lock) {
      if (lock) {
        const scrollY = window.scrollY;
        Object.assign(document.body.style, {
          position: "fixed",
          top: `-${scrollY}px`,
          width: "100%",
        });
      } else {
        const scrollY = Math.abs(parseInt(document.body.style.top || "0"));
        document.documentElement.style.scrollBehavior = "auto";
        Object.assign(document.body.style, { position: "", top: "", width: "" });
        window.scrollTo(0, scrollY);
        document.documentElement.style.scrollBehavior = "";
      }
    },

    openMenu() {
      this.toggleScrollLock(true);
      this.resetMenu();
      this.isOpen = true;

      document.body.classList.add("menu-open");
      document.querySelector(".hamburger-menu")?.classList.add("nav-open");
      window.closeFilter?.();

      [".menu-drawer__overlay", ".menu-drawer"].forEach((sel) =>
        document.querySelector(sel)?.classList.add("menu-drawer--open")
      );

      const video = document.querySelector(".menu-drawer__video");
      video?.play().catch((e) => console.log("Autoplay prevented:", e));

      setTimeout(() => this.updateHeaderHeight(), 0);
      this.triggerAnimations([
        "#menu-drawer__menu-1",
        "#menu-drawer__menu-1-secondary",
        ".menu-drawer__scrollable-content",
      ]);
    },

    closeMenu() {
      if (!this.isOpen) return;

      this.isOpen = false;
      document.body.classList.remove("menu-open");
      document.querySelector(".hamburger-menu")?.classList.remove("nav-open");

      [".menu-drawer__overlay", ".menu-drawer"].forEach((sel) =>
        document.querySelector(sel)?.classList.remove("menu-drawer--open")
      );

      document.querySelector(".menu-drawer__video")?.pause();

      this.toggleScrollLock(false);
      this.resetMenu();
    },

    resetMenu() {
      this.currentLevel = 1;
      this.activeIndexes = [null, null];
      this.filteredArticles = [];

      this.splideSlider?.destroy();
      this.splideSlider = null;

      const journal = document.querySelector(".menu-drawer__journal-container");
      if (journal) journal.style.display = "none";

      [2, 3].forEach((level) =>
        document.querySelector(`#menu-drawer-level-${level}`)?.classList.remove("menu-drawer__level--active")
      );

      const nav = document.querySelector(".menu-drawer");
      if (nav) nav.dataset.activeLevel = 1;

      document
        .querySelectorAll(".menu-drawer__item--active, .menu-drawer__item--inactive, .menu-drawer__media--inactive")
        .forEach(
          (el) => (el.className = el.className.replace(/(menu-drawer__(item|media)--(active|inactive))/g, "").trim())
        );
    },

    updateLevelVisibility() {
      const nav = document.querySelector(".menu-drawer");
      if (nav) nav.dataset.activeLevel = this.currentLevel;

      [1, 2, 3].forEach((level) =>
        document
          .querySelector(`#menu-drawer-level-${level}`)
          ?.classList.toggle("menu-drawer__level--active", this.currentLevel >= level)
      );

      this.updateActiveStates();
      this.updateInactiveStates();
    },

    updateActiveStates() {
      document
        .querySelectorAll("#menu-drawer__menu-1 > li")
        .forEach((item, idx) => item.classList.toggle("menu-drawer__item--active", idx === this.activeIndexes[0]));

      document
        .querySelectorAll(".menu-drawer__menu-level-2 > li")
        .forEach((item, idx) =>
          item.classList.toggle("menu-drawer__item--active", idx === this.activeIndexes[1] && this.currentLevel >= 3)
        );
    },

    updateInactiveStates() {
      const isLevel2 = this.currentLevel >= 2;
      const isLevel3 = this.currentLevel >= 3;

      const level1Selectors =
        "#menu-drawer__menu-1 .menu-drawer__link, #menu-drawer__menu-1-secondary .menu-drawer__link, .menu-drawer__video, .menu-drawer__video + p";
      document.querySelectorAll(level1Selectors).forEach((el) => {
        const isMedia = ["VIDEO", "P"].includes(el.tagName);
        el.classList.toggle(isMedia ? "menu-drawer__media--inactive" : "menu-drawer__item--inactive", isLevel2);
      });

      this.updateSpanStates("#menu-drawer__menu-1 > li", this.activeIndexes[0], isLevel2);

      const level2Selectors =
        "#menu-drawer-level-2 .menu-drawer__back span, #menu-drawer-level-2 .menu-drawer__heading, .menu-drawer__featured-image img";
      document
        .querySelectorAll(level2Selectors)
        .forEach((el) => el.classList.toggle("menu-drawer__media--inactive", isLevel3));

      const journal = document.querySelector(".menu-drawer__journal-container");
      if (journal?.style.display !== "none") {
        journal?.classList.toggle("menu-drawer__media--inactive", isLevel3);
      }

      document
        .querySelectorAll(".menu-drawer__menu-level-2 .menu-drawer__link")
        .forEach((el) => el.classList.toggle("menu-drawer__item--inactive", isLevel3));

      this.updateSpanStates(".menu-drawer__menu-level-2 > li", this.activeIndexes[1], isLevel3);
    },

    updateSpanStates(selector, activeIndex, shouldInactivate) {
      document.querySelectorAll(selector).forEach((item, idx) => {
        const shouldApply = idx !== activeIndex && shouldInactivate;
        item
          .querySelectorAll("span")
          .forEach((span) => span.classList.toggle("menu-drawer__item--inactive", shouldApply));
      });
    },

    openLevel(level, title, parentIndex, featuredImage, featuredImageAlt, childIndex) {
      if (level === 2) {
        if (this.activeIndexes[0] === parentIndex && this.currentLevel >= 2) {
          this.currentLevel = 1;
          this.activeIndexes = [null, null];
          this.updateLevelVisibility();
          return;
        }

        this.currentLevel = 2;
        this.activeIndexes[0] = parentIndex;
        this.activeIndexes[1] = null;

        const menuItem = this.menuData[parentIndex];
        if (!menuItem) return;

        document.querySelector("#menu-drawer-heading-2").textContent = this.decodeHtml(title);

        const newUrl = featuredImage || menuItem.featuredImage || "";
        if (this.featuredImage.url !== newUrl) {
          this.updateFeaturedImage(newUrl, featuredImageAlt || menuItem.featuredImageAlt || title, menuItem.url);
        }

        this.filteredArticles = this.getArticles().filter((article) =>
          article.relatedIds.includes(menuItem.collectionId)
        );

        const journal = document.querySelector(".menu-drawer__journal-container");
        if (journal) journal.style.display = this.filteredArticles.length > 0 ? "block" : "none";

        this.renderMenu(2, menuItem.links);
        this.updateLevelVisibility();

        setTimeout(() => {
          this.refreshSlider();
          this.triggerAnimations(["#menu-drawer-level-2", ".menu-drawer__menu-level-2"]);
        }, 0);
      } else if (level === 3) {
        if (this.currentLevel === 3 && this.activeIndexes[1] === childIndex) {
          this.backLevel();
          return;
        }

        this.currentLevel = 3;
        this.activeIndexes[1] = childIndex;

        const submenu = this.menuData[this.activeIndexes[0]]?.links[childIndex];
        if (!submenu) return;

        document.querySelector("#menu-drawer-heading-3").textContent = this.decodeHtml(title);

        this.renderMenu(3, submenu.links);
        this.updateLevelVisibility();

        setTimeout(() => {
          this.triggerAnimations(["#menu-drawer-level-3", ".menu-drawer__menu-level-3"]);
        }, 0);
      }
    },

    updateFeaturedImage(url, alt, link) {
      this.featuredImage = { url, alt };

      const img = document.querySelector(".menu-drawer__featured-image img");
      const imgLink = document.querySelector(".menu-drawer__featured-image a");
      const container = document.querySelector(".menu-drawer__featured-image");

      if (img) {
        container?.classList.add("menu-drawer__featured-image--loading-new-image");
        img.src = url;
        img.alt = alt;
        img.srcset = this.generateSrcset(url);
        img.onload = () => container?.classList.remove("menu-drawer__featured-image--loading-new-image");
      }
      if (imgLink) imgLink.href = link || "#";
    },

    renderMenu(level, items) {
      const container = document.querySelector(`.menu-drawer__menu-level-${level}`);
      if (!container || !items) return;

      const arrowIcon =
        level === 2
          ? document.querySelector("#menu-drawer__menu-1 .menu-drawer__button--has-submenu span:last-child")
              ?.innerHTML || ""
          : "";

      container.innerHTML = items
        .map((item, index) => {
          const hasSubmenu = level === 2 && item.links?.length > 0;

          return `
            <li role="none">
              ${
                hasSubmenu
                  ? `
                <button data-submenu-index="${index}" class="menu-drawer__button menu-drawer__button--has-submenu body--uppercase" role="menuitem" aria-haspopup="true" aria-expanded="false">
                  <span>${this.decodeHtml(item.title)}</span>
                  <span>${arrowIcon}</span>
                </button>
              `
                  : `
                <a href="${item.url}" class="menu-drawer__link body--uppercase" role="menuitem">
                  ${this.decodeHtml(item.title)}
                </a>
              `
              }
            </li>
          `;
        })
        .join("");

      if (level === 2) {
        container.querySelectorAll(".menu-drawer__button--has-submenu").forEach((btn) => {
          btn.addEventListener("click", () => {
            const index = parseInt(btn.dataset.submenuIndex);
            const item = items[index];
            if (item) this.openLevel(3, item.title, this.activeIndexes[0], null, null, index);
          });
        });
      }
    },

    backLevel() {
      if (this.currentLevel <= 1) return;

      this.currentLevel--;

      if (this.currentLevel === 1) {
        this.activeIndexes = [null, null];
        this.filteredArticles = [];
        this.splideSlider?.destroy();
        this.splideSlider = null;

        const journal = document.querySelector(".menu-drawer__journal-container");
        if (journal) journal.style.display = "none";
      } else if (this.currentLevel === 2) {
        this.activeIndexes[1] = null;
        setTimeout(() => this.refreshSlider(), 0);
      }

      this.updateLevelVisibility();
    },

    refreshSlider() {
      const track = document.querySelector("#menu-drawer-level-2 .splide__list");
      if (!track) return;

      track.innerHTML = this.filteredArticles
        .map(
          (article) => `
          <li class="splide__slide">
            <article class="menu-drawer__article">
              <div class="menu-drawer__article-content">
                ${
                  article.image
                    ? `<img src="${article.image}" alt="${article.title}" class="menu-drawer__article-image" width="300" height="300">`
                    : ""
                }
                <p class="menu-drawer__article-tag small">${article.tag}</p>
                <header class="menu-drawer__article-header">
                  <h2 class="menu-drawer__article-title body--bold">${article.title}</h2>
                </header>
                <a class="menu-drawer__article-link body" href="${article.url}">
                  Read The Article 
                  <span>
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.6 1L10.6 5M10.6 5L6.6 9M10.6 5L1 5" stroke="#A0A0A0" stroke-width="0.75" stroke-linecap="square"/>
                    </svg>
                  </span>
                </a>
              </div>
            </article>
          </li>
        `
        )
        .join("");

      this.initSlider();
    },

    initSlider() {
      this.splideSlider?.destroy();
      this.splideSlider = null;

      setTimeout(() => {
        const element = document.querySelector("#menu-drawer-level-2 .splide");
        if (this.filteredArticles.length > 0 && window.Splide && element) {
          this.splideSlider = new Splide(element, {
            perPage: 1,
            gap: "var(--space-m)",
            type: "loop",
            arrows: false,
            pagination: false,
            breakpoints: {
              1200: { perPage: 3, arrows: true },
              768: { perPage: 2 },
              470: { perPage: 1 },
            },
          }).mount();
        }
      }, 0);
    },

    getArticles() {
      const script = document.getElementById("menu-drawer-script");
      const articlesData = script?.getAttribute("data-articles-data");

      if (articlesData) {
        try {
          return JSON.parse(this.decodeHtml(articlesData));
        } catch (e) {
          console.error("Failed to parse articles data:", e);
        }
      }
      return [];
    },

    generateSrcset(baseUrl) {
      if (!baseUrl) return "";
      const parts = baseUrl.split("_1200x");
      if (parts.length !== 2) return baseUrl;

      const [base, ext] = parts;
      return [400, 800, 1200].map((size) => `${base}_${size}x${ext} ${size}w`).join(", ");
    },

    triggerAnimations(selectors) {
      if (window.triggerCardLoadAnimation) {
        selectors.forEach((sel) => window.triggerCardLoadAnimation(sel));
      }
    },
  };

  menuDrawer.init();
})();