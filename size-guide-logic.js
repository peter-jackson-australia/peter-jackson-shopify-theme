// @ts-check

/**
 * @typedef {'easy' | 'regular' | 'slim'} FitPreference
 * @typedef {'metric' | 'imperial'} UnitSystem
 * @typedef {'short' | 'regular' | 'long'} FitLength
 * @typedef {'easy' | 'accurate'} MeasurementMethod
 */

/**
 * @typedef {Object} FitAndChestSize
 * @property {string} casualSize
 * @property {number} chest
 * @property {number} trousers
 */

/**
 * @typedef {Object} WaistSize
 * @property {number} size
 */

/**
 * @typedef {Object} ShirtSize
 * @property {string} casualSize
 * @property {number} shirtSize
 */

/**
 * @typedef {Object} SizeResult
 * @property {string} size
 * @property {FitLength} [fit]
 * @property {number} [chestSize]
 * @property {number} [trouserSize]
 * @property {number} confidence
 */

// Size data
/** @type {FitAndChestSize[]} */
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

/** @type {WaistSize[]} */
const waistSize = [{ size: 72 }, { size: 76 }, { size: 80 }, { size: 84 }, { size: 88 }, { size: 92 }, { size: 96 }, { size: 100 }, { size: 104 }, { size: 108 }, { size: 112 }, { size: 116 }];

/** @type {ShirtSize[]} */
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

// Product category mappings
const fitAndChestProducts = ["coats-jackets", "overcoats", "pant-suits", "pea-coats", "polos", "rain-coats", "sport-jackets", "sweaters", "t-shirts", "tuxedos", "vests"];

const waistProducts = ["belts", "cargo-pants", "chinos", "jeans", "shorts", "trousers"];

const shirtProducts = ["shirts"];

const footwearProducts = ["boots", "flats", "sandals", "shoes", "sneakers"];

const noMeasurementProducts = ["beanies", "briefcases", "cufflinks", "handbags", "handkerchiefs", "neckties", "scarves-shawls", "tie-clips", "wallets", "wallets-money-clips"];

/**
 * Convert weight in kg to chest size in cm
 * @param {number} weightKg
 * @param {FitPreference} preference
 * @returns {number}
 */
