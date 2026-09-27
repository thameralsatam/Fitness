import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Type, Check, X, Sparkles, UploadCloud, Trash2, Smartphone } from 'lucide-react';
import { Language } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  saveAndApplyCustomFont,
  getStoredCustomFontInfo,
  deleteCustomFont,
} from '../utils/customFonts';

export const DEFAULT_TITLE_FONT = "'Thmanyah Sans', system-ui, -apple-system, sans-serif";
export const DEFAULT_BODY_FONT = "'Thmanyah Sans', system-ui, -apple-system, sans-serif";
export const SYSTEM_FONT = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

interface FontSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  currentTitleFont: string;
  currentBodyFont: string;
  onSelectTitleFont: (fontValue: string) => void;
  onSelectBodyFont: (fontValue: string) => void;
  onShowToast?: (msg: string) => void;
}

export const FontSettingsModal: React.FC<FontSettingsModalProps> = ({
  isOpen,
  onClose,
  currentTitleFont,
  currentBodyFont,
  onSelectTitleFont,
  onSelectBodyFont,
  onShowToast,
}) => {
  const titleFileInputRef = useRef<HTMLInputElement | null>(null);
  const bodyFileInputRef = useRef<HTMLInputElement | null>(null);

  const [customTitleInfo, setCustomTitleInfo] = useState(() => getStoredCustomFontInfo('title'));
  const [customBodyInfo, setCustomBodyInfo] = useState(() => getStoredCustomFontInfo('body'));
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomTitleInfo(getStoredCustomFontInfo('title'));
      setCustomBodyInfo(getStoredCustomFontInfo('body'));
    }
  }, [isOpen]);

  const handleFileUpload = async (type: 'title' | 'body', file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    triggerHaptic('medium');

    const result = await saveAndApplyCustomFont(type, file);
    setIsUploading(false);

    if (result.success && result.fontValue) {
      triggerHaptic('success');
      if (type === 'title') {
        setCustomTitleInfo(getStoredCustomFontInfo('title'));
        onSelectTitleFont(result.fontValue);
      } else {
        setCustomBodyInfo(getStoredCustomFontInfo('body'));
        onSelectBodyFont(result.fontValue);
      }
      const msg = `تم استيراد وتطبيق الخط بنجاح: ${file.name}`;
      if (onShowToast) onShowToast(msg);
    } else {
      triggerHaptic('heavy');
      const errorMsg = 'فشل استيراد ملف الخط، تأكد من الصيغة (TTF, OTF, WOFF)';
      if (onShowToast) onShowToast(errorMsg);
    }
  };

  const handleDeleteCustom = (type: 'title' | 'body') => {
    triggerHaptic('warning');
    deleteCustomFont(type);
    if (type === 'title') {
      setCustomTitleInfo(getStoredCustomFontInfo('title'));
      if (currentTitleFont.includes('CustomTitleFont')) {
        onSelectTitleFont(DEFAULT_TITLE_FONT);
      }
    } else {
      setCustomBodyInfo(getStoredCustomFontInfo('body'));
      if (currentBodyFont.includes('CustomBodyFont')) {
        onSelectBodyFont(DEFAULT_BODY_FONT);
      }
    }
    if (onShowToast) {
      onShowToast('تم حذف الخط المخصص والرجوع للافتراضي');
    }
  };

  if (!isOpen) return null;

  const isCustomTitleSelected = currentTitleFont.includes('CustomTitleFont');
  const isKufamTitleSelected = currentTitleFont === DEFAULT_TITLE_FONT;
  const isSystemTitleSelected = currentTitleFont === SYSTEM_FONT;

  const isCustomBodySelected = currentBodyFont.includes('CustomBodyFont');
  const isIbmBodySelected = currentBodyFont === DEFAULT_BODY_FONT;
  const isSystemBodySelected = currentBodyFont === SYSTEM_FONT;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Hidden File Pickers */}
        <input
          type="file"
          ref={titleFileInputRef}
          accept=".ttf,.otf,.woff,.woff2,.eot"
          className="hidden"
          onChange={(e) => {
            handleFileUpload('title', e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <input
          type="file"
          ref={bodyFileInputRef}
          accept=".ttf,.otf,.woff,.woff2,.eot"
          className="hidden"
          onChange={(e) => {
            handleFileUpload('body', e.target.files?.[0]);
            e.target.value = '';
          }}
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
          <div className="flex items-center justify-between pb-3.5 border-b border-[#e2ebe3] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#eef4f0] text-[#215641] flex items-center justify-center">
                <Type className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-[15px] text-[#15221b]">
                  إدارة واستيراد الخطوط
                </h3>
                <p className="text-[11px] text-[#75877d]">
                  الخطوط الافتراضية أو استيراد خط مخصص من جهازك
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f1f6f3] text-[#4f6156] hover:text-[#15221b] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
            {/* 1. Title / Heading Font Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#15221b] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#215641]" />
                  <span>1. خط العناوين الرئيسية (Titles Font):</span>
                </label>
              </div>

              <div className="space-y-2">
                {/* Option: Default Thmanyah Sans */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelectTitleFont(DEFAULT_TITLE_FONT);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-right transition-all active:scale-98 cursor-pointer ${
                    isKufamTitleSelected
                      ? 'bg-[#eef5f1] border-[#215641] text-[#215641] shadow-xs'
                      : 'bg-[#fafcfa] border-[#dbe4dc] text-[#15221b] hover:border-[#bad3c3]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span style={{ fontFamily: DEFAULT_TITLE_FONT }} className="text-sm font-bold">
                      خط ثمانية (Thmanyah Sans - الافتراضي)
                    </span>
                    <span className="text-[10px] text-[#75877d]">Thmanyah Sans Medium</span>
                  </div>
                  {isKufamTitleSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#215641] text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Option: System Font */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelectTitleFont(SYSTEM_FONT);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-right transition-all active:scale-98 cursor-pointer ${
                    isSystemTitleSelected
                      ? 'bg-[#eef5f1] border-[#215641] text-[#215641] shadow-xs'
                      : 'bg-[#fafcfa] border-[#dbe4dc] text-[#15221b] hover:border-[#bad3c3]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#75877d]" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">خط نظام الجوال (System)</span>
                      <span className="text-[10px] text-[#75877d]">Android / Device Default</span>
                    </div>
                  </div>
                  {isSystemTitleSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#215641] text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Option: Custom Uploaded Font if exists */}
                {customTitleInfo.exists && (
                  <div
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isCustomTitleSelected
                        ? 'bg-[#eef5f1] border-[#215641] text-[#215641] shadow-xs'
                        : 'bg-[#fafcfa] border-[#dbe4dc] text-[#15221b]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        onSelectTitleFont(customTitleInfo.fontValue);
                      }}
                      className="flex-1 flex flex-col text-right cursor-pointer"
                    >
                      <span style={{ fontFamily: customTitleInfo.fontValue }} className="text-sm font-bold">
                        {customTitleInfo.name} (خط مستورد)
                      </span>
                      <span className="text-[10px] text-[#75877d]">خطك المخصص المحفوظ</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {isCustomTitleSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#215641] text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom('title')}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center cursor-pointer"
                        title="حذف هذا الخط"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Import Button for Titles */}
                <button
                  type="button"
                  onClick={() => titleFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-[#215641]/40 bg-[#f4f8f5] hover:bg-[#eaf2ec] text-[#215641] text-xs font-bold transition-all active:scale-98 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>📂 استيراد خط مخصص للعناوين (TTF / OTF / WOFF)</span>
                </button>
              </div>
            </div>

            {/* 2. Body Text Font Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#15221b] flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[#215641]" />
                  <span>2. خط النصوص والقوائم (Body Font):</span>
                </label>
              </div>

              <div className="space-y-2">
                {/* Option: Default Thmanyah Sans */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelectBodyFont(DEFAULT_BODY_FONT);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-right transition-all active:scale-98 cursor-pointer ${
                    isIbmBodySelected
                      ? 'bg-[#eef5f1] border-[#215641] text-[#215641] shadow-xs'
                      : 'bg-[#fafcfa] border-[#dbe4dc] text-[#15221b] hover:border-[#bad3c3]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span style={{ fontFamily: DEFAULT_BODY_FONT }} className="text-sm font-medium">
                      خط ثمانية (Thmanyah Sans - الافتراضي)
                    </span>
                    <span className="text-[10px] text-[#75877d]">Thmanyah Sans Medium</span>
                  </div>
                  {isIbmBodySelected && (
                    <div className="w-5 h-5 rounded-full bg-[#215641] text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Option: System Font */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onSelectBodyFont(SYSTEM_FONT);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-right transition-all active:scale-98 cursor-pointer ${
                    isSystemBodySelected
                      ? 'bg-[#eef5f1] border-[#215641] text-[#215641] shadow-xs'
                      : 'bg-[#fafcfa] border-[#dbe4dc] text-[#15221b] hover:border-[#bad3c3]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#75877d]" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">خط نظام الجوال (System)</span>
                      <span className="text-[10px] text-[#75877d]">Android / Device Default</span>
                    </div>
                  </div>
                  {isSystemBodySelected && (
                    <div className="w-5 h-5 rounded-full bg-[#215641] text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Option: Custom Uploaded Font if exists */}
                {customBodyInfo.exists && (
                  <div
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isCustomBodySelected
                        ? 'bg-[#eef5f1] border-[#215641] text-[#215641] shadow-xs'
                        : 'bg-[#fafcfa] border-[#dbe4dc] text-[#15221b]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        onSelectBodyFont(customBodyInfo.fontValue);
                      }}
                      className="flex-1 flex flex-col text-right cursor-pointer"
                    >
                      <span style={{ fontFamily: customBodyInfo.fontValue }} className="text-sm font-medium">
                        {customBodyInfo.name} (خط مستورد)
                      </span>
                      <span className="text-[10px] text-[#75877d]">خطك المخصص المحفوظ</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {isCustomBodySelected && (
                        <div className="w-5 h-5 rounded-full bg-[#215641] text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteCustom('body')}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center cursor-pointer"
                        title="حذف هذا الخط"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Import Button for Body */}
                <button
                  type="button"
                  onClick={() => bodyFileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-[#215641]/40 bg-[#f4f8f5] hover:bg-[#eaf2ec] text-[#215641] text-xs font-bold transition-all active:scale-98 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>📂 استيراد خط مخصص للنصوص (TTF / OTF / WOFF)</span>
                </button>
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
              className="w-full py-2.5 px-4 bg-[#215641] hover:bg-[#1b4836] text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-98 cursor-pointer"
            >
              تم وحفظ الإعدادات
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
