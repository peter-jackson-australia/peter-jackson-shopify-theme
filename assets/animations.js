document.addEventListener('DOMContentLoaded', function () {
  /*
    Classes: 
    animate-slide-up-load 
    animate-rotate-load
    animate-slide-up-scroll
    animate-rotate-scroll
    animate-opacity-scrub-scroll
    animate-body-slide-up-scroll
  */

  const headingElements = document.querySelectorAll(
    '.animate-slide-up-load, .animate-slide-up-scroll, .animate-rotate-load, .animate-rotate-scroll, .animate-opacity-scrub-scroll'
  );
  const bodyElements = document.querySelectorAll('.animate-body-slide-up-scroll');

  if (headingElements.length > 0) {
    new SplitType(headingElements, {
      types: 'lines, words, chars',
      tagName: 'span',
    });
  }

  /* 
    Slide up on load 
    Class: animate-slide-up-load 
  */
  const slideUpElements = document.querySelectorAll('.animate-slide-up-load');
  if (slideUpElements.length > 0) {
    gsap.from('.animate-slide-up-load .word', {
      y: '100%',
      opacity: 1,
      duration: 0.5,
      ease: 'power1.out',
      stagger: 0.1,
    });
  }

  /* 
    Rotate on load
    Class: animate-rotate-load
  */
  const rotateElements = document.querySelectorAll('.animate-rotate-load');
  if (rotateElements.length > 0) {
    gsap.from('.animate-rotate-load .word', {
      y: '110%',
      opacity: 1,
      rotationZ: '10',
      duration: 0.5,
      ease: 'power1.out',
      stagger: 0.1,
    });
  }

  /* 
    Slide up on scroll
    Class: animate-slide-up-scroll
  */
  const slideUpScrollElements = document.querySelectorAll('.animate-slide-up-scroll');
  if (slideUpScrollElements.length > 0) {
    gsap.set('.animate-slide-up-scroll .word', {
      y: '100%',
      opacity: 0,
    });

    gsap.to('.animate-slide-up-scroll .word', {
      y: '0%',
      opacity: 1,
      duration: 0.5,
      ease: 'power1.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.animate-slide-up-scroll',
        start: 'top bottom',
      },
    });
  }

  /* 
    Rotate on scroll
    Class: animate-rotate-scroll
  */
  const rotateScrollElements = document.querySelectorAll('.animate-rotate-scroll');
  if (rotateScrollElements.length > 0) {
    gsap.set('.animate-rotate-scroll .word', {
      y: '110%',
      opacity: 0,
      rotationZ: '10',
    });

    gsap.to('.animate-rotate-scroll .word', {
      y: '0%',
      opacity: 1,
      rotationZ: '0',
      duration: 0.5,
      ease: 'power1.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.animate-rotate-scroll',
        start: 'top bottom',
      },
    });
  }

  /* 
    Scrub opacity on scroll
    Class: animate-opacity-scrub-scroll
  */
  const opacityScrubElements = document.querySelectorAll('.animate-opacity-scrub-scroll');
  if (opacityScrubElements.length > 0) {
    gsap.set('.animate-opacity-scrub-scroll .word', {
      opacity: 0.3,
    });

    gsap.to('.animate-opacity-scrub-scroll .word', {
      opacity: 1,
      duration: 0.5,
      ease: 'power1.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.animate-opacity-scrub-scroll',
        start: 'top bottom',
        scrub: true,
      },
    });
  }

  /* 
    Paragraph text slide up on scroll
    Class: animate-body-slide-up-scroll
  */
  if (bodyElements.length > 0) {
    gsap.set('.animate-body-slide-up-scroll', {
      y: '100%',
      opacity: 0,
    });

    gsap.to('.animate-body-slide-up-scroll', {
      y: '0%',
      opacity: 1,
      duration: 0.5,
      ease: 'power1.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '.animate-body-slide-up-scroll',
        start: 'top bottom',
      },
    });
  }
});
