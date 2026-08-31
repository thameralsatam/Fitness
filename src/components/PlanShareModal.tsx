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
  Sparkles,
  AlertTriangle,
  RotateCcw,
  FileText,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Loader2,
} from 'lucide-react';
import { WorkoutPlan, Language } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';
import {
  exportPlanAsFile,
  exportPlanAsJsonString,
  sharePlanNative,
  parseAndHydratePlanJson,
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
  const [pastedJson, setPastedJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importPreview, setImportPreview] = useState<WorkoutPlan | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

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

  const handleDownloadFile = async () => {
    try {
      setIsProcessing(true);
      triggerHaptic('success');
      await exportPlanAsFile(plan);
      showToast(isAr ? 'تم تحميل ملف الجدول شاملاً الوسائط بنجاح (.json)' : 'Plan inkl. Medien heruntergeladen');
    } catch {
      showToast(isAr ? 'حدث خطأ أثناء تحميل الملف' : 'Fehler beim Herunterladen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyJson = async () => {
    try {
      setIsProcessing(true);
      triggerHaptic('success');
      const jsonStr = await exportPlanAsJsonString(plan);
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      showToast(isAr ? 'تم نسخ كود الجدول شاملاً الوسائط إلى الحافظة' : 'Plan-Code in die Zwischenablage kopiert');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(isAr ? 'تعذر النسخ التلقائي' : 'Kopieren fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      setIsProcessing(true);
      triggerHaptic('selection');
      const success = await sharePlanNative(plan);
      if (success) {
        showToast(isAr ? 'تم فتح خيارات المشاركة' : 'Freigabe geöffnet');
      } else {
        await handleCopyJson();
      }
    } catch {
      showToast(isAr ? 'تعذر المشاركة' : 'Teilen fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic('selection');
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = await parseAndHydratePlanJson(content);
        if (result.success && result.plan) {
          setImportPreview(result.plan);
          setImportError(null);
          triggerHaptic('light');
        } else {
          setImportPreview(null);
          setImportError(result.error || (isAr ? 'خطأ في الاستيراد' : 'Importfehler'));
          triggerHaptic('warning');
        }
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setImportError(isAr ? 'تعذر قراءة الملف' : 'Datei konnte nicht gelesen werden');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleParsePastedJson = async () => {
    if (!pastedJson.trim()) {
      setImportError(isAr ? 'الرجاء لصق كود JSON أولاً' : 'Bitte füge zuerst den JSON-Code ein');
      setImportPreview(null);
      return;
    }
    triggerHaptic('selection');
    setIsProcessing(true);
    try {
      const result = await parseAndHydratePlanJson(pastedJson);
      if (result.success && result.plan) {
        setImportPreview(result.plan);
        setImportError(null);
        triggerHaptic('light');
      } else {
        setImportPreview(null);
        setImportError(result.error || (isAr ? 'كود غير صالح' : 'Ungültiger Code'));
        triggerHaptic('warning');
      }
    } finally {
      setIsProcessing(false);
    }
  };


  const handleConfirmImport = () => {
    if (!importPreview) return;
    triggerHaptic('success');
    onUpdatePlan(importPreview);
    showToast(isAr ? 'تم استيراد وتحديث الجدول بنجاح!' : 'Plan erfolgreich importiert!');
    setImportPreview(null);
    setPastedJson('');
    onClose();
  };

  const handleRestoreDefaultPlan = () => {
    triggerHaptic('warning');
    onUpdatePlan(DEFAULT_WORKOUT_PLAN);
    showToast(isAr ? 'تم استعادة الجدول الافتراضي (4 أيام)' : 'Standardplan wiederhergestellt');
    onClose();
  };

  // Count total exercises across all days in the plan
  const getTotalExercisesCount = (targetPlan: WorkoutPlan) => {
    if (targetPlan.days) {
      const uniqueExIds = new Set<number>();
      Object.values(targetPlan.days).forEach((dayData) => {
        if (!dayData.isRestDay && Array.isArray(dayData.exercises)) {
          dayData.exercises.forEach((ex) => uniqueExIds.add(ex.id));
        }
      });
      if (uniqueExIds.size > 0) return uniqueExIds.size;
    }
    return targetPlan.exercises?.length || 0;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-[#e2ebe3] z-10 overflow-hidden max-h-[92vh] flex flex-col text-[#15221b]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#eef4f0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#edf5f0] text-[#215641] flex items-center justify-center border border-[#d2e2d7] shadow-2xs">
                  <ArrowUpDown className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-[#15221b] leading-tight">
                    {isAr ? 'تصدير واستيراد الجدول' : 'Plan Exportieren & Importieren'}
                  </h3>
                  <p className="text-xs text-[#6e8276] mt-0.5">
                    {isAr ? 'مشاركة جدول التمارين أو استيراد ملف جديد' : 'Plan teilen oder aus Datei laden'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="w-9 h-9 rounded-full bg-[#f1f6f3] text-[#4f6156] hover:text-[#15221b] hover:bg-[#e2ece5] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                aria-label={isAr ? 'إغلاق' : 'Schließen'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Tab Bar */}
            <div className="px-5 pt-4 pb-2">
              <div className="grid grid-cols-2 p-1 bg-[#edf5f0] rounded-2xl border border-[#d6e5dc]">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setActiveTab('export');
                  }}
                  className={`py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'export'
                      ? 'bg-white text-[#1b4332] shadow-xs'
                      : 'text-[#5a7364] hover:text-[#15241c]'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تصدير ومشاركة' : 'Exportieren'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setActiveTab('import');
                  }}
                  className={`py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'import'
                      ? 'bg-white text-[#1b4332] shadow-xs'
                      : 'text-[#5a7364] hover:text-[#15241c]'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{isAr ? 'استيراد جدول' : 'Importieren'}</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto min-w-0 flex-1">
              {activeTab === 'export' ? (
                /* EXPORT TAB */
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Active Plan Card Preview */}
                  <div className="p-4 rounded-2xl bg-[#f7faf8] border border-[#e2ebe4] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#4f6156] uppercase tracking-wider">
                        {isAr ? 'الجدول الحالي' : 'Aktueller Plan'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#edf5f0] text-[#215641] text-[10px] font-bold border border-[#bad5c2]">
                        {isAr ? `${getTotalExercisesCount(plan)} جهاز` : `${getTotalExercisesCount(plan)} Übungen`}
                      </span>
                    </div>

                    <h4 className="font-display font-extrabold text-base text-[#15241c]">
                      {isAr ? plan.nameAr : plan.nameDe}
                    </h4>

                    <p className="text-xs text-[#6e8276]">
                      {isAr ? plan.scheduleDaysAr : plan.scheduleDaysDe}
                    </p>
                  </div>

                  {/* Action Buttons Stack */}
                  <div className="space-y-2.5 pt-1">
                    {/* 1. Download JSON File */}
                    <button
                      type="button"
                      onClick={handleDownloadFile}
                      disabled={isProcessing}
                      className="w-full py-3 px-4 rounded-2xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-sm flex items-center justify-between transition-all active:scale-[0.99] shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 text-emerald-200 animate-spin" />
                        ) : (
                          <FileJson className="w-5 h-5 text-emerald-200" />
                        )}
                        <div className="text-start">
                          <div className="leading-snug">
                            {isAr ? 'تنزيل كملف (.json)' : 'Als .json Datei herunterladen'}
                          </div>
                          <div className="text-[10px] text-emerald-100 font-normal">
                            {isAr ? 'ملف مناسب للمشاركة والاحتفاظ بنسخة احتياطية (يشمل الوسائط)' : 'Ideal zum Sichern inkl. Medien'}
                          </div>
                        </div>
                      </div>
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>

                    {/* 2. Share via Native Share App */}
                    <button
                      type="button"
                      onClick={handleNativeShare}
                      disabled={isProcessing}
                      className="w-full py-3 px-4 rounded-2xl bg-[#edf5f0] hover:bg-[#e2ede6] text-[#1b4332] font-display font-bold text-sm flex items-center justify-between border border-[#bad5c2] transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <Share2 className="w-5 h-5 text-[#215641]" />
                        <div className="text-start">
                          <div className="leading-snug">
                            {isAr ? 'مشاركة عبر تطبيقات الجوال' : 'Über Smartphone teilen'}
                          </div>
                          <div className="text-[10px] text-[#5a7364] font-normal">
                            {isAr ? 'واتساب، تلغرام، أو الحفظ في الملفات' : 'WhatsApp, Telegram oder Dateien'}
                          </div>
                        </div>
                      </div>
                      <Share2 className="w-4 h-4 text-[#215641]" />
                    </button>

                    {/* 3. Copy JSON String */}
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      disabled={isProcessing}
                      className="w-full py-3 px-4 rounded-2xl bg-[#fafcfa] hover:bg-[#edf5f0] text-[#2c4235] font-display font-bold text-sm flex items-center justify-between border border-[#e0ece3] transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        {copied ? (
                          <Check className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-[#4f6156]" />
                        )}
                        <div className="text-start">
                          <div className="leading-snug">
                            {copied
                              ? (isAr ? 'تم النسخ بنجاح!' : 'Kopiert!')
                              : (isAr ? 'نسخ كود الجدول (JSON)' : 'Plan-Code kopieren')}
                          </div>
                          <div className="text-[10px] text-[#6e8276] font-normal">
                            {isAr ? 'لصقه مباشرة في التطبيق على جهاز آخر' : 'Code auf anderem Gerät einfügen'}
                          </div>
                        </div>
                      </div>
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#6e8276]" />}
                    </button>

                  </div>
                </div>
              ) : (
                /* IMPORT TAB */
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* File Upload Trigger Area */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 rounded-2xl border-2 border-dashed border-[#bad5c2] hover:border-[#215641] bg-[#f9fcfa] hover:bg-[#edf5f0] transition-all cursor-pointer text-center space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#edf5f0] text-[#215641] mx-auto flex items-center justify-center border border-[#d2e2d7] group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-[#15241c]">
                        {isAr ? 'اختر ملف جدول من جهازك (.json)' : 'JSON-Datei auswählen'}
                      </h4>
                      <p className="text-xs text-[#6e8276] mt-0.5">
                        {isAr ? 'انقر هنا للتصفح واختيار الملف' : 'Klicke hier zum Auswählen'}
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
                        className="w-full py-2.5 px-4 rounded-xl bg-[#edf5f0] hover:bg-[#e2ede6] text-[#1b4332] font-display font-bold text-xs flex items-center justify-center gap-2 border border-[#bad5c2] transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
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
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isAr ? 'معاينة الملف المستورد' : 'Plan-Vorschau'}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#215641] text-white text-[10px] font-bold">
                          {isAr ? `${getTotalExercisesCount(importPreview)} جهاز` : `${getTotalExercisesCount(importPreview)} Übungen`}
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
