// Personal Records detection and management.
// Scans workout logs for the heaviest weight lifted per lift at each rep count.

export function detectPRs(workoutLogs) {
  const prs = {};

  for (const [date, log] of Object.entries(workoutLogs)) {
    if (!log.sections) continue;
    for (const section of Object.values(log.sections)) {
      if (!section.liftKey || !section.sets) continue;
      const { liftKey } = section;

      if (!prs[liftKey]) prs[liftKey] = {};

      for (const set of section.sets) {
        const { weight, reps } = set;
        if (!weight || !reps) continue;

        const key = `${reps}rm`;
        if (!prs[liftKey][key] || weight > prs[liftKey][key].weight) {
          prs[liftKey][key] = {
            weight,
            reps,
            date,
            weekNumber: log.weekNumber,
          };
        }
      }
    }
  }

  return prs;
}

export function checkForNewPRs(existingPRs, sectionData) {
  if (!sectionData?.liftKey || !sectionData?.sets) return [];

  const { liftKey, sets } = sectionData;
  const newPRs = [];

  for (const set of sets) {
    const { weight, reps } = set;
    if (!weight || !reps) continue;

    const key = `${reps}rm`;
    const current = existingPRs?.[liftKey]?.[key];

    if (!current || weight > current.weight) {
      newPRs.push({ liftKey, key, weight, reps });
    }
  }

  return newPRs;
}

export function getBestPR(prMap) {
  // Returns the heaviest single lift across all rep ranges for a given lift
  if (!prMap) return null;
  let best = null;
  for (const pr of Object.values(prMap)) {
    if (!best || pr.weight > best.weight) best = pr;
  }
  return best;
}

// Estimated 1RM using Epley formula: weight * (1 + reps/30)
export function estimated1RM(weight, reps) {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 2) / 2; // round to 0.5
}
