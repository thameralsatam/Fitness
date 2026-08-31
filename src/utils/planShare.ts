import { WorkoutPlan, ExerciseItem, ExerciseMediaItem } from '../types';
import {
  getAllExerciseMediaBase64Map,
  importBase64MediaItems,
  SerializedMediaItem,
} from './mediaStorage';

/**
 * Prepares a workout plan for export by embedding all IndexedDB exercise media as Base64 Data URLs
 */
export async function prepareExportablePlan(plan: WorkoutPlan): Promise<WorkoutPlan> {
  try {
    const mediaMap = await getAllExerciseMediaBase64Map();
    const clonedPlan: WorkoutPlan = JSON.parse(JSON.stringify(plan));

    const enrichExercise = (ex: ExerciseItem) => {
      if (!ex) return;
      const base64List = mediaMap[ex.id];
      if (base64List && base64List.length > 0) {
        ex.media = base64List.map((item) => ({
          id: item.id,
          type: item.type,
          url: item.dataUrl, // Embed base64 string
          name: item.name,
          size: item.size,
          createdAt: item.createdAt,
        }));
      } else if (Array.isArray(ex.media)) {
        // Remove temporary object URLs
        ex.media = ex.media.filter((m) => m.url && !m.url.startsWith('blob:'));
      }
    };

    if (Array.isArray(clonedPlan.exercises)) {
      clonedPlan.exercises.forEach(enrichExercise);
    }

    if (clonedPlan.days) {
      Object.values(clonedPlan.days).forEach((dayData) => {
        if (Array.isArray(dayData.exercises)) {
          dayData.exercises.forEach(enrichExercise);
        }
      });
    }

    return clonedPlan;
  } catch {
    return plan;
  }
}

/**
 * Downloads the workout plan with embedded media as a formatted JSON file
 */
export async function exportPlanAsFile(plan: WorkoutPlan): Promise<void> {
  const exportablePlan = await prepareExportablePlan(plan);
  const jsonStr = JSON.stringify(exportablePlan, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = (plan.nameAr || plan.nameDe || 'Gym_Workout_Plan')
    .replace(/[^\w\u0600-\u06FF]+/g, '_')
    .toLowerCase();
  link.download = `${fileName}_schedule.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Returns JSON text representation of the plan with embedded media
 */
export async function exportPlanAsJsonString(plan: WorkoutPlan): Promise<string> {
  const exportablePlan = await prepareExportablePlan(plan);
  return JSON.stringify(exportablePlan, null, 2);
}

/**
 * Shares plan with embedded media using Web Share API if supported
 */
export async function sharePlanNative(plan: WorkoutPlan): Promise<boolean> {
  const exportablePlan = await prepareExportablePlan(plan);
  const jsonStr = JSON.stringify(exportablePlan, null, 2);
  const planName = plan.nameAr || plan.nameDe || 'جدول التمارين';

  if (navigator.share) {
    try {
      const file = new File([jsonStr], 'workout_plan.json', { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: planName,
          text: `جدول التمارين: ${planName}`,
          files: [file],
        });
        return true;
      } else {
        await navigator.share({
          title: planName,
          text: `جدول التمارين: ${planName}\n\n${jsonStr}`,
        });
        return true;
      }
    } catch {
      // User cancelled or unsupported share fallback
      return false;
    }
  }
  return false;
}

/**
 * Parses and validates JSON string, restoring embedded Base64 media into IndexedDB
 */
export async function parseAndHydratePlanJson(
  jsonText: string
): Promise<{ success: boolean; plan?: WorkoutPlan; error?: string }> {
  try {
    const data = JSON.parse(jsonText.trim());
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'الملف غير صالح أو المضمون ليس بصيغة JSON' };
    }

    if (!data.days && !Array.isArray(data.exercises)) {
      return { success: false, error: 'الملف لا يحتوي على جدول تمارين صحيح (غياب أيام التمارين أو الأجهزة)' };
    }

    const importedPlan: WorkoutPlan = {
      id: data.id || `plan_imported_${Date.now()}`,
      nameDe: data.nameDe || 'Importierter Trainingsplan',
      nameAr: data.nameAr || 'جدول تمارين مستورد',
      scheduleDaysDe: data.scheduleDaysDe || 'Individuelles Training',
      scheduleDaysAr: data.scheduleDaysAr || 'جدول مخصص',
      frequencyDe: data.frequencyDe || 'Individuell',
      frequencyAr: data.frequencyAr || 'مخصص',
      trainingDays: Array.isArray(data.trainingDays) ? data.trainingDays : [0, 1, 3, 4],
      exercises: Array.isArray(data.exercises) ? data.exercises : [],
      days: data.days && typeof data.days === 'object' ? data.days : {},
      notesDe: Array.isArray(data.notesDe) ? data.notesDe : [],
      notesAr: Array.isArray(data.notesAr) ? data.notesAr : [],
    };

    // Hydrate embedded Base64 media into IndexedDB
    const processedExerciseIds = new Set<number>();

    const hydrateExerciseMedia = async (ex: ExerciseItem) => {
      if (!ex || !Array.isArray(ex.media) || ex.media.length === 0) return;
      if (processedExerciseIds.has(ex.id)) return;

      const base64Items: SerializedMediaItem[] = [];
      const nonDataMedia: ExerciseMediaItem[] = [];

      for (const item of ex.media) {
        if (item.url && item.url.startsWith('data:')) {
          base64Items.push({
            id: item.id,
            type: item.type,
            name: item.name,
            dataUrl: item.url,
            size: item.size,
            createdAt: item.createdAt,
          });
        } else {
          nonDataMedia.push(item);
        }
      }

      if (base64Items.length > 0) {
        const savedMedia = await importBase64MediaItems(ex.id, base64Items);
        ex.media = [...nonDataMedia, ...savedMedia];
        processedExerciseIds.add(ex.id);
      }
    };

    if (Array.isArray(importedPlan.exercises)) {
      for (const ex of importedPlan.exercises) {
        await hydrateExerciseMedia(ex);
      }
    }

    if (importedPlan.days) {
      for (const dayData of Object.values(importedPlan.days)) {
        if (Array.isArray(dayData.exercises)) {
          for (const ex of dayData.exercises) {
            await hydrateExerciseMedia(ex);
          }
        }
      }
    }

    return { success: true, plan: importedPlan };
  } catch (e: any) {
    return { success: false, error: 'تعذر قراءة الملف: تأكد من صحة التنسيق' };
  }
}

/**
 * Legacy synchronous alias for fast validation
 */
export function parsePlanJson(jsonText: string): { success: boolean; plan?: WorkoutPlan; error?: string } {
  try {
    const data = JSON.parse(jsonText.trim());
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'الملف غير صالح أو المضمون ليس بصيغة JSON' };
    }
    if (!data.days && !Array.isArray(data.exercises)) {
      return { success: false, error: 'الملف لا يحتوي على جدول تمارين صحيح' };
    }
    return { success: true, plan: data as WorkoutPlan };
  } catch {
    return { success: false, error: 'تنسيق غير صالح' };
  }
}

