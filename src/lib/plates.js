// Plate calculator — calculates plates needed per side of the barbell.
// Supports both lbs and kg plate sets.

const PLATE_SETS = {
  lbs: {
    bar: 45,
    plates: [45, 35, 25, 10, 5, 2.5],
    colors: {
      45: '#ef4444',  // red
      35: '#3b82f6',  // blue
      25: '#22c55e',  // green
      10: '#f59e0b',  // amber
      5: '#8b5cf6',   // purple
      2.5: '#94a3b8',  // slate
    },
  },
  kg: {
    bar: 20,
    plates: [25, 20, 15, 10, 5, 2.5, 1.25],
    colors: {
      25: '#ef4444',  // red
      20: '#3b82f6',  // blue
      15: '#f59e0b',  // amber
      10: '#22c55e',  // green
      5: '#f1f5f9',   // white
      2.5: '#ef4444', // red (small)
      1.25: '#94a3b8', // slate
    },
  },
};

/**
 * Calculate plates needed per side for a given total weight.
 * @param {number} totalWeight - Total barbell weight (in the unit specified)
 * @param {string} unit - 'kg' or 'lbs'
 * @param {number|null} barWeightOverride - Custom bar weight in display unit (e.g. 35 for women's bar in lbs)
 * @returns {{ bar: number, perSide: number[], totalLoaded: number, unit: string }}
 */
export function calculatePlates(totalWeight, unit = 'lbs', barWeightOverride = null) {
  const config = PLATE_SETS[unit] || PLATE_SETS.lbs;
  const bar = barWeightOverride != null ? barWeightOverride : config.bar;
  const { plates } = config;

  if (totalWeight <= bar) {
    return { bar, perSide: [], totalLoaded: bar, unit, remainder: 0 };
  }

  let remaining = (totalWeight - bar) / 2;
  const perSide = [];

  for (const plate of plates) {
    while (remaining >= plate - 0.001) { // tiny epsilon for float issues
      perSide.push(plate);
      remaining -= plate;
    }
  }

  const loadedPerSide = perSide.reduce((sum, p) => sum + p, 0);
  const totalLoaded = bar + loadedPerSide * 2;

  return {
    bar,
    perSide,
    totalLoaded,
    unit,
    remainder: Math.round(remaining * 100) / 100,
  };
}

/**
 * Get the color for a plate weight.
 */
export function getPlateColor(weight, unit = 'lbs') {
  return PLATE_SETS[unit]?.colors[weight] || '#94a3b8';
}

/**
 * Get the plate set configuration.
 */
export function getPlateConfig(unit = 'lbs') {
  return PLATE_SETS[unit] || PLATE_SETS.lbs;
}

/**
 * Get plate height as a percentage (visual sizing).
 */
export function getPlateHeight(weight, unit = 'lbs') {
  if (unit === 'lbs') {
    if (weight >= 45) return 100;
    if (weight >= 35) return 85;
    if (weight >= 25) return 75;
    if (weight >= 10) return 55;
    if (weight >= 5) return 40;
    return 30;
  }
  // kg
  if (weight >= 25) return 100;
  if (weight >= 20) return 90;
  if (weight >= 15) return 80;
  if (weight >= 10) return 65;
  if (weight >= 5) return 50;
  if (weight >= 2.5) return 40;
  return 30;
}

/**
 * Get plate width (visual thickness).
 */
export function getPlateWidth(weight, unit = 'lbs') {
  if (unit === 'lbs') {
    if (weight >= 25) return 14;
    if (weight >= 10) return 10;
    return 7;
  }
  if (weight >= 15) return 14;
  if (weight >= 5) return 10;
  return 7;
}
