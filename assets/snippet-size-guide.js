(function () {
  const fitAndChestSize = [
    { casualSize: "XS", chest: 84, trousers: 72 },
    { casualSize: "S", chest: 88, trousers: 76 },
    { casualSize: "M", chest: 92, trousers: 80 },
    { casualSize: "M", chest: 96, trousers: 84 },
    { casualSize: "L", chest: 100, trousers: 88 },
    { casualSize: "L", chest: 104, trousers: 92 },
    { casualSize: "XL", chest: 108, trousers: 96 },
    { casualSize: "XL", chest: 112, trousers: 100 },
    { casualSize: "2XL", chest: 116, trousers: 104 },
    { casualSize: "2XL", chest: 120, trousers: 108 },
    { casualSize: "3XL", chest: 124, trousers: 112 },
    { casualSize: "3XL", chest: 128, trousers: 116 },
  ];

  const waistSize = [{ size: 76 }, { size: 80 }, { size: 84 }, { size: 88 }, { size: 92 }, { size: 96 }, { size: 100 }, { size: 104 }, { size: 108 }, { size: 112 }, { size: 116 }];

  const shirtSizeChart = [
    { casualSize: "S", shirtSize: 37 },
    { casualSize: "S", shirtSize: 38 },
    { casualSize: "M", shirtSize: 39 },
    { casualSize: "M", shirtSize: 40 },
    { casualSize: "L", shirtSize: 41 },
    { casualSize: "L", shirtSize: 42 },
    { casualSize: "XL", shirtSize: 43 },
    { casualSize: "XL", shirtSize: 44 },
    { casualSize: "2XL", shirtSize: 46 },
    { casualSize: "2XL", shirtSize: 48 },
    { casualSize: "2XL", shirtSize: 50 },
  ];

  function lbsToKg(lbs) {
    return lbs / 2.20462;
  }

  function inchesToCm(inches) {
    return inches * 2.54;
  }

  function feetAndInchesToCm(feet, inches) {
    return inchesToCm(feet * 12 + inches);
  }

  function weightToChestSize(weightKg) {
    const boundaries = {
      60: { lower: 84, upper: 88 },
      65: { lower: 88, upper: 92 },
      70: { lower: 92, upper: 92 },
      75: { lower: 96, upper: 96 },
      80: { lower: 96, upper: 100 },
      85: { lower: 100, upper: 104 },
      90: { lower: 104, upper: 108 },
      95: { lower: 108, upper: 112 },
      100: { lower: 112, upper: 116 },
      110: { lower: 116, upper: 120 },
      120: { lower: 120, upper: 124 },
      130: { lower: 124, upper: 128 },
    };

    if (boundaries[weightKg]) {
      return boundaries[weightKg].lower;
    }

    if (weightKg >= 55 && weightKg < 60) return 80;
    if (weightKg >= 60 && weightKg < 65) return 84;
    if (weightKg >= 65 && weightKg < 70) return 88;
    if (weightKg > 70 && weightKg < 75) return weightKg <= 72.5 ? 92 : 96;
    if (weightKg > 75 && weightKg < 80) return 92;
    if (weightKg > 80 && weightKg < 85) return 96;
    if (weightKg > 85 && weightKg < 90) return 100;
    if (weightKg > 90 && weightKg < 95) return 104;
    if (weightKg > 95 && weightKg < 100) return 108;
    if (weightKg > 100 && weightKg < 110) return 112;
    if (weightKg > 110 && weightKg < 120) return 116;
    if (weightKg > 120 && weightKg < 130) return 120;
    if (weightKg > 130 && weightKg <= 140) return 124;

    return -1;
  }

  function determineFitLength(heightCm) {
    if (heightCm < 173) return "Short";
    if (heightCm >= 173 && heightCm < 188) return "Regular";
    return "Long";
  }

  function calculateHeightConfidenceFactor(heightCm) {
    if (heightCm < 173) {
      const dist = 173 - heightCm;
      if (dist <= 3) return 10;
      if (dist <= 6) return 5;
      return 0;
    } else if (heightCm >= 173 && heightCm < 188) {
      const minDist = Math.min(heightCm - 173, 188 - heightCm);
      if (minDist <= 3) return 10;
      if (minDist <= 6) return 5;
      return 0;
    } else {
      const dist = heightCm - 188;
      if (dist <= 3) return 10;
      if (dist <= 6) return 5;
      return 0;
    }
  }

  function adjustFitAndChestSize(baseSize, preference) {
    const currentIndex = fitAndChestSize.findIndex((item) => item.chest === baseSize.chest && item.trousers === baseSize.trousers);
    if (currentIndex === -1) return baseSize;

    if (preference === "easy") {
      if (currentIndex < fitAndChestSize.length - 1) return fitAndChestSize[currentIndex + 1];
      return baseSize;
    }
    if (preference === "regular") {
      return baseSize;
    }
    if (preference === "slim") {
      if (currentIndex > 0) return fitAndChestSize[currentIndex - 1];
      return baseSize;
    }
    return baseSize;
  }

  function calculateFitAndChestConfidence(actualChestCm, recommendedChestCm, heightCm, preference) {
    let confidence = 95;
    confidence -= Math.abs(actualChestCm - recommendedChestCm) * 3;
    confidence -= calculateHeightConfidenceFactor(heightCm);

    const sorted = [...fitAndChestSize].sort((a, b) => Math.abs(a.chest - actualChestCm) - Math.abs(b.chest - actualChestCm));
    const naturalClosest = sorted[0]?.chest || actualChestCm;

    if (preference === "easy" && recommendedChestCm > naturalClosest) confidence -= 8;
    if (preference === "slim" && recommendedChestCm < naturalClosest) confidence -= 8;

    return Math.max(0, Math.min(95, Math.round(confidence)));
  }

  function findFitAndChestSize(chestCm, heightCm, preference) {
    const fit = determineFitLength(heightCm);
    const sorted = [...fitAndChestSize].sort((a, b) => Math.abs(a.chest - chestCm) - Math.abs(b.chest - chestCm));
    if (sorted.length === 0) return null;

    const regularSize = sorted[0];
    const adjustedSize = adjustFitAndChestSize(regularSize, preference);
    if (!adjustedSize) return null;

    const confidence = calculateFitAndChestConfidence(chestCm, adjustedSize.chest, heightCm, preference);

    return {
      size: adjustedSize.casualSize,
      fit: fit,
      chestSize: adjustedSize.chest,
      trouserSize: adjustedSize.trousers,
      confidence: confidence,
    };
  }

  function adjustWaistSize(baseSize, preference) {
    const currentIndex = waistSize.findIndex((item) => item.size === baseSize.size);
    if (currentIndex === -1) return baseSize;

    if (preference === "easy") {
      if (currentIndex < waistSize.length - 1) return waistSize[currentIndex + 1];
      return baseSize;
    }
    if (preference === "regular") {
      return baseSize;
    }
    if (preference === "slim") {
      if (currentIndex > 0) return waistSize[currentIndex - 1];
      return baseSize;
    }
    return baseSize;
  }

  function calculateWaistConfidence(actualWaistCm, recommendedWaistCm, preference) {
    let confidence = 95;
    confidence -= Math.abs(actualWaistCm - recommendedWaistCm) * 4;

    const sorted = [...waistSize].sort((a, b) => Math.abs(a.size - actualWaistCm) - Math.abs(b.size - actualWaistCm));
    const naturalClosest = sorted[0]?.size || actualWaistCm;

    if (preference === "easy" && recommendedWaistCm > naturalClosest) confidence -= 8;
    if (preference === "slim" && recommendedWaistCm < naturalClosest) confidence -= 8;

    return Math.max(0, Math.min(95, Math.round(confidence)));
  }

  function findWaistSize(waistCm, preference) {
    const sorted = [...waistSize].sort((a, b) => Math.abs(a.size - waistCm) - Math.abs(b.size - waistCm));
    if (sorted.length === 0) return null;

    const regularSize = sorted[0];
    const adjustedSize = adjustWaistSize(regularSize, preference);
    if (!adjustedSize) return null;

    const confidence = calculateWaistConfidence(waistCm, adjustedSize.size, preference);

    return {
      size: adjustedSize.size.toString(),
      confidence: confidence,
    };
  }

  function adjustShirtSize(baseSize, preference) {
    const currentIndex = shirtSizeChart.findIndex((item) => item.shirtSize === baseSize.shirtSize && item.casualSize === baseSize.casualSize);
    if (currentIndex === -1) return baseSize;

    if (preference === "easy") {
      if (currentIndex < shirtSizeChart.length - 1) return shirtSizeChart[currentIndex + 1];
      return baseSize;
    }
    if (preference === "regular") {
      return baseSize;
    }
    if (preference === "slim") {
      if (currentIndex > 0) return shirtSizeChart[currentIndex - 1];
      return baseSize;
    }
    return baseSize;
  }

  function calculateShirtConfidence(actualNeckCm, recommendedNeckCm, preference) {
    let confidence = 95;
    confidence -= Math.abs(actualNeckCm - recommendedNeckCm) * 5;

    const sorted = [...shirtSizeChart].sort((a, b) => Math.abs(a.shirtSize - actualNeckCm) - Math.abs(b.shirtSize - actualNeckCm));
    const naturalClosest = sorted[0]?.shirtSize || actualNeckCm;

    if (preference === "easy" && recommendedNeckCm > naturalClosest) confidence -= 8;
    if (preference === "slim" && recommendedNeckCm < naturalClosest) confidence -= 8;

    return Math.max(0, Math.min(95, Math.round(confidence)));
  }

  function findShirtSize(neckCm, preference) {
    const sorted = [...shirtSizeChart].sort((a, b) => Math.abs(a.shirtSize - neckCm) - Math.abs(b.shirtSize - neckCm));
    if (sorted.length === 0) return null;

    const regularSize = sorted[0];
    const adjustedSize = adjustShirtSize(regularSize, preference);
    if (!adjustedSize) return null;

    const confidence = calculateShirtConfidence(neckCm, adjustedSize.shirtSize, preference);

    return {
      size: `${adjustedSize.casualSize} (${adjustedSize.shirtSize}cm collar)`,
      confidence: confidence,
    };
  }

  class SizeGuide {
    constructor(element) {
      this.element = element;
      this.categoryType = element.dataset.categoryType;
      this.unitSystem = element.dataset.unitSystem || "metric";
      this.state = {
        currentStep: 0,
        method: null,
        heightCm: null,
        weightKg: null,
        chestCm: null,
        waistCm: null,
        neckCm: null,
        preference: null,
        result: null,
      };
      this.steps = this.getSteps();
      this.init();
    }

    getSteps() {
      if (this.categoryType === "fit-chest") {
        return ["method", "height", "measurement", "preference", "result"];
      }
      if (this.categoryType === "waist") {
        return ["waist", "preference", "result"];
      }
      if (this.categoryType === "shirt") {
        return ["neck", "preference", "result"];
      }
      return [];
    }

    init() {
      this.bindEvents();
      this.updateUnitVisibility();
      this.showStep(0);
    }

    bindEvents() {
      this.element.querySelectorAll(".size-guide__option[data-method]").forEach((btn) => {
        btn.addEventListener("click", () => this.selectMethod(btn.dataset.method));
      });

      this.element.querySelectorAll(".size-guide__option[data-preference]").forEach((btn) => {
        btn.addEventListener("click", () => this.selectPreference(btn.dataset.preference));
      });

      const backBtn = this.element.querySelector(".size-guide__nav-back");
      const nextBtn = this.element.querySelector(".size-guide__nav-next");

      if (backBtn) backBtn.addEventListener("click", () => this.prevStep());
      if (nextBtn) nextBtn.addEventListener("click", () => this.nextStep());

      this.element.querySelectorAll(".size-guide__restart").forEach((btn) => {
        btn.addEventListener("click", () => this.restart());
      });

      this.element.querySelectorAll(".size-guide__input").forEach((input) => {
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") this.nextStep();
        });
      });
    }

    updateUnitVisibility() {
      this.element.querySelectorAll(".size-guide__input-group[data-unit]").forEach((group) => {
        group.style.display = group.dataset.unit === this.unitSystem ? "" : "none";
      });
    }

    selectMethod(method) {
      this.state.method = method;
      this.element.querySelectorAll(".size-guide__option[data-method]").forEach((btn) => {
        btn.classList.toggle("size-guide__option--selected", btn.dataset.method === method);
      });
      this.nextStep();
    }

    selectPreference(preference) {
      this.state.preference = preference;
      this.element.querySelectorAll(".size-guide__option[data-preference]").forEach((btn) => {
        btn.classList.toggle("size-guide__option--selected", btn.dataset.preference === preference);
      });
      this.calculateAndShowResult();
    }

    getCurrentStepName() {
      const stepName = this.steps[this.state.currentStep];
      if (stepName === "measurement") {
        return this.state.method === "easy" ? "weight" : "chest";
      }
      return stepName;
    }

    showStep(index) {
      this.state.currentStep = index;
      const stepName = this.getCurrentStepName();

      this.element.querySelectorAll(".size-guide__step").forEach((step) => {
        step.classList.remove("size-guide__step--active");
      });

      const activeStep = this.element.querySelector(`.size-guide__step[data-step="${stepName}"]`);
      if (activeStep) {
        activeStep.classList.add("size-guide__step--active");
        const input = activeStep.querySelector(`.size-guide__input-group[data-unit="${this.unitSystem}"] .size-guide__input`);
        if (input) setTimeout(() => input.focus(), 100);
      }

      this.updateNavigation();
      this.updateProgress();
    }

    updateNavigation() {
      const backBtn = this.element.querySelector(".size-guide__nav-back");
      const nextBtn = this.element.querySelector(".size-guide__nav-next");
      const stepName = this.getCurrentStepName();

      if (backBtn) {
        backBtn.style.display = this.state.currentStep === 0 ? "none" : "";
      }

      if (nextBtn) {
        const isResultStep = stepName === "result";
        const isPreferenceStep = stepName === "preference";
        const isMethodStep = stepName === "method";
        nextBtn.style.display = isResultStep || isPreferenceStep || isMethodStep ? "none" : "";
      }
    }

    updateProgress() {
      const progressBar = this.element.querySelector(".size-guide__progress-bar");
      if (progressBar) {
        const progress = ((this.state.currentStep + 1) / this.steps.length) * 100;
        progressBar.style.width = `${progress}%`;
      }
    }

    validateCurrentStep() {
      const stepName = this.getCurrentStepName();
      const activeGroup = this.element.querySelector(`.size-guide__step[data-step="${stepName}"] .size-guide__input-group[data-unit="${this.unitSystem}"]`);
      const errorEl = activeGroup?.querySelector(".size-guide__error");

      const showError = (msg) => {
        if (errorEl) errorEl.textContent = msg;
        return false;
      };
      const clearError = () => {
        if (errorEl) errorEl.textContent = "";
        return true;
      };

      if (stepName === "height") {
        const heightCm = this.getHeightCm();
        if (!heightCm) return showError("Please enter your height");
        if (this.unitSystem === "metric") {
          if (heightCm < 155) return showError("Height must be at least 155cm");
          if (heightCm > 201) return showError("Height must be no more than 201cm");
        } else {
          if (heightCm < 155) return showError("Height must be at least 5'1\"");
          if (heightCm > 201) return showError("Height must be no more than 6'7\"");
        }
        this.state.heightCm = heightCm;
        return clearError();
      }

      if (stepName === "weight") {
        const weightKg = this.getWeightKg();
        if (!weightKg) return showError("Please enter your weight");
        if (this.unitSystem === "metric") {
          if (weightKg < 55) return showError("Weight must be at least 55kg");
          if (weightKg > 140) return showError("Weight must be no more than 140kg");
        } else {
          if (weightKg < 55) return showError("Weight must be at least 121lbs");
          if (weightKg > 140) return showError("Weight must be no more than 309lbs");
        }
        this.state.weightKg = weightKg;
        return clearError();
      }

      if (stepName === "chest") {
        const chestCm = this.getChestCm();
        if (!chestCm) return showError("Please enter your chest measurement");
        if (this.unitSystem === "metric") {
          if (chestCm < 84) return showError("Chest must be at least 84cm");
          if (chestCm > 128) return showError("Chest must be no more than 128cm");
        } else {
          if (chestCm < 84) return showError('Chest must be at least 33"');
          if (chestCm > 128) return showError('Chest must be no more than 50"');
        }
        this.state.chestCm = chestCm;
        return clearError();
      }

      if (stepName === "waist") {
        const waistCm = this.getWaistCm();
        if (!waistCm) return showError("Please enter your waist measurement");
        if (this.unitSystem === "metric") {
          if (waistCm < 76) return showError("Waist must be at least 76cm");
          if (waistCm > 116) return showError("Waist must be no more than 116cm");
        } else {
          if (waistCm < 76) return showError('Waist must be at least 29"');
          if (waistCm > 116) return showError('Waist must be no more than 46"');
        }
        this.state.waistCm = waistCm;
        return clearError();
      }

      if (stepName === "neck") {
        const neckCm = this.getNeckCm();
        if (!neckCm) return showError("Please enter your neck measurement");
        if (this.unitSystem === "metric") {
          if (neckCm < 37) return showError("Neck must be at least 37cm");
          if (neckCm > 50) return showError("Neck must be no more than 50cm");
        } else {
          if (neckCm < 37) return showError('Neck must be at least 14"');
          if (neckCm > 50) return showError('Neck must be no more than 20"');
        }
        this.state.neckCm = neckCm;
        return clearError();
      }

      return true;
    }

    getHeightCm() {
      if (this.unitSystem === "metric") {
        const input = this.element.querySelector("#size-guide-height-cm");
        return input ? parseFloat(input.value) : null;
      }
      const feetInput = this.element.querySelector("#size-guide-height-feet");
      const inchesInput = this.element.querySelector("#size-guide-height-inches");
      const feet = feetInput ? parseFloat(feetInput.value) || 0 : 0;
      const inches = inchesInput ? parseFloat(inchesInput.value) || 0 : 0;
      return feet || inches ? feetAndInchesToCm(feet, inches) : null;
    }

    getWeightKg() {
      if (this.unitSystem === "metric") {
        const input = this.element.querySelector("#size-guide-weight-kg");
        return input ? parseFloat(input.value) : null;
      }
      const input = this.element.querySelector("#size-guide-weight-lbs");
      const lbs = input ? parseFloat(input.value) : null;
      return lbs ? lbsToKg(lbs) : null;
    }

    getChestCm() {
      if (this.unitSystem === "metric") {
        const input = this.element.querySelector("#size-guide-chest-cm");
        return input ? parseFloat(input.value) : null;
      }
      const input = this.element.querySelector("#size-guide-chest-inches");
      const inches = input ? parseFloat(input.value) : null;
      return inches ? inchesToCm(inches) : null;
    }

    getWaistCm() {
      if (this.unitSystem === "metric") {
        const input = this.element.querySelector("#size-guide-waist-cm");
        return input ? parseFloat(input.value) : null;
      }
      const input = this.element.querySelector("#size-guide-waist-inches");
      const inches = input ? parseFloat(input.value) : null;
      return inches ? inchesToCm(inches) : null;
    }

    getNeckCm() {
      if (this.unitSystem === "metric") {
        const input = this.element.querySelector("#size-guide-neck-cm");
        return input ? parseFloat(input.value) : null;
      }
      const input = this.element.querySelector("#size-guide-neck-inches");
      const inches = input ? parseFloat(input.value) : null;
      return inches ? inchesToCm(inches) : null;
    }

    nextStep() {
      if (!this.validateCurrentStep()) return;
      if (this.state.currentStep < this.steps.length - 1) {
        this.showStep(this.state.currentStep + 1);
      }
    }

    prevStep() {
      if (this.state.currentStep > 0) {
        this.showStep(this.state.currentStep - 1);
      }
    }

    calculateAndShowResult() {
      let result = null;
      let outOfRange = false;

      if (this.categoryType === "fit-chest") {
        let chestCm = this.state.chestCm;
        if (this.state.method === "easy" && this.state.weightKg) {
          chestCm = weightToChestSize(this.state.weightKg);
          if (chestCm === -1) {
            outOfRange = true;
          }
        }
        if (!outOfRange && chestCm) {
          result = findFitAndChestSize(chestCm, this.state.heightCm, this.state.preference);
        }
      } else if (this.categoryType === "waist") {
        if (this.state.waistCm) {
          result = findWaistSize(this.state.waistCm, this.state.preference);
        }
      } else if (this.categoryType === "shirt") {
        if (this.state.neckCm) {
          result = findShirtSize(this.state.neckCm, this.state.preference);
        }
      }

      this.state.result = result;
      this.displayResult(result, outOfRange);
      this.nextStep();
    }

    displayResult(result, outOfRange) {
      const resultEl = this.element.querySelector(".size-guide__result:not(.size-guide__result--mtm)");
      const mtmEl = this.element.querySelector(".size-guide__result--mtm");

      if (!result || outOfRange) {
        if (resultEl) resultEl.style.display = "none";
        if (mtmEl) mtmEl.style.display = "";
        return;
      }

      if (resultEl) resultEl.style.display = "";
      if (mtmEl) mtmEl.style.display = "none";

      const sizeEl = this.element.querySelector(".size-guide__result-size");
      if (sizeEl) sizeEl.textContent = result.size;

      if (result.fit) {
        const fitEl = this.element.querySelector('[data-result="fit"] .size-guide__result-item-value');
        if (fitEl) fitEl.textContent = result.fit;
      }

      if (result.chestSize) {
        const chestEl = this.element.querySelector('[data-result="chest"] .size-guide__result-item-value');
        if (chestEl) chestEl.textContent = `${result.chestSize}`;
      }

      if (result.trouserSize) {
        const trouserEl = this.element.querySelector('[data-result="trouser"] .size-guide__result-item-value');
        if (trouserEl) trouserEl.textContent = result.trouserSize;
      }

      const confidenceEl = this.element.querySelector('[data-result="confidence"] .size-guide__result-item-value');
      if (confidenceEl) {
        const displayConfidence = Math.min(result.confidence, 95);
        confidenceEl.textContent = `${displayConfidence}%`;
      }
    }

    restart() {
      this.state = {
        currentStep: 0,
        method: null,
        heightCm: null,
        weightKg: null,
        chestCm: null,
        waistCm: null,
        neckCm: null,
        preference: null,
        result: null,
      };

      this.element.querySelectorAll(".size-guide__input").forEach((input) => {
        input.value = "";
      });

      this.element.querySelectorAll(".size-guide__option--selected").forEach((btn) => {
        btn.classList.remove("size-guide__option--selected");
      });

      this.element.querySelectorAll(".size-guide__error").forEach((el) => {
        el.textContent = "";
      });

      this.showStep(0);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const sizeGuideEl = document.querySelector(".size-guide");
    if (sizeGuideEl) {
      new SizeGuide(sizeGuideEl);
    }
  });
})();
