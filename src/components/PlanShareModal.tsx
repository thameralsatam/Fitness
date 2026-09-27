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
  Code2,
  Loader2,
  Archive,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { WorkoutPlan, Language } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';
import {
  exportPlanAsFile,
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
  const [showPasteArea, setShowPasteArea] = useState(false);

  // Code Inspector state
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

  const handleOpenCodeInspector = async () => {
    if (activeAction !== null) return;
    try {
      setActiveAction('inspector');
      triggerHaptic('selection');
      const jsonStr = await exportPlanAsJsonString(plan, { includeVideos: false });
      setCodeInspectorText(jsonStr);
      setShowCodeInspector(true);
    } catch {
      showToast(isAr ? 'تعذر توليد كود الخطة' : 'Fehler beim Generieren');
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
      if (res === 'file_picker' || res === 'download_data' || res === 'download_blob') {
        showToast(isAr ? 'تم تنزيل ملف الخطة بنجاح' : 'Datei heruntergeladen');
      } else if (res === 'share') {
        showToast(isAr ? 'تم فتح نافذة المشاركة' : 'Freigabe geöffnet');
      } else {
        showToast(isAr ? 'تعذر التحميل، يمكنك نسخ الكود بدلاً من ذلك' : 'Download fehlgeschlagen');
      }
    } catch {
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
      const jsonStr = await exportPlanAsJsonString(plan, { includeVideos: false });
      const res = await copyTextToClipboardAndroid(jsonStr);
      if (res.success) {
        setCopied(true);
        showToast(isAr ? 'تم نسخ كود الخطة' : 'Plan-Code kopiert');
        setTimeout(() => setCopied(false), 2500);
      } else {
        showToast(isAr ? 'تعذر النسخ التلقائي' : 'Kopieren fehlgeschlagen');
      }
    } catch {
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
            ? 'تم تصدير حزمة الخطة (.zip) بنجاح'
            : 'ZIP-Paket erfolgreich exportiert'
        );
      } else {
        showToast(isAr ? 'تعذر تصدير الحزمة' : 'Export fehlgeschlagen');
      }
    } catch {
      showToast(isAr ? 'حدث خطأ أثناء تصدير الملف' : 'Fehler beim Exportieren');
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
      if (!success) {
        await handleDownloadFile();
      }
    } catch {
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
              ? `تم استرجاع ${result.mediaRestoredCount} ملف وسائط بنجاح`
              : `${result.mediaRestoredCount} Medien wiederhergestellt`
          );
        }
      } else {
        setImportPreview(null);
        setImportError(result.error || (isAr ? 'الملف غير صالح أو تالف' : 'Ungültige Datei'));
        triggerHaptic('warning');
      }
    } catch {
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
      setImportError(isAr ? 'يرجى لصق كود JSON أولاً' : 'Bitte zuerst JSON-Code einfügen');
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
        setImportError(result.error || (isAr ? 'كود الخطة غير صالح' : 'Ungültiger Code'));
        triggerHaptic('warning');
      }
    } catch {
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
    showToast(isAr ? 'تم استيراد الخطة وتطبيقها بنجاح' : 'Plan erfolgreich angewendet');
    onClose();
  };

  const handleRestoreDefaultPlan = () => {
    triggerHaptic('warning');
    if (
      window.confirm(
        isAr
          ? 'هل ترغب في استعادة جدول التمارين الافتراضي (5 أيام)؟'
          : 'Möchtest du den 5-Tage-Standardplan wiederherstellen?'
      )
    ) {
      onUpdatePlan(DEFAULT_WORKOUT_PLAN);
      showToast(isAr ? 'تمت استعادة الجدول الافتراضي' : 'Standardplan wiederhergestellt');
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
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/45 z-[100] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
            className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-[#e4ede7] flex flex-col max-h-[85vh] z-10"
          >
            {/* Clean, Quiet Modal Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-[#edf4ee]">
              <div>
                <h3 className="font-display font-extrabold text-base text-[#15241c]">
                  {isAr ? 'خطة التمارين' : 'Trainingsplan'}
                </h3>
                <p className="text-xs text-[#6e8276] mt-0.5">
                  {isAr ? 'تصدير نسخة احتياطية أو استيراد خطة' : 'Sichern oder Wiederherstellen'}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#75877d] hover:text-[#15221b] hover:bg-[#f1f6f3] transition-colors cursor-pointer"
                aria-label={isAr ? 'إغلاق' : 'Schließen'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Calm Segmented Control Tabs */}
            <div className="px-5 pt-4">
              <div className="flex p-1 bg-[#f1f6f3] rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setActiveTab('export');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl font-display font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'export'
                      ? 'bg-white text-[#15241c] shadow-2xs'
                      : 'text-[#6e8276] hover:text-[#15241c]'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تصدير وحفظ' : 'Exportieren'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setActiveTab('import');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl font-display font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'import'
                      ? 'bg-white text-[#15241c] shadow-2xs'
                      : 'text-[#6e8276] hover:text-[#15241c]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isAr ? 'استيراد واسترجاع' : 'Importieren'}</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {activeTab === 'export' ? (
                /* EXPORT SECTION */
                <div className="space-y-4">
                  {/* Active Plan Summary */}
                  <div className="p-3.5 rounded-2xl bg-[#f8faf9] border border-[#e4ede7] flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="text-[11px] font-semibold text-[#6e8276]">
                        {isAr ? 'الخطة الحالية' : 'Aktueller Plan'}
                      </div>
                      <div className="font-display font-extrabold text-sm text-[#15241c] truncate mt-0.5">
                        {isAr ? plan.nameAr : plan.nameDe}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-[#edf5f0] text-[#215641] text-xs font-bold whitespace-nowrap flex-shrink-0">
                      {isAr
                        ? `${getTotalExercisesCount(plan)} أجهزة`
                        : `${getTotalExercisesCount(plan)} Übungen`}
                    </span>
                  </div>

                  {/* Media Toggle Switch */}
                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f8faf9] border border-[#e4ede7] cursor-pointer hover:bg-[#f1f6f3] transition-colors">
                    <div className="space-y-0.5 pr-2">
                      <div className="text-xs font-bold text-[#15241c]">
                        {isAr ? 'تضمين الصور ومقاطع الفيديو' : 'Medien einschließen'}
                      </div>
                      <div className="text-[11px] text-[#6e8276]">
                        {isAr
                          ? 'حفظ وسائط الأجهزة مع الخطة داخل الحزمة'
                          : 'Alle Fotos & Videos in die ZIP aufnehmen'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeVideos}
                      onChange={(e) => {
                        triggerHaptic('selection');
                        setIncludeVideos(e.target.checked);
                      }}
                      className="w-4 h-4 accent-[#215641] rounded cursor-pointer flex-shrink-0"
                    />
                  </label>

                  {/* Primary Export Button */}
                  <button
                    type="button"
                    onClick={handleExportZipPackage}
                    disabled={activeAction !== null}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 shadow-2xs"
                  >
                    {activeAction === 'zip' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                    <span>
                      {isAr
                        ? 'تصدير حزمة الخطة كاملة (.zip)'
                        : 'ZIP-Paket herunterladen'}
                    </span>
                  </button>

                  {/* Secondary Export Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadFile}
                      disabled={activeAction !== null}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-[#f8faf9] text-[#15241c] font-display font-bold text-xs flex items-center justify-center gap-1.5 border border-[#e4ede7] transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {activeAction === 'download' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#215641]" />
                      ) : (
                        <FileJson className="w-3.5 h-3.5 text-[#5a7364]" />
                      )}
                      <span>{isAr ? 'ملف JSON فقط' : 'Nur .json Datei'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyJson}
                      disabled={activeAction !== null}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-[#f8faf9] text-[#15241c] font-display font-bold text-xs flex items-center justify-center gap-1.5 border border-[#e4ede7] transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {activeAction === 'copy' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#215641]" />
                      ) : copied ? (
                        <Check className="w-3.5 h-3.5 text-[#215641]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#5a7364]" />
                      )}
                      <span>
                        {copied
                          ? isAr
                            ? 'تم النسخ'
                            : 'Kopiert'
                          : isAr
                          ? 'نسخ الكود'
                          : 'Code kopieren'}
                      </span>
                    </button>
                  </div>

                  {/* Quiet Additional Utilities */}
                  <div className="flex items-center justify-center gap-4 pt-1 text-xs text-[#6e8276]">
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      disabled={activeAction !== null}
                      className="hover:text-[#15241c] font-medium flex items-center gap-1 transition-colors cursor-pointer py-1"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مشاركة' : 'Teilen'}</span>
                    </button>
                    <span className="text-[#d2e2d7]">·</span>
                    <button
                      type="button"
                      onClick={handleOpenCodeInspector}
                      disabled={activeAction !== null}
                      className="hover:text-[#15241c] font-medium flex items-center gap-1 transition-colors cursor-pointer py-1"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'عرض الكود' : 'Code anzeigen'}</span>
                    </button>
                  </div>

                  {/* Clean Code Viewer */}
                  {showCodeInspector && (
                    <div className="p-3.5 rounded-2xl bg-[#f8faf9] border border-[#e4ede7] space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#15241c]">
                          {isAr ? 'كود الخطة (JSON)' : 'Plan-Code'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCodeInspector(false)}
                          className="text-[#6e8276] hover:text-[#15241c] text-xs font-semibold cursor-pointer"
                        >
                          {isAr ? 'إغلاق' : 'Schließen'}
                        </button>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#e4ede7] max-h-36 overflow-y-auto">
                        <textarea
                          readOnly
                          value={codeInspectorText}
                          className="w-full h-28 bg-transparent text-[11px] font-mono text-[#15241c] resize-none outline-none leading-relaxed"
                          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const res = await copyTextToClipboardAndroid(codeInspectorText);
                          triggerHaptic(res.success ? 'success' : 'warning');
                          showToast(
                            res.success
                              ? isAr
                                ? 'تم نسخ الكود'
                                : 'Code kopiert'
                              : isAr
                              ? 'يرجى تحديد النص يدويًا'
                              : 'Fehler'
                          );
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isAr ? 'نسخ كامل الكود' : 'Alles kopieren'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* IMPORT SECTION */
                <div className="space-y-4">
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
                    className="p-6 rounded-2xl border-2 border-dashed border-[#d2e2d7] hover:border-[#215641] bg-[#f8faf9] hover:bg-[#f1f6f3] transition-colors cursor-pointer text-center space-y-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white text-[#215641] mx-auto flex items-center justify-center border border-[#e4ede7] shadow-2xs">
                      {activeAction === 'import_file' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 stroke-[2.2]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs sm:text-sm text-[#15241c]">
                        {isAr
                          ? 'اختيار ملف الخطة (.zip أو .json)'
                          : 'ZIP- oder JSON-Datei auswählen'}
                      </h4>
                      <p className="text-[11px] text-[#6e8276] mt-0.5">
                        {isAr
                          ? 'يتم استرجاع التمارين والصور والفيديوهات تلقائياً'
                          : 'Lädt alle Übungen und Medien'}
                      </p>
                    </div>
                  </div>

                  {/* Optional Direct Code Paste Accordion */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowPasteArea(!showPasteArea)}
                      className="text-xs font-semibold text-[#6e8276] hover:text-[#15241c] flex items-center justify-between w-full py-1 transition-colors cursor-pointer"
                    >
                      <span>
                        {isAr
                          ? 'أو لصق كود الخطة (JSON) مباشرة'
                          : 'Oder JSON-Code einfügen'}
                      </span>
                      {showPasteArea ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {showPasteArea && (
                      <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                        <textarea
                          value={pastedJson}
                          onChange={(e) => {
                            setPastedJson(e.target.value);
                            setImportError(null);
                          }}
                          placeholder={
                            isAr
                              ? 'الصق كود الـ JSON هنا...'
                              : 'JSON-Code hier einfügen...'
                          }
                          rows={3}
                          className="w-full p-3 rounded-xl border border-[#e4ede7] focus:border-[#215641] font-mono text-xs text-[#15241c] bg-[#f8faf9] resize-none outline-none"
                        />
                        {pastedJson.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={handleParsePastedJson}
                            disabled={activeAction !== null}
                            className="w-full py-2 px-3 rounded-xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            {activeAction === 'import_paste' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{isAr ? 'فحص ومعاينة الخطة' : 'Code prüfen'}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Error Box */}
                  {importError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{importError}</span>
                    </div>
                  )}

                  {/* Plan Preview & Confirmation */}
                  {importPreview && (
                    <div className="p-3.5 rounded-2xl bg-[#f8faf9] border border-[#bad5c2] space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#215641] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{isAr ? 'جاهز للاستيراد' : 'Vorschau bereit'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#edf5f0] text-[#215641] text-[11px] font-bold">
                          {isAr
                            ? `${getTotalExercisesCount(importPreview)} أجهزة`
                            : `${getTotalExercisesCount(importPreview)} Übungen`}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-display font-extrabold text-sm text-[#15241c]">
                          {isAr ? importPreview.nameAr : importPreview.nameDe}
                        </h4>
                        <p className="text-xs text-[#6e8276] mt-0.5">
                          {isAr
                            ? importPreview.scheduleDaysAr
                            : importPreview.scheduleDaysDe}
                        </p>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmImport}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{isAr ? 'تطبيق الخطة' : 'Übernehmen'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setImportPreview(null)}
                          className="py-2.5 px-3 rounded-xl bg-white text-[#6e8276] hover:bg-[#f1f6f3] font-display font-bold text-xs border border-[#e4ede7] transition-colors cursor-pointer"
                        >
                          {isAr ? 'إلغاء' : 'Abbrechen'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reset to Default Plan */}
                  <div className="pt-3 border-t border-[#edf4ee] text-center">
                    <button
                      type="button"
                      onClick={handleRestoreDefaultPlan}
                      className="text-xs text-[#6e8276] hover:text-[#15241c] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        {isAr
                          ? 'استعادة الخطة الافتراضية (5 أيام)'
                          : 'Standardplan wiederherstellen'}
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
