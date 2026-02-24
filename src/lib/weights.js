const MAX_ADJUSTMENT = 15; // kg cap in either direction

export function roundToPlate(kg) {
  return Math.round(kg / 2.5) * 2.5;
}

export function getEffective1RM(liftKey, baseMaxes, adjustments) {
  const base = baseMaxes[liftKey] || 0;
  const adj = adjustments[liftKey] || 0;
  return base + adj;
}

export function calcWeight(effective1RM, percentage) {
  return roundToPlate(effective1RM * percentage);
}

export function calcSetWeights(effective1RM, sets) {
  return sets.map(s => ({
    ...s,
    targetWeight: calcWeight(effective1RM, s.pct),
  }));
}

export function calculateRPEAdjustment(reportedRPE, targetRPE) {
  const [targetLow, targetHigh] = targetRPE;

  if (reportedRPE <= targetLow - 1) {
    return {
      delta: 2.5,
      reason: `RPE ${reportedRPE} below target ${targetLow}-${targetHigh} — bumping +2.5kg`,
    };
  }

  if (reportedRPE >= targetHigh + 1) {
    return {
      delta: -2.5,
      reason: `RPE ${reportedRPE} above target ${targetLow}-${targetHigh} — dropping -2.5kg`,
    };
  }

  return { delta: 0, reason: null };
}

export function applyAdjustment(adjustments, liftKey, delta) {
  const current = adjustments[liftKey] || 0;
  const clamped = Math.max(-MAX_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, current + delta));
  return { ...adjustments, [liftKey]: clamped };
}
