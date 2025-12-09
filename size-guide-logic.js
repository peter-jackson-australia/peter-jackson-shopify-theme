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

const waistSize = [{ size: 72 }, { size: 76 }, { size: 80 }, { size: 84 }, { size: 88 }, { size: 92 }, { size: 96 }, { size: 100 }, { size: 104 }, { size: 108 }, { size: 112 }, { size: 116 }];

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

const fitAndChestProducts = ["coats-jackets", "overcoats", "pant-suits", "pea-coats", "polos", "rain-coats", "sport-jackets", "sweaters", "t-shirts", "tuxedos", "vests"];

const waistProducts = ["belts", "cargo-pants", "chinos", "jeans", "shorts", "trousers"];

const shirtProducts = ["shirts"];

const footwearProducts = ["boots", "flats", "sandals", "shoes", "sneakers"];

const noMeasurementProducts = ["beanies", "briefcases", "cufflinks", "handbags", "handkerchiefs", "neckties", "scarves-shawls", "tie-clips", "wallets", "wallets-money-clips"];

function weightToChestSize(weightKg, preference) {
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

  if (weightKg > 70 && weightKg < 75) {
    return weightKg <= 72.5 ? 92 : 96;
  }

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

function lbsToKg(lbs) {
  return lbs / 2.20462;
}

function cmToInches(cm) {
  return cm / 2.54;
}

function inchesToCm(inches) {
  return inches * 2.54;
}

function feetAndInchesToCm(feet, inches) {
  return inchesToCm(feet * 12 + inches);
}

function determineFitLength(heightCm) {
  if (heightCm < 173) {
    return "short";
  } else if (heightCm >= 173 && heightCm < 188) {
    return "regular";
  } else {
    return "long";
  }
}

function calculateHeightConfidenceFactor(heightCm) {
  if (heightCm < 173) {
    const distanceFromBoundary = 173 - heightCm;
    if (distanceFromBoundary <= 3) return 10;
    if (distanceFromBoundary <= 6) return 5;
    return 0;
  } else if (heightCm >= 173 && heightCm < 188) {
    const distanceFromLower = heightCm - 173;
    const distanceFromUpper = 188 - heightCm;
    const minDistance = Math.min(distanceFromLower, distanceFromUpper);

    if (minDistance <= 3) return 10;
    if (minDistance <= 6) return 5;
    return 0;
  } else {
    const distanceFromBoundary = heightCm - 188;
    if (distanceFromBoundary <= 3) return 10;
    if (distanceFromBoundary <= 6) return 5;
    return 0;
  }
}

function calculateFitAndChestConfidence(actualChestCm, recommendedChestCm, heightCm, preference) {
  let confidence = 95;

  const chestDifference = Math.abs(actualChestCm - recommendedChestCm);
  confidence -= chestDifference * 3;

  const heightPenalty = calculateHeightConfidenceFactor(heightCm);
  confidence -= heightPenalty;

  const sortedByClosest = [...fitAndChestSize].sort((a, b) => Math.abs(a.chest - actualChestCm) - Math.abs(b.chest - actualChestCm));
  const naturalClosest = sortedByClosest[0]?.chest || actualChestCm;

  if (preference === "easy" && recommendedChestCm > naturalClosest) {
    confidence -= 8;
  } else if (preference === "slim" && recommendedChestCm < naturalClosest) {
    confidence -= 8;
  }

  return Math.max(0, Math.min(95, Math.round(confidence)));
}

function calculateWaistConfidence(actualWaistCm, recommendedWaistCm, preference) {
  let confidence = 95;
  const waistDifference = Math.abs(actualWaistCm - recommendedWaistCm);
  confidence -= waistDifference * 4;

  const sortedByClosest = [...waistSize].sort((a, b) => Math.abs(a.size - actualWaistCm) - Math.abs(b.size - actualWaistCm));
  const naturalClosest = sortedByClosest[0]?.size || actualWaistCm;

  if (preference === "easy" && recommendedWaistCm > naturalClosest) {
    confidence -= 8;
  } else if (preference === "slim" && recommendedWaistCm < naturalClosest) {
    confidence -= 8;
  }
  return Math.max(0, Math.min(95, Math.round(confidence)));
}

function calculateShirtConfidence(actualNeckCm, recommendedNeckCm, preference) {
  let confidence = 95;
  const neckDifference = Math.abs(actualNeckCm - recommendedNeckCm);
  confidence -= neckDifference * 5;
  const sortedByClosest = [...shirtSizeChart].sort((a, b) => Math.abs(a.shirtSize - actualNeckCm) - Math.abs(b.shirtSize - actualNeckCm));
  const naturalClosest = sortedByClosest[0]?.shirtSize || actualNeckCm;

  if (preference === "easy" && recommendedNeckCm > naturalClosest) {
    confidence -= 8;
  } else if (preference === "slim" && recommendedNeckCm < naturalClosest) {
    confidence -= 8;
  }
  return Math.max(0, Math.min(95, Math.round(confidence)));
}

function adjustFitAndChestSize(baseSize, preference) {
  const currentIndex = fitAndChestSize.findIndex((item) => item.chest === baseSize.chest && item.trousers === baseSize.trousers);

  if (currentIndex === -1) {
    return baseSize;
  }

  if (preference === "easy") {
    return baseSize;
  } else if (preference === "regular") {
    if (currentIndex > 0) {
      return fitAndChestSize[currentIndex - 1];
    } else {
      return baseSize;
    }
  } else if (preference === "slim") {
    if (currentIndex > 1) {
      return fitAndChestSize[currentIndex - 2];
    } else if (currentIndex > 0) {
      return fitAndChestSize[currentIndex - 1];
    } else {
      return baseSize;
    }
  }

  return baseSize;
}

function findFitAndChestSize(chestCm, heightCm, preference) {
  const fit = determineFitLength(heightCm);

  const sorted = [...fitAndChestSize].sort((a, b) => Math.abs(a.chest - chestCm) - Math.abs(b.chest - chestCm));

  if (sorted.length === 0) {
    return null;
  }

  const regularSize = sorted[0];

  const adjustedSize = adjustFitAndChestSize(regularSize, preference);

  if (!adjustedSize) {
    return null;
  }

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

  if (currentIndex === -1) {
    return baseSize;
  }

  if (preference === "easy") {
    return baseSize;
  } else if (preference === "regular") {
    if (currentIndex > 0) {
      return waistSize[currentIndex - 1];
    } else {
      return baseSize;
    }
  } else if (preference === "slim") {
    if (currentIndex > 1) {
      return waistSize[currentIndex - 2];
    } else if (currentIndex > 0) {
      return waistSize[currentIndex - 1];
    } else {
      return baseSize;
    }
  }

  return baseSize;
}

function findWaistSize(waistCm, preference) {
  const sorted = [...waistSize].sort((a, b) => Math.abs(a.size - waistCm) - Math.abs(b.size - waistCm));

  if (sorted.length === 0) {
    return null;
  }

  const regularSize = sorted[0];

  const adjustedSize = adjustWaistSize(regularSize, preference);

  if (!adjustedSize) {
    return null;
  }

  const confidence = calculateWaistConfidence(waistCm, adjustedSize.size, preference);

  return {
    size: adjustedSize.size.toString(),
    confidence: confidence,
  };
}

function adjustShirtSize(baseSize, preference) {
  const currentIndex = shirtSizeChart.findIndex((item) => item.shirtSize === baseSize.shirtSize && item.casualSize === baseSize.casualSize);

  if (currentIndex === -1) {
    return baseSize;
  }

  if (preference === "easy") {
    return baseSize;
  } else if (preference === "regular") {
    if (currentIndex > 0) {
      return shirtSizeChart[currentIndex - 1];
    } else {
      return baseSize;
    }
  } else if (preference === "slim") {
    if (currentIndex > 1) {
      return shirtSizeChart[currentIndex - 2];
    } else if (currentIndex > 0) {
      return shirtSizeChart[currentIndex - 1];
    } else {
      return baseSize;
    }
  }

  return baseSize;
}

function findShirtSize(neckCm, preference) {
  const sorted = [...shirtSizeChart].sort((a, b) => Math.abs(a.shirtSize - neckCm) - Math.abs(b.shirtSize - neckCm));

  if (sorted.length === 0) {
    return null;
  }

  const regularSize = sorted[0];

  const adjustedSize = adjustShirtSize(regularSize, preference);

  if (!adjustedSize) {
    return null;
  }

  const confidence = calculateShirtConfidence(neckCm, adjustedSize.shirtSize, preference);

  return {
    size: `${adjustedSize.casualSize} (${adjustedSize.shirtSize}cm collar)`,
    confidence: confidence,
  };
}

function getRequiredMeasurements(productType, measurementMethod) {
  if (fitAndChestProducts.includes(productType)) {
    if (measurementMethod === "easy") {
      return ["height", "weight"];
    } else {
      return ["height", "chest"];
    }
  } else if (waistProducts.includes(productType)) {
    return ["waist"];
  } else if (shirtProducts.includes(productType)) {
    return ["neck"];
  } else if (footwearProducts.includes(productType)) {
    return ["shoe"];
  } else if (noMeasurementProducts.includes(productType)) {
    return [];
  }
  return [];
}

function updateFieldVisibility(productType, unitSystem, measurementMethod) {
  const requiredMeasurements = getRequiredMeasurements(productType, measurementMethod);

  const heightCmSection = document.querySelector('h3:has(+ label[for="height-cm"])');
  const heightImperialSection = document.querySelector('h3:has(+ label[for="height-feet"])');
  const chestCmSection = document.querySelector('h3:has(+ label[for="chest-cm"])');
  const chestImperialSection = document.querySelector('h3:has(+ label[for="chest-inches"])');
  const weightKgSection = document.querySelector('h3:has(+ label[for="weight-kg"])');
  const weightLbsSection = document.querySelector('h3:has(+ label[for="weight-lbs"])');
  const waistCmSection = document.querySelector('h3:has(+ label[for="waist-cm"])');
  const waistImperialSection = document.querySelector('h3:has(+ label[for="waist-inches"])');
  const neckCmSection = document.querySelector('h3:has(+ label[for="neck-cm"])');
  const neckImperialSection = document.querySelector('h3:has(+ label[for="neck-inches"])');

  const toggleSection = (section, show) => {
    if (section) {
      const nextElements = [];
      let current = section.nextElementSibling;
      while (current && current.tagName !== "HR") {
        nextElements.push(current);
        current = current.nextElementSibling;
      }
      if (current && current.tagName === "HR") {
        nextElements.push(current);
      }

      section.style.display = show ? "" : "none";
      nextElements.forEach((el) => {
        if (el) el.style.display = show ? "" : "none";
      });
    }
  };

  const needsHeight = requiredMeasurements.includes("height");
  const needsChest = requiredMeasurements.includes("chest");
  const needsWeight = requiredMeasurements.includes("weight");
  const needsWaist = requiredMeasurements.includes("waist");
  const needsNeck = requiredMeasurements.includes("neck");

  toggleSection(heightCmSection, needsHeight && unitSystem === "metric");
  toggleSection(heightImperialSection, needsHeight && unitSystem === "imperial");
  toggleSection(chestCmSection, needsChest && unitSystem === "metric");
  toggleSection(chestImperialSection, needsChest && unitSystem === "imperial");
  toggleSection(weightKgSection, needsWeight && unitSystem === "metric");
  toggleSection(weightLbsSection, needsWeight && unitSystem === "imperial");
  toggleSection(waistCmSection, needsWaist && unitSystem === "metric");
  toggleSection(waistImperialSection, needsWaist && unitSystem === "imperial");
  toggleSection(neckCmSection, needsNeck && unitSystem === "metric");
  toggleSection(neckImperialSection, needsNeck && unitSystem === "imperial");
}

function shouldShowFitPreference(productType) {
  return fitAndChestProducts.includes(productType) || waistProducts.includes(productType) || shirtProducts.includes(productType);
}

function updateMeasurementMethodVisibility(productType) {
  const measurementMethodSection = document.getElementById("measurement-method-section");
  const fitPreferenceSection = document.getElementById("fit-preference-section");
  const measurementMethodSelect = document.getElementById("measurement-method");
  const productTypeMessageSection = document.getElementById("product-type-message");
  const productTypeMessageText = document.getElementById("product-type-message-text");

  if (noMeasurementProducts.includes(productType)) {
    if (productTypeMessageSection) productTypeMessageSection.style.display = "";
    if (productTypeMessageText) productTypeMessageText.textContent = "One Size";
    if (measurementMethodSection) measurementMethodSection.style.display = "none";
    if (fitPreferenceSection) fitPreferenceSection.style.display = "none";
    measurementMethodSelect.value = "";
    return;
  }

  if (footwearProducts.includes(productType)) {
    if (productTypeMessageSection) productTypeMessageSection.style.display = "";
    if (productTypeMessageText) productTypeMessageText.textContent = "Footwear Sizes";
    if (measurementMethodSection) measurementMethodSection.style.display = "none";
    if (fitPreferenceSection) fitPreferenceSection.style.display = "none";
    measurementMethodSelect.value = "";
    return;
  }

  if (productTypeMessageSection) productTypeMessageSection.style.display = "none";

  if (fitAndChestProducts.includes(productType)) {
    if (measurementMethodSection) measurementMethodSection.style.display = "";
  } else {
    if (measurementMethodSection) measurementMethodSection.style.display = "none";
    measurementMethodSelect.value = "";
  }

  if (shouldShowFitPreference(productType)) {
    if (fitPreferenceSection) fitPreferenceSection.style.display = "";
  } else {
    if (fitPreferenceSection) fitPreferenceSection.style.display = "none";
  }
}

function calculateSize() {
  const productTypeSelect = document.getElementById("product-type");
  const unitSelect = document.getElementById("unit-selection");
  const measurementMethodSelect = document.getElementById("measurement-method");
  const productType = productTypeSelect.value;
  const unitSystem = unitSelect.value;
  const measurementMethod = measurementMethodSelect.value;

  if (noMeasurementProducts.includes(productType)) {
    return {
      size: "One Size",
      confidence: 100,
    };
  }

  if (footwearProducts.includes(productType)) {
    return {
      size: "Footwear",
      confidence: 100,
    };
  }

  if (fitAndChestProducts.includes(productType) && !measurementMethod) {
    alert("Please select a measurement method (Easy or Accurate).");
    return null;
  }

  const requiredMeasurements = getRequiredMeasurements(productType, measurementMethod);

  const preferenceInputs = document.querySelectorAll('input[name="preference"]');
  let preference = "regular";
  for (const input of preferenceInputs) {
    const radioInput = input;
    if (radioInput.checked) {
      preference = radioInput.value;
      break;
    }
  }

  if (requiredMeasurements.length === 0) {
    alert("This product type does not require measurements.");
    return null;
  }

  let heightCm = 0;
  let chestCm = 0;
  let waistCm = 0;
  let neckCm = 0;

  if (requiredMeasurements.includes("height")) {
    if (unitSystem === "metric") {
      const heightInput = document.getElementById("height-cm");
      heightCm = parseFloat(heightInput.value);
    } else {
      const feetInput = document.getElementById("height-feet");
      const inchesInput = document.getElementById("height-inches");
      const feet = parseFloat(feetInput.value);
      const inches = parseFloat(inchesInput.value);
      heightCm = feetAndInchesToCm(feet, inches);
    }

    if (isNaN(heightCm)) {
      alert("Please enter a valid height.");
      return null;
    }

    if (heightCm < 155 || heightCm > 201) {
      alert("Based on your measurements, we recommend our Made To Measure program for the perfect fit.");
      return null;
    }
  }

  if (requiredMeasurements.includes("chest")) {
    if (unitSystem === "metric") {
      const chestInput = document.getElementById("chest-cm");
      chestCm = parseFloat(chestInput.value);
    } else {
      const chestInchesInput = document.getElementById("chest-inches");
      chestCm = inchesToCm(parseFloat(chestInchesInput.value));
    }

    if (isNaN(chestCm)) {
      alert("Please enter a valid chest measurement.");
      return null;
    }

    if (chestCm < 84 || chestCm > 128) {
      alert("Based on your measurements, we recommend our Made To Measure program for the perfect fit.");
      return null;
    }
  }

  if (requiredMeasurements.includes("weight")) {
    let weightKg = 0;

    if (unitSystem === "metric") {
      const weightInput = document.getElementById("weight-kg");
      weightKg = parseFloat(weightInput.value);
    } else {
      const weightLbsInput = document.getElementById("weight-lbs");
      const weightLbs = parseFloat(weightLbsInput.value);
      weightKg = lbsToKg(weightLbs);
    }

    if (isNaN(weightKg)) {
      alert("Please enter a valid weight.");
      return null;
    }

    if (weightKg < 55 || weightKg > 140) {
      alert("Based on your measurements, we recommend our Made To Measure program for the perfect fit.");
      return null;
    }

    chestCm = weightToChestSize(weightKg, preference);

    if (chestCm === -1) {
      alert("Unable to determine chest size from weight. Please try the Accurate method.");
      return null;
    }
  }

  if (requiredMeasurements.includes("waist")) {
    if (unitSystem === "metric") {
      const waistInput = document.getElementById("waist-cm");
      waistCm = parseFloat(waistInput.value);
    } else {
      const waistInchesInput = document.getElementById("waist-inches");
      waistCm = inchesToCm(parseFloat(waistInchesInput.value));
    }

    if (isNaN(waistCm)) {
      alert("Please enter a valid waist measurement.");
      return null;
    }

    if (waistCm < 72 || waistCm > 116) {
      alert("Based on your measurements, we recommend our Made To Measure program for the perfect fit.");
      return null;
    }
  }

  if (requiredMeasurements.includes("neck")) {
    if (unitSystem === "metric") {
      const neckInput = document.getElementById("neck-cm");
      neckCm = parseFloat(neckInput.value);
    } else {
      const neckInchesInput = document.getElementById("neck-inches");
      neckCm = inchesToCm(parseFloat(neckInchesInput.value));
    }

    if (isNaN(neckCm)) {
      alert("Please enter a valid neck measurement.");
      return null;
    }

    if (neckCm < 37 || neckCm > 50) {
      alert("Based on your measurements, we recommend our Made To Measure program for the perfect fit.");
      return null;
    }
  }

  if (fitAndChestProducts.includes(productType)) {
    return findFitAndChestSize(chestCm, heightCm, preference);
  } else if (waistProducts.includes(productType)) {
    return findWaistSize(waistCm, preference);
  } else if (shirtProducts.includes(productType)) {
    return findShirtSize(neckCm, preference);
  }

  return null;
}

function displayResult(result) {
  let message = `Your recommended size is: ${result.size}`;

  if (result.chestSize !== undefined) {
    message += `\nChest size: ${result.chestSize}cm`;
  }

  if (result.fit) {
    message += `\nFit: ${result.fit.charAt(0).toUpperCase() + result.fit.slice(1)}`;
  }

  if (result.trouserSize !== undefined) {
    message += `\nTrouser size: ${result.trouserSize}cm`;
  }

  message += `\n\nConfidence: ${result.confidence}%`;

  alert(message);
}

document.addEventListener("DOMContentLoaded", () => {
  const productTypeSelect = document.getElementById("product-type");
  const unitSelect = document.getElementById("unit-selection");
  const measurementMethodSelect = document.getElementById("measurement-method");
  const calculateBtn = document.getElementById("calculate-size-btn");

  updateMeasurementMethodVisibility(productTypeSelect.value);
  updateFieldVisibility(productTypeSelect.value, unitSelect.value, measurementMethodSelect.value);

  productTypeSelect.addEventListener("change", () => {
    updateMeasurementMethodVisibility(productTypeSelect.value);
    updateFieldVisibility(productTypeSelect.value, unitSelect.value, measurementMethodSelect.value);
  });

  unitSelect.addEventListener("change", () => {
    updateFieldVisibility(productTypeSelect.value, unitSelect.value, measurementMethodSelect.value);
  });

  measurementMethodSelect.addEventListener("change", () => {
    updateFieldVisibility(productTypeSelect.value, unitSelect.value, measurementMethodSelect.value);
  });

  calculateBtn.addEventListener("click", () => {
    const result = calculateSize();
    if (result) {
      displayResult(result);
    }
  });
});
