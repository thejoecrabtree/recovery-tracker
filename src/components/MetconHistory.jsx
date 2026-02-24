import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';

/**
 * MetconHistory — shows score history for all completed metcons.
 * Scores are stored in data.metconScores: { [name]: [{ date, score, variant, format }] }
 */
export default function MetconHistory() {
  const { data } = useApp();

  const metcons = useMemo(() => {
    const scores = data.metconScores || {};
    return Object.entries(scores)
      .filter(([, entries]) => entries.length > 0)
      .map(([name, entries]) => ({
        name,
        entries: [...entries].sort((a, b) => a.date.localeCompare(b.date)),
        latest: entries[entries.length - 1],
        count: entries.length,
      }))
      .sort((a, b) => b.latest.date.localeCompare(a.latest.date));
  }, [data.metconScores]);

  if (metcons.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">{'\u{1F3CB}\u{FE0F}'}</p>
        <p className="text-slate-400">No metcon scores logged yet.</p>
        <p className="text-xs text-slate-600 mt-1">Complete metcons and log your score to track progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {metcons.map(({ name, entries, latest, count }) => (
        <MetconCard key={name} name={name} entries={entries} latest={latest} count={count} />
      ))}
    </div>
  );
}

function MetconCard({ name, entries, latest, count }) {
  // Parse scores for charting — attempt to extract numeric values
  const numericScores = entries.map(e => ({
    ...e,
    numeric: parseScore(e.score, e.format),
  })).filter(e => e.numeric !== null);

  const hasTrend = numericScores.length >= 2;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200">{name}</h3>
          <p className="text-[10px] text-slate-500">{count} attempt{count !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-400 font-mono">{latest.score}</p>
          <p className="text-[10px] text-slate-500">
            {latest.variant?.toUpperCase()} · {formatDateShort(latest.date)}
          </p>
        </div>
      </div>

      {/* Score trend chart */}
      {hasTrend && (
        <ScoreTrend scores={numericScores} format={latest.format} />
      )}

      {/* History list */}
      {entries.length > 1 && (
        <div className="space-y-1">
          {[...entries].reverse().map((e, i) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <span className="text-slate-500">{formatDateShort(e.date)}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  e.variant === 'rx' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'
                }`}>
                  {e.variant?.toUpperCase()}
                </span>
                <span className="text-slate-200 font-mono">{e.score}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreTrend({ scores, format }) {
  const W = 280, H = 50, PAD = 5;
  const values = scores.map(s => s.numeric);
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.1 || 1;
  const range = max - min || 1;

  // For "forTime" format, lower is better — invert the chart
  const isLowerBetter = format === 'forTime';

  const points = values.map((v, i) => {
    const x = PAD + (i / Math.max(values.length - 1, 1)) * (W - PAD * 2);
    const normalized = (v - min) / range;
    const y = PAD + (isLowerBetter ? normalized : 1 - normalized) * (H - PAD * 2);
    return { x, y, v };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Determine trend
  const first = values[0];
  const last = values[values.length - 1];
  const improving = isLowerBetter ? last < first : last > first;
  const color = improving ? '#22c55e' : '#f59e0b';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '50px' }}>
      <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} />
      ))}
    </svg>
  );
}

/**
 * Parse a score string into a numeric value for charting.
 * Supports: "8:45" → 525 (seconds), "4+12" → 4.12, plain numbers.
 */
function parseScore(score, format) {
  if (!score) return null;
  const s = String(score).trim();

  // Time format: "M:SS" or "MM:SS"
  const timeMatch = s.match(/^(\d+):(\d{2})$/);
  if (timeMatch) {
    return parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
  }

  // AMRAP format: "4+12"
  const amrapMatch = s.match(/^(\d+)\+(\d+)$/);
  if (amrapMatch) {
    return parseInt(amrapMatch[1]) * 100 + parseInt(amrapMatch[2]);
  }

  // Plain number
  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}
