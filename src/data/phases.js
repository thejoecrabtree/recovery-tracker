export const PHASES = {
  1: { weeks: [1, 2, 3, 4],     targetRPE: [6, 7], label: 'Base Building',   color: '#22c55e', injuryNote: 'ZERO IMPACT — No running, jumping, box jumps, burpees, double-unders' },
  2: { weeks: [5, 6, 7, 8],     targetRPE: [7, 8], label: 'Strength',        color: '#f59e0b', injuryNote: 'GRADUAL RETURN — Walking, step-ups, light sled, hang Olympic lifts' },
  3: { weeks: [9, 10, 11, 12],  targetRPE: [8, 9], label: 'Peak & Test',     color: '#ef4444', injuryNote: 'FULL RETURN — Running, box jumps, double-unders by Week 11' },
};

export function getPhaseForWeek(weekNumber) {
  if (weekNumber <= 4) return { ...PHASES[1], number: 1 };
  if (weekNumber <= 8) return { ...PHASES[2], number: 2 };
  return { ...PHASES[3], number: 3 };
}
