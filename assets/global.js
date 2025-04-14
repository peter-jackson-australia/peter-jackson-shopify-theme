// Quicklink provides faster subsequent page-loads by prefetching in-viewport links during idle time
window.addEventListener("load", () => {
  quicklink.listen();
});

// Function to measure the DOM size and memory usage
function measurePerformance() {
  console.group('Performance Metrics');
  
  // Measure DOM nodes
  const totalElements = document.querySelectorAll('*').length;
  console.log(`Total DOM elements: ${totalElements}`);
  
  // Measure memory if supported
  if (window.performance && window.performance.memory) {
    const memory = window.performance.memory;
    console.log(`Used JS Heap: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
    console.log(`Total JS Heap: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
  }
  
  // Image count
  const images = document.querySelectorAll('img').length;
  console.log(`Total images in DOM: ${images}`);
  
  // Splide instance count
  const splideElements = document.querySelectorAll('.splide').length;
  console.log(`Splide elements in DOM: ${splideElements}`);
  
  // Measure specific elements
  const productCards = document.querySelectorAll('.product-card').length;
  const slideLists = document.querySelectorAll('.splide__list').length;
  const slideItems = document.querySelectorAll('.splide__slide').length;
  
  console.log(`Product cards: ${productCards}`);
  console.log(`Slide lists: ${slideLists}`);
  console.log(`Slide items: ${slideItems}`);
  console.log(`Average slides per product: ${(slideItems / productCards).toFixed(2)}`);
  
  console.groupEnd();
}

// Run after page fully loads
window.addEventListener('load', () => {
  // First measurement - before any hover
  console.log('Initial page load metrics:');
  measurePerformance();
  
  // Listen for hover events to measure on demand creation
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.product-card__image-wrapper')) {
      // Wait a moment for any DOM changes
      setTimeout(() => {
        console.log('Metrics after hover:');
        measurePerformance();
      }, 500);
    }
  }, { once: true });
});
