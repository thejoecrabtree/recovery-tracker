import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getData, setData, resetData as resetStorage } from '../lib/storage';
import { isTokenExpired, refreshAccessToken } from '../lib/whoop';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setDataState] = useState(() => getData());

  const update = useCallback((updater) => {
    setDataState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      setData(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const fresh = resetStorage();
    setDataState(fresh);
  }, []);

  // Proactive Whoop token refresh on app load
  useEffect(() => {
    const whoop = data.whoop;
    if (!whoop?.accessToken || !whoop?.refreshToken) return;
    if (!isTokenExpired(whoop.expiresAt)) return;

    console.log('[Whoop] Token expired on app load, refreshing proactively...');
    refreshAccessToken(whoop.refreshToken)
      .then(refreshed => {
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
          console.log('[Whoop] Proactive token refresh succeeded');
        }
      })
      .catch(err => {
        console.warn('[Whoop] Proactive token refresh failed:', err.message);
        // Don't clear tokens — WhoopReadiness will handle retry/error display
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider value={{ data, update, reset }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
