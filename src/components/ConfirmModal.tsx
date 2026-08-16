import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, RotateCcw, X } from 'lucide-react';
import { Language } from '../types';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  type?: 'reset' | 'delete' | 'danger';
  currentLang: Language;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText,
  cancelText,
  type = 'reset',
  currentLang,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  const isDelete = type === 'delete' || type === 'danger';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#dbe4dc] space-y-4 min-w-0"
            onClick={(e) => e.stopPropagation()}
            dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header with icon & close */}
            <div className="flex items-start justify-between gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  isDelete
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-[#eef4f0] text-[#215641] border border-[#d6e5db]'
                }`}
              >
                {isDelete ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#75877d] hover:text-[#15221b] hover:bg-[#f1f6f3] transition-colors"
                aria-label={cancelText}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Text Content */}
            <div className="space-y-1.5 min-w-0">
              <h3 className="font-display font-bold text-base sm:text-lg text-[#15221b] leading-snug break-words">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-[#4f6156] leading-relaxed break-words">
                {description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 h-11 rounded-xl border border-[#dbe4dc] bg-white hover:bg-[#f8faf8] text-[#4f6156] hover:text-[#15221b] text-xs sm:text-sm font-semibold transition-all active:scale-98"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={`flex-1 h-11 rounded-xl text-white text-xs sm:text-sm font-bold transition-all active:scale-98 shadow-sm ${
                  isDelete
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#215641] hover:bg-[#1b4635]'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
