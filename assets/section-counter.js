const counters = document.querySelectorAll('.counter__container-value');
for (let i = 0; i < counters.length; i++) {
  const c = counters[i]
  const from = parseFloat(c.dataset.from)
  const to = parseFloat(c.dataset.to)
  const animateSeconds = parseFloat(c.dataset.animateSeconds)

  const totalIncrements = to - from
  const timeoutSeconds = animateSeconds / totalIncrements

  c.textContent = from
  animateCounterInt(c, to, timeoutSeconds)
}

function animateCounterInt(elem, final, timeoutSeconds) {
  const currentNumber = parseFloat(elem.textContent)

  if (currentNumber < final) {
    elem.textContent = String(currentNumber + 1)
    setTimeout(() => animateCounterInt(elem, final, timeoutSeconds), timeoutSeconds * 1000)
  } else if (currentNumber > final) {
    elem.textContent = String(currentNumber - 1)
    setTimeout(() => animateCounterInt(elem, final, timeoutSeconds), timeoutSeconds * 1000)
  }
}