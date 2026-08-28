import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Headphones,
  Timer as TimerIcon,
  RotateCcw,
  ChevronUp,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useTimer } from '../context/TimerContext';
import { ViewTab, Language } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { LyricsModal } from './LyricsModal';

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
    handlePrevious: handleAudioPrev,
    stopAudio,
    currentTime: audioCurrentTime,
    duration: audioDuration,
    seekTo: audioSeekTo,
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
  
  // Floating Dynamic Island Expansion State
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Ref for click outside detection
  const islandRef = useRef<HTMLDivElement>(null);

  // Auto-switch mode & briefly expand when new activity starts
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

  // State to control lyrics sheet directly from floating island
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  // State to control inline bottom lyric line preview
  const [isLyricDrawerOpen, setIsLyricDrawerOpen] = useState(false);

  // Active live lyric line for currentTrack during playback
  const activeLiveLyric = useMemo(() => {
    if (!currentTrack || !currentTrack.lyrics || currentTrack.lyrics.length === 0) return null;
    let active = null;
    let next = null;
    for (let i = 0; i < currentTrack.lyrics.length; i++) {
      if (audioCurrentTime >= currentTrack.lyrics[i].time) {
        active = currentTrack.lyrics[i];
        next = currentTrack.lyrics[i + 1] || null;
      } else {
        if (!active && i === 0) {
          next = currentTrack.lyrics[0];
        }
        break;
      }
    }
    return { active, next };
  }, [currentTrack, audioCurrentTime]);

  const hasLyrics = Boolean(currentTrack && currentTrack.lyrics && currentTrack.lyrics.length > 0);

  // Click Outside Listener: when expanded, clicking outside shrinks back to compact island
  useEffect(() => {
    if (!isExpanded || !hasActiveActivity) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (
        islandRef.current &&
        !islandRef.current.contains(event.target as Node)
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

  // Audio progress percentage
  const audioProgress = audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0;
  // Timer progress percentage
  const timerProgress = selectedDuration > 0 ? ((selectedDuration - secondsLeft) / selectedDuration) * 100 : 0;

  // Format seconds helper
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle Close / Dismiss (stops active activities to close island)
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('warning');
    if (isAudioActive) stopAudio();
    if (isTimerActive) resetTimer();
  };

  return (
    <div className="fixed top-0 inset-x-0 z-[9999] pointer-events-none flex justify-center px-3 pt-[calc(env(safe-area-inset-top,0px)+8px)]">
      <AnimatePresence>
        {hasActiveActivity && (
          <motion.div
            key="dynamic-island-container"
            ref={islandRef}
            layout
            initial={{ opacity: 0, scale: 0.7, y: -14 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.7, y: -14 }}
            transition={{
              type: 'spring',
              stiffness: 340,
              damping: 28,
              mass: 0.75,
            }}
            className={`pointer-events-auto bg-[#080a09]/95 backdrop-blur-2xl border border-white/12 text-white shadow-[0_16px_40px_rgba(0,0,0,0.85)] ring-1 ring-white/10 relative overflow-hidden select-none transition-shadow ${
              isExpanded
                ? 'w-[calc(100vw-24px)] max-w-[360px] rounded-[30px] p-3.5'
                : 'w-[200px] sm:w-[220px] h-[38px] rounded-full px-2.5 flex items-center justify-between cursor-pointer hover:bg-[#0c0f0d] active:scale-97 transition-transform'
            }`}
            onClick={() => {
              if (!isExpanded) {
                triggerHaptic('selection');
                setIsExpanded(true);
              }
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {!isExpanded ? (
                /* ================= COMPACT ISLAND (NARROW PILL) ================= */
                <motion.div
                  key="compact-island"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="w-full h-full flex items-center justify-between gap-2 text-xs font-medium"
                >
                  {/* Left: Animated Soundwave or Icon */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {activeMode === 'audio' ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        {isAudioPlaying ? (
                          /* Animated Equalizer Wave Bars */
                          <div className="flex items-end gap-[1.5px] h-2.5 px-0.5">
                            <motion.span
                              animate={{ height: ['30%', '100%', '40%', '80%', '30%'] }}
                              transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                              className="w-[2px] bg-emerald-400 rounded-full"
                            />
                            <motion.span
                              animate={{ height: ['80%', '30%', '90%', '20%', '80%'] }}
                              transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut' }}
                              className="w-[2px] bg-emerald-400 rounded-full"
                            />
                            <motion.span
                              animate={{ height: ['40%', '90%', '20%', '100%', '40%'] }}
                              transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut' }}
                              className="w-[2px] bg-emerald-400 rounded-full"
                            />
                          </div>
                        ) : (
                          <Headphones className="w-3 h-3" />
                        )}
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <TimerIcon className={`w-3 h-3 ${isTimerRunning ? 'animate-spin-slow' : ''}`} />
                      </div>
                    )}
                  </div>

                  {/* Center: Track Title or Timer Display */}
                  <div className="flex-1 min-w-0 px-1 text-center">
                    {activeMode === 'audio' ? (
                      <p className="text-[11px] font-bold text-zinc-200 truncate leading-tight">
                        {currentTrack?.name || (isAr ? 'الصوتيات' : 'Audio')}
                      </p>
                    ) : (
                      <p className="text-[11px] font-bold text-amber-300 font-mono tracking-wider">
                        {formattedTime}
                      </p>
                    )}
                  </div>

                  {/* Right: Quick Play/Pause or Compact Duration */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {activeMode === 'audio' ? (
                      <span className="text-[10px] font-mono text-emerald-400/90 font-medium tracking-tight">
                        {formatTime(audioCurrentTime)}
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
                </motion.div>
              ) : (
                /* ================= EXPANDED DYNAMIC ISLAND ================= */
                <motion.div
                  key="expanded-island"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="w-full flex flex-col gap-3"
                >
                  {/* Top Bar: Thumbnail/Icon + Meta + Collapse/Close */}
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Left: Artwork / Thumbnail */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          if (activeMode === 'audio') onNavigateTab('audio');
                          else onNavigateTab('timer');
                        }}
                        className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#13281d] to-[#1c3d2e] border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-xs cursor-pointer hover:border-emerald-400/60 transition-colors"
                      >
                        {activeMode === 'audio' ? (
                          <Headphones className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <TimerIcon className="w-5 h-5 text-amber-400" />
                        )}
                      </div>

                      {/* Title & Subtitle */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          if (activeMode === 'audio') onNavigateTab('audio');
                          else onNavigateTab('timer');
                        }}
                        className="flex flex-col min-w-0 flex-1 cursor-pointer"
                      >
                        <h4 className="text-xs sm:text-[13px] font-extrabold text-white truncate leading-tight">
                          {activeMode === 'audio'
                            ? currentTrack?.name || (isAr ? 'مشغل الصوتيات' : 'Audio Player')
                            : isTimerRunning
                            ? isAr ? 'المؤقت جارٍ' : 'Timer läuft'
                            : isAr ? 'المؤقت متوقف' : 'Pausiert'}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-medium">
                          {activeMode === 'audio'
                            ? currentTrack?.folderName || (isAr ? 'الصوتيات المحفوظة' : 'Audio Track')
                            : `${isAr ? 'المدة الكلية:' : 'Dauer:'} ${Math.floor(selectedDuration / 60)}m`}
                        </p>
                      </div>
                    </div>

                    {/* Mode Selector & Action Icons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isAudioActive && isTimerActive && (
                        <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-full border border-white/10 mr-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('selection');
                              setActiveMode('audio');
                            }}
                            className={`px-2 py-1 rounded-full text-[10px] font-bold transition-colors ${
                              activeMode === 'audio'
                                ? 'bg-emerald-500 text-black shadow-2xs'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {isAr ? 'صوت' : 'Audio'}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('selection');
                              setActiveMode('timer');
                            }}
                            className={`px-2 py-1 rounded-full text-[10px] font-bold transition-colors ${
                              activeMode === 'timer'
                                ? 'bg-amber-500 text-black shadow-2xs'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {isAr ? 'مؤقت' : 'Timer'}
                          </button>
                        </div>
                      )}

                      {/* Collapse Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          setIsExpanded(false);
                        }}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition-all active:scale-95"
                        title={isAr ? 'تقليص' : 'Minimieren'}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Close / Dismiss Island */}
                      <button
                        type="button"
                        onClick={handleDismiss}
                        className="w-7 h-7 rounded-full bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-all active:scale-95"
                        title={isAr ? 'إغلاق' : 'Schließen'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Progress Bar */}
                  <div className="flex flex-col gap-1 px-0.5">
                    <div
                      className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeMode === 'audio' && audioDuration > 0) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                          audioSeekTo(ratio * audioDuration);
                        }
                      }}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          activeMode === 'audio' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{
                          width: `${activeMode === 'audio' ? audioProgress : timerProgress}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono tracking-tight font-semibold">
                      <span>
                        {activeMode === 'audio'
                          ? formatTime(audioCurrentTime)
                          : formattedTime}
                      </span>
                      <span>
                        {activeMode === 'audio'
                          ? formatTime(audioDuration)
                          : `${Math.floor(selectedDuration / 60)}:00`}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Controls Bar */}
                  <div className="flex items-center justify-between pt-0.5">
                    {activeMode === 'audio' ? (
                      <>
                        {/* Lyrics Toggle */}
                        <div className="flex items-center gap-1">
                          {hasLyrics && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('selection');
                                setIsLyricDrawerOpen((prev) => !prev);
                              }}
                              className={`h-7 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all ${
                                isLyricDrawerOpen
                                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="text-[11px]">
                                {isAr ? 'الكلمات' : 'Text'}
                              </span>
                              <ChevronDown
                                className={`w-3 h-3 transition-transform ${
                                  isLyricDrawerOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {/* Audio Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('light');
                              handleAudioPrev();
                            }}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 flex items-center justify-center active:scale-95 transition-all"
                          >
                            <SkipBack className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('medium');
                              toggleAudioPlay();
                            }}
                            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-md active:scale-95 transition-all"
                          >
                            {isAudioPlaying ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current translate-x-0.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('light');
                              handleAudioNext();
                            }}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 flex items-center justify-center active:scale-95 transition-all"
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Timer Controls */
                      <div className="w-full flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            resetTimer();
                          }}
                          className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إعادة' : 'Reset'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('medium');
                            if (isTimerRunning) pauseTimer();
                            else resumeTimer();
                          }}
                          className="h-9 px-5 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 text-xs font-black shadow-md active:scale-95 transition-all"
                        >
                          {isTimerRunning ? (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                              <span>{isAr ? 'استئناف' : 'Start'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline Live Lyric Drawer */}
                  <AnimatePresence>
                    {isLyricDrawerOpen && activeMode === 'audio' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="overflow-hidden border-t border-emerald-500/20 pt-2 mt-0.5"
                      >
                        <div
                          className="px-3 py-2 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 text-center cursor-pointer hover:bg-emerald-900/30 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            setIsLyricsModalOpen(true);
                          }}
                        >
                          <p className="text-xs font-bold text-emerald-200 truncate font-display">
                            {activeLiveLyric?.active
                              ? activeLiveLyric.active.text
                              : isAr
                              ? '🎵 متابعة الكلمات الحية...'
                              : '🎵 Live-Text...'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direct Full Lyrics Sheet from Dynamic Island */}
      {currentTrack && isLyricsModalOpen && (
        <LyricsModal
          track={currentTrack}
          isOpen={isLyricsModalOpen}
          onClose={() => setIsLyricsModalOpen(false)}
          currentLang={lang}
        />
      )}
    </div>
  );
};
