export type Priority = 'low' | 'medium' | 'high';
export type TimerMode = 'work' | 'break';

export interface Task {
  id: string;
  text: string;
  Text?: string; // Fallback helper for un-migrated components
  completed: boolean;
  createdAt: number;
  priority: Priority;
}

export interface SessionLog {
  id: string;
  type: TimerMode;
  Type?: TimerMode; // Fallback helper for un-migrated components
  durationMinutes: number;
  timestamp: number;
  completed: boolean;
  distractionsCount: number;
}

