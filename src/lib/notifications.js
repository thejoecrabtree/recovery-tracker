// PWA notification helpers for workout day reminders

export function isNotificationSupported() {
  return 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'denied';
  return Notification.requestPermission();
}

/**
 * Show a workout reminder notification if:
 * 1. Notifications are enabled in settings
 * 2. Permission is granted
 * 3. It's a workout day
 * 4. We haven't already notified today
 */
export function showWorkoutReminder(dayLabel, todayISO, lastNotifiedDate) {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  if (lastNotifiedDate === todayISO) return false;
  if (!dayLabel) return false;

  // Use service worker registration for persistent notifications
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification('Recovery Tracker', {
        body: `${dayLabel} — ready to train?`,
        icon: './favicon.svg',
        badge: './favicon.svg',
        tag: `workout-${todayISO}`,
        renotify: false,
      });
    }).catch(() => {
      // Fallback to regular notification
      new Notification('Recovery Tracker', {
        body: `${dayLabel} — ready to train?`,
        icon: './favicon.svg',
        tag: `workout-${todayISO}`,
      });
    });
  } else {
    new Notification('Recovery Tracker', {
      body: `${dayLabel} — ready to train?`,
      icon: './favicon.svg',
      tag: `workout-${todayISO}`,
    });
  }

  return true;
}
