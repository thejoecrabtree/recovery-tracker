import { useState } from 'react';

export default function WorkoutNotes({ initialNotes, onSave, onSkip }) {
  const [notes, setNotes] = useState(initialNotes || '');

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
      <div className="w-full max-w-lg bg-slate-900 rounded-t-2xl p-6 space-y-4 animate-slide-up">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Workout Notes</h2>
          <p className="text-xs text-slate-500">How did it feel? Any tweaks for next time?</p>
        </div>

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Energy was good, hip felt tight on squats..."
          className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-emerald-600"
          autoFocus
        />

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-semibold active:bg-slate-700"
          >
            Skip
          </button>
          <button
            onClick={() => onSave(notes)}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold active:bg-emerald-700"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}

export function InlineNotes({ notes, onChange, editable = false }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(notes || '');

  if (!notes && !editable) return null;

  if (editing) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 resize-none focus:outline-none focus:border-emerald-600"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={() => { setEditing(false); setValue(notes || ''); }}
            className="flex-1 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => { onChange?.(value); setEditing(false); }}
            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => editable && setEditing(true)}
      className="w-full text-left bg-slate-900/50 border border-slate-800/50 rounded-xl p-3"
    >
      <div className="flex items-start gap-2">
        <span className="text-sm">📝</span>
        <div className="flex-1">
          <p className="text-xs text-slate-500 font-medium mb-0.5">Notes</p>
          <p className="text-sm text-slate-400">{notes || 'Add notes...'}</p>
        </div>
        {editable && <span className="text-xs text-slate-600">Edit</span>}
      </div>
    </button>
  );
}
