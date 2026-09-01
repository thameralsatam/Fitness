import { WorkoutPlan, ExerciseItem, ExerciseMediaItem } from '../types';
import {
  getAllExerciseMediaBase64Map,
  getAllExerciseMediaRecordsMap,
  saveRawMediaRecord,
  importBase64MediaItems,
  SerializedMediaItem,
} from './mediaStorage';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Clipboard } from '@capacitor/clipboard';
import JSZip from 'jszip';

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

export interface CopyResult {
  success: boolean;
  isLightweightFallback?: boolean;
  copiedUrl?: string;
}

/**
 * Universal Android-compatible Clipboard Copy supporting Capacitor Native Clipboard, async clipboard & fallbacks
 */
export async function copyTextToClipboardAndroid(
  text: string,
  logger?: ShareLogger
): Promise<CopyResult> {
  const log = (msg: string) => {
    console.log(`[PlanShare Copy] ${msg}`);
    logger?.(msg);
  };

  const textKb = (text.length / 1024).toFixed(1);
  log(`📋 جاري بدء محاولة النسخ للحافظة (حجم النص: ${textKb} KB)...`);

  // 1. If running in Capacitor Native App, use Capacitor Clipboard plugin!
  if (Capacitor.isNativePlatform()) {
    try {
      log('📱 استخدام حافظة أندرويد الأصلية (Capacitor Clipboard)...');
      await Clipboard.write({ string: text });
      log('✅ تم النسخ بنجاح عبر حافظة أندرويد الأصلية!');
      return { success: true, isLightweightFallback: false };
    } catch (err: any) {
      log(`⚠️ تعذر النسخ عبر Capacitor Clipboard: ${err?.message || err}`);
    }
  }

  // Helper to strip heavy Base64 data URLs from JSON if total string exceeds clipboard quota
  const getLightweightJsonText = (rawJson: string): string => {
    try {
      const parsed = JSON.parse(rawJson);
      const cleanExercise = (ex: any) => {
        if (ex && Array.isArray(ex.media)) {
          ex.media = ex.media.map((m: any) => ({
            id: m.id,
            type: m.type,
            name: m.name,
            size: m.size,
            createdAt: m.createdAt,
            url: '', // Omit heavy base64 dataUrl
          }));
        }
      };
      if (Array.isArray(parsed.exercises)) parsed.exercises.forEach(cleanExercise);
      if (parsed.days) {
        Object.values(parsed.days).forEach((d: any) => {
          if (Array.isArray(d?.exercises)) d.exercises.forEach(cleanExercise);
        });
      }
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawJson.replace(/"url"\s*:\s*"data:[^"]+"/g, '"url": ""');
    }
  };

  const tryDirectCopy = async (strToCopy: string): Promise<boolean> => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(strToCopy);
        log('✅ تم النسخ بنجاح باستخدام (navigator.clipboard)');
        return true;
      } catch (err: any) {
        log(`⚠️ فشل navigator.clipboard: ${err?.message || err}. جاري تجربة المحول القديم لأندرويد...`);
      }
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = strToCopy;
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
      textArea.setSelectionRange(0, 9999999);

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        log('✅ تم النسخ بنجاح عبر محاكي أندرويد (document.execCommand)');
        return true;
      }
    } catch (err: any) {
      log(`⚠️ خطأ استثناء أثناء execCommand: ${err?.message || err}`);
    }

    return false;
  };

  // If text is under 1.2MB, try direct copy
  if (text.length < 1200000) {
    const success = await tryDirectCopy(text);
    if (success) return { success: true, isLightweightFallback: false };
  } else {
    log(`⚠️ حجم كود الكود الخامي (${(text.length / 1024 / 1024).toFixed(1)} MB) يتجاوز سعة حافظة أندرويد OS (~1MB max).`);
  }

  // If full text copy failed or text > 1.2MB, copy lightweight plan JSON (without heavy base64)
  log('🔄 جاري تجربة نسخ بيانات الجدول الأساسية (بدون كود الفيديوهات الضخم)...');
  const lightText = getLightweightJsonText(text);
  const lightSuccess = await tryDirectCopy(lightText);

  if (lightSuccess) {
    log('✅ تم نسخ بيانات وتفاصيل الجدول بنجاح إلى الحافظة!');
    return { success: true, isLightweightFallback: true };
  }

  log('❌ فشلت كافة محاولات النسخ للحافظة.');
  return { success: false };
}

/**
 * Creates a compressed ZIP file package containing plan.json + binary media files (images & videos).
 * Highly efficient: zero base64 overhead, losslessly compressed, tiny file size!
 */
