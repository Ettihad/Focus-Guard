export type Priority = 'low' | 'medium' | 'high';
export type TimerMode = 'work' | 'break';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: Priority;
}

export interface SessionLog {
  id: string;
  type: TimerMode;
  durationMinutes: number;
  timestamp: number;
  completed: boolean;
  distractionsCount: number;
}
