import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { PROGRAM } from '../data/program';
import { getPhaseForWeek } from '../data/phases';
import { getProgramDay, toISODate, dayName, getDateForProgramDay } from '../lib/dates';
import { calculateRPEAdjustment, applyAdjustment } from '../lib/weights';
import StrengthLogger from './StrengthLogger';
import MetconLogger from './MetconLogger';

export default function WorkoutView() {
  const { weekNum, dayIdx } = useParams();
  const { data, update } = useApp();
  const navigate = useNavigate();

  // Determine which workout to show
  const { weekNumber, dayIndex } = useMemo(() => {
    if (weekNum && dayIdx) {
      return { weekNumber: Number(weekNum), dayIndex: Number(dayIdx) };
    }
    if (!data.startDate) return { weekNumber: 1, dayIndex: 0 };
    const prog = getProgramDay(data.startDate);
    return prog?.started && !prog.finished ? prog : { weekNumber: 1, dayIndex: 0 };
  }, [weekNum, dayIdx, data.startDate]);

  const weekData = PROGRAM.weeks[weekNumber - 1];
  const dayData = weekData?.days?.[dayIndex];
  const phase = getPhaseForWeek(weekNumber);

  const dateISO = data.startDate ? toISODate(getDateForProgramDay(data.startDate, weekNumber, dayIndex)) : toISODate(new Date());

  // Section completion state
  const [completedSections, setCompletedSections] = useState({});
  const [sectionData, setSectionData] = useState({});
  const [activeSection, setActiveSection] = useState(0);
  const [adjustmentMessages, setAdjustmentMessages] = useState([]);

  if (!dayData || dayData.isRestDay) {
    return (
      <div className="p-6 text-center mt-20">
        <h2 className="text-xl font-bold mb-2">Rest Day</h2>
        <p className="text-slate-400">No workout scheduled.</p>
        <button onClick={() => navigate('/')} className="mt-6 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-semibold">
          Back to Today
        </button>
      </div>
    );
  }

  const sections = dayData.sections;
  const totalSections = sections.length;
  const completedCount = Object.keys(completedSections).length;
  const allComplete = completedCount === totalSections;

  const markComplete = (sectionIdx, sData) => {
    setCompletedSections(prev => ({ ...prev, [sectionIdx]: true }));
    if (sData) {
      setSectionData(prev => ({ ...prev, [sectionIdx]: sData }));
    }

    // RPE adjustment for strength sections
    if (sData?.rpe && sData?.liftKey) {
      const adj = calculateRPEAdjustment(sData.rpe, phase.targetRPE);
      if (adj.delta !== 0) {
        setAdjustmentMessages(prev => [...prev, adj.reason]);
        update(prev => ({
          ...prev,
          adjustments: applyAdjustment(prev.adjustments, sData.liftKey, adj.delta),
          adjustmentHistory: [...prev.adjustmentHistory, {
            date: dateISO,
            liftKey: sData.liftKey,
            rpe: sData.rpe,
            delta: adj.delta,
            weekNumber,
            reason: adj.reason,
          }],
        }));
      }
    }

    // Auto-advance to next section
    if (sectionIdx < totalSections - 1) {
      setActiveSection(sectionIdx + 1);
    }
  };

  const saveWorkout = () => {
    update(prev => ({
      ...prev,
      workoutLogs: {
        ...prev.workoutLogs,
        [dateISO]: {
          date: dateISO,
          weekNumber,
          dayIndex,
          completedAt: new Date().toISOString(),
          sections: sectionData,
        },
      },
    }));
    navigate('/');
  };

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-500">Week {weekNumber} — {dayName(dayIndex)}</p>
          <h1 className="text-lg font-bold">{dayData.label}</h1>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: phase.color + '22', color: phase.color }}>
          Phase {phase.number}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {sections.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${completedSections[i] ? 'bg-emerald-500' : i === activeSection ? 'bg-amber-500' : 'bg-slate-800'}`}
          />
        ))}
      </div>

      {/* Adjustment messages */}
      {adjustmentMessages.map((msg, i) => (
        <div key={i} className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-3">
          <p className="text-xs text-blue-400">{msg}</p>
        </div>
      ))}

      {/* Sections */}
      {sections.map((section, i) => (
        <div key={i} className={`rounded-xl border ${i === activeSection ? 'border-slate-700 bg-slate-900' : completedSections[i] ? 'border-emerald-900/30 bg-emerald-950/10' : 'border-slate-800/50 bg-slate-950/50'}`}>
          {/* Section header (always visible) */}
          <button
            onClick={() => setActiveSection(i)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              {completedSections[i] ? (
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                  <span className="text-[10px] text-slate-500">{i + 1}</span>
                </div>
              )}
              <span className={`text-sm font-semibold ${completedSections[i] ? 'text-emerald-400' : 'text-slate-200'}`}>
                {section.title || section.name || section.type}
              </span>
            </div>
            <span className="text-[10px] text-slate-600 uppercase">{section.type}</span>
          </button>

          {/* Section body (expanded) */}
          {i === activeSection && !completedSections[i] && (
            <div className="px-4 pb-4">
              {section.type === 'strength' && (
                <StrengthLogger
                  section={section}
                  weekNumber={weekNumber}
                  onComplete={(sData) => markComplete(i, sData)}
                />
              )}

              {section.type === 'metcon' && (
                <MetconLogger
                  section={section}
                  onComplete={(sData) => markComplete(i, sData)}
                />
              )}

              {(section.type === 'warmup' || section.type === 'cooldown' || section.type === 'rehab') && (
                <div className="space-y-3">
                  {section.duration && <p className="text-xs text-slate-500">{section.duration}</p>}
                  <div className="bg-slate-800 rounded-lg p-3 space-y-1">
                    {(section.movements || section.description || []).map((m, j) => (
                      <p key={j} className="text-sm text-slate-300">{m}</p>
                    ))}
                  </div>
                  <button
                    onClick={() => markComplete(i)}
                    className="w-full py-3 bg-slate-700 text-slate-200 rounded-xl font-semibold active:bg-slate-600"
                  >
                    Done
                  </button>
                </div>
              )}

              {section.type === 'accessory' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">{section.scheme}</p>
                  <div className="bg-slate-800 rounded-lg p-3 space-y-1">
                    {(section.movements || []).map((m, j) => (
                      <p key={j} className="text-sm text-slate-300">{m}</p>
                    ))}
                  </div>
                  <button
                    onClick={() => markComplete(i)}
                    className="w-full py-3 bg-slate-700 text-slate-200 rounded-xl font-semibold active:bg-slate-600"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Complete workout button */}
      {allComplete && (
        <button
          onClick={saveWorkout}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg active:bg-emerald-700"
        >
          Complete Workout
        </button>
      )}
    </div>
  );
}
