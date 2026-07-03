import { useState } from 'react';
import { Task, Priority } from '../types';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (text: string, priority: Priority) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskList({ tasks, onAddTask, onToggleTask, onDeleteTask }: TaskListProps) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddTask(text.trim(), priority);
    setText('');
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col h-full">
      <h2 className="text-sm font-semibold text-zinc-200 mb-4 tracking-tight flex items-center gap-2">
        <span>📋</span> Task Manager
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3 mb-5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to get done?"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
        />
        
        <div className="flex gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 focus:outline-none focus:border-zinc-700"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <button
            type="submit"
            className="flex-grow bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium rounded-lg text-xs transition-colors py-1.5"
          >
            Add Task
          </button>
        </div>
      </form>

      <div className="flex-grow overflow-y-auto space-y-2 max-h-[340px] pr-1">
        {tasks.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-8">No tasks on your plate.</div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 rounded-lg border bg-zinc-950 transition-all ${
                task.completed ? 'border-zinc-900 opacity-60' : 'border-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleTask(task.id)}
                  className="rounded border-zinc-800 bg-zinc-900 text-zinc-100 accent-zinc-100 h-3.5 w-3.5 cursor-pointer"
                />
                <span className={`text-xs truncate ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                  {task.text}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium border uppercase tracking-wider ${
                  task.priority === 'high' ? 'bg-red-950/40 border-red-900/50 text-red-400' :
                  task.priority === 'medium' ? 'bg-amber-950/40 border-amber-900/50 text-amber-400' :
                  'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}>
                  {task.priority}
                </span>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 text-xs transition-colors"
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
