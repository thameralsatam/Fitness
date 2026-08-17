import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, X, Headphones } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { ViewTab, Language } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface FloatingMiniPlayerProps {
  currentTab: ViewTab;
  onNavigateTab: (tab: ViewTab) => void;
  lang: Language;
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  currentTab,
  onNavigateTab,
  lang,
}) => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    handleNext,
    stopAudio,
    currentTime,
    duration,
  } = useAudio();

  // Show mini player only when there is an active track and currentTab is NOT 'audio'
  if (!currentTrack || currentTab === 'audio') {
    return null;
  }

  const isAr = lang === 'ar';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="fixed bottom-[72px] sm:bottom-[80px] left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-lg"
      >
        <div className="bg-[#15221b]/95 backdrop-blur-xl border border-emerald-500/30 text-white rounded-2xl shadow-xl p-2.5 flex items-center justify-between gap-2.5 relative overflow-hidden">
          {/* Progress bar line at top edge */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-950">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Track Info (Clickable to jump to Audio Tab) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onNavigateTab('audio');
            }}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-right ltr:text-left hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-[#215641] text-[#7be3af] flex items-center justify-center flex-shrink-0 shadow-inner">
              <Headphones className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {currentTrack.name}
              </p>
              <p className="text-[10px] text-emerald-300/80 truncate leading-tight">
                {isAr ? 'مشغل الصوت شغال' : 'Audio playing in background'}
              </p>
            </div>
          </button>

          {/* Quick Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                togglePlay();
              }}
              className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 flex items-center justify-center active:scale-95 transition-all shadow-sm"
              title={isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current stroke-[2.5]" />
              ) : (
                <Play className="w-4 h-4 fill-current stroke-[2.5] ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                handleNext();
              }}
              className="w-8 h-8 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-900/50 flex items-center justify-center active:scale-95 transition-all"
              title={isAr ? 'التالي' : 'Next'}
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Close / Stop Audio (X) */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('warning');
                stopAudio();
              }}
              className="w-8 h-8 rounded-full text-emerald-400/80 hover:text-red-400 hover:bg-red-950/40 flex items-center justify-center active:scale-95 transition-all ml-0.5"
              title={isAr ? 'إيقاف وإغلاق' : 'Stop & Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
