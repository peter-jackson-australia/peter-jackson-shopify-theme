{
  // In custom scope to avoid conflicting local variables
  const sectionId = document.currentScript.dataset.sectionId;
  const counters = document.querySelectorAll(
    `#counter-${sectionId} .countervalue__main-value`,
  );

  for (let i = 0; i < counters.length; i++) {
    const counter = counters[i];

    const initialValue = parseFloat(counter.dataset.initial);
    const finalValue = parseFloat(counter.dataset.final);
    const duration = parseFloat(counter.dataset.duration);

    const prefix = counter.dataset.prefix ?? "";
    const suffix = counter.dataset.suffix ?? "";

    const finalDecimalValue = decimalStrFromNumber(finalValue);
    const finalDecimalLength = finalDecimalValue ? finalDecimalValue.length : 0;

    counter.textContent = finalValue.toFixed(0);
    gsap.from(`#${counter.id}`, {
      textContent: initialValue,
      duration: duration,
      ease: Power1.power1out,
      snap: { textContent: 1 },
      stagger: {
        each: 0,
        start: "start",
        onUpdate: function () {
          const target = this.targets()[0];
          const num = parseFloat(target.textContent).toFixed(0);

          let innerHTML = prefix + num.toString();
          if (finalDecimalLength) innerHTML += `.${finalDecimalLength}`;
          innerHTML += suffix;
          target.textContent = innerHTML;
        },
      },
      scrollTrigger: {
        trigger: counter,
        start: "top bottom-=100"
      }
    });
  }

  function decimalStrFromNumber(num) {
    const fraction = num.toString().split(".");
    fraction.length >= 2 ? fraction[1] : undefined;
  }
}
