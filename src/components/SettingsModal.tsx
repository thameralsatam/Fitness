import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  X, 
  Globe, 
  Type, 
  Bug, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  Copy,
  Layers,
  Sparkles,
  BookOpen,
  ArrowUpDown
} from 'lucide-react';
import { Language } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';
import { SaudiFlagSvg, GermanFlagSvg } from './SvgIcons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  onSelectLang: (lang: Language) => void;
  onOpenFontSettings: () => void;
  onOpenDebugLogs: () => void;
  onOpenLibrary?: () => void;
  onOpenPlanShare?: () => void;
  onResetProgress?: () => void;
  onCopyPlan?: () => void;
  onFactoryReset?: () => void;
  libraryExercisesCount?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onSelectLang,
  onOpenFontSettings,
  onOpenDebugLogs,
  onOpenLibrary,
  onOpenPlanShare,
  onResetProgress,
  onCopyPlan,
  onFactoryReset,
  libraryExercisesCount = 0,
}) => {
  const isAr = currentLang === 'ar';
  const ArrowIcon = isAr ? ChevronLeft : ChevronRight;

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

  const handleOpenFont = () => {
    triggerHaptic('selection');
    onClose();
    onOpenFontSettings();
  };

  const handleOpenConsole = () => {
    triggerHaptic('selection');
    onClose();
    onOpenDebugLogs();
  };

  const handleOpenLib = () => {
    triggerHaptic('selection');
    onClose();
    if (onOpenLibrary) onOpenLibrary();
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
            className="relative w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-[#e2ebe3] z-10 overflow-hidden max-h-[90vh] flex flex-col text-[#15221b]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#eef4f0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center border border-[#dbe4dc] shadow-2xs">
                  <Settings className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-lg text-[#15221b] leading-tight">
                    {isAr ? 'الإعدادات' : 'Einstellungen'}
                  </h3>
                  <p className="text-xs text-[#75877d] mt-0.5">
                    {isAr ? 'تخصيص الواجهة واللغة وسجلات التشخيص' : 'Sprache, Schriftarten & Entwickler-Optionen'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="w-9 h-9 rounded-full bg-[#f1f6f3] text-[#4f6156] hover:text-[#15221b] hover:bg-[#e2ece5] flex items-center justify-center transition-all active:scale-95"
                aria-label={isAr ? 'إغلاق' : 'Schließen'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Language Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4f6156] px-1">
                  <Globe className="w-3.5 h-3.5 text-[#215641]" />
                  <span>{isAr ? 'لغة التطبيق' : 'Sprache'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      onSelectLang('ar');
                    }}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-right ${
                      isAr
                        ? 'bg-[#edf4ef] border-[#215641] text-[#215641] font-bold shadow-2xs ring-1 ring-[#215641]'
                        : 'bg-white border-[#e2ebe3] text-[#4f6156] hover:bg-[#f6f8f6]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <SaudiFlagSvg className="w-6 h-4" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">العربية</span>
                        <span className="text-[11px] opacity-75">Arabic</span>
                      </div>
                    </div>
                    {isAr && (
                      <div className="w-5 h-5 rounded-full bg-[#215641] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      onSelectLang('de');
                    }}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-left ${
                      !isAr
                        ? 'bg-[#edf4ef] border-[#215641] text-[#215641] font-bold shadow-2xs ring-1 ring-[#215641]'
                        : 'bg-white border-[#e2ebe3] text-[#4f6156] hover:bg-[#f6f8f6]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <GermanFlagSvg className="w-6 h-4" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Deutsch</span>
                        <span className="text-[11px] opacity-75">German</span>
                      </div>
                    </div>
                    {!isAr && (
                      <div className="w-5 h-5 rounded-full bg-[#215641] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Exercise & Machine Library Section */}
              {onOpenLibrary && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4f6156] px-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#215641]" />
                    <span>{isAr ? 'مكتبة التمارين والأجهزة' : 'Bibliothek & Geräte'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenLib}
                    className="w-full p-3.5 rounded-2xl bg-white border border-[#e2ebe3] hover:border-[#215641]/40 hover:bg-[#f6f8f6] transition-all flex items-center justify-between group active:scale-[0.99] text-start"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0 group-hover:bg-[#215641] group-hover:text-white transition-colors">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#15221b]">
                          {isAr ? 'إدارة مكتبة الأجهزة والتمارين' : 'Übungs- & Geräte-Bibliothek'}
                        </div>
                        <div className="text-xs font-semibold text-[#215641] mt-0.5">
                          {isAr
                            ? `${libraryExercisesCount} أجهزة وتمارين محفوظة محلياً`
                            : `${libraryExercisesCount} Geräte & Übungen lokal gespeichert`}
                        </div>
                      </div>
                    </div>
                    <ArrowIcon className="w-4 h-4 text-[#75877d] group-hover:text-[#215641] transition-colors flex-shrink-0" />
                  </button>
                </div>
              )}

              {/* Plan Share / Import & Export Section */}
              {onOpenPlanShare && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4f6156] px-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#215641]" />
                    <span>{isAr ? 'تصدير واستيراد الجدول' : 'Plan Export / Import'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      onClose();
                      onOpenPlanShare();
                    }}
                    className="w-full p-3.5 rounded-2xl bg-[#edf5f0] border border-[#c2dcd0] hover:border-[#215641]/60 hover:bg-[#e2ede6] transition-all flex items-center justify-between group active:scale-[0.99] text-start shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#215641] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <ArrowUpDown className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#15221b]">
                          {isAr ? 'مشاركة وتصدير أو استيراد ملف' : 'Plan teilen, sichern oder importieren'}
                        </div>
                        <div className="text-xs font-semibold text-[#215641] mt-0.5">
                          {isAr
                            ? 'تحميل كملف JSON أو استيراد جدول آخر'
                            : 'Als JSON speichern oder externen Plan laden'}
                        </div>
                      </div>
                    </div>
                    <ArrowIcon className="w-4 h-4 text-[#215641] flex-shrink-0" />
                  </button>
                </div>
              )}

              {/* Fonts Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4f6156] px-1">
                  <Type className="w-3.5 h-3.5 text-[#215641]" />
                  <span>{isAr ? 'مظهر الخطوط' : 'Typografie'}</span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenFont}
                  className="w-full p-3.5 rounded-2xl bg-white border border-[#e2ebe3] hover:border-[#215641]/40 hover:bg-[#f6f8f6] transition-all flex items-center justify-between group active:scale-[0.99] text-start"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0 group-hover:bg-[#215641] group-hover:text-white transition-colors">
                      <Type className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#15221b]">
                        {isAr ? 'تغيير خطوط التطبيق' : 'Schriftarten anpassen'}
                      </div>
                      <div className="text-xs text-[#75877d]">
                        {isAr ? 'تخصيص خطوط العناوين والنصوص أو رفع خط خارجي' : 'Titel- und Fließtextschriftarten wählen'}
                      </div>
                    </div>
                  </div>
                  <ArrowIcon className="w-4 h-4 text-[#75877d] group-hover:text-[#215641] transition-colors flex-shrink-0" />
                </button>
              </div>

              {/* Console Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#4f6156] px-1">
                  <Bug className="w-3.5 h-3.5 text-[#215641]" />
                  <span>{isAr ? 'أدوات المطور والتشخيص' : 'Entwickler & Diagnose'}</span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenConsole}
                  className="w-full p-3.5 rounded-2xl bg-[#edf4ef]/50 border border-[#dbe4dc] hover:border-[#215641]/50 hover:bg-[#edf4ef] transition-all flex items-center justify-between group active:scale-[0.99] text-start"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#215641] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Bug className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#15221b] flex items-center gap-2">
                        <span>{isAr ? 'الكونسول وسجل التشخيص' : 'Debug Logs Console'}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#215641]/15 text-[#215641] font-bold">LIVE</span>
                      </div>
                      <div className="text-xs text-[#75877d]">
                        {isAr ? 'عرض سجلات النظام وتتبع تشغيل الصوت والذاكرة' : 'Systemprotokolle & Audio-Puffer einsehen'}
                      </div>
                    </div>
                  </div>
                  <ArrowIcon className="w-4 h-4 text-[#75877d] group-hover:text-[#215641] transition-colors flex-shrink-0" />
                </button>
              </div>

              {/* Secondary Actions (Reset / Copy) if available */}
              {(onResetProgress || onCopyPlan) && (
                <div className="pt-2 border-t border-[#eef4f0] flex items-center gap-2">
                  {onCopyPlan && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onClose();
                        onCopyPlan();
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#f1f6f3] text-[#4f6156] hover:bg-[#e2ece5] hover:text-[#15221b] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{isAr ? 'نسخ الخطة' : 'Plan kopieren'}</span>
                    </button>
                  )}

                  {onResetProgress && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('warning');
                        onClose();
                        onResetProgress();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-[#edf4ef] text-[#215641] hover:bg-[#dbe8de] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تصفير اليوم' : 'Zurücksetzen'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Factory Reset Action */}
              {onFactoryReset && (
                <div className="pt-2 border-t border-[#eef4f0]">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('warning');
                      onClose();
                      onFactoryReset();
                    }}
                    className="w-full py-3 px-3.5 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/60 font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-98 shadow-2xs"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.2]" />
                    <span>{isAr ? 'إعادة ضبط مصنع شاملة للموقع (مسح التخزين)' : 'Werkseinstellungen (Alle Daten löschen)'}</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
