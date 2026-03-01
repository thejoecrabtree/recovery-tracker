import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { toISODate } from '../lib/dates';
import { fetchRecovery, fetchSleep, isTokenExpired, refreshAccessToken, extractWhoopReadiness } from '../lib/whoop';
import { whoopRecoveryToReadiness, getWorkoutModifications } from '../lib/readiness';

/**
 * WhoopReadiness — auto-fetches Whoop recovery + sleep data
 * and displays it as a visual card with icons.
 * Replaces the manual readiness check-in when Whoop is connected.
 */
export default function WhoopReadiness() {
  const { data, update } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [whoopData, setWhoopData] = useState(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const todayISO = toISODate(new Date());
  const todayReadiness = data.readiness?.[todayISO];
  const hasWhoop = !!data.whoop?.accessToken;

  // Auto-fetch on mount whenever Whoop is connected
  useEffect(() => {
    if (!hasWhoop) return;
    // Always fetch fresh data — only skip if we already have Whoop metrics from this session
    if (!whoopData) {
      fetchWhoopData();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWhoopData = async () => {
    setLoading(true);
    setError(null);
    setFetchAttempted(true);
    try {
      let token = data.whoop.accessToken;

      // Refresh if expired
      if (isTokenExpired(data.whoop.expiresAt)) {
        console.log('[Whoop] Token expired, refreshing...');
        try {
          const refreshed = await refreshAccessToken(data.whoop.refreshToken);
          if (!refreshed.access_token) {
            throw new Error('No access_token in refresh response');
          }
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
          console.log('[Whoop] Token refreshed successfully');
        } catch (refreshErr) {
          console.error('[Whoop] Token refresh failed:', refreshErr);
          setError(`Token refresh failed: ${refreshErr.message}`);
          setLoading(false);
          return;
        }
      }

      // Fetch recovery + sleep in parallel
      let recoveryErr = null;
      let sleepErr = null;
      const [recovery, sleep] = await Promise.all([
        fetchRecovery(token).catch(e => { recoveryErr = e; console.warn('[Whoop] recovery fetch failed:', e); return null; }),
        fetchSleep(token).catch(e => { sleepErr = e; console.warn('[Whoop] sleep fetch failed:', e); return null; }),
      ]);

      console.log('[Whoop] recovery:', JSON.stringify(recovery));
      console.log('[Whoop] sleep:', JSON.stringify(sleep));

      // If both failed, show error
      if (!recovery && !sleep) {
        const msgs = [];
        if (recoveryErr) msgs.push(`Recovery: ${recoveryErr.message}`);
        if (sleepErr) msgs.push(`Sleep: ${sleepErr.message}`);
        setError(msgs.length ? msgs.join(' | ') : 'No data returned from Whoop');
        setLoading(false);
        return;
      }

      const extracted = extractWhoopReadiness(recovery, sleep);
      console.log('[Whoop] extracted:', JSON.stringify(extracted));
      setWhoopData(extracted);

      // Auto-save readiness if we got a recovery score
      if (extracted.recoveryScore != null) {
        const readinessScore = whoopRecoveryToReadiness(extracted.recoveryScore);
        update(prev => ({
          ...prev,
          readiness: {
            ...prev.readiness,
            [todayISO]: {
              score: readinessScore,
              source: 'whoop',
              recoveryPct: extracted.recoveryScore,
              hrv: extracted.hrvRmssd,
              restingHR: extracted.restingHR,
              sleepPerformance: extracted.sleepPerformance,
              timestamp: new Date().toISOString(),
            },
          },
        }));
      } else {
        // Recovery came back but score was null (possible PENDING state)
        setError('Recovery score not available yet — Whoop may still be processing');
      }
    } catch (err) {
      console.error('[Whoop] fetch error:', err);
      if (err.message === 'UNAUTHORIZED') {
        // Try one more refresh before giving up
        try {
          const refreshed = await refreshAccessToken(data.whoop.refreshToken);
          if (refreshed.access_token) {
            update(prev => ({
              ...prev,
              whoop: {
                ...prev.whoop,
                accessToken: refreshed.access_token,
                refreshToken: refreshed.refresh_token || prev.whoop.refreshToken,
                expiresAt: Date.now() + (refreshed.expires_in || 3600) * 1000,
              },
            }));
            // Retry the fetch with new token
            setLoading(false);
            setTimeout(fetchWhoopData, 500);
            return;
          }
        } catch {
          // Refresh truly failed
        }
        setError('Whoop session expired. Go to Settings to reconnect.');
      } else {
        setError(err.message || 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hasWhoop) return null;

  // Use fresh fetched data first, then fall back to stored readiness
  const recoveryPct = whoopData?.recoveryScore ?? todayReadiness?.recoveryPct ?? null;
  const hrv = whoopData?.hrvRmssd ?? todayReadiness?.hrv ?? null;
  const restingHR = whoopData?.restingHR ?? todayReadiness?.restingHR ?? null;
  const sleepPct = whoopData?.sleepPerformance ?? todayReadiness?.sleepPerformance ?? null;

  const readinessScore = whoopData?.recoveryScore != null
    ? whoopRecoveryToReadiness(whoopData.recoveryScore)
    : todayReadiness?.score ?? null;
  const mods = readinessScore ? getWorkoutModifications(readinessScore) : null;

  // Recovery color
  const recoveryColor = recoveryPct >= 67 ? '#22c55e' : recoveryPct >= 34 ? '#f59e0b' : recoveryPct != null ? '#ef4444' : '#64748b';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={recoveryColor} strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Whoop</span>
        </div>
        <button
          onClick={fetchWhoopData}
          disabled={loading}
          className="text-[10px] text-slate-500 active:text-slate-300 disabled:opacity-50"
        >
          {loading ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 flex items-center gap-2">
          <p className="text-xs text-red-400 flex-1">{error}</p>
          <button
            onClick={fetchWhoopData}
            className="text-[10px] text-emerald-500 font-semibold active:text-emerald-300 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="px-4 py-6 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Fetching recovery data...</span>
        </div>
      ) : (
        <>
          {/* Main recovery score */}
          <div className="px-4 py-3 flex items-center gap-4">
            {/* Big recovery % */}
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
                {recoveryPct != null && (
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke={recoveryColor} strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${recoveryPct * 0.974} 100`}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold" style={{ color: recoveryColor }}>
                  {recoveryPct != null ? `${Math.round(recoveryPct)}` : '--'}
                </span>
              </div>
            </div>

            {/* Label + readiness */}
            <div className="flex-1">
              <p className="text-xs text-slate-500">Recovery</p>
              {mods && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm">{mods.emoji}</span>
                  <span className="text-sm font-bold" style={{ color: mods.color }}>{mods.label}</span>
                </div>
              )}
              {mods && mods.label !== 'Normal' && mods.label !== 'Full Send' && (
                <p className="text-[10px] text-slate-600 mt-0.5">{mods.description}</p>
              )}
            </div>
          </div>

          {/* Metric icons row */}
          <div className="grid grid-cols-3 border-t border-slate-800">
            <MetricCell
              icon={<HRVIcon />}
              label="HRV"
              value={hrv != null ? `${Math.round(hrv)}` : '--'}
              unit="ms"
            />
            <MetricCell
              icon={<HeartIcon />}
              label="Resting HR"
              value={restingHR != null ? `${Math.round(restingHR)}` : '--'}
              unit="bpm"
              border
            />
            <MetricCell
              icon={<MoonIcon />}
              label="Sleep"
              value={sleepPct != null ? `${Math.round(sleepPct)}` : '--'}
              unit="%"
            />
          </div>
        </>
      )}
    </div>
  );
}

function MetricCell({ icon, label, value, unit, border }) {
  return (
    <div className={`py-3 px-3 text-center ${border ? 'border-x border-slate-800' : ''}`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-[9px] text-slate-500 uppercase">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-200">
        {value}<span className="text-[10px] text-slate-500 font-normal ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

function HRVIcon() {
  return (
    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
    </svg>
  );
}
