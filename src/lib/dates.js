// Helper: 0=Mon, 1=Tue, ..., 6=Sun
function dayOfWeek(date) {
  return (date.getDay() + 6) % 7;
}

// Helper: get midnight Monday of the week containing `date`
function getMondayOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - dayOfWeek(d));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getProgramDay(startDate, today = new Date()) {
  if (!startDate) return null;

  const start = new Date(startDate + 'T00:00:00');
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (now < start) {
    const daysUntilStart = Math.round((start - now) / (1000 * 60 * 60 * 24));
    return { started: false, daysUntilStart, weekNumber: 0, dayIndex: 0 };
  }

  // Actual day of week (0=Mon ... 6=Sun)
  const dayIndex = dayOfWeek(now);

  // Week number anchored to Monday of start week
  const startMonday = getMondayOfWeek(start);
  const diffDays = Math.round((now - startMonday) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;

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
  const startMonday = getMondayOfWeek(start);
  const d = new Date(startMonday);
  d.setDate(d.getDate() + (weekNumber - 1) * 7 + dayIndex);
  return d;
}

// Get { weekNumber, dayIndex } for any calendar date, or null if outside program
export function getProgramDayForDate(startDate, date) {
  const start = new Date(startDate + 'T00:00:00');
  if (date < start) return null;

  const dayIndex = dayOfWeek(date);
  const startMonday = getMondayOfWeek(start);
  const diffDays = Math.round((date - startMonday) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(diffDays / 7) + 1;

  if (weekNumber < 1 || weekNumber > 12) return null;
  return { weekNumber, dayIndex };
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export function dayName(dayIndex) {
  return DAY_NAMES[dayIndex] || '';
}