export async function exportPlanAsZipPackage(
  plan: WorkoutPlan,
  options?: ExportOptions,
  logger?: ShareLogger
): Promise<{ success: boolean; blob?: Blob; fileName?: string; error?: string }> {
  const log = (msg: string) => {
    console.log(`[PlanShare ZIP Export] ${msg}`);
    logger?.(msg);
  };

  try {
    const includeVideos = options?.includeVideos ?? true;
    log(`[ZIP] جاري تحضير الملف المضغوط (.zip) شامل الوسائط والفيديوهات...`);

    const zip = new JSZip();
    const mediaRecordsMap = await getAllExerciseMediaRecordsMap();
    const clonedPlan: WorkoutPlan = JSON.parse(JSON.stringify(plan));
    const mediaFolder = zip.folder('media');

    let totalMediaFiles = 0;
    let totalBytes = 0;

    const processExercise = (ex: ExerciseItem) => {
      if (!ex) return;
      const records = mediaRecordsMap[ex.id];
      if (records && records.length > 0) {
        ex.media = [];
        for (const rec of records) {
          if (rec.type === 'video' && !includeVideos) continue;

          const extMatch = rec.name.match(/\.([a-zA-Z0-9]+)$/);
          const ext = extMatch ? extMatch[1] : rec.type === 'video' ? 'mp4' : 'jpg';
          const zipPath = `media/${ex.id}_${rec.id}.${ext}`;

          if (mediaFolder) {
            mediaFolder.file(`${ex.id}_${rec.id}.${ext}`, rec.blob);
            totalMediaFiles++;
            totalBytes += rec.blob.size;
          }

          ex.media.push({
            id: rec.id,
            type: rec.type,
            url: zipPath,
            name: rec.name,
            size: rec.size,
            createdAt: rec.createdAt,
          });
        }
      }
    };

    if (Array.isArray(clonedPlan.exercises)) {
      clonedPlan.exercises.forEach(processExercise);
    }
    if (clonedPlan.days) {
      Object.values(clonedPlan.days).forEach((d) => {
        if (Array.isArray(d?.exercises)) d.exercises.forEach(processExercise);
      });
    }

    zip.file('plan.json', JSON.stringify(clonedPlan, null, 2));

    log(`[ZIP] ضغط الوسائط (${totalMediaFiles} ملف / ${(totalBytes / 1024 / 1024).toFixed(1)} MB)...`);
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const fileName =
      (plan.nameAr || plan.nameDe || 'Gym_Workout_Plan')
        .replace(/[^\w\u0600-\u06FF]+/g, '_')
        .toLowerCase() + '_package.zip';

    log(`[ZIP] تم إنشاء الملف المضغوط بنجاح! الحجم النهائي: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`);
    return { success: true, blob: zipBlob, fileName };
  } catch (err: any) {
    log(`[ZIP Error] حدث خطأ أثناء إنشاء الملف المضغوط: ${err?.message || err}`);
    return { success: false, error: err?.message || err };
  }
}

/**
 * Downloads the ZIP package (.zip) directly via Browser download link or Capacitor Filesystem/Share
 */
