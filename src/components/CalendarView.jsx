import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { PROGRAM } from '../data/program';
import { toISODate, dateFromISO, getDateForProgramDay, dayName } from '../lib/dates';

export default function CalendarView() {
  const { data } = useApp();
  const navigate = useNavigate();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7; // Monday start
    const days = [];

    for (let i = -startPad; i <= lastDay.getDate() + (6 - (lastDay.getDay() + 6) % 7) - 1; i++) {
      const d = new Date(year, month, i + 1);
      days.push(d);
    }
    return days;
  }, [year, month]);

  // Determine day status based on program
  const getDayStatus = (date) => {
    const iso = toISODate(date);
    if (data.workoutLogs[iso]) return 'completed';

    if (!data.startDate) return 'none';
    const start = dateFromISO(data.startDate);
    const diffMs = date - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || diffDays >= 84) return 'none';

    const weekNumber = Math.floor(diffDays / 7) + 1;
    const dayIndex = diffDays % 7;
    const weekData = PROGRAM.weeks[weekNumber - 1];
    const dayData = weekData?.days?.[dayIndex];

    if (!dayData || dayData.isRestDay) return 'rest';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return 'missed';
    return 'scheduled';
  };

  const getSelectedInfo = () => {
    if (!selectedDate || !data.startDate) return null;

    const start = dateFromISO(data.startDate);
    const diffMs = selectedDate - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || diffDays >= 84) return null;

    const weekNumber = Math.floor(diffDays / 7) + 1;
    const dayIndex = diffDays % 7;
    const weekData = PROGRAM.weeks[weekNumber - 1];
    const dayData = weekData?.days?.[dayIndex];
    const iso = toISODate(selectedDate);
    const log = data.workoutLogs[iso];

    return { weekNumber, dayIndex, dayData, log, iso };
  };

  const selectedInfo = getSelectedInfo();

  const STATUS_COLORS = {
    completed: 'bg-emerald-500',
    scheduled: 'bg-blue-500',
    rest: 'bg-slate-700',
    missed: 'bg-red-900/50',
    none: '',
  };

  return (
    <div className="p-4 space-y-4">
      {/* Month header */}
      <div className="flex justify-between items-center">
        <button onClick={prevMonth} className="p-2 text-slate-400 active:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold">
          {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={nextMonth} className="p-2 text-slate-400 active:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="text-xs text-slate-600 py-1">{d}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, i) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = toISODate(date) === toISODate(new Date());
          const isSelected = selectedDate && toISODate(date) === toISODate(selectedDate);
          const status = isCurrentMonth ? getDayStatus(date) : 'none';

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(date)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative
                ${!isCurrentMonth ? 'text-slate-800' : 'text-slate-300'}
                ${isSelected ? 'ring-2 ring-emerald-500' : ''}
                ${isToday ? 'font-bold' : ''}`}
            >
              <span>{date.getDate()}</span>
              {status !== 'none' && (
                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${STATUS_COLORS[status]}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Done</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Scheduled</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-700" /> Rest</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-900/50" /> Missed</span>
      </div>

      {/* Selected day detail */}
      {selectedInfo && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-400">Week {selectedInfo.weekNumber} — {dayName(selectedInfo.dayIndex)}</p>
              <p className="font-bold">{selectedInfo.dayData?.label || 'Rest Day'}</p>
            </div>
            {selectedInfo.log && (
              <span className="text-xs text-emerald-500 font-semibold">Completed</span>
            )}
          </div>

          {selectedInfo.dayData && !selectedInfo.dayData.isRestDay && (
            <>
              <div className="space-y-1">
                {selectedInfo.dayData.sections.map((s, i) => (
                  <p key={i} className="text-xs text-slate-500">
                    {s.title || s.name || s.type}
                    {selectedInfo.log?.sections?.[i]?.rpe && (
                      <span className="text-amber-500 ml-2">RPE {selectedInfo.log.sections[i].rpe}</span>
                    )}
                  </p>
                ))}
              </div>

              <button
                onClick={() => navigate(`/day/${selectedInfo.weekNumber}/${selectedInfo.dayIndex}`)}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold active:bg-emerald-700"
              >
                View Full Workout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
