import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getData, setData, resetData as resetStorage } from '../lib/storage';
import { isTokenExpired, refreshAccessToken } from '../lib/whoop';
import { showWorkoutReminder } from '../lib/notifications';
import { getProgramDay, toISODate } from '../lib/dates';
import { PROGRAM } from '../data/program';

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

  // Workout day notification on app load
  useEffect(() => {
    if (!data.notifications?.enabled) return;
    if (!data.startDate) return;

    const todayISO = toISODate(new Date());
    const lastNotified = data.notifications?.lastNotifiedDate;
    if (lastNotified === todayISO) return;

    const prog = getProgramDay(data.startDate);
    if (!prog?.started || prog.finished) return;

    const weekData = PROGRAM.weeks[prog.weekNumber - 1];
    const dayData = weekData?.days?.[prog.dayIndex];
    if (!dayData || dayData.isRestDay) return;

    // It's a workout day — send notification after a short delay
    const timer = setTimeout(() => {
      const sent = showWorkoutReminder(dayData.label, todayISO, lastNotified);
      if (sent) {
        update(prev => ({
          ...prev,
          notifications: { ...prev.notifications, lastNotifiedDate: todayISO },
        }));
      }
    }, 2000);

    return () => clearTimeout(timer);
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