export async function exportPlanAsZipFile(
  plan: WorkoutPlan,
  options?: ExportOptions,
  logger?: ShareLogger
): Promise<boolean> {
  const log = (msg: string) => {
    console.log(`[PlanShare ZIP File] ${msg}`);
    logger?.(msg);
  };

  const res = await exportPlanAsZipPackage(plan, options, logger);
  if (!res.success || !res.blob || !res.fileName) {
    return false;
  }

  // 1. Capacitor Native Android Save & Share
  if (Capacitor.isNativePlatform()) {
    try {
      log('📱 حفظ الملف المضغوط مباشرة في ذاكرة أندرويد عبر Capacitor...');
      // Convert blob to base64 for Capacitor Filesystem
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const resStr = reader.result as string;
          resolve(resStr.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(res.blob!);
      });

      const fileResult = await Filesystem.writeFile({
        path: res.fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: plan.nameAr || 'جدول التمارين المضغوط',
        files: [fileResult.uri],
      });
      log('✅ تم فتح نافذة الحفظ والمشاركة الأصلية للهاتف بنجاح!');
      return true;
    } catch (err: any) {
      log(`⚠️ تعذر الحفظ عبر Capacitor Filesystem: ${err?.message || err}`);
    }
  }

  // 2. Direct Browser Download link
  try {
    log('🔗 جاري تنزيل الملف المضغوط (.zip) مباشرة في المتصفح...');
    const blobUrl = URL.createObjectURL(res.blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = res.fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 5000);
    log('✅ تم تنزيل الملف المضغوط بنجاح!');
    return true;
  } catch (err: any) {
    log(`❌ فشل تنزيل الملف المضغوط: ${err?.message || err}`);
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
 * Downloads the workout plan as a formatted JSON file.
 * Multi-layer fallback: Capacitor Native Filesystem -> Server HTTP Download Link -> Native File Picker -> WebShare -> Blob URL
 */
export async function exportPlanAsFile(
  plan: WorkoutPlan,
  options?: ExportOptions,
  logger?: ShareLogger
): Promise<'capacitor_native' | 'server_download' | 'file_picker' | 'share' | 'download_data' | 'download_blob' | 'failed'> {
  const log = (msg: string) => {
    console.log(`[PlanShare FileExport] ${msg}`);
    logger?.(msg);
  };

  log('🚀 بدء عملية تصدير وتنزل الملف...');

  // 1. Try Capacitor Native File Save if running inside native Android App!
  if (Capacitor.isNativePlatform()) {
    try {
      log('📱 جاري حفظ الملف مباشرة على ذاكرة أندرويد عبر محرك Capacitor...');
      const exportablePlan = await prepareExportablePlan(plan, options, logger);
      const jsonStr = JSON.stringify(exportablePlan, null, 2);
      const fileName = (plan.nameAr || plan.nameDe || 'Gym_Workout_Plan')
        .replace(/[^\w\u0600-\u06FF]+/g, '_')
        .toLowerCase() + '_schedule.json';

      const fileResult = await Filesystem.writeFile({
        path: fileName,
        data: jsonStr,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      log(`✅ تم حفظ الملف بنجاح في ذاكرة أندرويد المؤقتة: ${fileResult.uri}`);
      // Open native Android Share sheet so user can save or open file!
      await Share.share({
        title: plan.nameAr || 'جدول التمارين',
        files: [fileResult.uri],
      });
      log('✅ تم فتح شاشة الحفظ والمشاركة الأصلية للهاتف!');
      return 'capacitor_native';
    } catch (err: any) {
      log(`⚠️ تعذر استخدام محرك Capacitor الاصلي: ${err?.message || err}`);
    }
  }

  // 2. Prepare local blob fallback
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

  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });

  // 4. Try Native File System Picker
  if ('showSaveFilePicker' in window && typeof (window as any).showSaveFilePicker === 'function') {
    try {
      log('📁 تجربة showSaveFilePicker...');
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
  }

  // 5. Try Blob Object URL Download
  try {
    log('🔗 جاري إنشاء رابط Blob URL مباشر لتنزيل الملف...');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 5000);

    log('✅ تم إطلاق رابط Blob URL بنجاح وتنزيل الملف.');
    return 'download_blob';
  } catch (err: any) {
    log(`⚠️ فشل التنزيل عبر Blob URL: ${err?.message || err}`);
  }

  return 'failed';
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
 * Shares plan using Capacitor Native Share OR Web Share API OR Server Share Link
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

  log('📱 جاري تحضير مشاركة الجدول عبر نظام الهاتف الأصلي...');

  const planName = plan.nameAr || plan.nameDe || 'جدول التمارين';

  // 1. Capacitor Native Share Plugin (If running in Capacitor App)
  if (Capacitor.isNativePlatform()) {
    try {
      log('📱 تشغيل نظام المشاركة الأصلي من أندرويد (Capacitor Native Share)...');
      const exportablePlan = await prepareExportablePlan(plan, options, logger);
      const jsonStr = JSON.stringify(exportablePlan, null, 2);
      const fileName = (plan.nameAr || plan.nameDe || 'Gym_Workout_Plan')
        .replace(/[^\w\u0600-\u06FF]+/g, '_')
        .toLowerCase() + '_schedule.json';

      const fileResult = await Filesystem.writeFile({
        path: fileName,
        data: jsonStr,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: planName,
        text: `جدول التمارين: ${planName}`,
        files: [fileResult.uri],
      });
      log('✅ تم فتح نافذة المشاركة والحفظ الأصلية لأندرويد بنجاح!');
      return true;
    } catch (err: any) {
      log(`⚠️ تعذر استخدام Capacitor Share: ${err?.message || err}`);
    }
  }

  // 2. Fallback Web Share with File
  if (navigator.share) {
    try {
      const exportablePlan = await prepareExportablePlan(plan, options, logger);
      const jsonStr = JSON.stringify(exportablePlan, null, 2);
      const file = new File([jsonStr], `${planName}_schedule.json`, { type: 'application/json' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: planName,
          text: `جدول التمارين: ${planName}`,
          files: [file],
        });
        log('✅ تم فتح قائمة المشاركة بالملف بنجاح!');
        return true;
      }
    } catch (err: any) {
      log(`❌ تعذرت المشاركة عبر WebShare: ${err?.message || err}`);
    }
  }

  log('❌ لم تكتمل ميزة المشاركة التلقائية.');
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
 * Universal importer: handles both compressed ZIP packages (.zip) containing binary media,
 * AND standard JSON files / text with embedded Base64 or plain references.
 */
export async function parseAndHydrateZipOrJsonFile(
  input: File | Blob | string,
  logger?: ShareLogger
): Promise<{ success: boolean; plan?: WorkoutPlan; error?: string; mediaRestoredCount?: number }> {
  const log = (msg: string) => {
    console.log(`[PlanShare Import] ${msg}`);
    logger?.(msg);
  };

  try {
    // 1. If input is string (pasted JSON text)
    if (typeof input === 'string') {
      log('📄 جاري معالجة كود JSON ملصق...');
      const res = await parseAndHydratePlanJson(input);
      return { success: res.success, plan: res.plan, error: res.error };
    }

    // 2. Try parsing input as a compressed ZIP file package first!
    log('📦 جاري فحص الملف (فحص ضغط ZIP مقابل JSON)...');
    let isZip = false;
    let zip: JSZip | null = null;
    try {
      zip = await JSZip.loadAsync(input);
      isZip = true;
    } catch {
      isZip = false;
    }

    if (isZip && zip) {
      log('⚡ تم التعرف على ملف مضغوط (.zip)! جاري استخراج البيانات والوسائط الفضفاضة...');
      const jsonFile = zip.file('plan.json') || Object.values(zip.files).find((f) => f.name.endsWith('.json'));
      if (!jsonFile) {
        return { success: false, error: 'الملف المضغوط لا يحتوي على ملف plan.json الأساسي' };
      }

      const jsonText = await jsonFile.async('string');
      const data = JSON.parse(jsonText.trim());

      if (!data || typeof data !== 'object' || (!data.days && !Array.isArray(data.exercises))) {
        return { success: false, error: 'بيانات plan.json داخل الملف المضغوط غير صالحة' };
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

      let restoredCount = 0;
      const processMediaRestoration = async (ex: ExerciseItem) => {
        if (!ex || !Array.isArray(ex.media)) return;
        const newMediaList: ExerciseMediaItem[] = [];

        for (const m of ex.media) {
          let zipMediaFile = zip!.file(m.url);
          if (!zipMediaFile) {
            const cleanFilename = m.url ? m.url.split('/').pop() || '' : '';
            if (cleanFilename) {
              zipMediaFile =
                zip!.file(`media/${cleanFilename}`) ||
                zip!.file(cleanFilename) ||
                Object.values(zip!.files).find((f) => f.name.endsWith(cleanFilename)) ||
                null;
            }
          }

          if (zipMediaFile) {
            const blob = await zipMediaFile.async('blob');
            const saved = await saveRawMediaRecord({
              id: m.id,
              exerciseId: ex.id,
              type: m.type || (blob.type.startsWith('video/') ? 'video' : 'image'),
              name: m.name || (m.type === 'video' ? 'video.mp4' : 'photo.jpg'),
              blob,
              createdAt: m.createdAt,
            });
            newMediaList.push(saved);
            restoredCount++;
          } else if (m.url && m.url.startsWith('data:')) {
            const savedList = await importBase64MediaItems(ex.id, [
              {
                id: m.id,
                type: m.type,
                name: m.name,
                dataUrl: m.url,
                size: m.size,
                createdAt: m.createdAt,
              },
            ]);
            newMediaList.push(...savedList);
            restoredCount += savedList.length;
          } else {
            newMediaList.push(m);
          }
        }
        ex.media = newMediaList;
      };

      if (Array.isArray(importedPlan.exercises)) {
        for (const ex of importedPlan.exercises) {
          await processMediaRestoration(ex);
        }
      }
      if (importedPlan.days) {
        for (const dayData of Object.values(importedPlan.days)) {
          if (Array.isArray(dayData.exercises)) {
            for (const ex of dayData.exercises) {
              await processMediaRestoration(ex);
            }
          }
        }
      }

      log(`🎉 تم استيراد الملف المضغوط (.zip) بنجاح! تم استرجاع ${restoredCount} ملف ميديا وفيديو كاملاً.`);
      return { success: true, plan: importedPlan, mediaRestoredCount: restoredCount };
    }

    // 3. Fallback: Read as plain JSON file text
    log('📄 الملف ليس ZIP مضغوط، جاري قراءته كملف JSON عادي...');
    const text = await (input as Blob).text();
    return await parseAndHydratePlanJson(text);
  } catch (err: any) {
    log(`❌ تعذر استيراد الملف: ${err?.message || err}`);
    return { success: false, error: 'تعذر استيراد الملف: الرجاء التأكد من صحة وسلامة الملف' };
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


