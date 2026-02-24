import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { PROGRAM } from '../data/program';
import { LIFTS } from '../data/exercises';
import { toISODate, getDateForProgramDay, dateFromISO } from '../lib/dates';
import { getPhaseForWeek } from '../data/phases';
import { displayWeight, unitLabel } from '../lib/units';
import { getWeeklyConsistency } from '../lib/streaks';
import { getWorkoutModifications } from '../lib/readiness';

/**
 * Weekly summary card — shows recap of the most recent completed week.
 * Includes: workouts completed, volume, metcons, readiness avg, PRs.
 */
export default function WeeklySummary() {
  const { data } = useApp();
  const unit = data.unit || 'kg';

  const summary = useMemo(() => {
    if (!data.startDate) return null;

    const today = new Date();
    const todayISO = toISODate(today);
    const start = dateFromISO(data.startDate);
    const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || diffDays >= 84) return null;

    const currentWeek = Math.floor(diffDays / 7) + 1;
    // Show previous week if we're past day 1, otherwise show current
    const targetWeek = (diffDays % 7) >= 1 && currentWeek > 1 ? currentWeek - 1 : currentWeek;

    const week = PROGRAM.weeks[targetWeek - 1];
    if (!week?.days) return null;

    let completedCount = 0;
    let scheduledCount = 0;
    let totalVolume = 0; // kg
    let metconsCompleted = 0;
    let readinessScores = [];
    const prCount = 0;

    for (let d = 0; d < week.days.length; d++) {
      const day = week.days[d];
      const dateISO = toISODate(getDateForProgramDay(data.startDate, targetWeek, d));

      if (day && !day.isRestDay) {
        scheduledCount++;
        const log = data.workoutLogs[dateISO];
        if (log) {
          completedCount++;

          // Count metcons
          if (day.sections?.some(s => s.type === 'metcon')) {
            metconsCompleted++;
          }

          // Sum logged volume
          if (log.sections) {
            Object.values(log.sections).forEach(s => {
              if (s?.sets) {
                s.sets.forEach(set => {
                  totalVolume += (set.weight || 0) * (set.reps || 0);
                });
              }
            });
          }
        }
      }

      // Readiness
      const readiness = data.readiness?.[dateISO];
      if (readiness) readinessScores.push(readiness.score);
    }

    const avgReadiness = readinessScores.length > 0
      ? Math.round(readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length * 10) / 10
      : null;

    const phase = getPhaseForWeek(targetWeek);
    const pct = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

    return {
      weekNumber: targetWeek,
      completedCount,
      scheduledCount,
      pct,
      totalVolume,
      metconsCompleted,
      avgReadiness,
      phase,
      isCurrent: targetWeek === currentWeek,
    };
  }, [data]);

  if (!summary) return null;

  const readinessMods = summary.avgReadiness ? getWorkoutModifications(summary.avgReadiness) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
            {summary.isCurrent ? 'This Week' : 'Last Week'}
          </p>
          <p className="text-sm font-bold text-slate-100">Week {summary.weekNumber} Summary</p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
          backgroundColor: summary.phase.color + '22',
          color: summary.phase.color,
        }}>
          {summary.phase.label}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <MiniStat
          label="Workouts"
          value={`${summary.completedCount}/${summary.scheduledCount}`}
          color={summary.pct === 100 ? '#22c55e' : summary.pct >= 75 ? '#f59e0b' : '#ef4444'}
        />
        <MiniStat
          label="Volume"
          value={summary.totalVolume > 0 ? `${displayWeight(summary.totalVolume / 1000, unit).toFixed?.(1) || Math.round(displayWeight(summary.totalVolume / 1000, unit))}t` : '—'}
          color="#3b82f6"
        />
        <MiniStat
          label="Metcons"
          value={summary.metconsCompleted}
          color="#8b5cf6"
        />
        <MiniStat
          label="Readiness"
          value={summary.avgReadiness ? `${summary.avgReadiness}` : '—'}
          color={readinessMods?.color || '#94a3b8'}
        />
      </div>

      {/* Consistency bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-500">Consistency</span>
          <span className="text-[10px] font-bold" style={{
            color: summary.pct === 100 ? '#22c55e' : summary.pct >= 75 ? '#f59e0b' : '#ef4444',
          }}>{summary.pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${summary.pct}%`,
              backgroundColor: summary.pct === 100 ? '#22c55e' : summary.pct >= 75 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
      <p className="text-[9px] text-slate-600">{label}</p>
    </div>
  );
}

/**
 * Consistency chart for the Progress view — shows all weeks.
 */
export function ConsistencyChart() {
  const { data } = useApp();

  const weeks = useMemo(
    () => getWeeklyConsistency(data.workoutLogs, data.startDate),
    [data.workoutLogs, data.startDate]
  );

  if (weeks.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-bold text-slate-200">Weekly Consistency</h3>

      <div className="flex gap-1 items-end h-20">
        {weeks.map(w => {
          const color = w.pct === 100 ? '#22c55e' : w.pct >= 75 ? '#f59e0b' : w.pct > 0 ? '#ef4444' : '#1e293b';
          return (
            <div key={w.weekNumber} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[8px] text-slate-600">{w.pct}%</span>
              <div
                className="w-full rounded-t"
                style={{ height: `${Math.max(w.pct, 4)}%`, backgroundColor: color, minHeight: '4px' }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[9px] text-slate-600">
        <span>W{weeks[0]?.weekNumber}</span>
        <span>W{weeks[weeks.length - 1]?.weekNumber}</span>
      </div>
    </div>
  );
}
