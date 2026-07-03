import { History, Trash2, Flame, Coffee } from 'lucide-react';
import { SessionLog } from '../types';

interface SessionHistoryProps {
  logs: SessionLog[];
  onClear: () => void;
}

export default function SessionHistory({ logs, onClear }: SessionHistoryProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <History size={16} className="text-zinc-400" />
          Session History
        </h2>

        {logs.length > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-500">
            No completed sessions recorded yet today.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-zinc-950 border border-zinc-850 p-2.5 rounded-lg flex items-center justify-between text-xs text-zinc-300"
            >
              <div className="flex items-center gap-2">
                {log.type === 'work' ? (
                  <Flame size={14} className="text-amber-500" />
                ) : (
                  <Coffee size={14} className="text-emerald-400" />
                )}
                <span className="capitalize font-medium">{log.type}</span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-400">
                  {log.durationMinutes}m
                </span>
                {log.type === 'work' && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      log.distractionsCount > 0
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {log.distractionsCount} distraction{log.distractionsCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
