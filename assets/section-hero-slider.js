(() => {
  const sectionId = document.currentScript.getAttribute("data-section-id");
  const autoplay = document.currentScript.getAttribute("data-autoplay");
  const interval = document.currentScript.getAttribute("data-slide-interval");

  const slider = new Splide(`#hero-slider-${sectionId}`, {
    type: "slide",
    perPage: 1,
    arrows: false,
    pagination: true,
    drag: true,
    autoplay: autoplay,
    interval: interval,
  });

  const isSafari =
    navigator.vendor &&
    navigator.vendor.indexOf("Apple") > -1 &&
    navigator.userAgent &&
    !navigator.userAgent.match("CriOS");

  if (isSafari) {
    slider.on("mounted", function () {
      const sliderElement = document.getElementById(`hero-slider-${sectionId}`);
      const contentsInHero = sliderElement.querySelectorAll(
        ".hero-slider__content"
      );

      contentsInHero.forEach((el) => {
        const originalTransform = window.getComputedStyle(el).transform;
        if (originalTransform && originalTransform !== "none") {
          el.style.transform = originalTransform + " translateZ(0)";
        } else {
          el.style.transform = "translateZ(0)";
        }
      });
    });

    slider.on("move", function () {
      const currentSlideNum = slider.index;
      requestAnimationFrame(function () {
        const currentSlide = slider.Components.Elements.slides[currentSlideNum];
        const content = currentSlide.querySelector(".hero-slider__content");

        if (content) {
          content.style.willChange = "transform";
        }

        setTimeout(function () {
          if (content) content.style.willChange = "auto";
        }, 500);
      });
    });
  }

  slider.on("mounted", function () {
    const heroSlider = document.getElementById(`hero-slider-${sectionId}`);
    const videos = heroSlider.querySelectorAll(".hero-slider__video-element");

    videos.forEach(function (video) {
      video.muted = true;
      video.playsInline = true;
    });
  });

  slider.mount();
})();
