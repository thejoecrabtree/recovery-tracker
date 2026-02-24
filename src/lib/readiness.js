// Readiness scoring and workout modification engine.
// Manual input: sleep (1-5), soreness (1-5), mood (1-5) → composite 1-10.
// Whoop input: recovery score (0-100) → mapped to 1-10.

export function calculateReadinessScore({ sleep, soreness, mood }) {
  // Each input is 1-5. Soreness is inverted (5 = very sore = bad).
  const sleepNorm = (sleep - 1) / 4;        // 0-1 (higher = better)
  const sorenessNorm = (5 - soreness) / 4;   // 0-1 (higher = less sore = better)
  const moodNorm = (mood - 1) / 4;           // 0-1 (higher = better)

  // Weighted average — sleep has highest impact
  const composite = sleepNorm * 0.4 + sorenessNorm * 0.35 + moodNorm * 0.25;
  return Math.round(composite * 9) + 1; // 1-10 scale
}

export function whoopRecoveryToReadiness(recoveryPct) {
  // Whoop recovery: 0-100% → map to 1-10
  return Math.max(1, Math.min(10, Math.round(recoveryPct / 10)));
}

export function getWorkoutModifications(readinessScore) {
  if (readinessScore >= 8) {
    return {
      volumeMultiplier: 1.0,
      intensityPct: 100,
      intensityDelta: 0,
      metconScale: 'rx',
      skipAccessory: false,
      activeRecoveryOnly: false,
      label: 'Full Send',
      emoji: '\u{1F7E2}',
      color: '#22c55e',
      description: 'You\'re recovered and ready. Hit it hard today.',
    };
  }
  if (readinessScore >= 5) {
    return {
      volumeMultiplier: 1.0,
      intensityPct: 100,
      intensityDelta: 0,
      metconScale: 'rx',
      skipAccessory: false,
      activeRecoveryOnly: false,
      label: 'Normal',
      emoji: '\u{1F7E1}',
      color: '#f59e0b',
      description: 'Feeling okay. Follow the program as written.',
    };
  }
  if (readinessScore >= 3) {
    return {
      volumeMultiplier: 0.75,
      intensityPct: 80,
      intensityDelta: -5,
      metconScale: 'scaled',
      skipAccessory: true,
      activeRecoveryOnly: false,
      label: 'Light Day',
      emoji: '\u{1F7E0}',
      color: '#f97316',
      description: 'Reducing to 80% intensity. Accessory work optional.',
    };
  }
  return {
    volumeMultiplier: 0.5,
    intensityPct: 60,
    intensityDelta: -10,
    metconScale: 'scaled',
    skipAccessory: true,
    activeRecoveryOnly: true,
    label: 'Active Recovery',
    emoji: '\u{1F534}',
    color: '#ef4444',
    description: 'Warmup + rehab only. Skip strength & metcon today.',
  };
}

export const READINESS_LABELS = {
  sleep: ['Terrible', 'Poor', 'Okay', 'Good', 'Great'],
  soreness: ['None', 'Mild', 'Moderate', 'Heavy', 'Severe'],
  mood: ['Low', 'Meh', 'Okay', 'Good', 'Great'],
};
