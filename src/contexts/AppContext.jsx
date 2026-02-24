import { createContext, useContext, useState, useCallback } from 'react';
import { getData, setData, resetData as resetStorage } from '../lib/storage';

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
