import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { toISODate } from '../lib/dates';
import { calculateReadinessScore, getWorkoutModifications, READINESS_LABELS, whoopRecoveryToReadiness } from '../lib/readiness';
import { fetchRecovery, isTokenExpired, refreshAccessToken } from '../lib/whoop';

export default function ReadinessCheck({ onComplete, onSkip }) {
  const { data, update } = useApp();
  const [mode, setMode] = useState('manual'); // 'manual' | 'whoop'
  const [sleep, setSleep] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [mood, setMood] = useState(3);
  const [whoopLoading, setWhoopLoading] = useState(false);
  const [whoopError, setWhoopError] = useState(null);

  const hasWhoop = !!data.whoop?.accessToken;
  const todayISO = toISODate(new Date());

  const score = calculateReadinessScore({ sleep, soreness, mood });
  const mods = getWorkoutModifications(score);

  const handleSave = (finalScore, source = 'manual') => {
    update(prev => ({
      ...prev,
      readiness: {
        ...prev.readiness,
        [todayISO]: {
          score: finalScore,
          sleep: source === 'manual' ? sleep : null,
          soreness: source === 'manual' ? soreness : null,
          mood: source === 'manual' ? mood : null,
          source,
          timestamp: new Date().toISOString(),
        },
      },
    }));
    onComplete?.(finalScore);
  };

  const handleWhoopFetch = async () => {
    setWhoopLoading(true);
    setWhoopError(null);
    try {
      let token = data.whoop.accessToken;

      // Refresh if expired
      if (isTokenExpired(data.whoop.expiresAt)) {
        const refreshed = await refreshAccessToken(data.whoop.refreshToken);
        token = refreshed.access_token;
        update(prev => ({
          ...prev,
          whoop: {
            ...prev.whoop,
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token || prev.whoop.refreshToken,
            expiresAt: Date.now() + refreshed.expires_in * 1000,
          },
        }));
      }

      const recovery = await fetchRecovery(token);
      if (recovery?.score?.recovery_score != null) {
        const readinessScore = whoopRecoveryToReadiness(recovery.score.recovery_score);
        handleSave(readinessScore, 'whoop');
      } else {
        setWhoopError('No recovery data available. Try manual check-in.');
      }
    } catch (err) {
      setWhoopError(err.message === 'UNAUTHORIZED' ? 'Session expired. Reconnect in Settings.' : 'Failed to fetch Whoop data.');
    } finally {
      setWhoopLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center">
      <div className="w-full max-w-lg bg-slate-900 rounded-t-2xl p-6 space-y-5 animate-slide-up">
        <div>
          <h2 className="text-lg font-bold text-slate-100">How Are You Feeling?</h2>
          <p className="text-xs text-slate-500">Your readiness affects today's workout intensity</p>
        </div>

        {/* Mode toggle */}
        {hasWhoop && (
          <div className="flex gap-2">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode === 'manual' ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-slate-500'}`}
            >
              Manual
            </button>
            <button
              onClick={() => setMode('whoop')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode === 'whoop' ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-slate-500'}`}
            >
              Whoop
            </button>
          </div>
        )}

        {mode === 'manual' ? (
          <>
            <SliderInput
              label="Sleep Quality"
              value={sleep}
              onChange={setSleep}
              labels={READINESS_LABELS.sleep}
            />
            <SliderInput
              label="Soreness"
              value={soreness}
              onChange={setSoreness}
              labels={READINESS_LABELS.soreness}
            />
            <SliderInput
              label="Mood / Energy"
              value={mood}
              onChange={setMood}
              labels={READINESS_LABELS.mood}
            />

            {/* Score preview */}
            <div className="bg-slate-800 rounded-xl p-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{mods.emoji}</span>
                <span className="text-lg font-bold" style={{ color: mods.color }}>{mods.label}</span>
              </div>
              <p className="text-xs text-slate-500">Readiness: {score}/10</p>
              <p className="text-xs text-slate-500">{mods.description}</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-6 text-center space-y-3">
              <p className="text-sm text-slate-300">Pull your latest recovery score from Whoop</p>
              <button
                onClick={handleWhoopFetch}
                disabled={whoopLoading}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold active:bg-emerald-700 disabled:opacity-50"
              >
                {whoopLoading ? 'Fetching...' : 'Fetch Recovery'}
              </button>
              {whoopError && <p className="text-xs text-red-400">{whoopError}</p>}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-semibold active:bg-slate-700"
          >
            Skip
          </button>
          {mode === 'manual' && (
            <button
              onClick={() => handleSave(score, 'manual')}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold active:bg-emerald-700"
            >
              Save & Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderInput({ label, value, onChange, labels }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-300 font-medium">{label}</span>
        <span className="text-sm text-slate-400">{labels[value - 1]}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              v === value
                ? 'bg-emerald-600 text-white'
                : v <= value
                ? 'bg-emerald-900/30 text-emerald-400'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
