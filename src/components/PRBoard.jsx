import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { LIFTS } from '../data/exercises';
import { detectPRs, estimated1RM, getBestEstimated1RM, detectVolumeRecords } from '../lib/records';
import { displayWeight, unitLabel } from '../lib/units';

export default function PRBoard() {
  const { data } = useApp();
  const unit = data.unit || 'kg';
  const ul = unitLabel(unit);
  const dw = (kg) => displayWeight(kg, unit);

  const allPRs = useMemo(() => detectPRs(data.workoutLogs), [data.workoutLogs]);
  const volumeRecords = useMemo(() => detectVolumeRecords(data.workoutLogs), [data.workoutLogs]);

  const liftEntries = Object.entries(LIFTS).map(([key, lift]) => ({
    key,
    lift,
    prs: allPRs[key] || {},
    volume: volumeRecords[key] || null,
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
          {liftEntries.map(({ key, lift, prs, volume }) => {
            const prList = Object.entries(prs).sort((a, b) => a[1].reps - b[1].reps);
            if (prList.length === 0) return null;

            const heaviest1RM = prs['1rm'];
            const bestEst = getBestEstimated1RM(prs);

            return (
              <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-200">{lift.name}</h3>

                {/* Key stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Heaviest single */}
                  <div className="bg-slate-800 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-emerald-400">
                      {heaviest1RM ? `${dw(heaviest1RM.weight)}` : '--'}
                    </p>
                    <p className="text-[9px] text-slate-500">Heaviest 1RM</p>
                  </div>

                  {/* Best estimated 1RM */}
                  <div className="bg-slate-800 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-blue-400">
                      {bestEst ? `${dw(bestEst.estimated)}` : '--'}
                    </p>
                    <p className="text-[9px] text-slate-500">Est. 1RM</p>
                  </div>

                  {/* Best volume */}
                  <div className="bg-slate-800 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-amber-400">
                      {volume ? `${dw(volume.totalVolume)}` : '--'}
                    </p>
                    <p className="text-[9px] text-slate-500">Best Vol.</p>
                  </div>
                </div>

                {/* Unit labels */}
                <div className="grid grid-cols-3 gap-2 -mt-2">
                  <p className="text-center text-[8px] text-slate-600">{ul}</p>
                  <p className="text-center text-[8px] text-slate-600">{ul}</p>
                  <p className="text-center text-[8px] text-slate-600">{ul}</p>
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

                {/* Volume record detail */}
                {volume && (
                  <p className="text-[10px] text-slate-600">
                    Best volume: {volume.sets} sets, {dw(volume.totalVolume)}{ul} total
                    {volume.date && ` — ${new Date(volume.date + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                    {volume.weekNumber && ` (Wk ${volume.weekNumber})`}
                  </p>
                )}

                {/* Most recent PR date */}
                {prList.length > 0 && (() => {
                  const mostRecent = prList.reduce((latest, [, pr]) =>
                    !latest || (pr.date && pr.date > latest.date) ? pr : latest, null);
                  return mostRecent?.date ? (
                    <p className="text-[10px] text-slate-600">
                      Latest PR: {new Date(mostRecent.date + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {mostRecent.weekNumber && ` (Week ${mostRecent.weekNumber})`}
                    </p>
                  ) : null;
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
