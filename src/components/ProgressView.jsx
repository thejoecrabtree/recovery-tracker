import { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { LIFTS } from '../data/exercises';
import LiftChart from './LiftChart';
import PRBoard from './PRBoard';
import MetconHistory from './MetconHistory';
import { ConsistencyChart } from './WeeklySummary';
import { getWorkoutModifications } from '../lib/readiness';
import { displayWeightExact, unitLabel } from '../lib/units';

export default function ProgressView() {
  const { data } = useApp();
  const [tab, setTab] = useState('lifts'); // 'lifts' | 'prs' | 'metcons' | 'trends'
  const liftKeys = Object.keys(LIFTS);
  const unit = data.unit || 'kg';

  const totalLogged = Object.keys(data.workoutLogs).length;
  const metconCount = Object.values(data.metconScores || {}).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Progress</h1>
        <p className="text-sm text-slate-500">{totalLogged} workouts logged</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Workouts" value={totalLogged} />
        <StatCard label="Adjustments" value={data.adjustmentHistory.length} />
        <StatCard label="PRs" value={Object.values(data.personalRecords || {}).reduce((sum, lift) => sum + Object.keys(lift).length, 0)} />
        <StatCard label="Metcons" value={metconCount} />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1.5">
        {[
          { key: 'lifts', label: 'Lifts' },
          { key: 'prs', label: 'PRs' },
          { key: 'metcons', label: 'Metcons' },
          { key: 'trends', label: 'Trends' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold ${tab === t.key ? 'bg-slate-700 text-slate-100' : 'bg-slate-900 text-slate-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'lifts' && (
        <div className="space-y-4">
          {liftKeys.map(key => (
            <LiftChart
              key={key}
              liftKey={key}
              liftName={LIFTS[key].name}
              base1RM={data.baseMaxes[key]}
              adjustment={data.adjustments[key] || 0}
              history={data.adjustmentHistory.filter(h => h.liftKey === key)}
            />
          ))}
        </div>
      )}

      {tab === 'prs' && <PRBoard />}

      {tab === 'metcons' && <MetconHistory />}

      {tab === 'trends' && <TrendsTab data={data} unit={unit} />}
    </div>
  );
}

function TrendsTab({ data, unit }) {
  const ul = unitLabel(unit);

  // Recent readiness scores
  const recentReadiness = useMemo(() => {
    const entries = Object.entries(data.readiness || {})
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 14);
    return entries.reverse();
  }, [data.readiness]);

  // Recent body weight
  const recentWeight = useMemo(() => {
    return (data.bodyWeight || []).slice(-14);
  }, [data.bodyWeight]);

  return (
    <div className="space-y-4">
      {/* Consistency chart */}
      <ConsistencyChart />

      {/* Readiness trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-200">Readiness</h3>
        {recentReadiness.length > 0 ? (
          <>
            <div className="flex gap-1 items-end h-16">
              {recentReadiness.map(([date, r]) => {
                const mods = getWorkoutModifications(r.score);
                const height = (r.score / 10) * 100;
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[8px] text-slate-600">{r.score}</span>
                    <div
                      className="w-full rounded-t"
                      style={{ height: `${height}%`, backgroundColor: mods.color, minHeight: '4px' }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-slate-600">
              <span>{recentReadiness[0]?.[0]?.slice(5)}</span>
              <span>{recentReadiness[recentReadiness.length - 1]?.[0]?.slice(5)}</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-600 text-center py-4">No readiness data yet. Check in before workouts.</p>
        )}
      </div>

      {/* Body weight trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-200">Body Weight</h3>
        {recentWeight.length >= 2 ? (
          <>
            <MiniChart
              data={recentWeight.map(e => displayWeightExact(e.kg, unit))}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Start: {displayWeightExact(recentWeight[0].kg, unit)}{ul}</span>
              <span>Now: {displayWeightExact(recentWeight[recentWeight.length - 1].kg, unit)}{ul}</span>
              <span className={recentWeight[recentWeight.length - 1].kg - recentWeight[0].kg > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                {displayWeightExact(recentWeight[recentWeight.length - 1].kg - recentWeight[0].kg, unit)}{ul}
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-600 text-center py-4">Log body weight in Settings to see trends.</p>
        )}
      </div>
    </div>
  );
}

function MiniChart({ data }) {
  const W = 300, H = 60, PAD = 5;
  const min = Math.min(...data) - 0.5;
  const max = Math.max(...data) + 0.5;
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '60px' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#22c55e"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((v, i) => {
        const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
        const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
        return <circle key={i} cx={x} cy={y} r={2} fill="#22c55e" />;
      })}
    </svg>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
      <p className="text-lg font-bold text-emerald-400">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}
