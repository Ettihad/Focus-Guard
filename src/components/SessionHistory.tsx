import { SessionLog } from '../types';

interface SessionHistoryProps {
  logs: SessionLog[];
  onClear: () => void;
}

export default function SessionHistory({ logs, onClear }: SessionHistoryProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-200 tracking-tight flex items-center gap-2">
          <span>🕒</span> History
        </h2>
        {logs.length > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-6">No tracking logs recorded yet.</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/60 bg-zinc-950/50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs shrink-0">
                  {log.type === 'work' ? '💼' : '☕'}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-300 capitalize truncate">
                    {log.type} Session
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-3">
                <div>
                  <p className="text-xs font-mono font-medium text-zinc-200">
                    {log.durationMinutes}m
                  </p>
                  {log.type === 'work' && (
                    <p className={`text-[10px] font-mono mt-0.5 ${log.distractionsCount > 0 ? 'text-amber-500' : 'text-zinc-500'}`}>
                      {log.distractionsCount} alert{log.distractionsCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <span className="text-xs">{log.completed ? '✅' : '⚠️'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
