import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/Shell';
import TodayView from './components/TodayView';
import WorkoutView from './components/WorkoutView';
import DayDetailView from './components/DayDetailView';
import CalendarView from './components/CalendarView';
import ProgressView from './components/ProgressView';
import SettingsView from './components/SettingsView';
import WhoopCallback from './components/WhoopCallback';

export default function App() {
  return (
    <Shell>
      {/* Whoop OAuth callback handler — detects ?code= on redirect */}
      <WhoopCallback />
      <Routes>
        <Route path="/" element={<TodayView />} />
        <Route path="/workout" element={<WorkoutView />} />
        <Route path="/workout/:weekNum/:dayIdx" element={<WorkoutView />} />
        <Route path="/day/:weekNum/:dayIdx" element={<DayDetailView />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/progress" element={<ProgressView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
