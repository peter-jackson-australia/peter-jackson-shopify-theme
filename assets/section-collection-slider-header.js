(function () {
  const sectionId = document.currentScript.getAttribute("section-id");

  if (window.innerWidth < 1000) return;

  const header = document.querySelector("#site-header");
  const sliderHeader = document.querySelector(
    `#section-${sectionId} .collection-slider-header__header`
  );
  if (!header || !sliderHeader) return;

  const spacer = document.createElement("div");
  const sliderHeaderHeight = sliderHeader.offsetHeight;
  spacer.style.height = sliderHeaderHeight + "px";
  spacer.style.display = "none";
  sliderHeader.parentNode.insertBefore(spacer, sliderHeader.nextSibling);

  const sliderHeaderTop = sliderHeader.offsetTop;
  const headerHeight = header.offsetHeight;
  let isFixed = false;

  window.addEventListener("scroll", function () {
    if (window.innerWidth < 1000) return;
    if (
      document.body.classList.contains("menu-open") ||
      document.body.classList.contains("cart-open") ||
      document.body.classList.contains("search-open") ||
      document.body.classList.contains("filter-open") ||
      document.body.classList.contains("search-filter-open")
    )
      return;

    const scrollY = window.scrollY;
    const triggerPoint = sliderHeaderTop - headerHeight;

    if (scrollY >= triggerPoint && !isFixed) {
      isFixed = true;
      sliderHeader.style.position = "fixed";
      sliderHeader.style.top = headerHeight - 1 + "px";
      sliderHeader.style.left = "0";
      sliderHeader.style.right = "0";
      sliderHeader.style.height = sliderHeaderHeight + "px";
      sliderHeader.style.zIndex = "40";
      sliderHeader.style.backgroundColor = "var(--white)";
      sliderHeader.style.borderBottom = "1px solid var(--neutral-50)";
      spacer.style.display = "block";
    } else if (scrollY < triggerPoint && isFixed) {
      isFixed = false;
      sliderHeader.style.position = "";
      sliderHeader.style.top = "";
      sliderHeader.style.left = "";
      sliderHeader.style.right = "";
      sliderHeader.style.height = "";
      sliderHeader.style.zIndex = "";
      sliderHeader.style.borderBottom = "";
      spacer.style.display = "none";
    }
  });

  document
    .querySelectorAll(
      `#section-${sectionId} .collection-slider-header__nav-button`
    )
    .forEach((button) => {
      button.addEventListener("click", () =>
        window.scrollTo({
          top: sliderHeaderTop - headerHeight,
          behavior: "smooth",
        })
      );
    });

  const collectionSliderHeader = document.getElementById(
    `section-${sectionId}`
  );
  if (!collectionSliderHeader) return;

  const navigationButtons = collectionSliderHeader.querySelectorAll(
    ".collection-slider-header__nav-button"
  );
  const heroImages = collectionSliderHeader.querySelectorAll(
    ".collection-slider-header__image-wrapper"
  );
  const collectionSliderSections = collectionSliderHeader.querySelectorAll(
    ".collection-slider-header__slider-section"
  );

  const splideConfig = {
    perPage: 4,
    type: "loop",
    gap: "var(--space-2xs)",
    arrows: false,
    pagination: false,
    drag: true,
    snap: true,
    breakpoints: {
      470: { perPage: 1 },
      768: { perPage: 2, arrows: true },
    },
  };

  function initializeSplideCarousel(sliderSection) {
    const carouselElement = sliderSection.querySelector(".splide");
    if (
      carouselElement &&
      !carouselElement.classList.contains("is-initialized")
    ) {
      new Splide(carouselElement, splideConfig).mount();
    }
  }

  function switchToNavigationItem(selectedIndex) {
    navigationButtons.forEach(function (navButton) {
      navButton.classList.toggle(
        "active",
        navButton.dataset.index === selectedIndex
      );
    });

    heroImages.forEach(function (heroImage) {
      heroImage.classList.toggle(
        "active",
        heroImage.dataset.imageIndex === selectedIndex
      );
    });

    collectionSliderSections.forEach(function (sliderSection) {
      const isActive = sliderSection.dataset.index === selectedIndex;
      sliderSection.classList.toggle("active", isActive);
      if (isActive) initializeSplideCarousel(sliderSection);
    });
  }

  initializeSplideCarousel(collectionSliderSections[0]);

  navigationButtons.forEach(function (navButton) {
    navButton.addEventListener("click", function () {
      switchToNavigationItem(navButton.dataset.index);
    });
  });
})();