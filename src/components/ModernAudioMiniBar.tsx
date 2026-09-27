import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, Music2, X } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useIsModalOpen } from '../utils/modalManager';
import { ViewTab, Language } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface ModernAudioMiniBarProps {
  currentTab: ViewTab;
  onNavigateTab: (tab: ViewTab) => void;
  lang: Language;
}

export const ModernAudioMiniBar: React.FC<ModernAudioMiniBarProps> = ({
  currentTab,
  onNavigateTab,
  lang,
}) => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    handleNext,
    currentTime,
    duration,
    stopAudio,
  } = useAudio();

  const isModalOpen = useIsModalOpen();
  const isAr = lang === 'ar';

  // Only show if there is an active track, not already on the audio tab, and no modal is open
  const shouldShow = Boolean(currentTrack) && currentTab !== 'audio' && !isModalOpen;

  if (!shouldShow || !currentTrack) return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.aside
        aria-label={isAr ? 'مشغل الصوت المصغر' : 'Mini-Audioplayer'}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="fixed bottom-[82px] inset-x-3 sm:inset-x-auto sm:w-[460px] sm:left-1/2 sm:-translate-x-1/2 z-40"
      >
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl border border-[#d2e2d7] shadow-[0_8px_20px_rgba(21,34,27,0.12)] p-2.5 flex items-center justify-between gap-3 text-[#15221b]">
          {/* Progress bar at the bottom */}
          <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-[#edf5f0]">
            <div
              className="h-full bg-[#215641] transition-[width] duration-300 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Track Info (Click to open full audio view) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onNavigateTab('audio');
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-start cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#edf5f0] border border-[#bad5c2] flex items-center justify-center flex-shrink-0 text-[#215641] group-hover:bg-[#e0ece3] transition-colors">
              <Music2 className="w-5 h-5 stroke-[2.2]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-display font-bold text-[#15221b] truncate group-hover:text-[#215641] transition-colors">
                {currentTrack.title || (isAr ? 'ملف صوتي' : 'Audiodatei')}
              </p>
              <p className="text-[11px] text-[#6e8276] truncate">
                {currentTrack.artist || (isAr ? 'مشغل الصوتيات' : 'Audioplayer')}
              </p>
            </div>
          </button>

          {/* Quick Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Play / Pause */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('medium');
                togglePlay();
              }}
              className="w-9 h-9 rounded-full bg-[#215641] text-white flex items-center justify-center hover:bg-[#1b4332] active:scale-95 transition-all shadow-xs cursor-pointer"
              title={isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pausieren') : (isAr ? 'تشغيل' : 'Abspielen')}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white ms-0.5" />
              )}
            </button>

            {/* Skip Next */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                handleNext();
              }}
              className="w-8 h-8 rounded-full text-[#4a5f52] hover:text-[#15221b] hover:bg-[#edf5f0] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              title={isAr ? 'التالي' : 'Weiter'}
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Close / Stop */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                stopAudio();
              }}
              className="w-7 h-7 rounded-full text-[#8a9d91] hover:text-[#c93b2b] hover:bg-red-50 flex items-center justify-center transition-all active:scale-95 cursor-pointer ms-0.5"
              title={isAr ? 'إيقاف وإغلاق' : 'Beenden'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
