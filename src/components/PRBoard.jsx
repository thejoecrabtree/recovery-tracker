import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { LIFTS } from '../data/exercises';
import { detectPRs, estimated1RM } from '../lib/records';
import { displayWeight, unitLabel } from '../lib/units';

export default function PRBoard() {
  const { data } = useApp();
  const unit = data.unit || 'kg';
  const ul = unitLabel(unit);
  const dw = (kg) => displayWeight(kg, unit);

  const allPRs = useMemo(() => detectPRs(data.workoutLogs), [data.workoutLogs]);

  const liftEntries = Object.entries(LIFTS).map(([key, lift]) => ({
    key,
    lift,
    prs: allPRs[key] || {},
  }));

  const hasPRs = liftEntries.some(e => Object.keys(e.prs).length > 0);

  return (
    <div className="space-y-4">
      {!hasPRs ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">{'\u{1F3CB}\u{FE0F}'}</p>
          <p className="text-slate-400">No PRs logged yet.</p>
          <p className="text-xs text-slate-600 mt-1">Complete workouts to track your records.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {liftEntries.map(({ key, lift, prs }) => {
            const prList = Object.entries(prs).sort((a, b) => b[1].weight - a[1].weight);
            if (prList.length === 0) return null;

            const topPR = prList[0][1];
            const est1RM = topPR.reps > 1 ? estimated1RM(topPR.weight, topPR.reps) : topPR.weight;

            return (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200">{lift.name}</h3>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">{dw(topPR.weight)}{ul}</p>
                    <p className="text-[10px] text-slate-500">
                      {topPR.reps === 1 ? '1RM' : `${topPR.reps}RM (est. 1RM: ${dw(est1RM)}${ul})`}
                    </p>
                  </div>
                </div>

                {/* All rep maxes */}
                <div className="flex flex-wrap gap-2">
                  {prList.map(([repKey, pr]) => (
                    <div key={repKey} className="bg-slate-800 rounded-lg px-3 py-1.5 text-center">
                      <p className="text-xs font-mono font-bold text-slate-200">{dw(pr.weight)}{ul}</p>
                      <p className="text-[9px] text-slate-500">{pr.reps}RM</p>
                    </div>
                  ))}
                </div>

                {/* When & where */}
                {topPR.date && (
                  <p className="text-[10px] text-slate-600">
                    Set on {new Date(topPR.date + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {topPR.weekNumber && ` (Week ${topPR.weekNumber})`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
