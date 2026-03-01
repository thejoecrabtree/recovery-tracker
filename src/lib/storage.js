const STORAGE_KEY = 'recovery-tracker-data';

const DEFAULT_DATA = {
  version: 5,
  startDate: null,
  barWeight: 20, // kg — men's Olympic bar. Women's = 15
  unit: 'kg', // 'kg' or 'lbs' — display preference
  notifications: { enabled: false, lastNotifiedDate: null },
  baseMaxes: {
    backSquat: 120,
    deadlift: 120,
    bench: 65,
    pushPress: 45,
    hipThrust: 90,
    powerClean: 82.5,
    snatch: 40,
  },
  adjustments: {
    backSquat: 0,
    deadlift: 0,
    bench: 0,
    pushPress: 0,
    hipThrust: 0,
    powerClean: 0,
    snatch: 0,
  },
  adjustmentHistory: [],
  workoutLogs: {},
  bodyWeight: [],
  workoutNotes: {},
  personalRecords: {},
  readiness: {},
  metconScores: {},  // { [metconName]: [{ date, score, variant, format }] }
  restTimerDefaults: { strength: 120, accessory: 60 },
  whoop: { accessToken: null, refreshToken: null, expiresAt: null, userId: null },
};

function migrateData(data) {
  let d = { ...data };

  // V1 → V2 migration
  if (!d.version || d.version < 2) {
    d = {
      ...DEFAULT_DATA,
      ...d,
      version: 2,
      bodyWeight: d.bodyWeight || [],
      workoutNotes: d.workoutNotes || {},
      personalRecords: d.personalRecords || {},
      readiness: d.readiness || {},
      restTimerDefaults: d.restTimerDefaults || { strength: 120, accessory: 60 },
      whoop: d.whoop || { accessToken: null, refreshToken: null, expiresAt: null, userId: null },
    };
  }

  // V2 → V3 migration: add unit preference and metcon scores
  if (d.version < 3) {
    d = {
      ...d,
      version: 3,
      unit: d.unit || 'kg',
      metconScores: d.metconScores || {},
    };
  }

  // V3 → V4 migration: add bar weight setting
  if (d.version < 4) {
    d = {
      ...d,
      version: 4,
      barWeight: d.barWeight || 20,
    };
  }

  // V4 → V5 migration: add notification preferences
  if (d.version < 5) {
    d = {
      ...d,
      version: 5,
      notifications: d.notifications || { enabled: false, lastNotifiedDate: null },
    };
  }

  return d;
}

export function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw);
    const migrated = migrateData(parsed);
    if (parsed.version !== migrated.version) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function setData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function updateData(updater) {
  const current = getData();
  const updated = updater(current);
  setData(updated);
  return updated;
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_DATA };
}

export function exportData() {
  const data = getData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recovery-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.version && data.baseMaxes) {
          const migrated = migrateData(data);
          setData(migrated);
          resolve(migrated);
        } else {
          reject(new Error('Invalid backup file'));
        }
      } catch {
        reject(new Error('Could not parse file'));
      }
    };
    reader.readAsText(file);
  });
}
