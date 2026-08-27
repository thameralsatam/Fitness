import { WorkoutPlan, ExerciseItem, DayIndex, DayScheduleConfig, Language } from '../types';

export const DAYS_NAMES_AR = [
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
  'الأحد',
] as const;

export const DAYS_NAMES_DE = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
] as const;

export const DAYS_SHORT_AR = ['إث', 'ثل', 'أر', 'خم', 'جم', 'سب', 'أح'] as const;
export const DAYS_SHORT_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

/**
 * Gets the current day index (0 = Monday ... 6 = Sunday)
 */
export function getTodayDayIndex(): DayIndex {
  const jsDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const dayMap: Record<number, DayIndex> = {
    1: 0, // Mon
    2: 1, // Tue
    3: 2, // Wed
    4: 3, // Thu
    5: 4, // Fri
    6: 5, // Sat
    0: 6, // Sun
  };
  return dayMap[jsDay] ?? 0;
}

/**
 * Resolves the exercise list for a specific day in the workout plan.
 * Handles day config, linked day inheritance, and plan defaults.
 */
export function getExercisesForDay(plan: WorkoutPlan, dayIndex: DayIndex): ExerciseItem[] {
  if (!plan.days) {
    // If no day customization exists yet, return default plan exercises if it's a training day
    const isTraining = plan.trainingDays?.includes(dayIndex) ?? (dayIndex === 0 || dayIndex === 2 || dayIndex === 4);
    return isTraining ? (plan.exercises || []) : [];
  }

  const dayConfig = plan.days[dayIndex];
  if (!dayConfig) {
    const isTraining = plan.trainingDays?.includes(dayIndex) ?? false;
    return isTraining ? (plan.exercises || []) : [];
  }

  if (dayConfig.isRestDay) {
    return [];
  }

  // If this day is linked to another day, resolve from linked day (recursively or single level)
  if (dayConfig.linkedDay !== undefined && dayConfig.linkedDay !== null && dayConfig.linkedDay !== dayIndex) {
    const sourceDayConfig = plan.days[dayConfig.linkedDay];
    if (sourceDayConfig) {
      if (sourceDayConfig.isRestDay) return [];
      return sourceDayConfig.exercises || [];
    }
    // Fallback if source day not explicitly in days map
    return plan.exercises || [];
  }

  return dayConfig.exercises || [];
}

/**
 * Checks if a specific day is marked as a rest day
 */
export function isDayRestDay(plan: WorkoutPlan, dayIndex: DayIndex): boolean {
  if (!plan.days) {
    return !(plan.trainingDays?.includes(dayIndex) ?? (dayIndex === 0 || dayIndex === 2 || dayIndex === 4));
  }

  const dayConfig = plan.days[dayIndex];
  if (!dayConfig) {
    return !(plan.trainingDays?.includes(dayIndex) ?? false);
  }

  if (dayConfig.isRestDay) {
    return true;
  }

  if (dayConfig.linkedDay !== undefined && dayConfig.linkedDay !== null && dayConfig.linkedDay !== dayIndex) {
    const sourceDayConfig = plan.days[dayConfig.linkedDay];
    if (sourceDayConfig?.isRestDay) return true;
  }

  return false;
}

/**
 * Gets the linked day index if this day is mirroring another day
 */
export function getLinkedDay(plan: WorkoutPlan, dayIndex: DayIndex): DayIndex | null {
  if (!plan.days || !plan.days[dayIndex]) return null;
  const linked = plan.days[dayIndex].linkedDay;
  return linked !== undefined && linked !== null && linked !== dayIndex ? linked : null;
}

/**
 * Gets the list of active training days (not rest days)
 */
export function getActiveTrainingDays(plan: WorkoutPlan): DayIndex[] {
  const active: DayIndex[] = [];
  for (let d = 0; d < 7; d++) {
    const dayIdx = d as DayIndex;
    if (!isDayRestDay(plan, dayIdx)) {
      active.push(dayIdx);
    }
  }
  return active;
}

/**
 * Updates training days list and synchronizes all days in the plan accordingly
 */
export function setTrainingDays(plan: WorkoutPlan, newTrainingDays: number[]): WorkoutPlan {
  const daysMap = ensureDaysMap(plan);

  for (let d = 0; d < 7; d++) {
    const dayIdx = d as DayIndex;
    const isTraining = newTrainingDays.includes(dayIdx);
    daysMap[dayIdx] = {
      ...daysMap[dayIdx],
      isRestDay: !isTraining,
      linkedDay: !isTraining ? null : daysMap[dayIdx]?.linkedDay,
    };
  }

  return {
    ...plan,
    trainingDays: newTrainingDays.sort((a, b) => a - b),
    days: daysMap,
  };
}

/**
 * Computes a dynamic, elegant schedule subtitle (e.g., "4 أيام في الأسبوع (إث، ثل، خم، جم)" or "4x pro Woche (Mo, Di, Do, Fr)")
 */
