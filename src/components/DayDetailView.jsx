import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { PROGRAM } from '../data/program';
import { getPhaseForWeek } from '../data/phases';
import { LIFTS } from '../data/exercises';
import { getEffective1RM, calcSetWeights } from '../lib/weights';
import { dayName, toISODate, getDateForProgramDay, formatDate } from '../lib/dates';

export default function DayDetailView() {
  const { weekNum, dayIdx } = useParams();
  const navigate = useNavigate();
  const { data } = useApp();

  const weekNumber = Number(weekNum);
  const dayIndex = Number(dayIdx);
  const weekData = PROGRAM.weeks[weekNumber - 1];
  const dayData = weekData?.days?.[dayIndex];
  const phase = getPhaseForWeek(weekNumber);

  const dateForDay = data.startDate
    ? getDateForProgramDay(data.startDate, weekNumber, dayIndex)
    : null;
  const dateISO = dateForDay ? toISODate(dateForDay) : null;
  const log = dateISO ? data.workoutLogs[dateISO] : null;

  if (!dayData) {
    return (
      <div className="p-6 text-center mt-20">
        <p className="text-slate-400">Workout not found.</p>
        <button onClick={() => navigate('/calendar')} className="mt-4 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold">
          Back to Calendar
        </button>
      </div>
    );
  }

  if (dayData.isRestDay) {
    return (
      <div className="p-4 pb-24 space-y-4">
        <BackButton navigate={navigate} />
        <DayHeader weekNumber={weekNumber} dayIndex={dayIndex} phase={phase} date={dateForDay} />
        <div className="mt-8 text-center">
          <p className="text-4xl mb-4">🧘</p>
          <h2 className="text-xl font-bold mb-2">Rest Day</h2>
          <p className="text-slate-400 text-sm">Recovery is part of the program. Foam roll, stretch, and do your foot rehab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <BackButton navigate={navigate} />
      <DayHeader weekNumber={weekNumber} dayIndex={dayIndex} phase={phase} date={dateForDay} />

      {/* Completed badge */}
      {log && (
        <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span className="text-sm text-emerald-400 font-medium">
            Completed {log.completedAt ? new Date(log.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
      )}

      {/* Injury phase note */}
      <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3">
        <p className="text-xs text-amber-500">{phase.injuryNote}</p>
      </div>

      {/* All sections expanded */}
      {dayData.sections.map((section, i) => (
        <SectionDetail
          key={i}
          section={section}
          weekNumber={weekNumber}
          data={data}
          logData={log?.sections?.[i]}
        />
      ))}

      {/* Start workout button (only if not already logged) */}
      {!log && (
        <button
          onClick={() => navigate(`/workout/${weekNumber}/${dayIndex}`)}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg active:bg-emerald-700"
        >
          Start Workout
        </button>
      )}
    </div>
  );
}

function BackButton({ navigate }) {
  return (
    <button
      onClick={() => navigate('/calendar')}
      className="flex items-center gap-1 text-slate-400 active:text-slate-200 -ml-1"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span className="text-sm">Calendar</span>
    </button>
  );
}

function DayHeader({ weekNumber, dayIndex, phase, date }) {
  return (
    <div>
      {date && <p className="text-sm text-slate-500">{formatDate(date)}</p>}
      <div className="flex items-center gap-3 mt-1">
        <h1 className="text-xl font-bold">Week {weekNumber} — {dayName(dayIndex)}</h1>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: phase.color + '22', color: phase.color }}>
          {phase.label}
        </span>
      </div>
    </div>
  );
}

const TYPE_LABELS = {
  warmup: { label: 'Warm-up', color: 'text-orange-400', bg: 'bg-orange-950/20 border-orange-900/30' },
  strength: { label: 'Strength', color: 'text-red-400', bg: 'bg-red-950/20 border-red-900/30' },
  accessory: { label: 'Accessory', color: 'text-purple-400', bg: 'bg-purple-950/20 border-purple-900/30' },
  metcon: { label: 'Metcon', color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900/30' },
  cooldown: { label: 'Cooldown', color: 'text-cyan-400', bg: 'bg-cyan-950/20 border-cyan-900/30' },
  rehab: { label: 'Rehab', color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900/30' },
};

function SectionDetail({ section, weekNumber, data, logData }) {
  const typeStyle = TYPE_LABELS[section.type] || TYPE_LABELS.warmup;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${typeStyle.bg}`}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-100">{section.title || section.name || section.type}</h3>
        <span className={`text-[10px] font-semibold uppercase ${typeStyle.color}`}>{typeStyle.label}</span>
      </div>

      {/* Strength section — show calculated weights */}
      {section.type === 'strength' && section.liftKey && section.sets?.length > 0 && (
        <StrengthDetail section={section} weekNumber={weekNumber} data={data} logData={logData} />
      )}

      {/* Metcon section — show RX and Scaled */}
      {section.type === 'metcon' && (
        <MetconDetail section={section} logData={logData} />
      )}

      {/* Warmup / Cooldown / Rehab — show movements */}
      {(section.type === 'warmup' || section.type === 'cooldown' || section.type === 'rehab') && (
        <div className="space-y-1">
          {section.duration && <p className="text-xs text-slate-500">{section.duration}</p>}
          {(section.movements || section.description || []).map((m, i) => (
            <p key={i} className="text-sm text-slate-300">{m}</p>
          ))}
        </div>
      )}

      {/* Accessory section */}
      {section.type === 'accessory' && (
        <div className="space-y-1">
          {section.scheme && <p className="text-xs text-slate-400 font-medium">{section.scheme}</p>}
          {(section.movements || []).map((m, i) => (
            <p key={i} className="text-sm text-slate-300">{m}</p>
          ))}
        </div>
      )}

      {/* Logged data for this section */}
      {logData?.rpe && (
        <div className="pt-2 border-t border-slate-800/50">
          <span className="text-xs text-amber-400">Logged RPE: {logData.rpe}</span>
        </div>
      )}
      {logData?.score && (
        <div className="pt-2 border-t border-slate-800/50">
          <span className="text-xs text-emerald-400">Score: {logData.score} ({logData.variant?.toUpperCase()})</span>
        </div>
      )}
    </div>
  );
}

function StrengthDetail({ section, weekNumber, data, logData }) {
  const lift = LIFTS[section.liftKey];
  const effective1RM = getEffective1RM(section.liftKey, data.baseMaxes, data.adjustments);
  const calculated = calcSetWeights(effective1RM, section.sets);

  // Group weights for display
  const weights = calculated.map(s => s.targetWeight);
  const uniqueWeights = [...new Set(weights)];
  const isBuildUp = uniqueWeights.length > 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{section.scheme}</p>
        <p className="text-xs text-slate-500">{lift?.name} — {effective1RM}kg 1RM</p>
      </div>

      {section.notes && <p className="text-xs text-slate-500 italic">{section.notes}</p>}

      {/* Build-up display */}
      {isBuildUp ? (
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-2">Build across sets:</p>
          <div className="flex flex-wrap gap-2">
            {calculated.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-sm font-mono font-bold text-slate-100">{s.targetWeight}kg</span>
                <span className="text-[10px] text-slate-600">x{s.reps}</span>
                {i < calculated.length - 1 && <span className="text-slate-700 mx-0.5">→</span>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-sm font-mono font-bold text-slate-100">
            {section.sets.length} x {section.sets[0]?.reps} @ {weights[0]}kg
            <span className="text-[10px] text-slate-500 font-normal ml-2">({Math.round(section.sets[0]?.pct * 100)}%)</span>
          </p>
        </div>
      )}

      {/* Show logged sets if available */}
      {logData?.sets && (
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-1">
          <p className="text-xs text-emerald-500 font-semibold mb-1">Logged:</p>
          {logData.sets.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Set {i + 1}:</span>
              <span className="text-slate-200 font-mono">{s.weight}kg x {s.reps}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetconDetail({ section, logData }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">{section.description}</p>
      {section.target && <p className="text-xs text-emerald-500">Target: {section.target}</p>}

      {/* RX version */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-400">RX</p>
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-0.5">
          {(section.rx || []).map((m, i) => (
            <p key={i} className={`text-sm ${m === '' ? 'h-1.5' : m.endsWith(':') ? 'text-slate-400 font-semibold mt-1.5 first:mt-0' : 'text-slate-200'}`}>
              {m}
            </p>
          ))}
        </div>
      </div>

      {/* Scaled version */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-400">Scaled</p>
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-0.5">
          {(section.scaled || []).map((m, i) => (
            <p key={i} className={`text-sm ${m === '' ? 'h-1.5' : m.endsWith(':') ? 'text-slate-400 font-semibold mt-1.5 first:mt-0' : 'text-slate-200'}`}>
              {m}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
