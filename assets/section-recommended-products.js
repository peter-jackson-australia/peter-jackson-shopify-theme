(() => {
  const sectionId = document.currentScript.getAttribute("data-section-id");
  const recommendedProductsSection = document.querySelector(
    `#section-${sectionId}`
  );

  // Function to initialize Splide slider
  function initializeSlider() {
    const splideElement = recommendedProductsSection.querySelector(
      ".recommended-products__slider"
    );
    if (
      splideElement &&
      splideElement.querySelector(".splide__list").children.length > 0
    ) {
      new Splide(splideElement, {
        perPage: 4,
        type: "loop",
        gap: "var(--space-2xs)",
        arrows: false,
        pagination: false,
        drag: true,
        snap: true,
        breakpoints: {
          470: {
            perPage: 1,
          },
          768: {
            perPage: 2,
            arrows: true,
          },
        },
      }).mount();
    }
  }

  if (
    !recommendedProductsSection.querySelector(
      ".recommended-products__slider .splide__list"
    )
  ) {
    const baseUrl = recommendedProductsSection.dataset.baseUrl;
    const productId = recommendedProductsSection.dataset.productId;
    const sectionId = recommendedProductsSection.dataset.sectionId;
    const intent = recommendedProductsSection.dataset.intent;

    const url = `${baseUrl}?section_id=${sectionId}&product_id=${productId}&limit=10&intent=${intent}`;

    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const newDocument = parser.parseFromString(html, "text/html");
        const newSection = newDocument.querySelector(`#section-${sectionId}`);

        if (newSection) {
          recommendedProductsSection.innerHTML = newSection.innerHTML;
          initializeSlider();
        }
      })
      .catch((error) => {
        console.error("Error loading recommendations:", error);
        const loadingDots = recommendedProductsSection.querySelector(
          ".recommended-products__loading-dots"
        );
        if (loadingDots) {
          loadingDots.style.display = "none";
        }
      });
  } else {
    initializeSlider();
  }
})();
