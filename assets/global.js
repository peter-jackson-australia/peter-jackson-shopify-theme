// Quicklink provides faster subsequent page-loads by prefetching in-viewport links during idle time
window.addEventListener("load", () => {
  quicklink.listen();
});
