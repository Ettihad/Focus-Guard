import { useState, useEffect } from 'react';
import PomodoroTimer from './components/PomodoroTimer';
import CameraDetector from './components/CameraDetector';
import TaskList from './components/TaskList';
import SessionHistory from './components/SessionHistory';
import { Task, TimerMode, SessionLog, Priority } from './types';

const getStorageItem = (key: string, fallback: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => getStorageItem('focus_tasks', []));
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>(() => getStorageItem('focus_logs', []));
  
  const [distractionsCount, setDistractionsCount] = useState(0);
  const [isGuardArmed, setIsGuardArmed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    localStorage.setItem('focus_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('focus_logs', JSON.stringify(sessionLogs));
  }, [sessionLogs]);

  const handleAddTask = (text: string, priority: Priority) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
      priority,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDistractionDetected = () => {
    setDistractionsCount((prev) => prev + 1);
  };

  const handleTimerComplete = (mode: TimerMode, durationMinutes: number, completed: boolean) => {
    if (durationMinutes <= 0) return;

    const log: SessionLog = {
      id: crypto.randomUUID(),
      type: mode,
      durationMinutes,
      timestamp: Date.now(),
      completed,
      distractionsCount: mode === 'work' ? distractionsCount : 0,
    };

    setSessionLogs((prev) => [log, ...prev].slice(0, 30));

    if (mode === 'work') {
      setDistractionsCount(0);
    }
  };

  const handleClearLogs = () => {
    setSessionLogs([]);
    setDistractionsCount(0);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-zinc-200">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-semibold tracking-tight">Focus Mode</h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className={`w-2 h-2 rounded-full ${isGuardArmed ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            <span>{isGuardArmed ? 'Guard Armed' : 'Standby'}</span>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="flex flex-col gap-6">
          <PomodoroTimer
            distractionsCount={distractionsCount}
            onTimerComplete={handleTimerComplete}
            isGuardArmed={isGuardArmed}
          />
          <SessionHistory logs={sessionLogs} onClear={handleClearLogs} />
        </div>

        <div className="flex flex-col gap-6">
          <CameraDetector
            isArmed={isGuardArmed}
            onArmedChange={setIsGuardArmed}
            onDistractionDetected={handleDistractionDetected}
            isMuted={isMuted}
            onMuteChange={setIsMuted}
          />
        </div>

        <div className="flex flex-col gap-6 h-full">
          <TaskList
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-600">
        Focus Mode &bull; Local machine vision detection
      </footer>
    </div>
  );
}
