import { useState, useEffect, useRef } from 'react';

export default function RestTimer({ seconds = 120, onDismiss, onComplete }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const totalRef = useRef(seconds);

  useEffect(() => {
    if (!running) return;

    startTimeRef.current = Date.now() - (totalRef.current - remaining) * 1000;

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const left = Math.max(0, Math.round(totalRef.current - elapsed));
      setRemaining(left);

      if (left <= 0) {
        clearInterval(intervalRef.current);
        setRunning(false);
        // Vibrate on finish
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
        onComplete?.();
      }
    }, 250);

    return () => clearInterval(intervalRef.current);
  }, [running]);

  const progress = remaining / totalRef.current;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  const display = `${min}:${sec.toString().padStart(2, '0')}`;

  // SVG circle dimensions
  const R = 44;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - progress);

  return (
    <div className="flex flex-col items-center py-4 space-y-3">
      <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Rest Timer</p>

      {/* Circular progress */}
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle cx="50" cy="50" r={R} fill="none" stroke="#1e293b" strokeWidth="6" />
          {/* Progress ring */}
          <circle
            cx="50" cy="50" r={R}
            fill="none"
            stroke={remaining <= 10 ? '#ef4444' : remaining <= 30 ? '#f59e0b' : '#22c55e'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.5s' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-mono font-bold text-slate-100">{display}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            clearInterval(intervalRef.current);
            onDismiss?.();
          }}
          className="px-5 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-sm font-semibold active:bg-slate-700"
        >
          Skip
        </button>
        {remaining > 0 && (
          <button
            onClick={() => setRunning(prev => !prev)}
            className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold active:bg-slate-700"
          >
            {running ? 'Pause' : 'Resume'}
          </button>
        )}
        {remaining === 0 && (
          <button
            onClick={onDismiss}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold active:bg-emerald-700"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
