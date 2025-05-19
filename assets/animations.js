document.addEventListener("DOMContentLoaded", function () {
  /*
    Classes: 
    animate-slide-up-scroll
    animate-rotate-scroll
    animate-opacity-scrub-scroll
    animate-body-slide-up-scroll
  */

  const headingElements = document.querySelectorAll(
    ".animate-slide-up-load, .animate-slide-up-scroll, .animate-rotate-load, .animate-rotate-scroll, .animate-opacity-scrub-scroll"
  );
  const bodyElements = document.querySelectorAll(".animate-body-slide-up-scroll");

  if (headingElements.length > 0) {
    new SplitType(headingElements, {
      types: "lines, words, chars",
      tagName: "span",
    });
  }

  /* 
    Slide up on scroll
    Class: animate-slide-up-scroll
  */
  const slideUpScrollElements = document.querySelectorAll(".animate-slide-up-scroll");
  if (slideUpScrollElements.length > 0) {
    slideUpScrollElements.forEach((element) => {
      const words = element.querySelectorAll(".word");

      gsap.set(words, {
        y: "100%",
        opacity: 0,
      });

      gsap.to(words, {
        y: "0%",
        opacity: 1,
        duration: 0.5,
        ease: "power1.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: element,
          start: "top bottom-=100",
        },
      });
    });
  }

  /* 
    Rotate on scroll
    Class: animate-rotate-scroll
  */
  const rotateScrollElements = document.querySelectorAll(".animate-rotate-scroll");
  if (rotateScrollElements.length > 0) {
    rotateScrollElements.forEach((element) => {
      const words = element.querySelectorAll(".word");

      gsap.set(words, {
        y: "110%",
        opacity: 0,
        rotationZ: "10",
      });

      gsap.to(words, {
        y: "0%",
        opacity: 1,
        rotationZ: "0",
        duration: 0.5,
        ease: "power1.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: element,
          start: "top bottom-=100",
        },
      });
    });
  }

  /* 
    Scrub opacity on scroll
    Class: animate-opacity-scrub-scroll
  */
  const opacityScrubElements = document.querySelectorAll(".animate-opacity-scrub-scroll");
  if (opacityScrubElements.length > 0) {
    opacityScrubElements.forEach((element) => {
      const words = element.querySelectorAll(".word");

      gsap.set(words, {
        opacity: 0.3,
      });

      gsap.to(words, {
        opacity: 1,
        duration: 0.5,
        ease: "power1.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: element,
          start: "top bottom-=100",
          scrub: true,
        },
      });
    });
  }

  /* 
    Paragraph text slide up on scroll
    Class: animate-body-slide-up-scroll
  */
  if (bodyElements.length > 0) {
    bodyElements.forEach((element) => {
      gsap.set(element, {
        y: "100%",
        opacity: 0,
      });

      gsap.to(element, {
        y: "0%",
        opacity: 1,
        duration: 0.5,
        ease: "power1.out",
        scrollTrigger: {
          trigger: element,
          start: "top bottom-=100",
        },
      });
    });
  }
});
