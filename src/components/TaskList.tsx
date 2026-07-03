import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ListTodo } from 'lucide-react';
import { Task, Priority } from '../types';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (text: string, priority: Priority) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskList({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: TaskListProps) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddTask(text.trim(), priority);
    setText('');
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <ListTodo size={16} className="text-zinc-400" />
          Task List
        </h2>
        <span className="text-xs font-mono text-zinc-500">
          {completedCount}/{tasks.length}
        </span>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a new task..."
            className="flex-grow bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-3 bg-zinc-100 hover:bg-white text-zinc-900 font-medium rounded-lg text-xs transition-colors disabled:opacity-40 shrink-0 flex items-center gap-1"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>

        {/* Priority buttons */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <span>Priority:</span>
          {(['low', 'medium', 'high'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`px-2 py-0.5 rounded capitalize font-mono transition-colors ${
                priority === p
                  ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                  : 'hover:text-zinc-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </form>

      {/* Tasks list */}
      <div className="flex-grow overflow-y-auto space-y-2 pr-1 max-h-[260px]">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-500">
            No tasks yet. Add one above to get started.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                task.completed
                  ? 'bg-zinc-950/40 border-zinc-900 opacity-60'
                  : 'bg-zinc-950 border-zinc-850 hover:border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-grow min-w-0">
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <Circle size={16} />
                  )}
                </button>

                <span
                  className={`text-xs truncate select-none ${
                    task.completed
                      ? 'line-through text-zinc-500'
                      : 'text-zinc-200'
                  }`}
                >
                  {task.text}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded capitalize ${
                    task.priority === 'high'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : task.priority === 'medium'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {task.priority}
                </span>

                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  title="Delete task"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${(completedCount / tasks.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
