import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { PROGRAM } from '../data/program';
import { LIFTS } from '../data/exercises';
import { getProgramDay, toISODate, dayName } from '../lib/dates';
import { getEffective1RM } from '../lib/weights';
import { getProxyUrl } from '../lib/whoop';
import { displayWeight, unitLabel } from '../lib/units';

export default function WorkoutCoach({ onClose }) {
  const { data, update } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState(null);

  const unit = data.unit || 'kg';
  const ul = unitLabel(unit);
  const dw = (kg) => displayWeight(kg, unit);

  const buildContext = () => {
    const prog = data.startDate ? getProgramDay(data.startDate) : null;
    const weekNumber = prog?.weekNumber || 1;
    const dayIndex = prog?.dayIndex || 0;
    const weekData = PROGRAM.weeks[weekNumber - 1];
    const dayData = weekData?.days?.[dayIndex];
    const todayISO = toISODate(new Date());
    const readiness = data.readiness?.[todayISO];

    const lifts = Object.entries(LIFTS).map(([key, lift]) => {
      const eff = getEffective1RM(key, data.baseMaxes, data.adjustments);
      return `  ${lift.name}: ${eff}kg (${dw(eff)}${ul})`;
    }).join('\n');

    const workout = dayData?.sections?.map(s =>
      `  - ${s.title || s.name || s.type} (${s.type})`
    ).join('\n') || 'Rest day';

    return {
      week: weekNumber,
      day: dayName(dayIndex),
      dayLabel: dayData?.label || 'Rest Day',
      readiness: readiness ? `${readiness.score}/10` : 'Not set',
      lifts,
      workout,
    };
  };

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setPendingActions(null);

    try {
      const proxy = getProxyUrl();
      const res = await fetch(`${proxy}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: buildContext(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'error', text: data.error || 'Request failed' }]);
      } else {
        setMessages(prev => [...prev, { role: 'coach', text: data.response }]);
        if (data.actions?.length > 0) {
          setPendingActions(data.actions);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', text: err.message || 'Network error' }]);
    } finally {
      setLoading(false);
    }
  };

  const applyActions = () => {
    if (!pendingActions) return;

    for (const action of pendingActions) {
      if (action.type === 'adjust_1rm' && action.lift && action.delta_kg) {
        update(prev => ({
          ...prev,
          adjustments: {
            ...prev.adjustments,
            [action.lift]: Math.max(-15, Math.min(15, (prev.adjustments[action.lift] || 0) + action.delta_kg)),
          },
        }));
      }
      if (action.type === 'add_note' && action.date && action.text) {
        update(prev => ({
          ...prev,
          workoutNotes: {
            ...prev.workoutNotes,
            [action.date]: (prev.workoutNotes?.[action.date] ? prev.workoutNotes[action.date] + '\n' : '') + action.text,
          },
        }));
      }
    }

    setMessages(prev => [...prev, { role: 'system', text: 'Changes applied!' }]);
    setPendingActions(null);
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">&#x1F3CB;</span>
          <h2 className="text-sm font-bold text-slate-200">AI Coach</h2>
        </div>
        <button onClick={onClose} className="text-sm text-slate-500 active:text-slate-300">Close</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center mt-8 space-y-3">
            <p className="text-sm text-slate-500">Ask me to adjust your workout</p>
            <div className="space-y-2">
              {['Add more ab work tomorrow', 'Reduce deadlift weight for next week', 'I feel tight, any warmup tips?'].map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); }}
                  className="block w-full text-left text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 active:bg-slate-800"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user' ? 'bg-emerald-600 text-white' :
              msg.role === 'error' ? 'bg-red-950/50 border border-red-900/30 text-red-400' :
              msg.role === 'system' ? 'bg-emerald-950/50 border border-emerald-900/30 text-emerald-400' :
              'bg-slate-800 text-slate-200'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500">Thinking...</span>
            </div>
          </div>
        )}

        {/* Pending actions */}
        {pendingActions && (
          <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-3 space-y-2">
            <p className="text-xs text-blue-400 font-semibold">Suggested changes:</p>
            {pendingActions.map((a, i) => (
              <p key={i} className="text-xs text-blue-300">
                {a.type === 'adjust_1rm' && `${LIFTS[a.lift]?.name || a.lift}: ${a.delta_kg > 0 ? '+' : ''}${a.delta_kg}kg`}
                {a.type === 'add_note' && `Note for ${a.date}: ${a.text}`}
              </p>
            ))}
            <div className="flex gap-2 pt-1">
              <button
                onClick={applyActions}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold active:bg-emerald-700"
              >
                Apply
              </button>
              <button
                onClick={() => setPendingActions(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold active:bg-slate-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800 bg-slate-950">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="e.g. Add more core work tomorrow..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-600"
            autoFocus
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40 active:bg-emerald-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