function weightToChestSize(weightKg, preference) {
  // NOTE: This function now ignores preference - we find the regular fit
  // and adjust the size after based on preference
  const boundaries = {
    60: { lower: 84, upper: 88 }, // 55-60 vs 60-65
    65: { lower: 88, upper: 92 }, // 60-65 vs 65-70
    70: { lower: 92, upper: 92 }, // 65-70 vs 70-75 (both 92, handled below)
    75: { lower: 96, upper: 96 }, // 70-75 vs 75-80 (both 96)
    80: { lower: 96, upper: 100 }, // 75-80 vs 80-85
    85: { lower: 100, upper: 104 }, // 80-85 vs 85-90
    90: { lower: 104, upper: 108 }, // 85-90 vs 90-95
    95: { lower: 108, upper: 112 }, // 90-95 vs 95-100
    100: { lower: 112, upper: 116 }, // 95-100 vs 100-110
    110: { lower: 116, upper: 120 }, // 100-110 vs 110-120
    120: { lower: 120, upper: 124 }, // 110-120 vs 120-130
    130: { lower: 124, upper: 128 }, // 120-130 vs 130-140
  };

  // Check if weight is exactly on a boundary - always use lower for regular
  if (boundaries[weightKg]) {
    return boundaries[weightKg].lower;
  }

  // Non-boundary values - standard ranges
  if (weightKg >= 55 && weightKg < 60) return 80;
  if (weightKg >= 60 && weightKg < 65) return 84;
  if (weightKg >= 65 && weightKg < 70) return 88;

  // Gap handling: 70-75 kg based on proximity
  if (weightKg > 70 && weightKg < 75) {
    // 70-72.5 → 92, 72.5-75 → 96
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

  // Out of range
  return -1;
}

/**
 * Convert pounds to kilograms
 * @param {number} lbs
 * @returns {number}
 */
function lbsToKg(lbs) {
  return lbs / 2.20462;
}

/**
 * Convert centimeters to inches
 * @param {number} cm
 * @returns {number}
 */
function cmToInches(cm) {
  return cm / 2.54;
}

/**
 * Convert inches to centimeters
 * @param {number} inches
 * @returns {number}
 */
function inchesToCm(inches) {
  return inches * 2.54;
}

/**
 * Convert feet and inches to centimeters
 * @param {number} feet
 * @param {number} inches
 * @returns {number}
 */
function feetAndInchesToCm(feet, inches) {
  return inchesToCm(feet * 12 + inches);
}

/**
 * Determine fit length based on height in cm
 * @param {number} heightCm
 * @returns {FitLength}
 */
function determineFitLength(heightCm) {
  if (heightCm < 173) {
    return "short";
  } else if (heightCm >= 173 && heightCm < 188) {
    return "regular";
  } else {
    return "long";
  }
}

/**
 * Calculate height confidence factor based on position within fit range
 * @param {number} heightCm
 * @returns {number} - Deduction from confidence (0-15)
 */
function calculateHeightConfidenceFactor(heightCm) {
  // Less than 173 = short
  // 173-187 = regular
  // 188+ = long

  if (heightCm < 173) {
    // Short range: penalty increases as we approach 173
    const distanceFromBoundary = 173 - heightCm;
    if (distanceFromBoundary <= 3) return 10; // Very close to boundary
    if (distanceFromBoundary <= 6) return 5; // Somewhat close
    return 0; // Comfortably in short range
  } else if (heightCm >= 173 && heightCm < 188) {
    // Regular range: penalty at both boundaries
    const distanceFromLower = heightCm - 173;
    const distanceFromUpper = 188 - heightCm;
    const minDistance = Math.min(distanceFromLower, distanceFromUpper);

    if (minDistance <= 3) return 10; // Very close to boundary
    if (minDistance <= 6) return 5; // Somewhat close
    return 0; // Comfortably in middle
  } else {
    // Long range: penalty increases as we approach 188
    const distanceFromBoundary = heightCm - 188;
    if (distanceFromBoundary <= 3) return 10; // Very close to boundary
    if (distanceFromBoundary <= 6) return 5; // Somewhat close
    return 0; // Comfortably in long range
  }
}

/**
 * Calculate confidence for fit and chest size recommendation
 * @param {number} actualChestCm
 * @param {number} recommendedChestCm
 * @param {number} heightCm
 * @param {FitPreference} preference
 * @returns {number} - Confidence percentage (0-95)
 */
function calculateFitAndChestConfidence(actualChestCm, recommendedChestCm, heightCm, preference) {
  let confidence = 95; // Start at maximum

  // Factor 1: Distance from exact chest measurement
  const chestDifference = Math.abs(actualChestCm - recommendedChestCm);
  confidence -= chestDifference * 3; // 3% penalty per cm difference

  // Factor 2: Height position within fit range
  const heightPenalty = calculateHeightConfidenceFactor(heightCm);
  confidence -= heightPenalty;

  // Factor 3: Preference adjustment penalty
  // If preference caused us to move away from the natural closest match
  const sortedByClosest = [...fitAndChestSize].sort((a, b) => Math.abs(a.chest - actualChestCm) - Math.abs(b.chest - actualChestCm));
  const naturalClosest = sortedByClosest[0]?.chest || actualChestCm;

  if (preference === "easy" && recommendedChestCm > naturalClosest) {
    // We sized up due to preference
    confidence -= 8;
  } else if (preference === "slim" && recommendedChestCm < naturalClosest) {
    // We sized down due to preference
    confidence -= 8;
  }

  // Ensure confidence stays within 0-95 range
  return Math.max(0, Math.min(95, Math.round(confidence)));
}

/**
 * Calculate confidence for waist size recommendation
 * @param {number} actualWaistCm
 * @param {number} recommendedWaistCm
 * @param {FitPreference} preference
 * @returns {number} - Confidence percentage (0-95)
 */
function calculateWaistConfidence(actualWaistCm, recommendedWaistCm, preference) {
  let confidence = 95; // Start at maximum

  // Factor 1: Distance from exact waist measurement
  const waistDifference = Math.abs(actualWaistCm - recommendedWaistCm);
  confidence -= waistDifference * 4; // 4% penalty per cm difference

  // Factor 2: Preference adjustment penalty
  const sortedByClosest = [...waistSize].sort((a, b) => Math.abs(a.size - actualWaistCm) - Math.abs(b.size - actualWaistCm));
  const naturalClosest = sortedByClosest[0]?.size || actualWaistCm;

  if (preference === "easy" && recommendedWaistCm > naturalClosest) {
    // We sized up due to preference
    confidence -= 8;
  } else if (preference === "slim" && recommendedWaistCm < naturalClosest) {
    // We sized down due to preference
    confidence -= 8;
  }

  // Ensure confidence stays within 0-95 range
  return Math.max(0, Math.min(95, Math.round(confidence)));
}

/**
 * Calculate confidence for shirt size recommendation
 * @param {number} actualNeckCm
 * @param {number} recommendedNeckCm
 * @param {FitPreference} preference
 * @returns {number} - Confidence percentage (0-95)
 */
function calculateShirtConfidence(actualNeckCm, recommendedNeckCm, preference) {
  let confidence = 95; // Start at maximum

  // Factor 1: Distance from exact neck measurement
  const neckDifference = Math.abs(actualNeckCm - recommendedNeckCm);
  confidence -= neckDifference * 5; // 5% penalty per cm difference

  // Factor 2: Preference adjustment penalty
  const sortedByClosest = [...shirtSizeChart].sort((a, b) => Math.abs(a.shirtSize - actualNeckCm) - Math.abs(b.shirtSize - actualNeckCm));
  const naturalClosest = sortedByClosest[0]?.shirtSize || actualNeckCm;

  if (preference === "easy" && recommendedNeckCm > naturalClosest) {
    // We sized up due to preference
    confidence -= 8;
  } else if (preference === "slim" && recommendedNeckCm < naturalClosest) {
    // We sized down due to preference
    confidence -= 8;
  }

  // Ensure confidence stays within 0-95 range
  return Math.max(0, Math.min(95, Math.round(confidence)));
}

/**
 * Adjust size based on preference
 * Base measurement finds the closest fit, then:
 * - Regular = one size down from closest
 * - Slim = two sizes down from closest (one down from regular)
 * - Easy = closest measurement (what used to be regular)
 * @param {FitAndChestSize} baseSize - The closest fit based on measurements
 * @param {FitPreference} preference
 * @returns {FitAndChestSize | null}
 */
function adjustFitAndChestSize(baseSize, preference) {
  const currentIndex = fitAndChestSize.findIndex((item) => item.chest === baseSize.chest && item.trousers === baseSize.trousers);

  if (currentIndex === -1) {
    return baseSize; // Fallback if not found
  }

  if (preference === "easy") {
    // Easy = no change (stays at closest measurement)
    return baseSize;
  } else if (preference === "regular") {
    // Regular = one size down from closest
    if (currentIndex > 0) {
      return fitAndChestSize[currentIndex - 1];
    } else {
      // Already at smallest size, can't go smaller
      return baseSize;
    }
  } else if (preference === "slim") {
    // Slim = two sizes down from closest
    if (currentIndex > 1) {
      return fitAndChestSize[currentIndex - 2];
    } else if (currentIndex > 0) {
      // Can only go down one size
      return fitAndChestSize[currentIndex - 1];
    } else {
      // Already at smallest size, can't go smaller
      return baseSize;
    }
  }

  return baseSize;
}

/**
 * Find size for fit and chest products
 * @param {number} chestCm
 * @param {number} heightCm
 * @param {FitPreference} preference
 * @returns {SizeResult | null}
 */
function findFitAndChestSize(chestCm, heightCm, preference) {
  const fit = determineFitLength(heightCm);

  // Always find the regular/closest fit first
  const sorted = [...fitAndChestSize].sort((a, b) => Math.abs(a.chest - chestCm) - Math.abs(b.chest - chestCm));

  if (sorted.length === 0) {
    return null;
  }

  const regularSize = sorted[0];

  // Adjust based on preference
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

/**
 * Adjust waist size based on preference
 * Base measurement finds the closest fit, then:
 * - Regular = one size down from closest
 * - Slim = two sizes down from closest (one down from regular)
 * - Easy = closest measurement (what used to be regular)
 * @param {WaistSize} baseSize
 * @param {FitPreference} preference
 * @returns {WaistSize | null}
 */
function adjustWaistSize(baseSize, preference) {
  const currentIndex = waistSize.findIndex((item) => item.size === baseSize.size);

  if (currentIndex === -1) {
    return baseSize;
  }

  if (preference === "easy") {
    // Easy = no change (stays at closest measurement)
    return baseSize;
  } else if (preference === "regular") {
    // Regular = one size down from closest
    if (currentIndex > 0) {
      return waistSize[currentIndex - 1];
    } else {
      return baseSize;
    }
  } else if (preference === "slim") {
    // Slim = two sizes down from closest
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

/**
 * Find size for waist products
 * @param {number} waistCm
 * @param {FitPreference} preference
 * @returns {SizeResult | null}
 */
function findWaistSize(waistCm, preference) {
  // Always find the regular/closest fit first
  const sorted = [...waistSize].sort((a, b) => Math.abs(a.size - waistCm) - Math.abs(b.size - waistCm));

  if (sorted.length === 0) {
    return null;
  }

  const regularSize = sorted[0];

  // Adjust based on preference
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

/**
 * Adjust shirt size based on preference
 * Base measurement finds the closest fit, then:
 * - Regular = one size down from closest
 * - Slim = two sizes down from closest (one down from regular)
 * - Easy = closest measurement (what used to be regular)
 * @param {ShirtSize} baseSize
 * @param {FitPreference} preference
 * @returns {ShirtSize | null}
 */
function adjustShirtSize(baseSize, preference) {
  const currentIndex = shirtSizeChart.findIndex((item) => item.shirtSize === baseSize.shirtSize && item.casualSize === baseSize.casualSize);

  if (currentIndex === -1) {
    return baseSize;
  }

  if (preference === "easy") {
    // Easy = no change (stays at closest measurement)
    return baseSize;
  } else if (preference === "regular") {
    // Regular = one size down from closest
    if (currentIndex > 0) {
      return shirtSizeChart[currentIndex - 1];
    } else {
      return baseSize;
    }
  } else if (preference === "slim") {
    // Slim = two sizes down from closest
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

/**
 * Find size for shirt products
 * @param {number} neckCm
 * @param {FitPreference} preference
 * @returns {SizeResult | null}
 */
function findShirtSize(neckCm, preference) {
  // Always find the regular/closest fit first
  const sorted = [...shirtSizeChart].sort((a, b) => Math.abs(a.shirtSize - neckCm) - Math.abs(b.shirtSize - neckCm));

  if (sorted.length === 0) {
    return null;
  }

  const regularSize = sorted[0];

  // Adjust based on preference
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

/**
 * Get required measurements for a product type
 * @param {string} productType
 * @param {MeasurementMethod} measurementMethod
 * @returns {string[]}
 */
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

/**
 * Update field visibility based on product type, unit system, and measurement method
 * @param {string} productType
 * @param {UnitSystem} unitSystem
 * @param {MeasurementMethod} measurementMethod
 */
function updateFieldVisibility(productType, unitSystem, measurementMethod) {
  const requiredMeasurements = getRequiredMeasurements(productType, measurementMethod);

  // Get all measurement sections
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

  // Helper to show/hide sections
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

  // Show/hide based on required measurements and unit system
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

/**
 * Check if product type should show fit preference
 * @param {string} productType
 * @returns {boolean}
 */
function shouldShowFitPreference(productType) {
  // Only show fit preference for products with measurements (not footwear, not single-size)
  return fitAndChestProducts.includes(productType) || waistProducts.includes(productType) || shirtProducts.includes(productType);
}

/**
 * Update visibility of measurement method selector and fit preference
 * @param {string} productType
 */
function updateMeasurementMethodVisibility(productType) {
  const measurementMethodSection = document.getElementById("measurement-method-section");
  const fitPreferenceSection = document.getElementById("fit-preference-section");
  const measurementMethodSelect = /** @type {HTMLSelectElement} */ (document.getElementById("measurement-method"));
  const productTypeMessageSection = document.getElementById("product-type-message");
  const productTypeMessageText = document.getElementById("product-type-message-text");

  // Handle single-size products
  if (noMeasurementProducts.includes(productType)) {
    if (productTypeMessageSection) productTypeMessageSection.style.display = "";
    if (productTypeMessageText) productTypeMessageText.textContent = "One Size";
    if (measurementMethodSection) measurementMethodSection.style.display = "none";
    if (fitPreferenceSection) fitPreferenceSection.style.display = "none";
    measurementMethodSelect.value = "";
    return;
  }

  // Handle footwear products
  if (footwearProducts.includes(productType)) {
    if (productTypeMessageSection) productTypeMessageSection.style.display = "";
    if (productTypeMessageText) productTypeMessageText.textContent = "Footwear Sizes";
    if (measurementMethodSection) measurementMethodSection.style.display = "none";
    if (fitPreferenceSection) fitPreferenceSection.style.display = "none";
    measurementMethodSelect.value = "";
    return;
  }

  // Hide the message for products that need measurements
  if (productTypeMessageSection) productTypeMessageSection.style.display = "none";

  // Show measurement method selector only for fitAndChestProducts
  if (fitAndChestProducts.includes(productType)) {
    if (measurementMethodSection) measurementMethodSection.style.display = "";
  } else {
    if (measurementMethodSection) measurementMethodSection.style.display = "none";
    measurementMethodSelect.value = "";
  }

  // Only show fit preference for specific product types (not footwear, not single-size)
  if (shouldShowFitPreference(productType)) {
    if (fitPreferenceSection) fitPreferenceSection.style.display = "";
  } else {
    if (fitPreferenceSection) fitPreferenceSection.style.display = "none";
  }
}

/**
 * Calculate size based on inputs
 * @returns {SizeResult | null}
 */
function calculateSize() {
  const productTypeSelect = /** @type {HTMLSelectElement} */ (document.getElementById("product-type"));
  const unitSelect = /** @type {HTMLSelectElement} */ (document.getElementById("unit-selection"));
  const measurementMethodSelect = /** @type {HTMLSelectElement} */ (document.getElementById("measurement-method"));
  const productType = productTypeSelect.value;
  const unitSystem = /** @type {UnitSystem} */ (unitSelect.value);
  const measurementMethod = /** @type {MeasurementMethod} */ (measurementMethodSelect.value);

  // Handle single-size products
  if (noMeasurementProducts.includes(productType)) {
    return {
      size: "One Size",
      confidence: 100,
    };
  }

  // Handle footwear products
  if (footwearProducts.includes(productType)) {
    return {
      size: "Footwear",
      confidence: 100,
    };
  }

  // Check if measurement method is selected for fitAndChestProducts
  if (fitAndChestProducts.includes(productType) && !measurementMethod) {
    alert("Please select a measurement method (Easy or Accurate).");
    return null;
  }

  const requiredMeasurements = getRequiredMeasurements(productType, measurementMethod);

  // Get preference
  const preferenceInputs = document.querySelectorAll('input[name="preference"]');
  let preference = /** @type {FitPreference} */ ("regular");
  for (const input of preferenceInputs) {
    const radioInput = /** @type {HTMLInputElement} */ (input);
    if (radioInput.checked) {
      preference = /** @type {FitPreference} */ (radioInput.value);
      break;
    }
  }

  if (requiredMeasurements.length === 0) {
    alert("This product type does not require measurements.");
    return null;
  }

  // Get measurements in cm
  let heightCm = 0;
  let chestCm = 0;
  let waistCm = 0;
  let neckCm = 0;

  if (requiredMeasurements.includes("height")) {
    if (unitSystem === "metric") {
      const heightInput = /** @type {HTMLInputElement} */ (document.getElementById("height-cm"));
      heightCm = parseFloat(heightInput.value);
    } else {
      const feetInput = /** @type {HTMLInputElement} */ (document.getElementById("height-feet"));
      const inchesInput = /** @type {HTMLInputElement} */ (document.getElementById("height-inches"));
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
      const chestInput = /** @type {HTMLInputElement} */ (document.getElementById("chest-cm"));
      chestCm = parseFloat(chestInput.value);
    } else {
      const chestInchesInput = /** @type {HTMLInputElement} */ (document.getElementById("chest-inches"));
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
      const weightInput = /** @type {HTMLInputElement} */ (document.getElementById("weight-kg"));
      weightKg = parseFloat(weightInput.value);
    } else {
      const weightLbsInput = /** @type {HTMLInputElement} */ (document.getElementById("weight-lbs"));
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

    // Convert weight to chest size - pass preference for boundary handling
    chestCm = weightToChestSize(weightKg, preference);

    if (chestCm === -1) {
      alert("Unable to determine chest size from weight. Please try the Accurate method.");
      return null;
    }
  }

  if (requiredMeasurements.includes("waist")) {
    if (unitSystem === "metric") {
      const waistInput = /** @type {HTMLInputElement} */ (document.getElementById("waist-cm"));
      waistCm = parseFloat(waistInput.value);
    } else {
      const waistInchesInput = /** @type {HTMLInputElement} */ (document.getElementById("waist-inches"));
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
      const neckInput = /** @type {HTMLInputElement} */ (document.getElementById("neck-cm"));
      neckCm = parseFloat(neckInput.value);
    } else {
      const neckInchesInput = /** @type {HTMLInputElement} */ (document.getElementById("neck-inches"));
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

  // Calculate size based on product type
  if (fitAndChestProducts.includes(productType)) {
    return findFitAndChestSize(chestCm, heightCm, preference);
  } else if (waistProducts.includes(productType)) {
    return findWaistSize(waistCm, preference);
  } else if (shirtProducts.includes(productType)) {
    return findShirtSize(neckCm, preference);
  }

  return null;
}

/**
 * Display size result
 * @param {SizeResult} result
 */
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

// Initialize event listeners
document.addEventListener("DOMContentLoaded", () => {
  const productTypeSelect = /** @type {HTMLSelectElement} */ (document.getElementById("product-type"));
  const unitSelect = /** @type {HTMLSelectElement} */ (document.getElementById("unit-selection"));
  const measurementMethodSelect = /** @type {HTMLSelectElement} */ (document.getElementById("measurement-method"));
  const calculateBtn = /** @type {HTMLButtonElement} */ (document.getElementById("calculate-size-btn"));

  // Initial visibility update
  updateMeasurementMethodVisibility(productTypeSelect.value);
  updateFieldVisibility(productTypeSelect.value, /** @type {UnitSystem} */ (unitSelect.value), /** @type {MeasurementMethod} */ (measurementMethodSelect.value));

  // Update visibility on product type change
  productTypeSelect.addEventListener("change", () => {
    updateMeasurementMethodVisibility(productTypeSelect.value);
    updateFieldVisibility(productTypeSelect.value, /** @type {UnitSystem} */ (unitSelect.value), /** @type {MeasurementMethod} */ (measurementMethodSelect.value));
  });

  // Update visibility on unit system change
  unitSelect.addEventListener("change", () => {
    updateFieldVisibility(productTypeSelect.value, /** @type {UnitSystem} */ (unitSelect.value), /** @type {MeasurementMethod} */ (measurementMethodSelect.value));
  });

  // Update visibility on measurement method change
  measurementMethodSelect.addEventListener("change", () => {
    updateFieldVisibility(productTypeSelect.value, /** @type {UnitSystem} */ (unitSelect.value), /** @type {MeasurementMethod} */ (measurementMethodSelect.value));
  });

  // Calculate size on button click
  calculateBtn.addEventListener("click", () => {
    const result = calculateSize();
    if (result) {
      displayResult(result);
    }
  });
});
