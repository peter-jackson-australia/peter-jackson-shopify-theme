const sectionId = document.currentScript.dataset.sectionId
const counters = document.querySelectorAll(`#counter-${sectionId} .counter__container-value`)

for (let i = 0; i < counters.length; i++) {
  const counter = counters[i]

  const initialValue = parseFloat(counter.dataset.initial)
  const finalValue = parseFloat(counter.dataset.final)
  const duration = parseFloat(counter.dataset.duration)

  const finalValueDecimal = decimalFromNumber(finalValue)

  // Make the counter apply the decimal points
  counter.textContent = finalValue.toFixed(0)
  gsap.from(`#${counter.id}`, {
    textContent: initialValue,
    duration: duration,
    ease: Power1.power1out,
    snap: { textContent: 1 },
    stagger: {
      each: 1,
      onUpdate: function () {
        const target = this.targets()[0]
        const num = parseFloat(target.textContent).toFixed(0);

        let innerHTML = num.toString()
        if (finalValueDecimal) innerHTML += `.${finalValueDecimal}`
        target.innerHTML = innerHTML
      },
    }
  })
}

/**
 * @param {number} num 
 * @returns {string}
 */
function decimalFromNumber(num) {
  const fraction = num.toString().split('.')
  if (fraction.length == 0) {
    return undefined
  }
  return fraction[1];
}