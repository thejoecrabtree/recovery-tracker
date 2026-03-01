// Workout streak and consistency tracking.
// Calculates current streak, longest streak, and weekly consistency.

import { PROGRAM } from '../data/program';
import { toISODate, dateFromISO, getDateForProgramDay, getProgramDay } from './dates';

/**
 * Get all scheduled (non-rest) workout dates for the program.
 */
function getScheduledDates(startDate) {
  if (!startDate) return [];
  const dates = [];
  for (let w = 0; w < PROGRAM.weeks.length; w++) {
    const week = PROGRAM.weeks[w];
    if (!week?.days) continue;
    for (let d = 0; d < week.days.length; d++) {
      const day = week.days[d];
      if (day && !day.isRestDay) {
        const date = getDateForProgramDay(startDate, w + 1, d);
        dates.push(toISODate(date));
      }
    }
  }
  return dates;
}

/**
 * Calculate workout streaks.
 * A "streak" is consecutive scheduled workouts that were completed.
 * @returns {{ current: number, longest: number, total: number }}
 */
export function calculateStreaks(workoutLogs, startDate) {
  if (!startDate) return { current: 0, longest: 0, total: 0 };

  const scheduled = getScheduledDates(startDate);
  const todayISO = toISODate(new Date());
  const total = Object.keys(workoutLogs).length;

  // Filter to scheduled dates up to today
  const pastScheduled = scheduled.filter(d => d <= todayISO);

  if (pastScheduled.length === 0) return { current: 0, longest: 0, total };

  // Calculate longest streak
  let longest = 0;
  let currentRun = 0;

  for (const date of pastScheduled) {
    if (workoutLogs[date]) {
      currentRun++;
      longest = Math.max(longest, currentRun);
    } else {
      currentRun = 0;
    }
  }

  // Current streak: count backwards from most recent scheduled date
  let current = 0;
  for (let i = pastScheduled.length - 1; i >= 0; i--) {
    const date = pastScheduled[i];
    // Skip today if it hasn't been completed yet (still has a chance)
    if (date === todayISO && !workoutLogs[date]) continue;
    if (workoutLogs[date]) {
      current++;
    } else {
      break;
    }
  }

  return { current, longest, total };
}

/**
 * Calculate weekly consistency (% of scheduled workouts completed per week).
 * Returns array of { weekNumber, completed, scheduled, pct }.
 */
export function getWeeklyConsistency(workoutLogs, startDate) {
  if (!startDate) return [];

  const weeks = [];
  const todayISO = toISODate(new Date());

  for (let w = 0; w < PROGRAM.weeks.length; w++) {
    const week = PROGRAM.weeks[w];
    if (!week?.days) continue;

    let scheduled = 0;
    let completed = 0;

    for (let d = 0; d < week.days.length; d++) {
      const day = week.days[d];
      if (day && !day.isRestDay) {
        const date = toISODate(getDateForProgramDay(startDate, w + 1, d));
        if (date > todayISO) continue; // Future — don't count
        scheduled++;
        if (workoutLogs[date]) completed++;
      }
    }

    if (scheduled > 0) {
      weeks.push({
        weekNumber: w + 1,
        completed,
        scheduled,
        pct: Math.round((completed / scheduled) * 100),
      });
    }
  }

  return weeks;
}

/**
 * Get the current week's progress.
 */
export function getCurrentWeekProgress(workoutLogs, startDate) {
  if (!startDate) return null;

  const today = new Date();
  const todayISO = toISODate(today);

  const prog = getProgramDay(startDate, today);
  if (!prog?.started || prog.finished) return null;

  const weekNumber = prog.weekNumber;
  const week = PROGRAM.weeks[weekNumber - 1];
  if (!week?.days) return null;

  let scheduled = 0;
  let completed = 0;
  const days = [];

  for (let d = 0; d < week.days.length; d++) {
    const day = week.days[d];
    const date = toISODate(getDateForProgramDay(startDate, weekNumber, d));
    const isScheduled = day && !day.isRestDay;
    const isCompleted = !!workoutLogs[date];
    const isPast = date <= todayISO;

    if (isScheduled) {
      scheduled++;
      if (isCompleted) completed++;
    }

    days.push({
      dayIndex: d,
      date,
      isRest: day?.isRestDay || !day,
      isScheduled,
      isCompleted,
      isPast,
      isToday: date === todayISO,
      label: day?.label || 'Rest',
    });
  }

  return {
    weekNumber,
    scheduled,
    completed,
    pct: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
    days,
  };
}
