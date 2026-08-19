import { ExerciseItem, WorkoutPlan } from '../types';
import { EXERCISES_DATA, DEFAULT_WORKOUT_PLAN } from '../data/workoutData';

const LIBRARY_STORAGE_KEY = 'gym_exercise_library';
const ACTIVE_PLAN_STORAGE_KEY = 'gym_active_workout_plan';

/**
 * Initialize and get exercises library.
 * Automatically migrates existing default exercises from EXERCISES_DATA on first launch
 * so that no user exercises/machines are ever lost.
 */
export function getStoredLibraryExercises(): ExerciseItem[] {
  try {
    // Populate/Restore full 103-machine library on v104 update
    if (!localStorage.getItem('gym_force_populate_library_v104')) {
      localStorage.setItem('gym_force_populate_library_v104', 'true');
      saveLibraryExercises(EXERCISES_DATA);
      return EXERCISES_DATA;
    }

    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading exercise library from localStorage:', err);
  }

  saveLibraryExercises(EXERCISES_DATA);
  return EXERCISES_DATA;
}

/**
 * Save library exercises to localStorage
 */
export function saveLibraryExercises(exercises: ExerciseItem[]): void {
  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(exercises));
  } catch (err) {
    console.error('Error saving exercise library to localStorage:', err);
  }
}

/**
 * Add a new exercise to the library
 */
export function addLibraryExercise(newEx: Omit<ExerciseItem, 'id'> & { id?: number }): ExerciseItem {
  const library = getStoredLibraryExercises();
  const maxId = library.reduce((max, item) => Math.max(max, item.id), 0);
  const exercise: ExerciseItem = {
    ...newEx,
    id: newEx.id || maxId + 1,
    alternatives: newEx.alternatives || [],
  };

  const updated = [exercise, ...library];
  saveLibraryExercises(updated);
  return exercise;
}

/**
 * Update an existing exercise in the library
 */
export function updateLibraryExercise(updatedEx: ExerciseItem): ExerciseItem[] {
  const library = getStoredLibraryExercises();
  const updated = library.map((item) => (item.id === updatedEx.id ? updatedEx : item));
  saveLibraryExercises(updated);
  return updated;
}

/**
 * Delete an exercise from the library
 */
export function deleteLibraryExercise(id: number): ExerciseItem[] {
  const library = getStoredLibraryExercises();
  const updated = library.filter((item) => item.id !== id);
  saveLibraryExercises(updated);
  return updated;
}

/**
 * Reset library to default built-in exercises (103 machines)
 */
export function resetLibraryToDefaults(): ExerciseItem[] {
  saveLibraryExercises(EXERCISES_DATA);
  return EXERCISES_DATA;
}

/**
 * Get active workout plan from localStorage or fallback to DEFAULT_WORKOUT_PLAN
 */
export function getStoredActivePlan(): WorkoutPlan {
  try {
    // Unconditional force wipe of initial default exercises on v99 key
    if (!localStorage.getItem('gym_force_empty_plan_v99')) {
      localStorage.setItem('gym_force_empty_plan_v99', 'true');
      const emptyPlan = { ...DEFAULT_WORKOUT_PLAN, exercises: [] };
      saveActivePlan(emptyPlan);
      return emptyPlan;
    }

    const raw = localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.exercises)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading active plan from localStorage:', err);
  }

  // Fallback to default
  const emptyPlan = { ...DEFAULT_WORKOUT_PLAN, exercises: [] };
  saveActivePlan(emptyPlan);
  return emptyPlan;
}

/**
 * Hard Reset / Factory Reset all application data from localStorage & sessionStorage
 */
export function hardResetApp(): void {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (err) {
    console.error('Error clearing storage:', err);
  }
  window.location.reload();
}

/**
 * Save active workout plan to localStorage
 */
export function saveActivePlan(plan: WorkoutPlan): void {
  try {
    localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, JSON.stringify(plan));
  } catch (err) {
    console.error('Error saving active plan to localStorage:', err);
  }
}
