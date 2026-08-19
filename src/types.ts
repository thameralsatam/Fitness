export type Language = 'de' | 'ar';
export type ViewTab = 'plan' | 'timer' | 'audio' | 'tools' | 'stats' | 'profile';

export interface ExerciseMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
  size?: number;
  createdAt?: number;
}

export interface ExerciseItem {
  id: number;
  muscleDe: string;
  muscleAr: string;
  nameDe: string;
  sets: string;
  reps: string;
  alternatives: string[];
  media?: ExerciseMediaItem[];
}

export interface WorkoutPlan {
  id: string;
  nameDe: string;
  nameAr: string;
  scheduleDaysDe: string;
  scheduleDaysAr: string;
  frequencyDe: string;
  frequencyAr: string;
  trainingDays: number[]; // 0=Mo, 1=Di, 2=Mi, 3=Do, 4=Fr, 5=Sa, 6=So
  exercises: ExerciseItem[];
  notesDe: string[];
  notesAr: string[];
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
