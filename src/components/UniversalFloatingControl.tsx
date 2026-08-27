import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  X,
  Headphones,
  Timer as TimerIcon,
  RotateCcw,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useTimer } from '../context/TimerContext';
import { ViewTab, Language } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface UniversalFloatingControlProps {
  currentTab: ViewTab;
  onNavigateTab: (tab: ViewTab) => void;
  lang: Language;
  onActiveStatusChange?: (isActive: boolean) => void;
  onExpandStatusChange?: (isExpanded: boolean) => void;
}

export const UniversalFloatingControl: React.FC<UniversalFloatingControlProps> = ({
  currentTab,
  onNavigateTab,
  lang,
  onActiveStatusChange,
  onExpandStatusChange,
}) => {
  // Audio Context
  const {
    currentTrack,
    currentTrackIndex,
    isPlaying: isAudioPlaying,
    togglePlay: toggleAudioPlay,
    handleNext: handleAudioNext,
    stopAudio,
    currentTime: audioCurrentTime,
    duration: audioDuration,
  } = useAudio();

  // Timer Context
  const timerContext = useTimer();
  const {
    isRunning: isTimerRunning,
    secondsLeft,
    selectedDuration,
    formattedTime,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = timerContext || {
    isRunning: false,
    secondsLeft: 0,
    selectedDuration: 90,
    formattedTime: '00:00',
    pauseTimer: () => {},
    resumeTimer: () => {},
    resetTimer: () => {},
  };

  const isAr = lang === 'ar';

  // Determine active states
  const isAudioActive = currentTrack !== null || currentTrackIndex >= 0;
  const isTimerActive = isTimerRunning || (secondsLeft > 0 && secondsLeft < selectedDuration);
  const hasActiveActivity = isAudioActive || isTimerActive;

  // Active mode inside floating control ('audio' | 'timer')
  const [activeMode, setActiveMode] = useState<'audio' | 'timer'>('audio');
  
  // Floating Control Expansion State
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Ref for click outside detection
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-switch mode & expand when new activity starts
  const prevAudioPlaying = useRef(isAudioPlaying);
  const prevTimerRunning = useRef(isTimerRunning);

  useEffect(() => {
    if (isAudioPlaying && !prevAudioPlaying.current) {
      setActiveMode('audio');
      setIsExpanded(true);
    }
    prevAudioPlaying.current = isAudioPlaying;
  }, [isAudioPlaying]);

  useEffect(() => {
    if (isTimerRunning && !prevTimerRunning.current) {
      setActiveMode('timer');
      setIsExpanded(true);
    }
    prevTimerRunning.current = isTimerRunning;
  }, [isTimerRunning]);

  // If currently active mode becomes inactive, switch to the other active mode
  useEffect(() => {
    if (activeMode === 'audio' && !isAudioActive && isTimerActive) {
      setActiveMode('timer');
    } else if (activeMode === 'timer' && !isTimerActive && isAudioActive) {
      setActiveMode('audio');
    }
  }, [isAudioActive, isTimerActive, activeMode]);

  // Notify parent of active status for header padding adjustments
  useEffect(() => {
    if (onActiveStatusChange) {
      onActiveStatusChange(hasActiveActivity);
    }
  }, [hasActiveActivity, onActiveStatusChange]);

  // Notify parent of expanded state for header title fade out
  useEffect(() => {
    if (onExpandStatusChange) {
      onExpandStatusChange(hasActiveActivity && isExpanded);
    }
  }, [hasActiveActivity, isExpanded, onExpandStatusChange]);

  // Click Outside Listener: when expanded, clicking outside shrinks to minimal capsule
  useEffect(() => {
    if (!isExpanded || !hasActiveActivity) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    const timeoutId = setTimeout(() => {
      window.addEventListener('mousedown', handlePointerDownOutside);
      window.addEventListener('touchstart', handlePointerDownOutside);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousedown', handlePointerDownOutside);
      window.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, [isExpanded, hasActiveActivity]);

  // Audio progress
  const audioProgress = audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0;
  // Timer progress
  const timerProgress = selectedDuration > 0 ? ((selectedDuration - secondsLeft) / selectedDuration) * 100 : 0;

  // Handle Close / Dismiss (stops both active activities to close the island completely)
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('warning');
    if (isAudioActive) stopAudio();
    if (isTimerActive) resetTimer();
  };

  return (
    <div className="fixed top-2.5 sm:top-3 inset-x-0 z-[9999] pointer-events-none flex justify-center px-3">
      <AnimatePresence>
        {hasActiveActivity && (
          <motion.div
            key="dynamic-island-wrapper"
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              width: isExpanded ? 'min(100%, 352px)' : '48px',
            }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{
              type: 'spring',
              stiffness: 240,
              damping: 28,
              mass: 0.8,
              opacity: { duration: 0.22, ease: 'easeOut' },
            }}
            className="pointer-events-auto h-12 rounded-full bg-[#0a110d]/95 backdrop-blur-2xl border border-emerald-500/35 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative overflow-hidden select-none"
          >
            <AnimatePresence initial={false}>
              {!isExpanded ? (
                /* ================= COLLAPSED STATE (PURE CIRCULAR BUBBLE) ================= */
                <motion.button
                  key="collapsed-badge"
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => {
                    triggerHaptic('selection');
                    setIsExpanded(true);
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer select-none relative group"
                  title={isAr ? 'توسيع' : 'Erweitern'}
                >
                  {activeMode === 'audio' ? (
                    <>
                      <Headphones className={`w-5 h-5 transition-colors ${isAudioPlaying ? 'text-emerald-300 animate-pulse' : 'text-emerald-400'}`} />
                      {isAudioPlaying && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                      )}
                    </>
                  ) : (
                    <>
                      <TimerIcon className={`w-5 h-5 transition-colors ${isTimerRunning ? 'text-emerald-300 animate-pulse' : 'text-emerald-400'}`} />
                      {isTimerRunning && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
                      )}
                    </>
                  )}
                </motion.button>
              ) : (
                /* ================= EXPANDED STATE (MATCHING HEIGHT H-12 CAPSULE BAR) ================= */
                <motion.div
                  key="expanded-bar"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 w-full h-full px-3 flex items-center justify-between gap-2 overflow-hidden whitespace-nowrap"
                >
            {/* Minimal Progress Line at Bottom */}
            <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-emerald-950/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{
                  width: `${activeMode === 'audio' ? audioProgress : timerProgress}%`,
                }}
              />
            </div>

            {/* Left/Right Main Content Info */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Mode Icon or Selector */}
              {isAudioActive && isTimerActive ? (
                <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded-full border border-emerald-900/60 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('selection');
                      setActiveMode('audio');
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      activeMode === 'audio'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-emerald-300/70 hover:text-white'
                    }`}
                    title={isAr ? 'الصوتيات' : 'Audio'}
                  >
                    <Headphones className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('selection');
                      setActiveMode('timer');
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      activeMode === 'timer'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-emerald-300/70 hover:text-white'
                    }`}
                    title={isAr ? 'المؤقت' : 'Timer'}
                  >
                    <TimerIcon className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    if (activeMode === 'audio' && currentTab !== 'audio') onNavigateTab('audio');
                    if (activeMode === 'timer' && currentTab !== 'timer') onNavigateTab('timer');
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 cursor-pointer ${
                    activeMode === 'audio' && isAudioPlaying
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40'
                      : 'bg-emerald-900/60 text-emerald-300'
                  }`}
                >
                  {activeMode === 'audio' ? (
                    <Headphones className="w-3.5 h-3.5 stroke-[2.2]" />
                  ) : (
                    <TimerIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                  )}
                </button>
              )}

              {/* Title / Countdown / Active Lyric Ticker */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  if (activeMode === 'audio' && currentTab !== 'audio') onNavigateTab('audio');
                  if (activeMode === 'timer' && currentTab !== 'timer') onNavigateTab('timer');
                }}
                className="min-w-0 flex-1 text-right ltr:text-left hover:opacity-90 transition-opacity cursor-pointer truncate"
              >
                {activeMode === 'audio' ? (
                  <div className="truncate">
                    <span className="text-xs font-bold text-white truncate block">
                      {currentTrack?.name}
                    </span>
                    {/* Active Live Lyric Line Preview */}
                    {(() => {
                      const lyrics = currentTrack?.lyrics;
                      if (!lyrics || lyrics.length === 0) return null;
                      let activeText: string | null = null;
                      for (let i = 0; i < lyrics.length; i++) {
                        if (audioCurrentTime >= lyrics[i].time) {
                          activeText = lyrics[i].text;
                        } else {
                          break;
                        }
                      }
                      return activeText ? (
                        <span className="text-[10px] text-emerald-300 font-medium truncate block opacity-95 animate-fade-in font-display">
                          {activeText}
                        </span>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <span className="font-mono text-xs font-black text-emerald-300 block">
                    {formattedTime}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {activeMode === 'audio' ? (
                <>
                  {/* Play / Pause */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('medium');
                      toggleAudioPlay();
                    }}
                    className="w-7 h-7 rounded-full bg-emerald-400 text-slate-950 hover:bg-emerald-300 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs"
                    title={isAudioPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
                  >
                    {isAudioPlaying ? (
                      <Pause className="w-3 h-3 fill-current stroke-[2.5]" />
                    ) : (
                      <Play className="w-3 h-3 fill-current stroke-[2.5] ml-0.5" />
                    )}
                  </button>

                  {/* Skip Next */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      handleAudioNext();
                    }}
                    className="w-6.5 h-6.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-900/60 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                    title={isAr ? 'التالي' : 'Weiter'}
                  >
                    <SkipForward className="w-3 h-3 stroke-[2]" />
                  </button>
                </>
              ) : (
                <>
                  {/* Pause / Resume Timer */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('medium');
                      if (isTimerRunning) {
                        pauseTimer();
                      } else {
                        resumeTimer();
                      }
                    }}
                    className="w-7 h-7 rounded-full bg-emerald-400 text-slate-950 hover:bg-emerald-300 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-xs"
                    title={isTimerRunning ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'استئناف' : 'Weiter')}
                  >
                    {isTimerRunning ? (
                      <Pause className="w-3 h-3 fill-current stroke-[2.5]" />
                    ) : (
                      <Play className="w-3 h-3 fill-current stroke-[2.5] ml-0.5" />
                    )}
                  </button>

                  {/* Reset Timer */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      resetTimer();
                    }}
                    className="w-6.5 h-6.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-900/60 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                    title={isAr ? 'إعادة ضبط' : 'Zurücksetzen'}
                  >
                    <RotateCcw className="w-3 h-3 stroke-[2]" />
                  </button>
                </>
              )}

                  {/* Close / Dismiss Activity Button (X) */}
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-6.5 h-6.5 rounded-full text-emerald-300/70 hover:text-red-400 hover:bg-red-950/50 flex items-center justify-center active:scale-95 transition-all cursor-pointer ml-0.5"
                    title={isAr ? 'إغلاق' : 'Beenden'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};
