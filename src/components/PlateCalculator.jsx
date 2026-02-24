import { useMemo } from 'react';
import { calculatePlates, getPlateColor, getPlateHeight, getPlateWidth } from '../lib/plates';

/**
 * Visual plate calculator — shows plates needed per side.
 * Pass weight in the DISPLAY unit (already converted).
 */
export default function PlateCalculator({ weight, unit = 'lbs', barWeight = null }) {
  const result = useMemo(() => calculatePlates(weight, unit, barWeight), [weight, unit, barWeight]);

  if (!weight || weight <= 0) return null;

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Plate Loading</p>
        {result.remainder > 0 && (
          <p className="text-[10px] text-amber-500">
            ~{result.totalLoaded}{unit} (can't perfectly load {weight}{unit})
          </p>
        )}
      </div>

      {result.perSide.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-1">Bar only ({result.bar}{unit})</p>
      ) : (
        <>
          {/* Visual barbell */}
          <div className="flex items-center justify-center gap-0" style={{ minHeight: '52px' }}>
            {/* Left plates (mirrored) */}
            <div className="flex items-center gap-px flex-row-reverse">
              {result.perSide.map((p, i) => (
                <Plate key={`l-${i}`} weight={p} unit={unit} />
              ))}
            </div>

            {/* Bar */}
            <div className="w-16 h-2 bg-slate-500 rounded-full mx-0.5" />

            {/* Right plates */}
            <div className="flex items-center gap-px">
              {result.perSide.map((p, i) => (
                <Plate key={`r-${i}`} weight={p} unit={unit} />
              ))}
            </div>
          </div>

          {/* Per side summary */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {summarizePlates(result.perSide).map(({ weight: w, count }) => (
              <span key={w} className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{
                backgroundColor: getPlateColor(w, unit) + '22',
                color: getPlateColor(w, unit),
              }}>
                {count > 1 && `${count}x `}{w}{unit}
              </span>
            ))}
            <span className="text-[10px] text-slate-600">per side</span>
          </div>
        </>
      )}
    </div>
  );
}

function Plate({ weight, unit }) {
  const color = getPlateColor(weight, unit);
  const heightPct = getPlateHeight(weight, unit);
  const width = getPlateWidth(weight, unit);

  return (
    <div
      className="rounded-sm flex items-center justify-center"
      style={{
        backgroundColor: color,
        height: `${heightPct * 0.48}px`,
        width: `${width}px`,
        minWidth: `${width}px`,
        fontSize: width > 10 ? '7px' : '6px',
        color: '#000',
        fontWeight: 700,
        writingMode: width > 10 ? 'initial' : 'vertical-rl',
        textOrientation: 'mixed',
      }}
    >
      {width >= 10 && weight}
    </div>
  );
}

function summarizePlates(plates) {
  const counts = {};
  for (const p of plates) {
    counts[p] = (counts[p] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[0] - a[0])
    .map(([w, count]) => ({ weight: Number(w), count }));
}

/**
 * Compact plate display for inline use in set rows.
 */
export function PlateChips({ weight, unit = 'lbs', barWeight = null }) {
  const result = useMemo(() => calculatePlates(weight, unit, barWeight), [weight, unit, barWeight]);

  if (!weight || result.perSide.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {summarizePlates(result.perSide).map(({ weight: w, count }) => (
        <span key={w} className="text-[8px] font-mono px-1 py-0.5 rounded" style={{
          backgroundColor: getPlateColor(w, unit) + '33',
          color: getPlateColor(w, unit),
        }}>
          {count > 1 && `${count}×`}{w}
        </span>
      ))}
    </div>
  );
}
