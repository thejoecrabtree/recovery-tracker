export function getProgramDay(startDate, today = new Date()) {
  if (!startDate) return null;

  const start = new Date(startDate + 'T00:00:00');
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = now - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { started: false, daysUntilStart: -diffDays, weekNumber: 0, dayIndex: 0 };
  }

  const weekNumber = Math.floor(diffDays / 7) + 1;
  const dayIndex = diffDays % 7; // 0=Mon, 1=Tue, ..., 6=Sun

  if (weekNumber > 12) {
    return { finished: true, weekNumber, dayIndex };
  }

  return { started: true, finished: false, weekNumber, dayIndex };
}

export function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateFromISO(str) {
  return new Date(str + 'T00:00:00');
}

export function getDateForProgramDay(startDate, weekNumber, dayIndex) {
  const start = new Date(startDate + 'T00:00:00');
  const dayOffset = (weekNumber - 1) * 7 + dayIndex;
  const d = new Date(start);
  d.setDate(d.getDate() + dayOffset);
  return d;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export function dayName(dayIndex) {
  return DAY_NAMES[dayIndex] || '';
}
