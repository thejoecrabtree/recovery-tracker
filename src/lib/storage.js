const STORAGE_KEY = 'recovery-tracker-data';

const DEFAULT_DATA = {
  version: 1,
  startDate: null,
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
};

export function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_DATA, ...parsed };
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
          setData(data);
          resolve(data);
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
