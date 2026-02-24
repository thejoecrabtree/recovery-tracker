import { useState, useRef, useCallback, useEffect } from 'react';

export function useTimer(initialSeconds = 0, countDown = false) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  const tick = useCallback(() => {
    setSeconds(prev => {
      if (countDown) {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setRunning(false);
          setFinished(true);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return next;
      }
      return prev + 1;
    });
  }, [countDown]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setRunning(true);
    setFinished(false);
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const resetTimer = useCallback((newSeconds) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSeconds(newSeconds ?? initialSeconds);
    setRunning(false);
    setFinished(false);
  }, [initialSeconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return { seconds, running, finished, start, pause, reset: resetTimer, display: formatTime(seconds) };
}
