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

  // All body weight entries (show up to 30)
  const allWeight = useMemo(() => {
    return (data.bodyWeight || []).slice(-30);
  }, [data.bodyWeight]);

  // 7-day moving average
  const movingAvg = useMemo(() => {
    if (allWeight.length < 2) return [];
    return allWeight.map((_, i) => {
      const window = allWeight.slice(Math.max(0, i - 6), i + 1);
      const avg = window.reduce((sum, e) => sum + e.kg, 0) / window.length;
      return avg;
    });
  }, [allWeight]);

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

      {/* Body weight trend — enhanced */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-200">Body Weight</h3>
        {allWeight.length >= 2 ? (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-200">{displayWeightExact(allWeight[allWeight.length - 1].kg, unit)}</p>
                <p className="text-[9px] text-slate-500">Current ({ul})</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-blue-400">
                  {movingAvg.length > 0 ? displayWeightExact(movingAvg[movingAvg.length - 1], unit) : '--'}
                </p>
                <p className="text-[9px] text-slate-500">7d Avg ({ul})</p>
              </div>
              <div className="text-center">
                {(() => {
                  const delta = allWeight[allWeight.length - 1].kg - allWeight[0].kg;
                  const sign = delta > 0 ? '+' : '';
                  return (
                    <p className={`text-sm font-bold ${delta > 0 ? 'text-amber-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {sign}{displayWeightExact(delta, unit)}
                    </p>
                  );
                })()}
                <p className="text-[9px] text-slate-500">Change ({ul})</p>
              </div>
            </div>

            {/* Chart with trend line */}
            <BodyWeightChart
              entries={allWeight}
              movingAvg={movingAvg}
              unit={unit}
            />

            {/* Date range */}
            <div className="flex justify-between text-[9px] text-slate-600">
              <span>{formatShortDate(allWeight[0].date)}</span>
              <span>{allWeight.length} entries</span>
              <span>{formatShortDate(allWeight[allWeight.length - 1].date)}</span>
            </div>
          </>
        ) : allWeight.length === 1 ? (
          <div className="text-center py-4">
            <p className="text-lg font-bold text-slate-200">{displayWeightExact(allWeight[0].kg, unit)}{ul}</p>
            <p className="text-xs text-slate-500 mt-1">Log more entries to see trends</p>
          </div>
        ) : (
          <p className="text-xs text-slate-600 text-center py-4">Log body weight on the Today tab or in Settings.</p>
        )}
      </div>
    </div>
  );
}

function formatShortDate(dateStr) {
  return new Date(dateStr + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function BodyWeightChart({ entries, movingAvg, unit }) {
  const W = 300, H = 80, PAD = 8;
  const values = entries.map(e => displayWeightExact(e.kg, unit));
  const avgValues = movingAvg.map(kg => displayWeightExact(kg, unit));

  const allVals = [...values, ...avgValues];
  const min = Math.min(...allVals) - 0.5;
  const max = Math.max(...allVals) + 0.5;
  const range = max - min || 1;

  const toPoint = (v, i) => {
    const x = PAD + (i / Math.max(values.length - 1, 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return { x, y };
  };

  const dataPoints = values.map((v, i) => toPoint(v, i));
  const avgPoints = avgValues.map((v, i) => toPoint(v, i));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '80px' }}>
      {/* Fill under main line */}
      <polygon
        points={`${dataPoints.map(p => `${p.x},${p.y}`).join(' ')} ${dataPoints[dataPoints.length - 1].x},${H - PAD} ${PAD},${H - PAD}`}
        fill="#22c55e"
        opacity={0.08}
      />
      {/* Main data line */}
      <polyline
        points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#22c55e"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 7-day moving average line */}
      {avgPoints.length > 1 && (
        <polyline
          points={avgPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        />
      )}
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.5} fill="#22c55e" />
      ))}
      {/* Last point highlighted */}
      <circle
        cx={dataPoints[dataPoints.length - 1].x}
        cy={dataPoints[dataPoints.length - 1].y}
        r={3}
        fill="#22c55e"
        stroke="#0f172a"
        strokeWidth={1.5}
      />
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
