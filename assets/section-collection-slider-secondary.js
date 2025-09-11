(function () {
  const sectionId = document.currentScript.getAttribute("section-id")
  const splideElement = document.querySelector(`#section-${sectionId} .collection-slider-secondary__slider`);

  if (splideElement) {
    new Splide(splideElement, {
      perPage: 4,
      type: 'loop',
      gap: 'var(--space-2xs)',
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
})()