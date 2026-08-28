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
  Dumbbell,
  Activity,
  Layers,
  Wrench,
  BarChart2,
  User,
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

  // Active mode inside floating control ('audio' | 'timer' | 'idle')
  const [activeMode, setActiveMode] = useState<'audio' | 'timer' | 'idle'>(
    isAudioActive ? 'audio' : isTimerActive ? 'timer' : 'idle'
  );
  
  // Floating Dynamic Island Expansion State
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Ref for click outside detection
  const islandRef = useRef<HTMLDivElement>(null);

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

  // If active modes change
  useEffect(() => {
    if (activeMode === 'audio' && !isAudioActive) {
      if (isTimerActive) setActiveMode('timer');
      else setActiveMode('idle');
    } else if (activeMode === 'timer' && !isTimerActive) {
      if (isAudioActive) setActiveMode('audio');
      else setActiveMode('idle');
    } else if (activeMode === 'idle') {
      if (isAudioActive) setActiveMode('audio');
      else if (isTimerActive) setActiveMode('timer');
    }
  }, [isAudioActive, isTimerActive, activeMode]);

  // Notify parent of active status
  useEffect(() => {
    if (onActiveStatusChange) {
      onActiveStatusChange(hasActiveActivity);
    }
  }, [hasActiveActivity, onActiveStatusChange]);

  // Notify parent of expanded state
  useEffect(() => {
    if (onExpandStatusChange) {
      onExpandStatusChange(isExpanded);
    }
  }, [isExpanded, onExpandStatusChange]);

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
    if (!isExpanded) return;

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
  }, [isExpanded]);

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

  // Handle Close / Dismiss
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('warning');
    if (activeMode === 'audio' && isAudioActive) stopAudio();
    if (activeMode === 'timer' && isTimerActive) resetTimer();
    setIsExpanded(false);
  };

  return (
    <div className="w-full flex justify-center pointer-events-none select-none">
      <motion.div
        key="dynamic-island-header"
        ref={islandRef}
        layout
        initial={{ y: -30, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 28,
          mass: 0.7,
        }}
        className={`pointer-events-auto bg-[#080a09]/95 backdrop-blur-2xl border-x border-b border-white/15 text-white shadow-[0_16px_40px_rgba(0,0,0,0.85)] relative overflow-hidden transition-all duration-300 ease-out ${
          isExpanded
            ? 'w-[calc(100vw-20px)] max-w-[380px] rounded-t-none rounded-b-[30px] sm:rounded-b-[34px] p-4'
            : 'w-[280px] sm:w-[330px] h-[40px] sm:h-[42px] rounded-t-none rounded-b-[22px] sm:rounded-b-[24px] px-3 flex items-center justify-between cursor-pointer hover:bg-[#0c100d] active:scale-[0.98]'
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
            /* ================= COMPACT TOP NOTCH HEADER WITH CAMERA CUTOUT ================= */
            <motion.div
              key="compact-island"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full h-full flex items-center justify-between gap-1 text-xs font-medium"
            >
              {/* Left Wing: Activity Icon & Label */}
              <div className="flex-1 flex items-center gap-1.5 min-w-0 justify-start">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  {activeMode === 'audio' && isAudioActive ? (
                    isAudioPlaying ? (
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
                      <Headphones className="w-3 h-3 text-emerald-400" />
                    )
                  ) : activeMode === 'timer' && isTimerActive ? (
                    <TimerIcon className={`w-3 h-3 text-amber-400 ${isTimerRunning ? 'animate-spin-slow' : ''}`} />
                  ) : (
                    <Dumbbell className="w-3 h-3 text-emerald-400 transform -rotate-12" />
                  )}
                </div>

                <p className="text-[11px] font-bold text-zinc-200 truncate leading-tight">
                  {activeMode === 'audio' && isAudioActive
                    ? currentTrack?.name || (isAr ? 'الصوتيات' : 'Audio')
                    : activeMode === 'timer' && isTimerActive
                    ? isAr ? 'مؤقت الراحة' : 'Rest Timer'
                    : isAr ? 'تمارين وصوتيات' : 'Gym & Audio'}
                </p>
              </div>

              {/* CENTER FORBIDDEN ZONE: Phone Camera Lens Notch Cutout */}
              <div className="w-12 sm:w-16 h-3.5 sm:h-4 bg-black/95 rounded-full border border-white/10 flex items-center justify-center gap-1.5 flex-shrink-0 mx-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)]">
                {/* Simulated Camera Lens & Ambient Light Sensor */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a0d] border border-zinc-700/80 flex items-center justify-center shadow-[inset_0_0_2px_rgba(30,144,255,0.5)]">
                  <div className="w-1 h-1 rounded-full bg-indigo-900/80" />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#0d0d10] border border-zinc-800 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-emerald-500/60 animate-pulse" />
                </div>
              </div>

              {/* Right Wing: Duration / Time / Status Indicator */}
              <div className="flex-1 flex items-center gap-1.5 min-w-0 justify-end">
                {activeMode === 'audio' && isAudioActive ? (
                  <span className="text-[10px] font-mono text-emerald-400/90 font-semibold tracking-tight">
                    {formatTime(audioCurrentTime)}
                  </span>
                ) : activeMode === 'timer' && isTimerActive ? (
                  <span className="text-[11px] font-bold text-amber-300 font-mono tracking-wider">
                    {formattedTime}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-400/80 flex items-center gap-0.5">
                    {isAr ? 'نشط' : 'Aktiv'}
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 opacity-80" />
                  </span>
                )}
              </div>
            </motion.div>
          ) : (
            /* ================= EXPANDED DYNAMIC ISLAND HEADER ================= */
            <motion.div
              key="expanded-island"
              initial={{ opacity: 0, scale: 0.94, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -5 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full flex flex-col gap-3.5 relative pt-1"
            >
              {/* Camera Notch Indicator in Expanded Top Center */}
              <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 w-14 h-3 bg-black/90 rounded-b-full border-x border-b border-white/10 flex items-center justify-center gap-1 shadow-xs">
                <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-700/60 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-blue-500/70" />
                </div>
                <div className="w-1 h-1 rounded-full bg-emerald-500/60 animate-pulse" />
              </div>

              {/* Top Bar: Icon + Meta + Mode Switcher + Controls */}
              <div className="flex items-center justify-between gap-2.5 pt-1">
                {/* Left: Thumbnail / Badge */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      if (activeMode === 'audio') onNavigateTab('audio');
                      else if (activeMode === 'timer') onNavigateTab('timer');
                      else onNavigateTab('plan');
                    }}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#13281d] to-[#1c3d2e] border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-xs cursor-pointer hover:border-emerald-400/60 transition-colors"
                  >
                    {activeMode === 'audio' && isAudioActive ? (
                      <Headphones className="w-5 h-5 text-emerald-400" />
                    ) : activeMode === 'timer' && isTimerActive ? (
                      <TimerIcon className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Dumbbell className="w-5 h-5 text-emerald-400 transform -rotate-12" />
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('light');
                      if (activeMode === 'audio') onNavigateTab('audio');
                      else if (activeMode === 'timer') onNavigateTab('timer');
                      else onNavigateTab('plan');
                    }}
                    className="flex flex-col min-w-0 flex-1 cursor-pointer"
                  >
                    <h4 className="text-xs sm:text-[13px] font-extrabold text-white truncate leading-tight">
                      {activeMode === 'audio' && isAudioActive
                        ? currentTrack?.name || (isAr ? 'مشغل الصوتيات' : 'Audio Player')
                        : activeMode === 'timer' && isTimerActive
                        ? isTimerRunning
                          ? isAr ? 'المؤقت جارٍ' : 'Timer läuft'
                          : isAr ? 'المؤقت متوقف' : 'Pausiert'
                        : isAr ? 'تطبيق التمارين والصوتيات' : 'Gym & Audio Suite'}
                    </h4>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-medium">
                      {activeMode === 'audio' && isAudioActive
                        ? currentTrack?.folderName || (isAr ? 'الصوتيات المحفوظة' : 'Audio Track')
                        : activeMode === 'timer' && isTimerActive
                        ? `${isAr ? 'المدة الكلية:' : 'Dauer:'} ${Math.floor(selectedDuration / 60)}m`
                        : isAr ? 'مركز التحكم والتنقل السريع' : 'Zentrale Steuerung'}
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

                  {/* Close / Dismiss Button if activity active */}
                  {hasActiveActivity && (
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-all active:scale-95"
                      title={isAr ? 'إغلاق' : 'Schließen'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar (for Audio or Timer) */}
              {activeMode !== 'idle' && (
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
              )}

              {/* Bottom Controls Bar */}
              <div className="flex items-center justify-between pt-0.5">
                {activeMode === 'audio' && isAudioActive ? (
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
                ) : activeMode === 'timer' && isTimerActive ? (
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
                ) : (
                  /* Idle Quick Navigation Shortcuts */
                  <div className="w-full flex items-center justify-between gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('selection');
                        onNavigateTab('plan');
                        setIsExpanded(false);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                        currentTab === 'plan'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>{isAr ? 'الخطة' : 'Plan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('selection');
                        onNavigateTab('audio');
                        setIsExpanded(false);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                        currentTab === 'audio'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                      }`}
                    >
                      <Headphones className="w-3 h-3" />
                      <span>{isAr ? 'الصوتيات' : 'Audio'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('selection');
                        onNavigateTab('timer');
                        setIsExpanded(false);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                        currentTab === 'timer'
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                      }`}
                    >
                      <TimerIcon className="w-3 h-3" />
                      <span>{isAr ? 'المؤقت' : 'Timer'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('selection');
                        onNavigateTab('stats');
                        setIsExpanded(false);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors ${
                        currentTab === 'stats'
                          ? 'bg-emerald-500 text-black'
                          : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                      }`}
                    >
                      <BarChart2 className="w-3 h-3" />
                      <span>{isAr ? 'الإحصائيات' : 'Stats'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Inline Live Lyric Drawer */}
              <AnimatePresence>
                {isLyricDrawerOpen && activeMode === 'audio' && isAudioActive && (
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
