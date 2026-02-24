import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { exchangeCode, fetchProfile } from '../lib/whoop';

/**
 * Handles the Whoop OAuth callback.
 *
 * After the user authorizes on Whoop, they're redirected back to:
 *   https://thejoecrabtree.github.io/recovery-tracker/?code=ABC123&state=XYZ
 *
 * Since we use HashRouter, the ?code param is in window.location.search.
 * This component detects it on mount, exchanges the code for tokens via
 * the Cloudflare Worker proxy, stores them, and cleans up the URL.
 */
export default function WhoopCallback() {
  const { update } = useApp();
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const oauthError = params.get('error');

    // Handle OAuth error redirect (e.g. invalid_scope)
    if (oauthError) {
      const hint = params.get('error_hint') || params.get('error_description') || oauthError;
      setError(hint);
      setStatus('error');
      const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
      return;
    }

    if (!code) return; // No OAuth callback in progress

    setStatus('loading');

    (async () => {
      try {
        // Exchange authorization code for tokens
        const tokens = await exchangeCode(code);

        if (!tokens.access_token) {
          throw new Error(tokens.error || 'No access token received');
        }

        const expiresAt = Date.now() + (tokens.expires_in || 3600) * 1000;

        // Try to fetch profile for display
        let userId = null;
        let name = '';
        try {
          const profile = await fetchProfile(tokens.access_token);
          userId = profile.user_id;
          name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
          setUserName(name);
        } catch {
          // Profile fetch is optional — tokens still work
        }

        // Store tokens in app data
        update(prev => ({
          ...prev,
          whoop: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt,
            userId,
          },
        }));

        setStatus('success');

        // Clean up URL — remove ?code= and &state= params
        const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);

        // Auto-dismiss after 3s
        setTimeout(() => setStatus(null), 3000);
      } catch (err) {
        console.error('Whoop OAuth error:', err);
        setError(err.message || 'Failed to connect Whoop');
        setStatus('error');

        // Clean up URL even on error
        const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!status) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      {status === 'loading' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3 shadow-2xl">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-300">Connecting to Whoop...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="bg-emerald-950/80 border border-emerald-800/50 rounded-xl p-4 flex items-center gap-3 shadow-2xl">
          <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <div>
            <p className="text-sm text-emerald-400 font-medium">Whoop connected!</p>
            {userName && <p className="text-xs text-emerald-600">Welcome, {userName}</p>}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-950/80 border border-red-800/50 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-400 font-medium">Whoop connection failed</p>
              <p className="text-xs text-red-500">{error}</p>
            </div>
            <button
              onClick={() => setStatus(null)}
              className="text-xs text-red-400 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
