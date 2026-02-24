import { useState } from 'react';
import { calcSetWeights, getEffective1RM } from '../lib/weights';
import { useApp } from '../contexts/AppContext';
import { getPhaseForWeek } from '../data/phases';
import { LIFTS } from '../data/exercises';
import RPESlider from './RPESlider';

export default function StrengthLogger({ section, weekNumber, onComplete }) {
  const { data } = useApp();
  const { liftKey, sets, scheme, title, notes } = section;

  const effective1RM = getEffective1RM(liftKey, data.baseMaxes, data.adjustments);
  const phase = getPhaseForWeek(weekNumber);
  const lift = LIFTS[liftKey];
  const calculatedSets = calcSetWeights(effective1RM, sets);

  const [loggedSets, setLoggedSets] = useState(
    calculatedSets.map(s => ({ ...s, actualWeight: s.targetWeight, actualReps: s.reps, done: false }))
  );
  const [rpe, setRpe] = useState(null);
  const allDone = loggedSets.every(s => s.done);

  const updateSet = (idx, field, value) => {
    setLoggedSets(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const toggleSet = (idx) => {
    setLoggedSets(prev => prev.map((s, i) => i === idx ? { ...s, done: !s.done } : s));
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
          <p className="text-sm font-semibold text-slate-300">{effective1RM} {lift?.unit}</p>
        </div>
      </div>

      {notes && <p className="text-xs text-slate-500 italic">{notes}</p>}

      <div className="space-y-2">
        {loggedSets.map((s, i) => (
          <div key={i} className={`flex items-center gap-2 p-3 rounded-lg ${s.done ? 'bg-emerald-950/30 border border-emerald-800/30' : 'bg-slate-800'}`}>
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
                  value={s.actualWeight}
                  onChange={e => updateSet(i, 'actualWeight', Number(e.target.value))}
                  className="w-16 bg-slate-700 text-center text-sm font-mono rounded-lg py-1.5 text-slate-100"
                  step={2.5}
                />
                <span className="text-xs text-slate-500">kg</span>
              </div>
              <span className="text-slate-600">x</span>
              <input
                type="number"
                value={s.actualReps}
                onChange={e => updateSet(i, 'actualReps', Number(e.target.value))}
                className="w-12 bg-slate-700 text-center text-sm font-mono rounded-lg py-1.5 text-slate-100"
              />
            </div>

            <span className="text-[10px] text-slate-600 w-10 text-right">{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>

      {allDone && (
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
