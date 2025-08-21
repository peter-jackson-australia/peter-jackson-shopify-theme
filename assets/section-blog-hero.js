const sectionId = document.currentScript.getAttribute("data-section-id")
const splideElement = document.querySelector(`#section-${sectionId} .blog-hero__slider`);

if (splideElement && window.innerWidth <= 768) {
  new Splide(splideElement, {
    perPage: 1,
    type: 'loop',
    gap: 'var(--space-2xs)',
    arrows: true,
    pagination: false,
    drag: true,
    snap: true,
    autoWidth: false,
  }).mount();
}