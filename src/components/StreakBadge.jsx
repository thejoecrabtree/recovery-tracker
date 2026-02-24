import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { calculateStreaks, getCurrentWeekProgress } from '../lib/streaks';

/**
 * Compact streak badge for the Today view.
 * Shows current streak, fire emoji, and week progress dots.
 */
export default function StreakBadge() {
  const { data } = useApp();

  const streaks = useMemo(
    () => calculateStreaks(data.workoutLogs, data.startDate),
    [data.workoutLogs, data.startDate]
  );

  const weekProgress = useMemo(
    () => getCurrentWeekProgress(data.workoutLogs, data.startDate),
    [data.workoutLogs, data.startDate]
  );

  if (!data.startDate) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
      {/* Streak row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{streaks.current >= 3 ? '\u{1F525}' : streaks.current > 0 ? '\u{26A1}' : '\u{1F4AA}'}</span>
          <div>
            <p className="text-sm font-bold text-slate-100">
              {streaks.current > 0 ? `${streaks.current} workout streak` : 'No active streak'}
            </p>
            <p className="text-[10px] text-slate-500">
              {streaks.total} total | {streaks.longest} best streak
            </p>
          </div>
        </div>

        {streaks.current >= 3 && (
          <div className="bg-amber-500/10 rounded-full px-2.5 py-1">
            <span className="text-xs font-bold text-amber-400">{streaks.current}</span>
          </div>
        )}
      </div>

      {/* Week progress dots */}
      {weekProgress && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-500 font-medium">Week {weekProgress.weekNumber}</p>
            <p className="text-[10px] text-slate-500">
              {weekProgress.completed}/{weekProgress.scheduled} workouts
              {weekProgress.pct > 0 && <span className="text-emerald-500 ml-1">{weekProgress.pct}%</span>}
            </p>
          </div>

          <div className="flex gap-1">
            {weekProgress.days.map((day, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-full h-2 rounded-full ${
                    day.isCompleted
                      ? 'bg-emerald-500'
                      : day.isToday
                      ? 'bg-amber-500 animate-pulse'
                      : day.isRest
                      ? 'bg-slate-800'
                      : day.isPast
                      ? 'bg-red-900/50'
                      : 'bg-slate-800'
                  }`}
                />
                <span className="text-[8px] text-slate-600">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Minimal inline streak for use in headers.
 */
export function InlineStreak() {
  const { data } = useApp();

  const streaks = useMemo(
    () => calculateStreaks(data.workoutLogs, data.startDate),
    [data.workoutLogs, data.startDate]
  );

  if (!data.startDate || streaks.current === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-semibold">
      {streaks.current >= 3 ? '\u{1F525}' : '\u{26A1}'} {streaks.current}
    </span>
  );
}
