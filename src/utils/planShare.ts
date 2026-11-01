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

/**
 * Logger callback type for step-by-step debugging on mobile screens
 */
export type ShareLogger = (msg: string) => void;

export interface ExportOptions {
  includeVideos?: boolean;
}

function normalizePlanData(data: any): WorkoutPlan {
  return {
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
}

async function iteratePlanExercises(plan: WorkoutPlan, fn: (ex: ExerciseItem) => Promise<void> | void): Promise<void> {
  if (Array.isArray(plan.exercises)) {
    for (const ex of plan.exercises) await fn(ex);
  }
  if (plan.days) {
    for (const day of Object.values(plan.days)) {
      if (Array.isArray(day?.exercises)) {
        for (const ex of day.exercises) await fn(ex);
      }
    }
  }
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
    await iteratePlanExercises(clonedPlan, (ex) => {
      const base64List = mediaMap[ex.id];
      if (base64List && base64List.length > 0) {
        mediaCount += base64List.length;
        ex.media = base64List.map((item) => ({
          id: item.id,
          type: item.type,
          url: item.dataUrl,
          name: item.name,
          size: item.size,
          createdAt: item.createdAt,
        }));
      } else if (Array.isArray(ex.media)) {
        ex.media = ex.media.filter((m) => m.url && !m.url.startsWith('blob:'));
      }
    });

    log(`✅ تم تجهيز البيانات بنجاح! عدد وسائط التمارين المضمنة: ${mediaCount}`);
    return clonedPlan;
  } catch (err: any) {
    log(`⚠️ تنبيه أثناء تجهيز الوسائط: ${err?.message || err}. سيتم تصدير النصوص الأساسية.`);
    return plan;
  }
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

    const { default: JSZip } = await import('jszip');
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

async function hydrateEmbeddedBase64Media(plan: WorkoutPlan): Promise<void> {
  const processedExerciseIds = new Set<number>();
  await iteratePlanExercises(plan, async (ex) => {
    if (!ex || !Array.isArray(ex.media) || ex.media.length === 0 || processedExerciseIds.has(ex.id)) return;
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
  });
}

/**
 * Parses and validates JSON string, restoring embedded Base64 media into IndexedDB
 */
export async function parseAndHydratePlanJson(
  jsonText: string
): Promise<{ success: boolean; plan?: WorkoutPlan; error?: string }> {
  try {
    const data = JSON.parse(jsonText.trim());
    if (!data || typeof data !== 'object' || (!data.days && !Array.isArray(data.exercises))) {
      return { success: false, error: 'الملف غير صالح أو لا يحتوي على جدول تمارين صحيح' };
    }
    const importedPlan = normalizePlanData(data);
    await hydrateEmbeddedBase64Media(importedPlan);
    return { success: true, plan: importedPlan };
  } catch {
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
    let zip: InstanceType<typeof import('jszip')> | null = null;
    try {
      const { default: JSZip } = await import('jszip');
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

      const importedPlan = normalizePlanData(data);

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

      await iteratePlanExercises(importedPlan, processMediaRestoration);

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



