import { useTimer } from '../hooks/useTimer';

export default function Timer({ seconds: initialSeconds, countDown = false, onFinish }) {
  const { seconds, running, finished, start, pause, reset, display } = useTimer(initialSeconds, countDown);

  return (
    <div className="bg-slate-800 rounded-xl p-4 text-center">
      <div className="text-5xl font-mono font-bold tabular-nums mb-4" style={{ color: finished ? '#22c55e' : running ? '#fbbf24' : '#94a3b8' }}>
        {display}
      </div>

      <div className="flex gap-3 justify-center">
        {!running && !finished && (
          <button onClick={start} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-lg active:bg-emerald-700">
            Start
          </button>
        )}
        {running && (
          <button onClick={pause} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold text-lg active:bg-amber-700">
            Pause
          </button>
        )}
        {(running || finished) && (
          <button onClick={() => { reset(); onFinish?.(seconds); }} className="px-6 py-3 bg-slate-700 text-slate-300 rounded-xl font-semibold text-lg active:bg-slate-600">
            Reset
          </button>
        )}
        {finished && (
          <button onClick={() => onFinish?.(countDown ? initialSeconds : seconds)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-lg active:bg-emerald-700">
            Done
          </button>
        )}
      </div>

      {finished && <p className="text-emerald-400 text-sm mt-2 font-medium">Time!</p>}
    </div>
  );
}