export function getScheduleSubtitle(plan: WorkoutPlan, lang: Language): string {
  const isAr = lang === 'ar';
  const activeDays = getActiveTrainingDays(plan);
  const count = activeDays.length;

  if (count === 0) {
    return isAr ? 'أيام راحة كاملة' : 'Komplette Ruhewoche';
  }

  if (count === 7) {
    return isAr ? 'تدريب يومي (7 أيام/أسبوع)' : 'Tägliches Training (7 Tage/Woche)';
  }

  const shortNames = activeDays
    .map((d) => (isAr ? DAYS_SHORT_AR[d] : DAYS_SHORT_DE[d]))
    .join('، ');
  const shortNamesDe = activeDays
    .map((d) => DAYS_SHORT_DE[d])
    .join(', ');

  if (isAr) {
    const daysLabel = count === 1 ? 'يوم واحد' : count === 2 ? 'يومان' : `${count} أيام`;
    return `${daysLabel} في الأسبوع (${shortNames})`;
  } else {
    return `${count}x pro Woche (${shortNamesDe})`;
  }
}

/**
 * Initializes or clones days structure for a workout plan
 */
function ensureDaysMap(plan: WorkoutPlan): Record<number, DayScheduleConfig> {
  const map: Record<number, DayScheduleConfig> = plan.days ? { ...plan.days } : {};

  // Ensure all 7 days have entries
  for (let d = 0; d < 7; d++) {
    const dayIdx = d as DayIndex;
    if (!map[dayIdx]) {
      const isTraining = plan.trainingDays?.includes(dayIdx) ?? (dayIdx === 0 || dayIdx === 2 || dayIdx === 4);
      map[dayIdx] = {
        isRestDay: !isTraining,
        exercises: isTraining ? [...(plan.exercises || [])] : [],
        linkedDay: null,
      };
    }
  }

  return map;
}

/**
 * Sets a day as Rest Day or Training Day
 */
export function setDayRestStatus(plan: WorkoutPlan, dayIndex: DayIndex, isRest: boolean): WorkoutPlan {
  const daysMap = ensureDaysMap(plan);
  const current = daysMap[dayIndex];

  daysMap[dayIndex] = {
    ...current,
    isRestDay: isRest,
    linkedDay: isRest ? null : current.linkedDay,
  };

  // Update trainingDays array to stay in sync
  const newTrainingDays = Object.entries(daysMap)
    .filter(([_, config]) => !config.isRestDay)
    .map(([d]) => parseInt(d, 10));

  return {
    ...plan,
    trainingDays: newTrainingDays,
    days: daysMap,
  };
}

/**
 * Links a target day to mirror a source day (e.g. Thursday mirrors Monday)
 */
export function linkDayToSource(plan: WorkoutPlan, targetDay: DayIndex, sourceDay: DayIndex): WorkoutPlan {
  const daysMap = ensureDaysMap(plan);
  const sourceConfig = daysMap[sourceDay] || { exercises: [], isRestDay: false };

  daysMap[targetDay] = {
    ...daysMap[targetDay],
    isRestDay: sourceConfig.isRestDay,
    linkedDay: sourceDay,
    exercises: [...sourceConfig.exercises],
  };

  const newTrainingDays = Object.entries(daysMap)
    .filter(([_, config]) => !config.isRestDay)
    .map(([d]) => parseInt(d, 10));

  return {
    ...plan,
    trainingDays: newTrainingDays,
    days: daysMap,
  };
}

/**
 * Copies exercises from source day to target day (independent copy, unlinked)
 */
export function copyExercisesFromDay(plan: WorkoutPlan, targetDay: DayIndex, sourceDay: DayIndex): WorkoutPlan {
  const daysMap = ensureDaysMap(plan);
  const sourceExercises = getExercisesForDay(plan, sourceDay);

  daysMap[targetDay] = {
    ...daysMap[targetDay],
    isRestDay: false,
    linkedDay: null,
    exercises: JSON.parse(JSON.stringify(sourceExercises)), // deep copy
  };

  const newTrainingDays = Object.entries(daysMap)
    .filter(([_, config]) => !config.isRestDay)
    .map(([d]) => parseInt(d, 10));

  return {
    ...plan,
    trainingDays: newTrainingDays,
    days: daysMap,
  };
}

/**
 * Adds an exercise to a specific day.
 * If this day is linked, or if other days are linked to this day, updates them consistently.
 */
