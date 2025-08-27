const counters = document.querySelectorAll('.counter__container-value');
for (let i = 0; i < counters.length; i++) {
  const c = counters[i]

  const fromStr = c.dataset.from
  const toStr = c.dataset.to
  const from = parseInt(fromStr)
  const fromDecimal = getDecimalNumber(fromStr)
  const to = parseInt(toStr)
  const toDecimal = getDecimalNumber(toStr)

  let decimalPlaces
  if (c.dataset.decimalPlaces) {
    decimalPlaces = parseInt(c.dataset.decimalPlaces)
  } else {
    decimalPlaces = 1
  }

  const animateSeconds = parseFloat(c.dataset.animateSeconds)
  createCounter(c, from, to, animateSeconds)
  if (decimalPlaces > 1) {
    const decimal = document.createElement("span")
    decimal.textContent = "."
    c.appendChild(decimal)
    createCounter(c, fromDecimal, toDecimal, animateSeconds)
  }
}

/**
 * @param {Element} container 
 * @param {number} from 
 * @param {number} to 
 * @param {number} animateSeconds 
 */
function createCounter(container, from, to, animateSeconds) {
  const totalIncrements = to - from
  const timeoutSeconds = animateSeconds / totalIncrements

  const counterElement = document.createElement("span")
  counterElement.textContent = from.toFixed(0)
  container.appendChild(counterElement)

  animateCounter(counterElement, to, timeoutSeconds)
}

/**
 * @param {String} numberStr 
 * @returns {Number}
 */
function getDecimalNumber(numberStr) {
  const decimalSplit = numberStr.split('.')
  if (decimalSplit.length > 1) {
    return parseFloat(decimalSplit[1])
  } else {
    return 0
  }
}

/**
 * @param {Element} elem 
 * @param {number} final 
 * @param {number} timeoutSeconds 
 * @param {number} decimalPlaces
 */
function animateCounter(elem, final, timeoutSeconds) {
  const currentNumber = parseFloat(elem.textContent)

  if (currentNumber < final) {
    elem.textContent = currentNumber + 1
    setTimeout(() => animateCounter(elem, final, timeoutSeconds), timeoutSeconds * 1000)
  } else {
    elem.textContent = String(final)
  }
}
