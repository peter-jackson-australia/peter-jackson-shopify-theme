(() => {
  const splideElement = document.querySelector('.featured-article__slider');

  if (splideElement) {
    new Splide(splideElement, {
      type: 'loop',
      perPage: 4.5,
      perMove: 1,
      gap: 'var(--space-2xs)',
      arrows: false,
      pagination: false,
      drag: true,
      snap: true,
      breakpoints: {
        1200: {
          perPage: 3,
          arrows: true,
        },
        768: {
          perPage: 2,
          arrows: true,
        },
        470: {
          perPage: 1,
          arrows: true,
        },
      },
    }).mount();
  }
})()