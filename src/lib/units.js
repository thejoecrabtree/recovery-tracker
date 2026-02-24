// Unit conversion utilities — all internal storage is in kg.
// Display converts to user's preferred unit.

export const KG_TO_LBS = 2.20462;
export const LBS_TO_KG = 1 / KG_TO_LBS;

export function kgToLbs(kg) {
  return kg * KG_TO_LBS;
}

export function lbsToKg(lbs) {
  return lbs * LBS_TO_KG;
}

/**
 * Convert kg value to display value in chosen unit.
 * Rounds to nearest plate increment (2.5kg or 5lbs).
 */
export function displayWeight(kg, unit = 'kg') {
  if (unit === 'lbs') {
    return Math.round(kgToLbs(kg) / 5) * 5; // round to nearest 5 lbs
  }
  return kg;
}

/**
 * Convert kg value to display value without rounding — for body weight, etc.
 */
export function displayWeightExact(kg, unit = 'kg', decimals = 1) {
  if (unit === 'lbs') {
    return Number(kgToLbs(kg).toFixed(decimals));
  }
  return Number(kg.toFixed(decimals));
}

/**
 * Format weight with unit label.
 */
export function formatWeight(kg, unit = 'kg') {
  const val = displayWeight(kg, unit);
  return `${val}${unit}`;
}

/**
 * Convert user input in their unit back to kg for storage.
 */
export function inputToKg(value, unit = 'kg') {
  if (unit === 'lbs') return lbsToKg(value);
  return value;
}

/**
 * Get the base increment for +/- buttons.
 */
export function getIncrement(unit = 'kg') {
  return unit === 'lbs' ? 5 : 2.5;
}

/**
 * Round a value to the correct plate increment for the unit.
 */
export function roundToIncrement(value, unit = 'kg') {
  if (unit === 'lbs') return Math.round(value / 5) * 5;
  return Math.round(value / 2.5) * 2.5;
}

/**
 * Get the unit label string.
 */
export function unitLabel(unit = 'kg') {
  return unit === 'lbs' ? 'lbs' : 'kg';
}

/**
 * Get the step value for number inputs.
 */
export function inputStep(unit = 'kg') {
  return unit === 'lbs' ? 5 : 2.5;
}

/**
 * For body weight inputs — finer granularity.
 */
export function bodyWeightStep(unit = 'kg') {
  return unit === 'lbs' ? 0.5 : 0.1;
}

/**
 * Convert bar weight (stored in kg) to display unit.
 * Uses lookup — Rogue bars are 45/35 lbs, not exact metric conversions.
 */
export function barWeightInUnit(barWeightKg, unit = 'kg') {
  if (unit === 'lbs') return barWeightKg === 15 ? 35 : 45;
  return barWeightKg;
}
