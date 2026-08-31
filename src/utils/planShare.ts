import { WorkoutPlan, ExerciseItem, ExerciseMediaItem } from '../types';
import {
  getAllExerciseMediaBase64Map,
  importBase64MediaItems,
  SerializedMediaItem,
} from './mediaStorage';

/**
 * Logger callback type for step-by-step debugging on mobile screens
 */
export type ShareLogger = (msg: string) => void;

export interface ExportOptions {
  includeVideos?: boolean;
}

/**
  * Prepares a workout plan for export by embedding IndexedDB exercise media as Base64 Data URLs
  */
export async function prepareExportablePlan(
  plan: WorkoutPlan,
  options?: ExportOptions,
  logger?: ShareLogger
): Promise<WorkoutPlan> {
  const log = (msg: string) => {
    console.log(`[PlanShare] ${msg}`);
    logger?.(msg);
  };

  try {
    const includeVideos = options?.includeVideos ?? true;
    log(`🔄 جاري تجهيز بيانات الجدول ${includeVideos ? 'شاملاً الوسائط والفيديوهات' : 'بدون فيديوهات'}...`);
    const mediaMap = await getAllExerciseMediaBase64Map({ includeVideos });
    const clonedPlan: WorkoutPlan = JSON.parse(JSON.stringify(plan));

    let mediaCount = 0;
    const enrichExercise = (ex: ExerciseItem) => {
      if (!ex) return;
      const base64List = mediaMap[ex.id];
      if (base64List && base64List.length > 0) {
        mediaCount += base64List.length;
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

    log(`✅ تم تجهيز البيانات بنجاح! عدد وسائط التمارين المضمنة: ${mediaCount}`);
    return clonedPlan;
  } catch (err: any) {
    log(`⚠️ تنبيه أثناء تجهيز الوسائط: ${err?.message || err}. سيتم تصدير النصوص الأساسية.`);
    return plan;
  }
}

/**
 * Universal Android-compatible Clipboard Copy using legacy execCommand DOM selection fallback
 */
export function copyTextToClipboardAndroid(text: string, logger?: ShareLogger): boolean {
  const log = (msg: string) => {
    console.log(`[PlanShare Copy] ${msg}`);
    logger?.(msg);
  };

  log('📋 جاري بدء محاولة النسخ للحافظة...');

  // 1. Try modern clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      navigator.clipboard.writeText(text);
      log('✅ تم النسخ بنجاح باستخدام (navigator.clipboard)');
      return true;
    } catch (err: any) {
      log(`⚠️ فشل navigator.clipboard: ${err?.message || err}. جاري استخدام المحول القديم لأندرويد...`);
    }
  }

  // 2. Legacy execCommand copy (Works 100% in Android WebView apps)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Hide off-screen
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 9999999); // For Android/iOS touch devices

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      log('✅ تم النسخ بنجاح عبر محاكي أندرويد (document.execCommand)');
      return true;
    } else {
      log('❌ فشل تنفيذ أمر document.execCommand');
      return false;
    }
  } catch (err: any) {
    log(`❌ خطأ استثناء أثناء النسخ: ${err?.message || err}`);
    return false;
  }
}

/**
 * Opens native OS File Picker (Files app) so user explicitly selects target folder & filename
 */
export async function exportPlanWithFolderPicker(
  plan: WorkoutPlan,
  options?: ExportOptions,
  logger?: ShareLogger
): Promise<boolean> {
  const log = (msg: string) => {
    console.log(`[PlanShare FolderPicker] ${msg}`);
    logger?.(msg);
  };

  log('🔍 فحص دعم ميزة اختيار المجلد (showSaveFilePicker)...');
  if (!('showSaveFilePicker' in window) || typeof (window as any).showSaveFilePicker !== 'function') {
    log('❌ ميزة showSaveFilePicker غير مدعومة في نظام أندرويد/WebView الخاص بالتطبيق الحالي.');
    return false;
  }

  let exportablePlan = await prepareExportablePlan(plan, options, logger);
  let jsonStr: string;

  try {
    jsonStr = JSON.stringify(exportablePlan, null, 2);
  } catch {
    log('⚠️ حجم البيانات كبير جداً، جاري المحاولة بدون الفيديوهات...');
    exportablePlan = await prepareExportablePlan(plan, { includeVideos: false }, logger);
    jsonStr = JSON.stringify(exportablePlan, null, 2);
  }

  const fileName =
    (plan.nameAr || plan.nameDe || 'Gym_Workout_Plan')
      .replace(/[^\w\u0600-\u06FF]+/g, '_')
      .toLowerCase() + '_schedule.json';

  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });

  try {
    log('📁 جاري طلب فتح منتقي الملفات الخاص بالجهاز...');
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: 'JSON Workout Plan File',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    log('✅ تم كتابة وحفظ الملف بنجاح داخل المجلد الذي اخترته!');
    return true;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      log('⚠️ قمت بإلغاء نافذة اختيار المجلد ولم يتم حفظ الملف.');
      return false;
    }
    log(`❌ فشلت عملية حفظ المجلد: ${err?.message || err}`);
    return false;
  }
}

/**
 * Downloads the workout plan with embedded media as a formatted JSON file.
 * Handles Native Folder Picker, WebShare, Base64 Data URIs, and WebView fallbacks gracefully.
 */
