(() => {
  const sectionId = document.currentScript.getAttribute("data-section-id");
  const targetDateStr = document.currentScript.getAttribute("data-target-date");
  const finalHoursThreshold = document.currentScript.getAttribute(
    "data-final-hours-threshold"
  );

  const daysElement = document.getElementById(
    "countdown-timer-days-" + sectionId
  );
  const hoursElement = document.getElementById(
    "countdown-timer-hours-" + sectionId
  );
  const minutesElement = document.getElementById(
    "countdown-timer-minutes-" + sectionId
  );
  const secondsElement = document.getElementById(
    "countdown-timer-seconds-" + sectionId
  );
  const blocksElement = document.getElementById(
    "countdown-timer-blocks-" + sectionId
  );
  const finalMessageElement = document.getElementById(
    "countdown-timer-final-" + sectionId
  );
  const completeMessageElement = document.getElementById(
    "countdown-timer-complete-" + sectionId
  );

  function getMelbourneTime() {
    const [datePart, timePart] = targetDateStr.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes, seconds] = timePart.split(":").map(Number);
    const dateObj = new Date(year, month - 1, day, hours, minutes, seconds);
    const melbourne = new Date(dateObj);
    const localTimezoneOffset = dateObj.getTimezoneOffset();
    const melbourneTimezoneOffset = -600;
    const offsetDiff = melbourneTimezoneOffset - localTimezoneOffset;
    melbourne.setMinutes(melbourne.getMinutes() + offsetDiff);

    return melbourne.getTime();
  }

  const targetDate = getMelbourneTime();

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      daysElement.textContent = "00";
      hoursElement.textContent = "00";
      minutesElement.textContent = "00";
      secondsElement.textContent = "00";

      blocksElement.style.display = "none";
      finalMessageElement.style.display = "none";
      completeMessageElement.style.display = "block";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysElement.textContent = String(days).padStart(2, "0");
    hoursElement.textContent = String(hours).padStart(2, "0");
    minutesElement.textContent = String(minutes).padStart(2, "0");
    secondsElement.textContent = String(seconds).padStart(2, "0");

    if (distance <= finalHoursThreshold * 60 * 60 * 1000) {
      blocksElement.style.display = "none";
      finalMessageElement.style.display = "block";
      completeMessageElement.style.display = "none";
    } else {
      blocksElement.style.display = "flex";
      finalMessageElement.style.display = "none";
      completeMessageElement.style.display = "none";
    }

    requestAnimationFrame(updateTimer);
  }

  if (targetDate) {
    updateTimer();
  }
})();
