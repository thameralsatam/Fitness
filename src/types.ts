export type Language = 'de' | 'ar';
export type ViewTab = 'plan' | 'timer' | 'audio' | 'tools' | 'stats';

export interface ExerciseItem {
  id: number;
  muscleDe: string;
  muscleAr: string;
  nameDe: string;
  sets: string;
  reps: string;
  alternatives: string[];
}

export interface GoalItem {
  id: number | string;
  titleDe?: string;
  titleAr?: string;
  title?: string;
  descDe?: string;
  descAr?: string;
  done: boolean;
}

export interface ProgressionPhase {
  weekDe: string;
  weekAr: string;
  focusDe: string;
  focusAr: string;
  sessions: boolean[];
  isCurrent: boolean;
}

export interface MuscleVolume {
  nameDe: string;
  nameAr: string;
  setsDe: string;
  setsAr: string;
}