export async function exportPlanAsFile(
  plan: WorkoutPlan,
  options?: ExportOptions,
  logger?: ShareLogger
): Promise<'file_picker' | 'share' | 'download_data' | 'download_blob' | 'failed'> {
  const log = (msg: string) => {
    console.log(`[PlanShare FileExport] ${msg}`);
    logger?.(msg);
  };

  log('🚀 بدء عملية تصدير الملف...');
  let exportablePlan = await prepareExportablePlan(plan, options, logger);
  let jsonStr: string;

  try {
    jsonStr = JSON.stringify(exportablePlan, null, 2);
  } catch {
    log('⚠️ الكود كبير في الذاكرة، جاري استبعاد الفيديوهات لتسهيل التصدير...');
    exportablePlan = await prepareExportablePlan(plan, { includeVideos: false }, logger);
    jsonStr = JSON.stringify(exportablePlan, null, 2);
  }

  const fileName = (plan.nameAr || plan.nameDe || 'Gym_Workout_Plan')
    .replace(/[^\w\u0600-\u06FF]+/g, '_')
    .toLowerCase() + '_schedule.json';

  log(`📄 حجم الملف المجهز: ${(jsonStr.length / 1024).toFixed(1)} كيلوبايت. اسم الملف: ${fileName}`);

  // 1. Try Native File System Picker (If OS/Browser supports it)
  if ('showSaveFilePicker' in window && typeof (window as any).showSaveFilePicker === 'function') {
    try {
      log('📁 تجربة showSaveFilePicker...');
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'JSON Workout Plan',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      log('✅ تم التصدير عبر showSaveFilePicker');
      return 'file_picker';
    } catch (err: any) {
      log(`ℹ️ showSaveFilePicker لم تكتمل (${err?.message || err}). الانتقال للمحاولات التالية...`);
    }
  } else {
    log('ℹ️ showSaveFilePicker غير متاح في بيئة هذا التطبيق.');
  }

  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });

  // 2. Try Web Share API with File
  if (navigator.share) {
    log('📱 تجربة navigator.share للمشاركة أو الحفظ...');
    try {
      const file = new File([blob], fileName, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        log('📲 جاري فتح نافذة المشاركة والحفظ لأندرويد...');
        await navigator.share({
          title: plan.nameAr || 'جدول التمارين',
          files: [file],
        });
        log('✅ تمت المشاركة عبر نافذة النظام');
        return 'share';
      } else {
        log('⚠️ متصفح التطبيق لا يدعم مشاركة الملفات المباشرة (canShare returned false).');
      }
    } catch (err: any) {
      log(`⚠️ تعذرت المشاركة عبر WebShare: ${err?.message || err}`);
    }
  } else {
    log('ℹ️ WebShare API غير متاح في بيئة هذا التطبيق.');
  }

  // 3. Android WebView Base64 Data URI Trigger
  try {
    log('🔗 تجربة رابط Base64 Data URI لتطبيق أندرويد...');
    const base64Json = btoa(unescape(encodeURIComponent(jsonStr)));
    const dataUrl = `data:application/octet-stream;charset=utf-8;base64,${base64Json}`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 2000);
    log('✅ تم إطلاق رابط Base64 Data URL لتطبيق أندرويد.');
    return 'download_data';
  } catch (err: any) {
    log(`⚠️ فشل التنزيل عبر Base64 Data URI: ${err?.message || err}`);
  }

  // 4. Fallback to Blob URL click
  try {
    log('🔗 تجربة رابط Blob URL...');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 3000);
    log('✅ تم إطلاق رابط Blob URL.');
    return 'download_blob';
  } catch (err: any) {
    log(`❌ فشل التنزيل عبر Blob URL: ${err?.message || err}`);
    return 'failed';
  }
}

/**
 * Returns JSON text representation of the plan with embedded media
 */
export async function exportPlanAsJsonString(
  plan: WorkoutPlan,
  options?: ExportOptions,
  logger?: ShareLogger
): Promise<string> {
  let exportablePlan = await prepareExportablePlan(plan, options, logger);
  try {
    return JSON.stringify(exportablePlan, null, 2);
  } catch {
    exportablePlan = await prepareExportablePlan(plan, { includeVideos: false }, logger);
    return JSON.stringify(exportablePlan, null, 2);
  }
}

/**
 * Shares plan with embedded media using Web Share API if supported
 */
export async function sharePlanNative(
  plan: WorkoutPlan,
  options?: ExportOptions,
  logger?: ShareLogger
): Promise<boolean> {
  const log = (msg: string) => {
    console.log(`[PlanShare NativeShare] ${msg}`);
    logger?.(msg);
  };

  log('📱 جاري تحضير مشاركة الجدول عبر نظام الهاتف...');
  let exportablePlan = await prepareExportablePlan(plan, options, logger);
  let jsonStr: string;

  try {
    jsonStr = JSON.stringify(exportablePlan, null, 2);
  } catch {
    exportablePlan = await prepareExportablePlan(plan, { includeVideos: false }, logger);
    jsonStr = JSON.stringify(exportablePlan, null, 2);
  }

  const planName = plan.nameAr || plan.nameDe || 'جدول التمارين';

  if (navigator.share) {
    try {
      const file = new File([jsonStr], `${planName}_schedule.json`, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: planName,
          text: `جدول التمارين: ${planName}`,
          files: [file],
        });
        log('✅ تم فتح قائمة المشاركة بالملف بنجاح!');
        return true;
      } else if (jsonStr.length < 50000) {
        await navigator.share({
          title: planName,
          text: `جدول التمارين: ${planName}\n\n${jsonStr}`,
        });
        log('✅ تم فتح قائمة المشاركة بالنص بنجاح!');
        return true;
      } else {
        log('⚠️ حجم الملف كبير جداً للمشاركة كـ نص مباشر.');
      }
    } catch (err: any) {
      log(`❌ تعذرت المشاركة عبر نظام الهاتف: ${err?.message || err}`);
      return false;
    }
  } else {
    log('❌ ميزة navigator.share غير متاحة في هذا التطبيق.');
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

