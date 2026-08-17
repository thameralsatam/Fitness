import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Type, Check, X, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { triggerHaptic } from '../utils/haptics';

export interface FontConfig {
  titleFont: string;
  bodyFont: string;
}

export const TITLE_FONTS = [
  { id: 'kufam', name: 'Kufam', labelAr: 'كوفام (افتراضي - رياضي عريض)', labelDe: 'Kufam (Standard - Kräftig)', value: "'Kufam', sans-serif" },
  { id: 'cairo', name: 'Cairo', labelAr: 'كايرو (عصري وواضح)', labelDe: 'Cairo (Modern & Klar)', value: "'Cairo', sans-serif" },
  { id: 'readex', name: 'Readex Pro', labelAr: 'ريدكس برو (هندسي رشيق)', labelDe: 'Readex Pro (Geometrisch)', value: "'Readex Pro', sans-serif" },
  { id: 'changa', name: 'Changa', labelAr: 'تشانغا (كتلي مميز)', labelDe: 'Changa (Sportlich-Block)', value: "'Changa', sans-serif" },
  { id: 'system', name: 'System Font', labelAr: 'خط نظام الجوال (System Font)', labelDe: 'System-Schriftart', value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
];

export const BODY_FONTS = [
  { id: 'ibm', name: 'IBM Plex Sans Arabic', labelAr: 'آي بي إم بلكس (افتراضي - مريح للقراءة)', labelDe: 'IBM Plex Sans (Standard)', value: "'IBM Plex Sans Arabic', sans-serif" },
  { id: 'cairo', name: 'Cairo', labelAr: 'كايرو (سلس ومقروء)', labelDe: 'Cairo (Flüssig)', value: "'Cairo', sans-serif" },
  { id: 'tajawal', name: 'Tajawal', labelAr: 'تجوّل (عربي أنيق ومتناسق)', labelDe: 'Tajawal (Harmonisch)', value: "'Tajawal', sans-serif" },
  { id: 'almarai', name: 'Almarai', labelAr: 'المراعي (عالي الوضوح)', labelDe: 'Almarai (Hohe Lesbarkeit)', value: "'Almarai', sans-serif" },
  { id: 'system', name: 'System Font', labelAr: 'خط نظام الجوال (System Font)', labelDe: 'System-Schriftart', value: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
];

interface FontSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentTitleFont: string;
  currentBodyFont: string;
  onSelectTitleFont: (fontValue: string) => void;
  onSelectBodyFont: (fontValue: string) => void;
}

export const FontSettingsModal: React.FC<FontSettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentTitleFont,
  currentBodyFont,
  onSelectTitleFont,
  onSelectBodyFont,
}) => {
  const isAr = lang === 'ar';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#dbe4dc] p-5 sm:p-6 overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#e2ebe3] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#eef4f0] text-[#215641] flex items-center justify-center">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[#15221b]">
                  {isAr ? 'اختيار خطوط التطبيق' : 'App-Schriftarten anpassen'}
                </h3>
                <p className="text-[11px] text-[#75877d]">
                  {isAr ? 'تخصيص خط النصوص وخط العناوين' : 'Schriftart für Titel & Fließtext'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f1f6f3] text-[#4f6156] hover:text-[#15221b] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Options List */}
          <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
            {/* 1. Title / Heading Font Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#15221b] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#215641]" />
                  <span>{isAr ? 'خط العناوين الرئيسية (Titles Font):' : 'Schriftart für Überschriften:'}</span>
                </label>
              </div>

              <div className="space-y-1.5">
                {TITLE_FONTS.map((f) => {
                  const isSelected = currentTitleFont === f.value;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        onSelectTitleFont(f.value);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all active:scale-98 ${
                        isSelected
                          ? 'bg-[#eef5f1] border-[#215641] text-[#215641] shadow-xs'
                          : 'bg-[#fafcfa] border-[#dbe4dc] text-[#15221b] hover:border-[#bad3c3]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span style={{ fontFamily: f.value }} className="text-sm font-bold">
                          {isAr ? f.labelAr : f.labelDe}
                        </span>
                        <span className="text-[10px] text-[#75877d]">{f.name}</span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#215641] text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Body Text Font Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#15221b] flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[#215641]" />
                  <span>{isAr ? 'خط النصوص والقوائم (Body Text Font):' : 'Schriftart für Fließtext & Listen:'}</span>
                </label>
              </div>

              <div className="space-y-1.5">
                {BODY_FONTS.map((f) => {
                  const isSelected = currentBodyFont === f.value;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        onSelectBodyFont(f.value);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all active:scale-98 ${
                        isSelected
                          ? 'bg-[#eef5f1] border-[#215641] text-[#215641] shadow-xs'
                          : 'bg-[#fafcfa] border-[#dbe4dc] text-[#15221b] hover:border-[#bad3c3]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span style={{ fontFamily: f.value }} className="text-sm font-medium">
                          {isAr ? f.labelAr : f.labelDe}
                        </span>
                        <span className="text-[10px] text-[#75877d]">{f.name}</span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#215641] text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-[#e2ebe3] flex items-center justify-end flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('success');
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-[#215641] hover:bg-[#1b4836] text-white text-xs font-bold rounded-xl transition-colors shadow-sm active:scale-98"
            >
              {isAr ? 'تم وحفظ الإعدادات' : 'Fertig & Schließen'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
