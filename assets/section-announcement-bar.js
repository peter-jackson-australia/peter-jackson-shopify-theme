document.addEventListener('DOMContentLoaded', function() {
    const slider = new Splide('#announcement-bar', {
      type: 'loop',
      perPage: 1,
      arrows: false,
      pagination: false,
      drag: true,
      autoplay: {{ slider_autoplay }},
      interval: {{ slider_interval }}
    });
    slider.mount();
  });