export function addExerciseToDay(plan: WorkoutPlan, dayIndex: DayIndex, exercise: ExerciseItem): WorkoutPlan {
  const daysMap = ensureDaysMap(plan);
  const effectiveDay = daysMap[dayIndex]?.linkedDay !== null && daysMap[dayIndex]?.linkedDay !== undefined
    ? daysMap[dayIndex].linkedDay!
    : dayIndex;

  const currentExercises = daysMap[effectiveDay]?.exercises || [];
  const updatedExercises = [...currentExercises, exercise];

  daysMap[effectiveDay] = {
    ...daysMap[effectiveDay],
    isRestDay: false,
    exercises: updatedExercises,
  };

  // Sync to any days linked to effectiveDay
  for (let d = 0; d < 7; d++) {
    const dIdx = d as DayIndex;
    if (daysMap[dIdx]?.linkedDay === effectiveDay) {
      daysMap[dIdx] = {
        ...daysMap[dIdx],
        isRestDay: false,
        exercises: [...updatedExercises],
      };
    }
  }

  const newTrainingDays = Object.entries(daysMap)
    .filter(([_, config]) => !config.isRestDay)
    .map(([d]) => parseInt(d, 10));

  return {
    ...plan,
    trainingDays: newTrainingDays,
    days: daysMap,
    exercises: effectiveDay === 0 ? updatedExercises : plan.exercises,
  };
}

/**
 * Updates an exercise on a specific day (or linked day)
 */
export function updateExerciseOnDay(plan: WorkoutPlan, dayIndex: DayIndex, updatedEx: ExerciseItem): WorkoutPlan {
  const daysMap = ensureDaysMap(plan);
  const effectiveDay = daysMap[dayIndex]?.linkedDay !== null && daysMap[dayIndex]?.linkedDay !== undefined
    ? daysMap[dayIndex].linkedDay!
    : dayIndex;

  const currentExercises = daysMap[effectiveDay]?.exercises || [];
  const updatedExercises = currentExercises.map((e) => (e.id === updatedEx.id ? updatedEx : e));

  daysMap[effectiveDay] = {
    ...daysMap[effectiveDay],
    exercises: updatedExercises,
  };

  // Sync linked days
  for (let d = 0; d < 7; d++) {
    const dIdx = d as DayIndex;
    if (daysMap[dIdx]?.linkedDay === effectiveDay) {
      daysMap[dIdx] = {
        ...daysMap[dIdx],
        exercises: [...updatedExercises],
      };
    }
  }

  return {
    ...plan,
    days: daysMap,
    exercises: effectiveDay === 0 ? updatedExercises : plan.exercises,
  };
}

/**
 * Removes an exercise from a specific day (or linked days)
 */
export function removeExerciseFromDay(plan: WorkoutPlan, dayIndex: DayIndex, exerciseId: number): WorkoutPlan {
  const daysMap = ensureDaysMap(plan);
  const effectiveDay = daysMap[dayIndex]?.linkedDay !== null && daysMap[dayIndex]?.linkedDay !== undefined
    ? daysMap[dayIndex].linkedDay!
    : dayIndex;

  const currentExercises = daysMap[effectiveDay]?.exercises || [];
  const updatedExercises = currentExercises.filter((e) => e.id !== exerciseId);

  daysMap[effectiveDay] = {
    ...daysMap[effectiveDay],
    exercises: updatedExercises,
  };

  // Sync linked days
  for (let d = 0; d < 7; d++) {
    const dIdx = d as DayIndex;
    if (daysMap[dIdx]?.linkedDay === effectiveDay) {
      daysMap[dIdx] = {
        ...daysMap[dIdx],
        exercises: [...updatedExercises],
      };
    }
  }

  return {
    ...plan,
    days: daysMap,
    exercises: effectiveDay === 0 ? updatedExercises : plan.exercises,
  };
}

/**
 * Clears all exercises on a specific day
 */
export function clearDayExercises(plan: WorkoutPlan, dayIndex: DayIndex): WorkoutPlan {
  const daysMap = ensureDaysMap(plan);
  const effectiveDay = daysMap[dayIndex]?.linkedDay !== null && daysMap[dayIndex]?.linkedDay !== undefined
    ? daysMap[dayIndex].linkedDay!
    : dayIndex;

  daysMap[effectiveDay] = {
    ...daysMap[effectiveDay],
    exercises: [],
  };

  for (let d = 0; d < 7; d++) {
    const dIdx = d as DayIndex;
    if (daysMap[dIdx]?.linkedDay === effectiveDay) {
      daysMap[dIdx] = {
        ...daysMap[dIdx],
        exercises: [],
      };
    }
  }

  return {
    ...plan,
    days: daysMap,
    exercises: effectiveDay === 0 ? [] : plan.exercises,
  };
}

/**
 * Unlinks a day so it becomes completely independent
 */
export function unlinkDay(plan: WorkoutPlan, dayIndex: DayIndex): WorkoutPlan {
  const daysMap = ensureDaysMap(plan);
  const currentExercises = getExercisesForDay(plan, dayIndex);

  daysMap[dayIndex] = {
    ...daysMap[dayIndex],
    linkedDay: null,
    exercises: JSON.parse(JSON.stringify(currentExercises)),
  };

  return {
    ...plan,
    days: daysMap,
  };
}
