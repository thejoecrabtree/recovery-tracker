import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { LIFTS } from '../data/exercises';
import { exportData, importData } from '../lib/storage';
import { getAuthUrl, setProxyUrl, getProxyUrl, isProxyConfigured } from '../lib/whoop';
import { displayWeight, unitLabel, getIncrement } from '../lib/units';
import { isNotificationSupported, getNotificationPermission, requestNotificationPermission } from '../lib/notifications';
import BodyWeightCard from './BodyWeightCard';

export default function SettingsView() {
  const { data, update, reset } = useApp();
  const [showReset, setShowReset] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [proxyUrl, setProxyUrlState] = useState(() => getProxyUrl());
  const [showProxySetup, setShowProxySetup] = useState(false);
  const unit = data.unit || 'kg';
  const ul = unitLabel(unit);

  const setStartDate = (dateStr) => {
    update(prev => ({ ...prev, startDate: dateStr }));
  };

  const toggleUnit = () => {
    update(prev => ({ ...prev, unit: prev.unit === 'lbs' ? 'kg' : 'lbs' }));
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
        [liftKey]: 0,
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

  const updateRestTimer = (type, value) => {
    update(prev => ({
      ...prev,
      restTimerDefaults: { ...prev.restTimerDefaults, [type]: value },
    }));
  };

  const disconnectWhoop = () => {
    update(prev => ({
      ...prev,
      whoop: { accessToken: null, refreshToken: null, expiresAt: null, userId: null },
    }));
  };

  const dw = (kg) => displayWeight(kg, unit);
  const inc = getIncrement(unit);

  return (
    <div className="p-4 pb-24 space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Unit Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Weight Unit</h2>
        <p className="text-xs text-slate-500">All weights will display in your chosen unit</p>
        <div className="flex gap-2">
          <button
            onClick={() => update(prev => ({ ...prev, unit: 'kg' }))}
            className={`flex-1 py-3 rounded-lg font-bold text-lg ${unit === 'kg' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            kg
          </button>
          <button
            onClick={() => update(prev => ({ ...prev, unit: 'lbs' }))}
            className={`flex-1 py-3 rounded-lg font-bold text-lg ${unit === 'lbs' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            lbs
          </button>
        </div>
      </div>

      {/* Bar Weight */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Bar Weight</h2>
        <p className="text-xs text-slate-500">Standard Olympic bar used for plate calculations</p>
        <div className="flex gap-2">
          <button
            onClick={() => update(prev => ({ ...prev, barWeight: 20 }))}
            className={`flex-1 py-3 rounded-lg font-bold text-sm ${(data.barWeight || 20) === 20 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Men's — {unit === 'lbs' ? '45 lbs' : '20 kg'}
          </button>
          <button
            onClick={() => update(prev => ({ ...prev, barWeight: 15 }))}
            className={`flex-1 py-3 rounded-lg font-bold text-sm ${data.barWeight === 15 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Women's — {unit === 'lbs' ? '35 lbs' : '15 kg'}
          </button>
        </div>
      </div>

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-300">Base 1RMs</h2>
            <p className="text-xs text-slate-500">Changing a base 1RM resets its RPE adjustment to 0</p>
          </div>
          <span className="text-xs text-slate-600 font-mono">{ul}</span>
        </div>

        {Object.entries(LIFTS).map(([key, lift]) => {
          const adj = data.adjustments[key] || 0;
          return (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-200">{lift.name}</p>
                {adj !== 0 && (
                  <p className="text-[10px] text-slate-500">
                    Adj: {adj > 0 ? '+' : ''}{dw(adj)}{ul}
                    = {dw(data.baseMaxes[key] + adj)}{ul} effective
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
                <span className="w-16 text-center text-lg font-mono font-bold">{dw(data.baseMaxes[key])}</span>
                <button
                  onClick={() => updateMax(key, 2.5)}
                  className="w-10 h-10 bg-slate-800 rounded-lg text-xl text-slate-400 active:bg-slate-700 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Body Weight */}
      <BodyWeightCard />

      {/* Rest Timer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">Rest Timer Defaults</h2>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Strength</span>
            <span className="text-sm font-mono text-slate-200">{formatTime(data.restTimerDefaults?.strength || 120)}</span>
          </div>
          <input
            type="range"
            min={30}
            max={300}
            step={15}
            value={data.restTimerDefaults?.strength || 120}
            onChange={e => updateRestTimer('strength', Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Accessory</span>
            <span className="text-sm font-mono text-slate-200">{formatTime(data.restTimerDefaults?.accessory || 60)}</span>
          </div>
          <input
            type="range"
            min={15}
            max={180}
            step={15}
            value={data.restTimerDefaults?.accessory || 60}
            onChange={e => updateRestTimer('accessory', Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>

      {/* Whoop */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Whoop Integration</h2>
        <p className="text-xs text-slate-500">Connect Whoop to auto-pull recovery scores for readiness</p>

        {data.whoop?.accessToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-emerald-400 font-medium">Connected</span>
              {data.whoop.userId && (
                <span className="text-xs text-slate-500">ID: {data.whoop.userId}</span>
              )}
            </div>
            <button
              onClick={disconnectWhoop}
              className="w-full py-2.5 bg-red-950/50 text-red-400 rounded-lg text-sm font-semibold border border-red-900/30 active:bg-red-950"
            >
              Disconnect Whoop
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Proxy URL setup */}
            {!isProxyConfigured() || showProxySetup ? (
              <div className="space-y-2">
                <p className="text-xs text-amber-500">Step 1: Enter your Cloudflare Worker proxy URL</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={proxyUrl}
                    onChange={e => setProxyUrlState(e.target.value)}
                    placeholder="https://recovery-whoop-proxy.xxx.workers.dev"
                    className="flex-1 bg-slate-800 text-slate-100 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    onClick={() => {
                      setProxyUrl(proxyUrl.replace(/\/$/, ''));
                      setShowProxySetup(false);
                    }}
                    className="px-3 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold active:bg-emerald-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400 font-mono truncate max-w-48">{proxyUrl}</span>
                </div>
                <button
                  onClick={() => setShowProxySetup(true)}
                  className="text-xs text-slate-500 underline"
                >
                  Edit
                </button>
              </div>
            )}

            {/* Connect button */}
            {isProxyConfigured() ? (
              <a
                href={getAuthUrl()}
                className="block w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold text-center active:bg-emerald-700"
              >
                Connect Whoop
              </a>
            ) : (
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500">Set your proxy URL above, then connect</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <NotificationSettings data={data} update={update} />

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

      <p className="text-xs text-center text-slate-700 pb-4">Recovery Tracker v5.0</p>
    </div>
  );
}

function NotificationSettings({ data, update }) {
  const [permStatus, setPermStatus] = useState(() => getNotificationPermission());
  const enabled = data.notifications?.enabled || false;

  if (!isNotificationSupported()) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Notifications</h2>
        <p className="text-xs text-slate-500">Notifications are not supported in this browser.</p>
      </div>
    );
  }

  const handleToggle = async () => {
    if (!enabled) {
      // Turning on — request permission if needed
      if (permStatus === 'default') {
        const result = await requestNotificationPermission();
        setPermStatus(result);
        if (result !== 'granted') return;
      } else if (permStatus === 'denied') {
        return; // Can't enable if denied
      }
      update(prev => ({
        ...prev,
        notifications: { ...prev.notifications, enabled: true },
      }));
    } else {
      // Turning off
      update(prev => ({
        ...prev,
        notifications: { ...prev.notifications, enabled: false },
      }));
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <h2 className="text-sm font-semibold text-slate-300">Workout Reminders</h2>
      <p className="text-xs text-slate-500">Get a reminder when you open the app on workout days</p>

      <button
        onClick={handleToggle}
        className={`w-full py-3 rounded-lg font-semibold text-sm ${
          enabled && permStatus === 'granted'
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-800 text-slate-400'
        }`}
      >
        {permStatus === 'denied'
          ? 'Notifications Blocked — Enable in Browser Settings'
          : enabled && permStatus === 'granted'
            ? 'Reminders On'
            : 'Enable Reminders'
        }
      </button>

      {permStatus === 'denied' && (
        <p className="text-[10px] text-amber-500">
          Notifications were denied. Open your browser/phone settings to allow notifications for this site.
        </p>
      )}
    </div>
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${m}:00`;
}
