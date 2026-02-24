import { useState } from 'react';
import { calcSetWeights, getEffective1RM } from '../lib/weights';
import { useApp } from '../contexts/AppContext';
import { getPhaseForWeek } from '../data/phases';
import { LIFTS } from '../data/exercises';
import { displayWeight, unitLabel, inputStep, barWeightInUnit } from '../lib/units';
import RPESlider from './RPESlider';
import RestTimer from './RestTimer';
import { PlateChips } from './PlateCalculator';

export default function StrengthLogger({ section, weekNumber, readinessMods, onComplete }) {
  const { data } = useApp();
  const { liftKey, sets, scheme, title, notes } = section;
  const unit = data.unit || 'kg';

  const effective1RM = getEffective1RM(liftKey, data.baseMaxes, data.adjustments);
  const phase = getPhaseForWeek(weekNumber);
  const lift = LIFTS[liftKey];

  // Apply readiness intensity delta if present
  const adjustedSets = readinessMods?.intensityDelta
    ? sets.map(s => ({ ...s, pct: Math.max(0.3, s.pct + readinessMods.intensityDelta / 100) }))
    : sets;

  // Apply volume multiplier — reduce number of sets
  const displaySets = readinessMods?.volumeMultiplier && readinessMods.volumeMultiplier < 1
    ? adjustedSets.slice(0, Math.max(1, Math.ceil(adjustedSets.length * readinessMods.volumeMultiplier)))
    : adjustedSets;

  const calculatedSets = calcSetWeights(effective1RM, displaySets);

  const [loggedSets, setLoggedSets] = useState(
    calculatedSets.map(s => ({ ...s, actualWeight: s.targetWeight, actualReps: s.reps, done: false }))
  );
  const [rpe, setRpe] = useState(null);
  const [showRestTimer, setShowRestTimer] = useState(false);

  const allDone = loggedSets.every(s => s.done);
  const restSeconds = data.restTimerDefaults?.strength || 120;
  const barWeightDisplay = barWeightInUnit(data.barWeight || 20, unit);

  // Display helpers
  const dw = (kg) => displayWeight(kg, unit);
  const ul = unitLabel(unit);
  const step = inputStep(unit);

  const updateSet = (idx, field, value) => {
    setLoggedSets(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const toggleSet = (idx) => {
    const wasUndone = !loggedSets[idx].done;
    setLoggedSets(prev => prev.map((s, i) => i === idx ? { ...s, done: !s.done } : s));

    // Show rest timer when completing a set (not the last one)
    if (wasUndone && idx < loggedSets.length - 1) {
      setShowRestTimer(true);
    }
  };

  const handleComplete = () => {
    if (rpe === null) return;
    onComplete?.({
      liftKey,
      sets: loggedSets.map(s => ({ weight: s.actualWeight, reps: s.actualReps })),
      rpe,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          <p className="text-sm text-slate-400">{scheme}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Effective 1RM</p>
          <p className="text-sm font-semibold text-slate-300">{dw(effective1RM)} {ul}</p>
        </div>
      </div>

      {notes && <p className="text-xs text-slate-500 italic">{notes}</p>}

      {readinessMods && readinessMods.intensityPct < 100 && (
        <div className="flex items-center gap-2 rounded-lg p-2 border" style={{ backgroundColor: readinessMods.color + '11', borderColor: readinessMods.color + '22' }}>
          <span className="text-sm">{readinessMods.emoji}</span>
          <p className="text-[10px] font-medium" style={{ color: readinessMods.color }}>
            {readinessMods.intensityPct}% intensity
            {readinessMods.volumeMultiplier < 1 ? ` · ${displaySets.length}/${sets.length} sets` : ''}
          </p>
        </div>
      )}

      {showRestTimer && (
        <RestTimer
          seconds={restSeconds}
          onDismiss={() => setShowRestTimer(false)}
          onComplete={() => {}}
        />
      )}

      <div className="space-y-2">
        {loggedSets.map((s, i) => (
          <div key={i}>
            <div className={`flex items-center gap-2 p-3 rounded-lg ${s.done ? 'bg-emerald-950/30 border border-emerald-800/30' : 'bg-slate-800'}`}>
              <button
                onClick={() => toggleSet(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-emerald-600' : 'bg-slate-700'}`}
              >
                {s.done ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs text-slate-400">{s.set}</span>
                )}
              </button>

              <div className="flex-1 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={dw(s.actualWeight)}
                    onChange={e => {
                      const val = Number(e.target.value);
                      // Convert back to kg for internal storage
                      updateSet(i, 'actualWeight', unit === 'lbs' ? val / 2.20462 : val);
                    }}
                    className="w-16 bg-slate-700 text-center text-sm font-mono rounded-lg py-1.5 text-slate-100"
                    step={step}
                  />
                  <span className="text-xs text-slate-500">{ul}</span>
                </div>
                <span className="text-slate-600">x</span>
                <input
                  type="number"
                  value={s.actualReps}
                  onChange={e => updateSet(i, 'actualReps', Number(e.target.value))}
                  className="w-12 bg-slate-700 text-center text-sm font-mono rounded-lg py-1.5 text-slate-100"
                />
              </div>

              <span className="text-[10px] text-slate-600 w-10 text-right">
                {Math.round(s.pct * 100)}%
              </span>
            </div>

            {/* Inline plate chips — updates live with weight */}
            <div className="mt-1 ml-11">
              <PlateChips
                weight={dw(s.actualWeight)}
                unit={unit}
                barWeight={barWeightDisplay}
              />
            </div>
          </div>
        ))}
      </div>

      {allDone && !showRestTimer && (
        <div className="space-y-3 pt-2">
          <RPESlider value={rpe || 7} onChange={setRpe} targetRPE={phase.targetRPE} />
          <button
            onClick={handleComplete}
            disabled={rpe === null}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold text-lg disabled:opacity-40 active:bg-emerald-700"
          >
            Log Strength
          </button>
        </div>
      )}
    </div>
  );
}
