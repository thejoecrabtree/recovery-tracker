import { useState } from 'react';
import Timer from './Timer';

export default function MetconLogger({ section, defaultVariant, onComplete }) {
  const { name, format, description, rx, scaled, timeSeconds, target } = section;
  const [variant, setVariant] = useState(defaultVariant || 'rx');
  const [score, setScore] = useState('');
  const [timerDone, setTimerDone] = useState(false);

  const movements = variant === 'rx' ? rx : scaled;

  const handleComplete = () => {
    onComplete?.({ variant, score, name, format });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-100">{name || 'Metcon'}</h3>
        <p className="text-sm text-slate-400">{description}</p>
        {target && <p className="text-xs text-emerald-500 mt-1">Target: {target}</p>}
      </div>

      {/* RX / Scaled toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setVariant('rx')}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm ${variant === 'rx' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >
          RX
        </button>
        <button
          onClick={() => setVariant('scaled')}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm ${variant === 'scaled' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >
          Scaled
        </button>
      </div>

      {/* Movements */}
      <div className="bg-slate-800 rounded-xl p-4 space-y-1">
        {movements?.map((m, i) => (
          <p key={i} className={`text-sm ${m === '' ? 'h-2' : m.endsWith(':') ? 'text-slate-400 font-semibold mt-2 first:mt-0' : 'text-slate-200'}`}>
            {m}
          </p>
        ))}
      </div>

      {/* Timer */}
      {timeSeconds > 0 && (
        <Timer
          seconds={format === 'amrap' || format === 'intervals' ? timeSeconds : 0}
          countDown={format === 'amrap' || format === 'intervals'}
          onFinish={() => setTimerDone(true)}
        />
      )}

      {/* Score input */}
      <div className="bg-slate-800 rounded-xl p-4">
        <label className="text-sm text-slate-400 block mb-2">
          Score {format === 'forTime' ? '(time, e.g. 8:45)' : format === 'amrap' ? '(rounds + reps, e.g. 4+12)' : '(total)'}
        </label>
        <input
          type="text"
          value={score}
          onChange={e => setScore(e.target.value)}
          placeholder={format === 'forTime' ? '8:45' : '4+12'}
          className="w-full bg-slate-700 text-slate-100 rounded-lg px-4 py-3 text-lg font-mono"
        />
      </div>

      <button
        onClick={handleComplete}
        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold text-lg active:bg-emerald-700"
      >
        Log Metcon
      </button>
    </div>
  );
}
