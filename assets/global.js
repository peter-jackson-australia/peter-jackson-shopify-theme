// Quicklink provides faster subsequent page-loads by prefetching in-viewport links during idle time
window.addEventListener("load", () => {
  quicklink.listen();
});

// Initialise Blaze Sliders
document.querySelectorAll(".blaze-slider").forEach((el) => {
  new BlazeSlider(el);
});
