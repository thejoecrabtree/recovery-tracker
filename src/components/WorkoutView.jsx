import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { PROGRAM } from '../data/program';
import { getPhaseForWeek } from '../data/phases';
import { getProgramDay, toISODate, dayName, getDateForProgramDay } from '../lib/dates';
import { calculateRPEAdjustment, applyAdjustment } from '../lib/weights';
import { displayWeight, unitLabel } from '../lib/units';
import { getWorkoutModifications } from '../lib/readiness';
import { checkForNewPRs } from '../lib/records';
import StrengthLogger from './StrengthLogger';
import MetconLogger from './MetconLogger';
import WorkoutNotes from './WorkoutNotes';
import { MovementWithVideo } from './VideoLink';

export default function WorkoutView() {
  const { weekNum, dayIdx } = useParams();
  const { data, update } = useApp();
  const navigate = useNavigate();
  const unit = data.unit || 'kg';
  const ul = unitLabel(unit);
  const dw = (kg) => displayWeight(kg, unit);

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

  // Readiness modifications
  const todayReadiness = data.readiness?.[dateISO];
  const readinessMods = todayReadiness ? getWorkoutModifications(todayReadiness.score) : null;

  // Section completion state
  const [completedSections, setCompletedSections] = useState({});
  const [sectionData, setSectionData] = useState({});
  const [activeSection, setActiveSection] = useState(0);
  const [adjustmentMessages, setAdjustmentMessages] = useState([]);
  const [newPRs, setNewPRs] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [workoutLogged, setWorkoutLogged] = useState(false);

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

  // Filter sections based on readiness
  const isActiveRecovery = readinessMods?.activeRecoveryOnly;
  const sections = isActiveRecovery
    ? dayData.sections.filter(s => s.type === 'warmup' || s.type === 'cooldown' || s.type === 'rehab')
    : dayData.sections;
  const skippedTypes = isActiveRecovery ? ['strength', 'metcon', 'accessory'] : [];
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

      // Check for new PRs
      const prs = checkForNewPRs(data.personalRecords, sData);
      if (prs.length > 0) {
        setNewPRs(prev => [...prev, ...prs]);
      }
    }

    // Save metcon scores
    if (sData?.name && sData?.score) {
      update(prev => {
        const scores = prev.metconScores || {};
        const existing = scores[sData.name] || [];
        return {
          ...prev,
          metconScores: {
            ...scores,
            [sData.name]: [...existing, {
              date: dateISO,
              score: sData.score,
              variant: sData.variant,
              format: sData.format,
            }],
          },
        };
      });
    }

    // Auto-advance to next section
    if (sectionIdx < totalSections - 1) {
      setActiveSection(sectionIdx + 1);
    }
  };

  const saveWorkout = (notes) => {
    // Save PRs
    const updatedPRs = { ...data.personalRecords };
    for (const pr of newPRs) {
      if (!updatedPRs[pr.liftKey]) updatedPRs[pr.liftKey] = {};
      updatedPRs[pr.liftKey][`${pr.reps}rm`] = {
        weight: pr.weight,
        reps: pr.reps,
        date: dateISO,
        weekNumber,
      };
    }

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
      personalRecords: updatedPRs,
      workoutNotes: notes
        ? { ...prev.workoutNotes, [dateISO]: notes }
        : prev.workoutNotes,
    }));
    setWorkoutLogged(true);
  };

  // Workout logged celebration screen
  if (workoutLogged) {
    const strengthSections = Object.values(sectionData).filter(s => s?.liftKey);
    const totalSets = strengthSections.reduce((sum, s) => sum + (s.sets?.length || 0), 0);
    const totalVolume = strengthSections.reduce((sum, s) =>
      sum + (s.sets || []).reduce((v, set) => v + set.weight * set.reps, 0), 0);

    return (
      <div className="p-6 text-center mt-12 space-y-6">
        <div className="text-6xl">&#x1F4AA;</div>
        <div>
          <h1 className="text-2xl font-bold text-emerald-400">Workout Logged!</h1>
          <p className="text-sm text-slate-500 mt-1">Week {weekNumber} — {dayName(dayIndex)}</p>
          <p className="text-sm text-slate-400">{dayData.label}</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-lg font-bold text-slate-100">{completedCount}</p>
            <p className="text-[10px] text-slate-500">Sections</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-lg font-bold text-slate-100">{totalSets}</p>
            <p className="text-[10px] text-slate-500">Sets</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-lg font-bold text-slate-100">{totalVolume > 0 ? `${dw(totalVolume)}` : '--'}</p>
            <p className="text-[10px] text-slate-500">Volume ({ul})</p>
          </div>
        </div>

        {/* PRs */}
        {newPRs.length > 0 && (
          <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4 space-y-2">
            <p className="text-sm font-bold text-amber-400">New PRs!</p>
            {newPRs.map((pr, i) => (
              <p key={i} className="text-xs text-amber-300">
                {pr.liftKey.replace(/([A-Z])/g, ' $1').trim()}: {dw(pr.weight)}{ul} x {pr.reps}
              </p>
            ))}
          </div>
        )}

        {/* Adjustment messages */}
        {adjustmentMessages.length > 0 && (
          <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-4 space-y-1">
            {adjustmentMessages.map((msg, i) => (
              <p key={i} className="text-xs text-blue-400">{msg}</p>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg active:bg-emerald-700"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Notes modal */}
      {showNotes && (
        <WorkoutNotes
          onSave={(notes) => saveWorkout(notes)}
          onSkip={() => saveWorkout(null)}
        />
      )}

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

      {/* Readiness banner with intensity badge */}
      {readinessMods && readinessMods.label !== 'Normal' && (
        <div className="rounded-xl p-3 border" style={{ backgroundColor: readinessMods.color + '11', borderColor: readinessMods.color + '33' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{readinessMods.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: readinessMods.color }}>{readinessMods.label}</p>
                {readinessMods.intensityPct < 100 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: readinessMods.color + '22', color: readinessMods.color }}>
                    {readinessMods.intensityPct}% intensity
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{readinessMods.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {sections.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${completedSections[i] ? 'bg-emerald-500' : i === activeSection ? 'bg-amber-500' : 'bg-slate-800'}`}
          />
        ))}
      </div>

      {/* New PR banners */}
      {newPRs.map((pr, i) => (
        <div key={i} className="bg-amber-950/30 border border-amber-800/30 rounded-lg p-3 flex items-center gap-2">
          <span className="text-lg">🎉</span>
          <p className="text-xs text-amber-400 font-semibold">
            New PR! {dw(pr.weight)}{ul} x {pr.reps} on {pr.liftKey.replace(/([A-Z])/g, ' $1').trim()}
          </p>
        </div>
      ))}

      {/* Adjustment messages */}
      {adjustmentMessages.map((msg, i) => (
        <div key={i} className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-3">
          <p className="text-xs text-blue-400">{msg}</p>
        </div>
      ))}

      {/* Active Recovery: show what was removed */}
      {isActiveRecovery && (
        <div className="rounded-xl p-3 border border-red-900/30 bg-red-950/10">
          <p className="text-xs text-red-400 font-medium mb-1">{readinessMods.emoji} Active Recovery Mode</p>
          <p className="text-[10px] text-slate-500">
            Skipped: {dayData.sections.filter(s => skippedTypes.includes(s.type)).map(s => s.title || s.name || s.type).join(', ')}
          </p>
        </div>
      )}

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
              {/* Intensity badge on strength/accessory sections */}
              {readinessMods?.intensityPct < 100 && (section.type === 'strength' || section.type === 'accessory') && !completedSections[i] && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: readinessMods.color + '22', color: readinessMods.color }}>
                  {readinessMods.intensityPct}%
                </span>
              )}
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
                  readinessMods={readinessMods}
                  onComplete={(sData) => markComplete(i, sData)}
                />
              )}

              {section.type === 'metcon' && (
                <MetconLogger
                  section={section}
                  defaultVariant={readinessMods?.metconScale}
                  onComplete={(sData) => markComplete(i, sData)}
                />
              )}

              {(section.type === 'warmup' || section.type === 'cooldown' || section.type === 'rehab') && (
                <div className="space-y-3">
                  {section.duration && <p className="text-xs text-slate-500">{section.duration}</p>}
                  <div className="bg-slate-800 rounded-lg p-3 space-y-1">
                    {(section.movements || section.description || []).map((m, j) => (
                      <MovementWithVideo key={j} text={m} />
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
                  {readinessMods?.skipAccessory && (
                    <div className="rounded-lg p-2 border border-orange-900/30 bg-orange-950/20">
                      <p className="text-[10px] text-orange-400 font-medium">{readinessMods.emoji} Accessory work optional — skip or reduce sets</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400">{section.scheme}</p>
                  <div className={`bg-slate-800 rounded-lg p-3 space-y-1 ${readinessMods?.skipAccessory ? 'opacity-50' : ''}`}>
                    {(section.movements || []).map((m, j) => (
                      <div key={j} className={readinessMods?.skipAccessory ? 'line-through decoration-slate-600' : ''}>
                        <MovementWithVideo text={m} />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {readinessMods?.skipAccessory && (
                      <button
                        onClick={() => markComplete(i)}
                        className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-semibold active:bg-slate-700 border border-slate-700"
                      >
                        Skip
                      </button>
                    )}
                    <button
                      onClick={() => markComplete(i)}
                      className={`${readinessMods?.skipAccessory ? 'flex-1' : 'w-full'} py-3 bg-slate-700 text-slate-200 rounded-xl font-semibold active:bg-slate-600`}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Complete workout button */}
      {allComplete && (
        <button
          onClick={() => setShowNotes(true)}
          className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg active:bg-emerald-700"
        >
          Complete Workout
        </button>
      )}
    </div>
  );
}
