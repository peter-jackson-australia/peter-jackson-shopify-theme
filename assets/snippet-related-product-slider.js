const slider = new Splide("#related-product-slider", {
  type: "slide",
  perPage: 6,
  gap: "var(--space-2xs)",
  arrows: true,
  pagination: false,
  drag: true,
  autoplay: false,
  breakpoints: {
    768: {
      perPage: 3,
    },
  },
});

slider.mount();