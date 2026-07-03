import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Flame, Coffee } from 'lucide-react';
import { TimerMode } from '../types';
import { audio } from '../utils/audio';

interface PomodoroTimerProps {
  distractionsCount: number;
  onTimerComplete: (mode: TimerMode, duration: number, completed: boolean) => void;
  isGuardArmed: boolean;
}

const PRESETS = [
  { label: '25 / 5', workMin: 25, breakMin: 5 },
  { label: '50 / 10', workMin: 50, breakMin: 10 },
  { label: '15 / 3', workMin: 15, breakMin: 3 },
];

export default function PomodoroTimer({
  distractionsCount,
  onTimerComplete,
  isGuardArmed,
}: PomodoroTimerProps) {
  const [presetIdx, setPresetIdx] = useState(0);
  const currentPreset = PRESETS[presetIdx];

  const [mode, setMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(currentPreset.workMin * 60);

  const totalSeconds = mode === 'work' ? currentPreset.workMin * 60 : currentPreset.breakMin * 60;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync timer when preset or mode changes while idle
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft((mode === 'work' ? currentPreset.workMin : currentPreset.breakMin) * 60);
    }
  }, [presetIdx, mode]);

  // Tick countdown interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, currentPreset]);

  const handleComplete = () => {
    setIsRunning(false);
    audio.playChime(true);

    const duration = mode === 'work' ? currentPreset.workMin : currentPreset.breakMin;
    onTimerComplete(mode, duration, true);

    const nextMode: TimerMode = mode === 'work' ? 'break' : 'work';
    setMode(nextMode);
    setTimeLeft((nextMode === 'work' ? currentPreset.workMin : currentPreset.breakMin) * 60);
  };

  const toggleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft((mode === 'work' ? currentPreset.workMin : currentPreset.breakMin) * 60);
  };

  const handleSkip = () => {
    const elapsedMinutes = Math.floor((totalSeconds - timeLeft) / 60);
    if (elapsedMinutes > 0) {
      onTimerComplete(mode, elapsedMinutes, false);
    }

    setIsRunning(false);
    const nextMode: TimerMode = mode === 'work' ? 'break' : 'work';
    setMode(nextMode);
    setTimeLeft((nextMode === 'work' ? currentPreset.workMin : currentPreset.breakMin) * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center relative overflow-hidden">
      {/* Subtle top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
        <div
          className="h-full bg-zinc-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mode & Presets selector */}
      <div className="flex items-center justify-between w-full mb-6">
        <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => {
              setIsRunning(false);
              setMode('work');
            }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === 'work'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Work
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setMode('break');
            }}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === 'break'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Break
          </button>
        </div>

        <div className="flex gap-1">
          {PRESETS.map((p, idx) => (
            <button
              key={p.label}
              onClick={() => {
                setIsRunning(false);
                setPresetIdx(idx);
              }}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                presetIdx === idx
                  ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Digital Timer Display */}
      <div className="my-4 text-center">
        <div className="text-6xl font-light tracking-tight text-zinc-100 font-mono select-none">
          {formatTime(timeLeft)}
        </div>
        <p className="text-xs text-zinc-400 mt-2 flex items-center justify-center gap-1.5 font-medium">
          {mode === 'work' ? (
            <>
              <Flame size={14} className="text-amber-500" />
              <span>Focus Session</span>
            </>
          ) : (
            <>
              <Coffee size={14} className="text-emerald-400" />
              <span>Break Time</span>
            </>
          )}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-6 mb-4">
        <button
          onClick={handleReset}
          title="Reset timer"
          className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          <RotateCcw size={16} />
        </button>

        <button
          onClick={toggleStartPause}
          className="px-8 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Pause size={16} fill="currentColor" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              <span>Start</span>
            </>
          )}
        </button>

        <button
          onClick={handleSkip}
          title="Skip section"
          className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Session stats */}
      {mode === 'work' && (
        <div className="w-full mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>Distractions caught</span>
          <span className="font-mono text-zinc-200 font-medium">
            {distractionsCount}
          </span>
        </div>
      )}
    </div>
  );
}
