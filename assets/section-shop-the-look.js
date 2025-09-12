(() => {
  const sectionId = document.currentScript.getAttribute("data-section-id")
  const splideElement = document.querySelector(`#section-${sectionId} .shop-the-look__slider`);

  if (splideElement) {
    new Splide(splideElement, {
      perPage: 1,
      type: 'loop',
      gap: 'var(--space-m)',
      arrows: true,
      pagination: false,
      drag: true,
      snap: true,
    }).mount();
  }
})();
