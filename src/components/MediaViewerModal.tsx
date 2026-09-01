import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Film,
  Image as ImageIcon,
  Maximize2,
  Trash2,
} from 'lucide-react';
import { ExerciseMediaItem } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';
import { ConfirmModal } from './ConfirmModal';
import { CustomVideoPlayer } from './CustomVideoPlayer';
import { VideoThumbnail } from './VideoThumbnail';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  mediaList: ExerciseMediaItem[];
  initialIndex?: number;
  onDeleteMedia?: (mediaId: string) => void;
  currentLang?: 'de' | 'ar';
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  onClose,
  exerciseName,
  mediaList,
  initialIndex = 0,
  onDeleteMedia,
  currentLang = 'ar',
}) => {
  const isAr = currentLang === 'ar';
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      notifyModalChange(true);
      document.body.style.overflow = 'hidden';
      setCurrentIndex(Math.min(Math.max(0, initialIndex), Math.max(0, mediaList.length - 1)));
    }
    return () => {
      if (isOpen) {
        notifyModalChange(false);
      }
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex, mediaList.length]);

  if (!isOpen || mediaList.length === 0) return null;

  const currentItem = mediaList[currentIndex] || mediaList[0];

  const handleNext = () => {
    triggerHaptic('light');
    setCurrentIndex((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrev = () => {
    triggerHaptic('light');
    setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
        {/* Animated Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-2xl bg-[#0e1712] border border-[#23382c] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#1c2e24] bg-[#121f18]/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#1b3629] text-[#73d29d] flex items-center justify-center flex-shrink-0">
                {currentItem.type === 'video' ? (
                  <Film className="w-4 h-4" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-sm sm:text-base text-white truncate">
                  {exerciseName}
                </h3>
                <span className="text-[11px] text-[#86a794] block truncate">
                  {currentItem.name || (currentItem.type === 'video' ? 'Video' : 'Foto')} · {currentIndex + 1} / {mediaList.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onDeleteMedia && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('warning');
                    setShowDeleteConfirm(true);
                  }}
                  className="p-2 rounded-xl text-[#86a794] hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                  title={isAr ? 'حذف هذا الملف' : 'Löschen'}
                  aria-label={isAr ? 'حذف هذا الملف' : 'Löschen'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="p-2 rounded-xl text-[#86a794] hover:text-white hover:bg-[#1b3629] transition-colors cursor-pointer"
                aria-label={isAr ? 'إغلاق' : 'Schließen'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Media Player Area */}
          <div className="relative flex-1 flex items-center justify-center bg-black/80 p-0 sm:p-2 min-h-[280px] sm:min-h-[400px] overflow-hidden">
            {currentItem.type === 'video' ? (
              <CustomVideoPlayer
                key={currentItem.url}
                src={currentItem.url}
                autoPlay={true}
                loop={true}
                currentLang={currentLang}
              />
            ) : (
              <img
                key={currentItem.url}
                src={currentItem.url}
                alt={currentItem.name || exerciseName}
                className="max-h-[60vh] sm:max-h-[65vh] w-auto max-w-full rounded-2xl shadow-lg object-contain p-2"
              />
            )}

            {/* Previous / Next Floating Buttons (if > 1 media item) */}
            {mediaList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-[#215641] text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all active:scale-95 z-20"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-[#215641] text-white flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all active:scale-95 z-20"
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip (if > 1 item) */}
          {mediaList.length > 1 && (
            <div className="p-3 bg-[#121f18] border-t border-[#1c2e24] flex items-center justify-center gap-2 overflow-x-auto">
              {mediaList.map((item, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setCurrentIndex(idx);
                    }}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-black/40 ${
                      isSelected
                        ? 'border-[#73d29d] scale-105 shadow-md ring-2 ring-[#73d29d]/30'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full relative flex items-center justify-center bg-[#182c21]">
                        <VideoThumbnail src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 fill-[#73d29d] text-[#73d29d]" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          type="delete"
          title={isAr ? 'حذف هذا المرفق؟' : 'Anhang löschen?'}
          description={
            isAr
              ? `هل أنت متأكد من رغبتك في حذف هذا الملف "${currentItem.name || (currentItem.type === 'video' ? 'الفيديو' : 'الصورة')}"؟ لن تتمكن من استرجاعه بعد الحذف.`
              : `Möchtest du die Datei "${currentItem.name || (currentItem.type === 'video' ? 'Video' : 'Foto')}" wirklich löschen?`
          }
          confirmText={isAr ? 'نعم، احذف المرفق' : 'Ja, löschen'}
          cancelText={isAr ? 'إلغاء' : 'Abbrechen'}
          currentLang={currentLang}
          onConfirm={() => {
            if (onDeleteMedia) {
              triggerHaptic('warning');
              const targetId = currentItem.id;
              onDeleteMedia(targetId);
              setShowDeleteConfirm(false);
              if (mediaList.length <= 1) {
                onClose();
              } else if (currentIndex >= mediaList.length - 1) {
                setCurrentIndex(Math.max(0, mediaList.length - 2));
              }
            }
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </AnimatePresence>
  );
};
