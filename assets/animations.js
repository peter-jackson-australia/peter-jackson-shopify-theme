document.addEventListener("DOMContentLoaded", function () {
  /*
    Classes: 
    animate-word-slide-up-scroll
    animate-word-rotate-scroll
    animate-word-opacity-scroll
    animate-paragraph-slide-up-scroll
    animate-container-cards-scroll
  */

  const headingElements = document.querySelectorAll(
    ".animate-slide-up-load, .animate-word-slide-up-scroll, .animate-rotate-load, .animate-word-rotate-scroll, .animate-word-opacity-scroll"
  );
  const bodyElements = document.querySelectorAll(".animate-paragraph-slide-up-scroll");
  const containerElements = document.querySelectorAll(".animate-container-cards-scroll");
  const parallaxImages = document.querySelectorAll(".animate-image-parallax");
  const parallaxHorizontalImages = document.querySelectorAll(".animate-image-parallax-horizontal");

  if (headingElements.length > 0) {
    new SplitType(headingElements, {
      types: "lines, words, chars",
      tagName: "span",
    });
  }

  /* 
    Slide up on scroll
    Class: animate-word-slide-up-scroll
  */
  const slideUpScrollElements = document.querySelectorAll(".animate-word-slide-up-scroll");
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
    Class: animate-word-rotate-scroll
  */
  const rotateScrollElements = document.querySelectorAll(".animate-word-rotate-scroll");
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
    Class: animate-word-opacity-scroll
  */
  const opacityScrubElements = document.querySelectorAll(".animate-word-opacity-scroll");
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
    Class: animate-paragraph-slide-up-scroll
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

  /* 
    Container with cards animation
    Class: animate-container-cards-scroll
  */
  if (containerElements.length > 0) {
    containerElements.forEach((container) => {
      const cards = container.children;
      
      if (cards.length > 0) {
        gsap.set(cards, {
          y: "50px",
          opacity: 0,
        });
        
        gsap.to(cards, {
          y: "0",
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: container,
            start: "top bottom-=150",
          },
        });
      }
    });
  }
  
  function animateCards(cards) {
    gsap.set(cards, {
      y: "50px",
      opacity: 0,
    });
    
    gsap.to(cards, {
      y: "0",
      opacity: 1,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.15,
    });
  }
  
  const ajaxContainer = document.getElementById("AjaxinateContainer");
  
  if (ajaxContainer) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          const newCards = Array.from(mutation.addedNodes).filter(
            node => node.nodeType === 1 && !node.classList.contains('no-products-message')
          );
          
          if (newCards.length > 0) {
            animateCards(newCards);
          }
        }
      });
    });
    
    observer.observe(ajaxContainer, { childList: true });
  }
});