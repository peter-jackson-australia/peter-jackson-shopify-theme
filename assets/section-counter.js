const sectionId = document.currentScript.dataset.sectionId
const counters = document.querySelectorAll(`#counter-${sectionId} .counter__container-value`)

for (let i = 0; i < counters.length; i++) {
  const counter = counters[i]

  const initialValue = parseFloat(counter.dataset.initial)
  const finalValue = parseFloat(counter.dataset.final)
  const duration = parseFloat(counter.dataset.duration)

  const decimalLength = decimalStrFromNumber(finalValue).length
  console.log(finalValue, decimalStrFromNumber(finalValue), decimalLength)

  counter.textContent = finalValue.toFixed(0)
  gsap.from(`#${counter.id}`, {
    textContent: initialValue,
    duration: duration,
    ease: Power1.power1out,
    snap: { textContent: 1 },
    stagger: {
      each: 0,
      start: 'start',
      onUpdate: function () {
        const target = this.targets()[0]
        const num = parseFloat(target.textContent).toFixed(0);

        let innerHTML = num.toString()
        if (decimalLength) innerHTML += `.${decimalLength}`
        target.textContent = innerHTML
      },
    }
  })
}

function decimalStrFromNumber(num) {
  const fraction = num.toString().split('.')
  fraction.length >= 2 ? fraction[1] : undefined
}