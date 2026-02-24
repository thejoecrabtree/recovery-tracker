import { useApp } from '../contexts/AppContext';
import { LIFTS } from '../data/exercises';
import LiftChart from './LiftChart';

export default function ProgressView() {
  const { data } = useApp();
  const liftKeys = Object.keys(LIFTS);

  // Count completed workouts
  const totalLogged = Object.keys(data.workoutLogs).length;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Progress</h1>
        <p className="text-sm text-slate-500">{totalLogged} workouts logged</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Workouts" value={totalLogged} />
        <StatCard label="Adjustments" value={data.adjustmentHistory.length} />
      </div>

      {/* Lift charts */}
      {liftKeys.map(key => (
        <LiftChart
          key={key}
          liftKey={key}
          liftName={LIFTS[key].name}
          base1RM={data.baseMaxes[key]}
          adjustment={data.adjustments[key] || 0}
          history={data.adjustmentHistory.filter(h => h.liftKey === key)}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-emerald-400">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
