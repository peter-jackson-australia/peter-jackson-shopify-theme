const sliderAutoplay = document.currentScript.getAttribute("data-autoplay");
const sliderInterval = document.currentScript.getAttribute("data-interval");
const slider = new Splide("#announcement-bar", {
  type: "loop",
  perPage: 1,
  arrows: false,
  pagination: false,
  drag: true,
  autoplay: sliderAutoplay,
  interval: sliderInterval,
});
slider.mount();
