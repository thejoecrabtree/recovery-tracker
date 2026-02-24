import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { LIFTS } from '../data/exercises';
import { exportData, importData } from '../lib/storage';

export default function SettingsView() {
  const { data, update, reset } = useApp();
  const [showReset, setShowReset] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const setStartDate = (dateStr) => {
    update(prev => ({ ...prev, startDate: dateStr }));
  };

  const updateMax = (liftKey, delta) => {
    update(prev => ({
      ...prev,
      baseMaxes: {
        ...prev.baseMaxes,
        [liftKey]: Math.max(0, (prev.baseMaxes[liftKey] || 0) + delta),
      },
      adjustments: {
        ...prev.adjustments,
        [liftKey]: 0, // reset adjustment when base changes
      },
    }));
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importData(file);
      update(imported);
      setImportMsg('Data imported successfully');
    } catch (err) {
      setImportMsg(err.message);
    }
  };

  const handleReset = () => {
    reset();
    setShowReset(false);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Start Date */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Program Start Date</h2>
        <p className="text-xs text-slate-500">The Monday your 12-week program begins</p>
        <input
          type="date"
          value={data.startDate || ''}
          onChange={e => setStartDate(e.target.value)}
          className="w-full bg-slate-800 text-slate-100 rounded-lg px-4 py-3 text-lg"
        />
      </div>

      {/* 1RMs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">Base 1RMs</h2>
        <p className="text-xs text-slate-500">Changing a base 1RM resets its RPE adjustment to 0</p>

        {Object.entries(LIFTS).map(([key, lift]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-200">{lift.name}</p>
              {data.adjustments[key] !== 0 && (
                <p className="text-[10px] text-slate-500">
                  Adj: {data.adjustments[key] > 0 ? '+' : ''}{data.adjustments[key]}kg
                  = {data.baseMaxes[key] + data.adjustments[key]}kg effective
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateMax(key, -2.5)}
                className="w-10 h-10 bg-slate-800 rounded-lg text-xl text-slate-400 active:bg-slate-700 flex items-center justify-center"
              >
                -
              </button>
              <span className="w-16 text-center text-lg font-mono font-bold">{data.baseMaxes[key]}</span>
              <button
                onClick={() => updateMax(key, 2.5)}
                className="w-10 h-10 bg-slate-800 rounded-lg text-xl text-slate-400 active:bg-slate-700 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Export / Import */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Data</h2>

        <button
          onClick={exportData}
          className="w-full py-3 bg-slate-800 text-slate-300 rounded-lg font-semibold active:bg-slate-700"
        >
          Export Backup (JSON)
        </button>

        <label className="w-full py-3 bg-slate-800 text-slate-300 rounded-lg font-semibold text-center block cursor-pointer active:bg-slate-700">
          Import Backup
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>

        {importMsg && <p className="text-xs text-center text-slate-400">{importMsg}</p>}
      </div>

      {/* Reset */}
      <div className="bg-slate-900 border border-red-900/30 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="w-full py-3 bg-red-950/50 text-red-400 rounded-lg font-semibold border border-red-900/30 active:bg-red-950"
          >
            Reset All Data
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-red-400">This will delete all workout logs, 1RM adjustments, and settings. This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold active:bg-red-700"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-lg font-semibold active:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-slate-700 pb-4">Recovery Tracker v1.0</p>
    </div>
  );
}
