import { useApp } from '../contexts/AppContext';
import { displayWeight, unitLabel } from '../lib/units';

export default function LiftChart({ liftKey, liftName, base1RM, adjustment, history }) {
  const { data } = useApp();
  const unit = data.unit || 'kg';
  const ul = unitLabel(unit);
  const dw = (kg) => displayWeight(kg, unit);

  const effective = base1RM + adjustment;
  const hasHistory = history.length > 0;

  // Build data points: start with base, then each adjustment
  const points = [{ week: 0, value: base1RM, label: 'Start' }];
  let running = base1RM;
  for (const h of history) {
    running += h.delta;
    points.push({ week: h.weekNumber, value: running, label: `W${h.weekNumber} RPE ${h.rpe}`, delta: h.delta });
  }

  // Chart dimensions
  const W = 320, H = 120, PAD = 30;
  const chartW = W - PAD * 2, chartH = H - PAD * 2;

  const minVal = Math.min(...points.map(p => p.value)) - 5;
  const maxVal = Math.max(...points.map(p => p.value)) + 5;
  const range = maxVal - minVal || 10;

  const toX = (i) => PAD + (i / Math.max(points.length - 1, 1)) * chartW;
  const toY = (v) => PAD + chartH - ((v - minVal) / range) * chartH;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.value)}`).join(' ');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-200">{liftName}</h3>
          <p className="text-xs text-slate-500">Base: {dw(base1RM)}{ul}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: adjustment > 0 ? '#22c55e' : adjustment < 0 ? '#ef4444' : '#94a3b8' }}>
            {dw(effective)}{ul}
          </p>
          {adjustment !== 0 && (
            <p className="text-xs" style={{ color: adjustment > 0 ? '#22c55e' : '#ef4444' }}>
              {adjustment > 0 ? '+' : ''}{dw(adjustment)}{ul}
            </p>
          )}
        </div>
      </div>

      {hasHistory ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '120px' }}>
          {/* Grid lines */}
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#1e293b" strokeWidth={1} />
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#1e293b" strokeWidth={1} />

          {/* Base line */}
          <line x1={PAD} y1={toY(base1RM)} x2={W - PAD} y2={toY(base1RM)} stroke="#334155" strokeWidth={1} strokeDasharray="4,4" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="#22c55e" strokeWidth={2} />

          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={toX(i)} cy={toY(p.value)} r={4} fill={p.delta > 0 ? '#22c55e' : p.delta < 0 ? '#ef4444' : '#94a3b8'} />
              <text x={toX(i)} y={toY(p.value) - 8} textAnchor="middle" fontSize={8} fill="#94a3b8">
                {dw(p.value)}
              </text>
            </g>
          ))}

          {/* Y axis labels */}
          <text x={PAD - 4} y={PAD + 4} textAnchor="end" fontSize={8} fill="#475569">{dw(maxVal)}</text>
          <text x={PAD - 4} y={H - PAD + 4} textAnchor="end" fontSize={8} fill="#475569">{dw(minVal)}</text>
        </svg>
      ) : (
        <p className="text-xs text-slate-600 text-center py-4">No adjustments yet. Complete workouts and rate RPE to see changes.</p>
      )}

      {/* Adjustment history */}
      {hasHistory && (
        <div className="mt-3 space-y-1">
          {history.slice(-5).map((h, i) => (
            <div key={i} className="flex justify-between text-[10px]">
              <span className="text-slate-500">Week {h.weekNumber} — RPE {h.rpe}</span>
              <span className={h.delta > 0 ? 'text-emerald-500' : 'text-red-400'}>
                {h.delta > 0 ? '+' : ''}{dw(h.delta)}{ul}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
