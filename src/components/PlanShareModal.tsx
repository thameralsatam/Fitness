import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Upload,
  Share2,
  Copy,
  Check,
  FileJson,
  AlertTriangle,
  RotateCcw,
  FileText,
  FolderDown,
  Eye,
  Code2,
  ArrowUpDown,
  Loader2,
  Archive,
  ChevronDown,
  ChevronUp,
  Film,
} from 'lucide-react';
import { WorkoutPlan, Language } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';
import {
  exportPlanAsFile,
  exportPlanWithFolderPicker,
  exportPlanAsJsonString,
  exportPlanAsZipFile,
  sharePlanNative,
  parseAndHydratePlanJson,
  parseAndHydrateZipOrJsonFile,
  copyTextToClipboardAndroid,
} from '../utils/planShare';
import { DEFAULT_WORKOUT_PLAN } from '../data/workoutData';

interface PlanShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: WorkoutPlan;
  currentLang: Language;
  onUpdatePlan: (plan: WorkoutPlan) => void;
  showToast: (msg: string) => void;
}

export const PlanShareModal: React.FC<PlanShareModalProps> = ({
  isOpen,
  onClose,
  plan,
  currentLang,
  onUpdatePlan,
  showToast,
}) => {
  const isAr = currentLang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [includeVideos, setIncludeVideos] = useState<boolean>(true);
  const [pastedJson, setPastedJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<WorkoutPlan | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Code Inspector state for Android WebView / Direct Copy
  const [showCodeInspector, setShowCodeInspector] = useState(false);
  const [codeInspectorText, setCodeInspectorText] = useState('');

  useEffect(() => {
    if (isOpen) {
      notifyModalChange(true);
      document.body.style.overflow = 'hidden';
      return () => {
        notifyModalChange(false);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleFolderPickerSave = async () => {
    if (activeAction !== null) return;
    try {
      setActiveAction('folder');
      triggerHaptic('success');
      const supported = await exportPlanWithFolderPicker(plan, { includeVideos });
      if (supported) {
        showToast(isAr ? 'تم اختيار مجلد الحفظ بنجاح!' : 'In Ausgewähltem Ordner gespeichert');
      } else {
        const res = await exportPlanAsFile(plan, { includeVideos });
        if (res === 'file_picker') {
          showToast(isAr ? 'تم حفظ الملف في المجلد المحدد بنجاح' : 'Datei im Ordner gespeichert');
        } else if (res === 'share') {
          showToast(isAr ? 'تم فتح نافذة المشاركة الحية' : 'Freigabe geöffnet');
        } else if (res === 'download_data' || res === 'download_blob') {
          showToast(isAr ? 'تم تنزيل الملف بنجاح!' : 'Datei heruntergeladen');
        } else {
          showToast(isAr ? 'تعذر الحفظ تلقائياً، يمكنك نسخ كود الملف' : 'Speichern fehlgeschlagen');
        }
      }
    } catch (err: any) {
      console.error('[PlanShareModal] FolderPickerSave error:', err);
      showToast(isAr ? 'تعذر الحفظ في المجلد المحدد' : 'Ordnerauswahl fehlgeschlagen');
    } finally {
      setActiveAction(null);
    }
  };

  const handleOpenCodeInspector = async () => {
    if (activeAction !== null) return;
    try {
      setActiveAction('inspector');
      triggerHaptic('selection');
      const jsonStr = await exportPlanAsJsonString(plan, { includeVideos });
      setCodeInspectorText(jsonStr);
      setShowCodeInspector(true);
    } catch (err: any) {
      console.error('[PlanShareModal] CodeInspector error:', err);
      showToast(isAr ? 'تعذر توليد كود الملف' : 'Fehler beim Generieren');
    } finally {
      setActiveAction(null);
    }
  };

  const handleDownloadFile = async () => {
    if (activeAction !== null) return;
    try {
      setActiveAction('download');
      triggerHaptic('success');
      const res = await exportPlanAsFile(plan, { includeVideos });
      if (res === 'file_picker') {
        showToast(isAr ? 'تم حفظ الملف بنجاح' : 'Datei gespeichert');
      } else if (res === 'share') {
        showToast(isAr ? 'تم فتح نافذة الحفظ والمشاركة' : 'Freigabe geöffnet');
      } else if (res === 'download_data' || res === 'download_blob') {
        showToast(isAr ? 'تم إرسال أمر التحميل للجهاز بنجاح!' : 'Download-Befehl gesendet');
      } else {
        showToast(isAr ? 'تعذر التحميل، يمكنك النسخ عبر زر النسخ المباشر' : 'Download fehlgeschlagen');
      }
    } catch (err: any) {
      console.error('[PlanShareModal] DownloadFile error:', err);
      showToast(isAr ? 'حدث خطأ أثناء تحميل الملف' : 'Fehler beim Herunterladen');
    } finally {
      setActiveAction(null);
    }
  };

  const handleCopyJson = async () => {
    if (activeAction !== null) return;
    try {
      setActiveAction('copy');
      triggerHaptic('success');
      const jsonStr = await exportPlanAsJsonString(plan, { includeVideos });
      const res = await copyTextToClipboardAndroid(jsonStr);
      if (res.success) {
        setCopied(true);
        if (res.isLightweightFallback) {
          showToast(
            isAr
              ? 'تم نسخ بيانات وتفاصيل الجدول بنجاح! (تم استبعاد كود الفيديوهات لتجاوزها سعة الحافظة)'
              : 'Plan-Details kopiert! (Videos wegen Größe ausgeschlossen)'
          );
        } else {
          showToast(isAr ? 'تم نسخ كود الجدول إلى الحافظة بنجاح!' : 'Plan-Code kopiert!');
        }
        setTimeout(() => setCopied(false), 2500);
      } else {
        showToast(isAr ? 'تعذر النسخ التلقائي، يمكنك استخدام زر عرض الكود أو تنزيل الملف' : 'Kopieren fehlgeschlagen');
      }
    } catch (err: any) {
      console.error('[PlanShareModal] CopyJson error:', err);
      showToast(isAr ? 'تعذر النسخ' : 'Kopieren fehlgeschlagen');
    } finally {
      setActiveAction(null);
    }
  };

  const handleExportZipPackage = async () => {
    if (activeAction !== null) return;
    try {
      setActiveAction('zip');
      triggerHaptic('success');
      const success = await exportPlanAsZipFile(plan, { includeVideos });
      if (success) {
        showToast(
          isAr
            ? 'تم تصدير وتنزيل الحزمة المضغوطة (.zip) شاملة الفيديوهات والصور بنجاح!'
            : 'ZIP-Paket erfolgreich exportiert!'
        );
      } else {
        showToast(isAr ? 'تعذر تصدير الملف المضغوط' : 'ZIP-Export fehlgeschlagen');
      }
    } catch (err: any) {
      console.error('[PlanShareModal] ExportZip error:', err);
      showToast(isAr ? 'حدث خطأ أثناء تصدير الملف المضغوط' : 'Fehler beim ZIP-Export');
    } finally {
      setActiveAction(null);
    }
  };

  const handleNativeShare = async () => {
    if (activeAction !== null) return;
    try {
      setActiveAction('share');
      triggerHaptic('selection');
      const success = await sharePlanNative(plan, { includeVideos });
      if (success) {
        showToast(isAr ? 'تم فتح خيارات المشاركة والحفظ' : 'Freigabe geöffnet');
      } else {
        await handleDownloadFile();
      }
    } catch (err: any) {
      console.error('[PlanShareModal] NativeShare error:', err);
      showToast(isAr ? 'تعذر المشاركة' : 'Teilen fehlgeschlagen');
    } finally {
      setActiveAction(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic('selection');
    setActiveAction('import_file');
    try {
      const result = await parseAndHydrateZipOrJsonFile(file);
      if (result.success && result.plan) {
        setImportPreview(result.plan);
        setImportError(null);
        triggerHaptic('light');
        if (result.mediaRestoredCount && result.mediaRestoredCount > 0) {
          showToast(
            isAr
              ? `تم استرجاع ${result.mediaRestoredCount} فيديو وصورة بحجمها الكلي دون أي فقدان!`
              : `${result.mediaRestoredCount} Medien erfolgreich wiederhergestellt!`
          );
        }
      } else {
        setImportPreview(null);
        setImportError(result.error || (isAr ? 'خطأ في الاستيراد' : 'Importfehler'));
        triggerHaptic('warning');
      }
    } catch (err: any) {
      setImportPreview(null);
      setImportError(isAr ? 'تعذر قراءة الملف' : 'Datei konnte nicht gelesen werden');
      triggerHaptic('warning');
    } finally {
      setActiveAction(null);
      e.target.value = '';
    }
  };

  const handleParsePastedJson = async () => {
    if (!pastedJson.trim()) {
      setImportError(isAr ? 'الرجاء لصق كود JSON أولاً' : 'Bitte füge zuerst den JSON-Code ein');
      setImportPreview(null);
      return;
    }
    triggerHaptic('selection');
    setActiveAction('import_paste');
    try {
      const result = await parseAndHydratePlanJson(pastedJson);
      if (result.success && result.plan) {
        setImportPreview(result.plan);
        setImportError(null);
        triggerHaptic('light');
      } else {
        setImportPreview(null);
        setImportError(result.error || (isAr ? 'الكود الملصق غير صالح' : 'Ungültiger Code'));
        triggerHaptic('warning');
      }
    } catch (err: any) {
      setImportPreview(null);
      setImportError(isAr ? 'خطأ في تحليل كود JSON' : 'Fehler beim Analysieren');
      triggerHaptic('warning');
    } finally {
      setActiveAction(null);
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    triggerHaptic('success');
    onUpdatePlan(importPreview);
    showToast(isAr ? 'تم استيراد وتطبيق الجدول الجديد بنجاح!' : 'Plan erfolgreich importiert!');
    onClose();
  };

  const handleRestoreDefaultPlan = () => {
    triggerHaptic('warning');
    if (
      window.confirm(
        isAr
          ? 'هل أنت تأكد من استعادة الجدول القياسي الافتراضي (4 أيام)؟'
          : 'Möchtest du den Standard-Plan wiederherstellen?'
      )
    ) {
      onUpdatePlan(DEFAULT_WORKOUT_PLAN);
      showToast(isAr ? 'تم استعادة الجدول الافتراضي بنجاح' : 'Standard-Plan wiederhergestellt');
      onClose();
    }
  };

  const getTotalExercisesCount = (p: WorkoutPlan | null) => {
    if (!p) return 0;
    let count = 0;
    if (p.exercises) count += p.exercises.length;
    if (p.days) {
      Object.values(p.days).forEach((d) => {
        if (d?.exercises) count += d.exercises.length;
      });
    }
    return count;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-[#0d1712]/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#d2e2d7] flex flex-col max-h-[90vh] z-10"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#215641] to-[#184232] text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
                  <ArrowUpDown className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base sm:text-lg leading-tight">
                    {isAr ? 'تصدير واستيراد الجدول' : 'Plan Exportieren & Importieren'}
                  </h3>
                  <p className="text-[11px] text-emerald-100/90 font-medium mt-0.5">
                    {isAr
                      ? 'حفظ الجدول بحزمة مضغوطة (.zip) أو استيراده بسهولة'
                      : 'Speichere oder lade deinen Trainingsplan'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#e2ebe4] bg-[#f7faf8]">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('export');
                }}
                className={`flex-1 py-3 px-4 font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'export'
                    ? 'border-[#215641] text-[#215641] bg-white'
                    : 'border-transparent text-[#6e8276] hover:text-[#15241c]'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تصدير وحفظ' : 'Exportieren'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('import');
                }}
                className={`flex-1 py-3 px-4 font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'import'
                    ? 'border-[#215641] text-[#215641] bg-white'
                    : 'border-transparent text-[#6e8276] hover:text-[#15241c]'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{isAr ? 'استيراد واسترجاع' : 'Importieren'}</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {activeTab === 'export' ? (
                /* EXPORT TAB */
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Active Plan Card Preview */}
                  <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#e2ebe4] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#4f6156] uppercase tracking-wider">
                        {isAr ? 'الجدول الحالي' : 'Aktueller Plan'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#edf5f0] text-[#215641] text-[10px] font-bold border border-[#bad5c2]">
                        {isAr ? `${getTotalExercisesCount(plan)} تمارين` : `${getTotalExercisesCount(plan)} Übungen`}
                      </span>
                    </div>

                    <h4 className="font-display font-black text-base text-[#15241c]">
                      {isAr ? plan.nameAr : plan.nameDe}
                    </h4>
                    <p className="text-xs text-[#5a7364]">
                      {isAr ? plan.scheduleDaysAr : plan.scheduleDaysDe}
                    </p>
                  </div>

                  {/* Video Media Toggle Option */}
                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f0f6f2] border border-[#d2e4d7] cursor-pointer hover:bg-[#e7f1eb] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#215641] text-white">
                        <Film className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#15241c]">
                          {isAr ? 'تضمين مقاطع الفيديو والصور' : 'Videos & Fotos einschließen'}
                        </div>
                        <div className="text-[10px] text-[#5a7364]">
                          {isAr
                            ? 'حفظ وسائط الأجهزة كملفات مستقلة داخل ملف الـ ZIP'
                            : 'Speichert Medien als Dateien im ZIP-Archiv'}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeVideos}
                      onChange={(e) => {
                        triggerHaptic('selection');
                        setIncludeVideos(e.target.checked);
                      }}
                      className="w-4 h-4 accent-[#215641] rounded cursor-pointer"
                    />
                  </label>

                  {/* Main Action Buttons */}
                  <div className="space-y-3 pt-1">
                    {/* 1. PRIMARY ZIP PACKAGE EXPORT */}
                    <button
                      type="button"
                      onClick={handleExportZipPackage}
                      disabled={activeAction !== null}
                      className="w-full py-4 px-4 rounded-2xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-sm flex items-center justify-between transition-all active:scale-[0.99] shadow-md cursor-pointer disabled:opacity-60 border border-emerald-600/30"
                    >
                      <div className="flex items-center gap-3 text-start">
                        {activeAction === 'zip' ? (
                          <Loader2 className="w-6 h-6 text-emerald-200 animate-spin flex-shrink-0" />
                        ) : (
                          <Archive className="w-6 h-6 text-emerald-300 flex-shrink-0" />
                        )}
                        <div>
                          <div className="leading-snug text-white font-black text-sm">
                            {isAr ? 'تصدير حزمة مضغوطة (.zip)' : 'Als ZIP-Paket (.zip) exportieren'}
                          </div>
                          <div className="text-[10px] text-emerald-100 font-normal mt-0.5">
                            {isAr
                              ? 'ملف ZIP يحتوي على بيانات الجدول والصور والفيديوهات'
                              : 'Enthält plan.json sowie alle Fotos & Videos'}
                          </div>
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                    </button>

                    {/* Collapsible Additional Options Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setShowMoreOptions(!showMoreOptions);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#f7faf8] hover:bg-[#edf5f0] text-[#4f6156] font-display font-bold text-xs flex items-center justify-between border border-[#e2ebe4] transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#215641]" />
                          <span>{isAr ? 'خيارات وتنسيقات إضافية للتصدير' : 'Weitere Export-Optionen'}</span>
                        </span>
                        {showMoreOptions ? (
                          <ChevronUp className="w-4 h-4 text-[#4f6156]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#4f6156]" />
                        )}
                      </button>

                      {showMoreOptions && (
                        <div className="mt-2 space-y-2 p-3 rounded-2xl bg-[#fafcfa] border border-[#e2ebe4] animate-in fade-in duration-150">
                          {/* Pick Folder Save */}
                          <button
                            type="button"
                            onClick={handleFolderPickerSave}
                            disabled={activeAction !== null}
                            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#edf5f0] text-[#15241c] font-display font-bold text-xs flex items-center justify-between border border-[#dce7df] transition-all cursor-pointer disabled:opacity-60"
                          >
                            <div className="flex items-center gap-2.5">
                              {activeAction === 'folder' ? (
                                <Loader2 className="w-4 h-4 text-[#215641] animate-spin" />
                              ) : (
                                <FolderDown className="w-4 h-4 text-[#215641]" />
                              )}
                              <span>{isAr ? 'تحديد مجلد وقسم الحفظ للجهاز' : 'Ordner wählen & Speichern'}</span>
                            </div>
                            <FolderDown className="w-3.5 h-3.5 text-[#5a7364]" />
                          </button>

                          {/* Standard JSON file */}
                          <button
                            type="button"
                            onClick={handleDownloadFile}
                            disabled={activeAction !== null}
                            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#edf5f0] text-[#15241c] font-display font-bold text-xs flex items-center justify-between border border-[#dce7df] transition-all cursor-pointer disabled:opacity-60"
                          >
                            <div className="flex items-center gap-2.5">
                              {activeAction === 'download' ? (
                                <Loader2 className="w-4 h-4 text-[#215641] animate-spin" />
                              ) : (
                                <FileJson className="w-4 h-4 text-[#215641]" />
                              )}
                              <span>{isAr ? 'تنزيل ملف عادي (.json)' : 'Als .json Datei speichern'}</span>
                            </div>
                            <Download className="w-3.5 h-3.5 text-[#5a7364]" />
                          </button>

                          {/* Native Share App */}
                          <button
                            type="button"
                            onClick={handleNativeShare}
                            disabled={activeAction !== null}
                            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#edf5f0] text-[#15241c] font-display font-bold text-xs flex items-center justify-between border border-[#dce7df] transition-all cursor-pointer disabled:opacity-60"
                          >
                            <div className="flex items-center gap-2.5">
                              {activeAction === 'share' ? (
                                <Loader2 className="w-4 h-4 text-[#215641] animate-spin" />
                              ) : (
                                <Share2 className="w-4 h-4 text-[#215641]" />
                              )}
                              <span>{isAr ? 'مشاركة عبر تطبيق خارجي' : 'Über App teilen'}</span>
                            </div>
                            <Share2 className="w-3.5 h-3.5 text-[#5a7364]" />
                          </button>

                          {/* Code Inspector Toggle */}
                          <button
                            type="button"
                            onClick={handleOpenCodeInspector}
                            disabled={activeAction !== null}
                            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#edf5f0] text-[#15241c] font-display font-bold text-xs flex items-center justify-between border border-[#dce7df] transition-all cursor-pointer disabled:opacity-60"
                          >
                            <div className="flex items-center gap-2.5">
                              {activeAction === 'inspector' ? (
                                <Loader2 className="w-4 h-4 text-[#215641] animate-spin" />
                              ) : (
                                <Code2 className="w-4 h-4 text-[#215641]" />
                              )}
                              <span>{isAr ? 'معاينة كود الـ JSON' : 'JSON-Code anzeigen'}</span>
                            </div>
                            <Eye className="w-3.5 h-3.5 text-[#5a7364]" />
                          </button>

                          {/* Copy JSON */}
                          <button
                            type="button"
                            onClick={handleCopyJson}
                            disabled={activeAction !== null}
                            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#edf5f0] text-[#15241c] font-display font-bold text-xs flex items-center justify-between border border-[#dce7df] transition-all cursor-pointer disabled:opacity-60"
                          >
                            <div className="flex items-center gap-2.5">
                              {activeAction === 'copy' ? (
                                <Loader2 className="w-4 h-4 text-[#215641] animate-spin" />
                              ) : (
                                <Copy className="w-4 h-4 text-[#215641]" />
                              )}
                              <span>{copied ? (isAr ? 'تم نسخ الكود' : 'Kopiert') : (isAr ? 'نسخ كود الجدول' : 'Code kopieren')}</span>
                            </div>
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5a7364]" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Code Inspector View */}
                  {showCodeInspector && (
                    <div className="p-4 rounded-2xl bg-[#15241c] text-white space-y-3 animate-in fade-in duration-200 border border-[#215641]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                          <Code2 className="w-4 h-4" />
                          <span>{isAr ? 'كود الجدول المباشر (JSON Code)' : 'Plan JSON Code'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCodeInspector(false)}
                          className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0d1712] border border-[#215641] max-h-48 overflow-y-auto">
                        <textarea
                          readOnly
                          value={codeInspectorText}
                          className="w-full h-36 bg-transparent text-[11px] font-mono text-emerald-300 resize-none outline-none leading-relaxed"
                          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await copyTextToClipboardAndroid(codeInspectorText);
                            triggerHaptic(res.success ? 'success' : 'warning');
                            if (res.success) {
                              showToast(isAr ? 'تم تحديد الكود ونسخه بنجاح' : 'Code kopiert!');
                            } else {
                              showToast(isAr ? 'حدد النص داخل المربع لنسخه' : 'Bitte manuell auswählen');
                            }
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0d1712] font-display font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          <Copy className="w-4 h-4" />
                          <span>{isAr ? 'تحديد الكود ونسخه' : 'Alles kopieren'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowCodeInspector(false)}
                          className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-display font-bold text-xs cursor-pointer"
                        >
                          {isAr ? 'إغلاق' : 'Schließen'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* IMPORT TAB */
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* File Upload Zone */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.json,application/zip,application/json"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 rounded-2xl border-2 border-dashed border-[#bad5c2] hover:border-[#215641] bg-[#f9fcfa] hover:bg-[#edf5f0] transition-all cursor-pointer text-center space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#edf5f0] text-[#215641] mx-auto flex items-center justify-center border border-[#d2e2d7] group-hover:scale-105 transition-transform">
                      {activeAction === 'import_file' ? (
                        <Loader2 className="w-6 h-6 stroke-[2.2] animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 stroke-[2.2]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-[#15241c]">
                        {isAr ? 'اختر ملف جدول من جهازك (.zip أو .json)' : 'ZIP- oder JSON-Datei auswählen'}
                      </h4>
                      <p className="text-xs text-[#6e8276] mt-0.5">
                        {isAr ? 'يدعم الحزم المضغوطة (.zip) وملفات .json مباشرة' : 'Klicke hier zum Auswählen'}
                      </p>
                    </div>
                  </div>

                  {/* Or Paste JSON Text */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-[#4f6156]">
                      {isAr ? 'أو يلصق كود الجدول (JSON) هنا:' : 'Oder Plan-Code einfügen:'}
                    </label>
                    <textarea
                      value={pastedJson}
                      onChange={(e) => {
                        setPastedJson(e.target.value);
                        setImportError(null);
                      }}
                      placeholder={
                        isAr
                          ? 'الصق كود الـ JSON هنا لتجربته واستيراده...'
                          : 'Füge hier den JSON-Code ein...'
                      }
                      rows={4}
                      className="w-full p-3 rounded-2xl border border-[#dce7df] focus:border-[#215641] focus:ring-2 focus:ring-[#215641]/20 font-mono text-xs text-[#15241c] bg-[#fafcfa] resize-none outline-none"
                    />

                    {pastedJson.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={handleParsePastedJson}
                        disabled={activeAction !== null}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#edf5f0] hover:bg-[#e2ede6] text-[#1b4332] font-display font-bold text-xs flex items-center justify-center gap-2 border border-[#bad5c2] transition-all cursor-pointer disabled:opacity-60"
                      >
                        {activeAction === 'import_paste' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>{isAr ? 'فحص ومعاينة الكود' : 'Code prüfen & Vorschau'}</span>
                      </button>
                    )}
                  </div>

                  {/* Error Notification */}
                  {importError && (
                    <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{importError}</span>
                    </div>
                  )}

                  {/* Import Preview Confirmation Card */}
                  {importPreview && (
                    <div className="p-4 rounded-2xl bg-[#edf5f0] border border-[#a8cfb7] space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#215641] uppercase tracking-wider flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#215641]" />
                          <span>{isAr ? 'معاينة الملف المستورد' : 'Plan-Vorschau'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#215641] text-white text-[10px] font-bold">
                          {isAr ? `${getTotalExercisesCount(importPreview)} تمارين` : `${getTotalExercisesCount(importPreview)} Übungen`}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-display font-extrabold text-base text-[#15241c]">
                          {isAr ? importPreview.nameAr : importPreview.nameDe}
                        </h4>
                        <p className="text-xs text-[#5a7364] mt-0.5">
                          {isAr ? importPreview.scheduleDaysAr : importPreview.scheduleDaysDe}
                        </p>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmImport}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>{isAr ? 'تأكيد واستبدال الجدول الحالي' : 'Plan annehmen & ersetzen'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setImportPreview(null)}
                          className="py-2.5 px-3 rounded-xl bg-white text-[#4f6156] hover:bg-[#f1f6f3] font-display font-bold text-xs border border-[#bad5c2] cursor-pointer"
                        >
                          {isAr ? 'إلغاء' : 'Abbrechen'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Preset Reset Button */}
                  <div className="pt-2 border-t border-[#eef4f0]">
                    <button
                      type="button"
                      onClick={handleRestoreDefaultPlan}
                      className="w-full py-2.5 px-3 rounded-2xl bg-[#fafcfa] hover:bg-[#edf5f0] text-[#4f6156] hover:text-[#15241c] font-display font-bold text-xs flex items-center justify-center gap-2 border border-[#e2ebe4] transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#215641]" />
                      <span>
                        {isAr
                          ? 'استعادة الجدول القياسي الافتراضي (4 أيام)'
                          : 'Standard 4-Tage-Split wiederherstellen'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
