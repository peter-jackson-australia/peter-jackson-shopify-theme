const sectionId = document.currentScript.dataset.sectionId
const counters = document.querySelectorAll(`#counter-${sectionId} .counter__container-value`)

for (let i = 0; i < counters.length; i++) {
  const counter = counters[i]

  const to = parseFloat(counter.dataset.to)
  const from = parseFloat(counter.dataset.from)
  const duration = parseFloat(counter.dataset.duration)

  console.log(`counter ${i}: `, to, from, duration)

  const toDecimal = decimalFromNumber(to)

  // Make the counter apply the decimal points
  counter.textContent = to.toFixed(0)
  gsap.from(`#${counter.id}`, {
    textContent: from,
    duration: duration,
    ease: Power1.power1out,
    snap: { textContent: 1 },
    stagger: {
      each: 1,
      onUpdate: function () {
        const target = this.targets()[0]
        const num = parseFloat(target.textContent).toFixed(0);

        const innerHTML = num.toString()
        if (toDecimal) innerHTML += `.${decimal}`
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