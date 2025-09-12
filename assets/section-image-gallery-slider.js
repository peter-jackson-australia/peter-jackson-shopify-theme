(() => {
  const sectionId = document.currentScript.getAttribute("data-section-id")
  const slider = document.querySelector(
    `#section-${sectionId} .image-gallery-slider__slider`
  );

  if (slider) {
    new Splide(slider, {
      perPage: 4.5,
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
})();
