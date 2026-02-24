import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { PROGRAM } from '../data/program';
import { getPhaseForWeek } from '../data/phases';
import { getProgramDay, formatDate, toISODate, dayName } from '../lib/dates';

const SECTION_ICONS = {
  warmup: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
  strength: 'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2.71 7 4.14 8.43l7 7z',
  accessory: 'M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
  metcon: 'M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z',
  cooldown: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  rehab: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5 0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5C8.5 7.57 10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z',
};

export default function TodayView() {
  const { data } = useApp();
  const navigate = useNavigate();
  const today = new Date();
  const todayISO = toISODate(today);

  if (!data.startDate) {
    return (
      <div className="p-6 text-center mt-20">
        <h1 className="text-2xl font-bold mb-4">Recovery Tracker</h1>
        <p className="text-slate-400 mb-6">Set your program start date in Settings to get started.</p>
        <button onClick={() => navigate('/settings')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold active:bg-emerald-700">
          Go to Settings
        </button>
      </div>
    );
  }

  const prog = getProgramDay(data.startDate, today);

  if (!prog?.started) {
    return (
      <div className="p-6 text-center mt-20">
        <h1 className="text-2xl font-bold mb-2">Recovery Tracker</h1>
        <p className="text-slate-400 mb-4">Program starts in <span className="text-emerald-400 font-bold">{prog.daysUntilStart}</span> days</p>
        <p className="text-sm text-slate-500">Start date: {data.startDate}</p>
      </div>
    );
  }

  if (prog.finished) {
    return (
      <div className="p-6 text-center mt-20">
        <h1 className="text-2xl font-bold mb-2">Program Complete!</h1>
        <p className="text-slate-400">You've finished all 12 weeks. Check your Progress tab for results.</p>
      </div>
    );
  }

  const { weekNumber, dayIndex } = prog;
  const weekData = PROGRAM.weeks[weekNumber - 1];
  const dayData = weekData?.days?.[dayIndex];
  const phase = getPhaseForWeek(weekNumber);
  const logged = data.workoutLogs[todayISO];

  if (!dayData || dayData.isRestDay) {
    return (
      <div className="p-6">
        <Header weekNumber={weekNumber} dayIndex={dayIndex} phase={phase} today={today} />
        <div className="mt-12 text-center">
          <p className="text-4xl mb-4">🧘</p>
          <h2 className="text-xl font-bold mb-2">Rest Day</h2>
          <p className="text-slate-400">Recovery is part of the program. Foam roll, stretch, and do your foot rehab if scheduled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Header weekNumber={weekNumber} dayIndex={dayIndex} phase={phase} today={today} />

      {logged && (
        <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span className="text-sm text-emerald-400 font-medium">Workout logged today</span>
        </div>
      )}

      <div className="bg-slate-900 rounded-xl p-4 space-y-3 border border-slate-800">
        <h2 className="text-lg font-bold">{dayData.label}</h2>

        <div className="space-y-2">
          {dayData.sections.map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <svg className="w-4 h-4 text-slate-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d={SECTION_ICONS[s.type] || SECTION_ICONS.warmup} />
              </svg>
              <span className="text-sm text-slate-300">{s.title || s.name || s.type}</span>
              <span className="text-xs text-slate-600 ml-auto capitalize">{s.type}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3">
        <p className="text-xs text-amber-500">{phase.injuryNote}</p>
      </div>

      <button
        onClick={() => navigate(`/workout/${weekNumber}/${dayIndex}`)}
        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg active:bg-emerald-700"
      >
        {logged ? 'View Workout' : 'Start Workout'}
      </button>
    </div>
  );
}

function Header({ weekNumber, dayIndex, phase, today }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{formatDate(today)}</p>
      <div className="flex items-center gap-3 mt-1">
        <h1 className="text-xl font-bold">Week {weekNumber} — {dayName(dayIndex)}</h1>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: phase.color + '22', color: phase.color }}>
          {phase.label}
        </span>
      </div>
    </div>
  );
}
