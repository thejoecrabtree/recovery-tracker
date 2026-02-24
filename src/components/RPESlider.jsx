import { useState } from 'react';

const RPE_COLORS = {
  1: '#22c55e', 2: '#22c55e', 3: '#4ade80', 4: '#4ade80',
  5: '#86efac', 6: '#fbbf24', 7: '#f59e0b',
  8: '#f97316', 9: '#ef4444', 10: '#dc2626',
};

const RPE_LABELS = {
  1: 'Very Light', 2: 'Light', 3: 'Light', 4: 'Moderate',
  5: 'Moderate', 6: 'Hard', 7: 'Hard',
  8: 'Very Hard', 9: 'Max Effort', 10: 'All Out',
};

export default function RPESlider({ value, onChange, targetRPE }) {
  const [local, setLocal] = useState(value || 7);
  const color = RPE_COLORS[local];

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-slate-400">Rate your effort (RPE)</span>
        {targetRPE && (
          <span className="text-xs text-slate-500">Target: {targetRPE[0]}-{targetRPE[1]}</span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-3">
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>{local}</span>
        <span className="text-sm" style={{ color }}>{RPE_LABELS[local]}</span>
      </div>

      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={local}
        onChange={e => {
          const v = Number(e.target.value);
          setLocal(v);
          onChange?.(v);
        }}
        className="w-full h-3 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #22c55e 0%, #fbbf24 50%, #ef4444 100%)`,
        }}
      />

      <div className="flex justify-between mt-1 text-[10px] text-slate-600">
        <span>1</span><span>5</span><span>10</span>
      </div>
    </div>
  );
}
