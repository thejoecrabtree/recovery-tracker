import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { toISODate } from '../lib/dates';
import { displayWeightExact, unitLabel, bodyWeightStep, inputToKg } from '../lib/units';

export default function BodyWeightCard() {
  const { data, update } = useApp();
  const [weight, setWeight] = useState('');
  const unit = data.unit || 'kg';
  const ul = unitLabel(unit);
  const step = bodyWeightStep(unit);

  const todayISO = toISODate(new Date());
  const todayEntry = data.bodyWeight?.find(e => e.date === todayISO);
  const entries = data.bodyWeight || [];
  const recent = entries.slice(-10);

  const logWeight = () => {
    const inputVal = parseFloat(weight);
    if (isNaN(inputVal) || inputVal <= 0) return;

    // Convert to kg for storage
    const kg = unit === 'lbs' ? inputToKg(inputVal, 'lbs') : inputVal;

    update(prev => {
      const existing = prev.bodyWeight || [];
      // Replace today's entry or append
      const filtered = existing.filter(e => e.date !== todayISO);
      return {
        ...prev,
        bodyWeight: [...filtered, { date: todayISO, kg }].sort((a, b) => a.date.localeCompare(b.date)),
      };
    });
    setWeight('');
  };

  const dwExact = (kg) => displayWeightExact(kg, unit);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">Body Weight</h3>
          {todayEntry && (
            <p className="text-xs text-slate-500">Today: {dwExact(todayEntry.kg)}{ul}</p>
          )}
        </div>
        {entries.length > 0 && (
          <p className="text-lg font-bold text-slate-200">
            {dwExact(entries[entries.length - 1].kg)}<span className="text-xs text-slate-500 font-normal">{ul}</span>
          </p>
        )}
      </div>

      {/* Sparkline */}
      {recent.length >= 2 && <Sparkline data={recent.map(e => dwExact(e.kg))} />}

      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder={todayEntry ? `${dwExact(todayEntry.kg)}` : unit === 'lbs' ? '187.0' : '85.0'}
            step={step}
            className="w-full bg-slate-800 text-slate-100 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">{ul}</span>
        </div>
        <button
          onClick={logWeight}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold active:bg-emerald-700"
        >
          Log
        </button>
      </div>

      {/* Recent entries */}
      {recent.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {recent.slice(-5).map((e, i) => (
            <span key={i} className="text-[10px] text-slate-600">
              {new Date(e.date + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: {dwExact(e.kg)}{ul}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Sparkline({ data }) {
  const W = 200, H = 30, PAD = 2;
  const min = Math.min(...data) - 0.5;
  const max = Math.max(...data) + 0.5;
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });

  const trend = data[data.length - 1] - data[0];
  const color = Math.abs(trend) < 0.5 ? '#94a3b8' : trend < 0 ? '#22c55e' : '#f59e0b';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '30px' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {data.length > 0 && (
        <circle
          cx={PAD + ((data.length - 1) / (data.length - 1)) * (W - PAD * 2)}
          cy={PAD + (1 - (data[data.length - 1] - min) / range) * (H - PAD * 2)}
          r={2.5}
          fill={color}
        />
      )}
    </svg>
  );
}
