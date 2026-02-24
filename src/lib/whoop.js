// Whoop API V2 OAuth 2.0 integration.
// Uses the V2 developer API endpoints per OpenAPI spec.
// ALL calls go through Cloudflare Worker proxy (CORS + client_secret).
//
// Flow:
// 1. User clicks "Connect Whoop" → redirect to Whoop auth URL
// 2. Whoop redirects back with ?code=... → exchange via proxy
// 3. Store tokens in localStorage
// 4. Fetch recovery data via proxy → Whoop API

const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';

// Cloudflare Worker proxy URL for token exchange.
const DEFAULT_PROXY = 'https://recovery-whoop-proxy.thejoecrabtree.workers.dev';
const PROXY_BASE = localStorage.getItem('whoop-proxy-url') || DEFAULT_PROXY;

// Client ID for OAuth — safe to have in frontend
const CLIENT_ID = localStorage.getItem('whoop-client-id') || '55675655-8382-4ac2-81d1-98d8290e3260';
const REDIRECT_URI = window.location.origin + window.location.pathname;

// V2 scopes — must match what's enabled in the Whoop developer portal
const SCOPES = 'read:recovery read:cycles read:sleep read:body_measurement';

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    state: crypto.randomUUID(),
  });
  return `${WHOOP_AUTH_URL}?${params}`;
}

export function getProxyUrl() {
  return localStorage.getItem('whoop-proxy-url') || DEFAULT_PROXY;
}

export function isProxyConfigured() {
  const url = getProxyUrl();
  return url.length > 0 && url.startsWith('https://');
}

export async function exchangeCode(code) {
  const proxy = getProxyUrl();
  if (!proxy) throw new Error('Whoop proxy URL not configured. Set it in Settings.');

  const res = await fetch(`${proxy}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Token exchange failed (${res.status})`);
  }
  return res.json(); // { access_token, refresh_token, expires_in }
}

export async function refreshAccessToken(refreshToken) {
  const proxy = getProxyUrl();
  if (!proxy) throw new Error('Whoop proxy URL not configured');

  const res = await fetch(`${proxy}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Token refresh failed (${res.status})`);
  }
  return res.json();
}

// ─── V2 API Fetch Helper (via proxy to avoid CORS) ───────────────

async function whoopFetch(accessToken, path, params = {}) {
  // Route through proxy: /api/v2/recovery → proxy → api.prod.whoop.com/developer/v2/recovery
  const proxy = getProxyUrl();
  const url = new URL(`${proxy}/api${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Whoop API error: ${res.status} ${body}`);
  }
  return res.json();
}

// ─── V2 Endpoints ─────────────────────────────────────────────────

/**
 * GET /v2/user/profile/basic
 * Returns: { user_id, email, first_name, last_name }
 */
export async function fetchProfile(accessToken) {
  return whoopFetch(accessToken, '/v2/user/profile/basic');
}

/**
 * GET /v2/recovery
 * Returns paginated list. We get the latest one.
 * Response shape: { records: [{ cycle_id, sleep_id, user_id, created_at, updated_at, score_state, score: { user_calibrating, recovery_score, resting_heart_rate, hrv_rmssd_milli, spo2_percentage, skin_temp_celsius } }], next_token }
 */
export async function fetchRecovery(accessToken) {
  const data = await whoopFetch(accessToken, '/v2/recovery', { limit: '1' });
  return data?.records?.[0] || null;
}

/**
 * GET /v2/activity/sleep
 * Returns paginated list. We get the latest one.
 * Response shape: { records: [{ id, user_id, created_at, updated_at, start, end, timezone_offset, nap, score_state, score: { stage_summary, sleep_needed, respiratory_rate, sleep_performance_percentage, sleep_consistency_percentage, sleep_efficiency_percentage } }], next_token }
 */
export async function fetchSleep(accessToken) {
  const data = await whoopFetch(accessToken, '/v2/activity/sleep', { limit: '1' });
  return data?.records?.[0] || null;
}

/**
 * GET /v2/user/measurement/body
 * Returns: { height_meter, weight_kilogram, max_heart_rate }
 */
export async function fetchBodyMeasurement(accessToken) {
  return whoopFetch(accessToken, '/v2/user/measurement/body');
}

/**
 * GET /v2/cycle
 * Returns paginated list of physiological cycles (day boundaries for Whoop).
 * Each cycle has strain, kilojoule, average_heart_rate, max_heart_rate.
 */
export async function fetchCycles(accessToken, limit = 7) {
  const data = await whoopFetch(accessToken, '/v2/cycle', { limit: String(limit) });
  return data?.records || [];
}

// ─── Helpers ──────────────────────────────────────────────────────

export function isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt - 60000; // 1 min buffer
}

export function setProxyUrl(url) {
  localStorage.setItem('whoop-proxy-url', url);
}

export function setClientId(id) {
  localStorage.setItem('whoop-client-id', id);
}

/**
 * Extract useful readiness data from Whoop recovery + sleep responses.
 */
export function extractWhoopReadiness(recovery, sleep) {
  const result = {
    recoveryScore: null,
    hrvRmssd: null,
    restingHR: null,
    spo2: null,
    sleepPerformance: null,
    sleepDurationMs: null,
    sleepStages: null,
  };

  if (recovery?.score) {
    result.recoveryScore = recovery.score.recovery_score;
    result.hrvRmssd = recovery.score.hrv_rmssd_milli;
    result.restingHR = recovery.score.resting_heart_rate;
    result.spo2 = recovery.score.spo2_percentage;
  }

  if (sleep?.score) {
    result.sleepPerformance = sleep.score.sleep_performance_percentage;
    if (sleep.score.stage_summary) {
      const s = sleep.score.stage_summary;
      result.sleepDurationMs = (s.total_light_sleep_time_milli || 0)
        + (s.total_slow_wave_sleep_time_milli || 0)
        + (s.total_rem_sleep_time_milli || 0)
        + (s.total_awake_time_milli || 0);
      result.sleepStages = {
        light: s.total_light_sleep_time_milli,
        deep: s.total_slow_wave_sleep_time_milli,
        rem: s.total_rem_sleep_time_milli,
        awake: s.total_awake_time_milli,
      };
    }
  }

  return result;
}
