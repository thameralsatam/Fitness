import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Headphones,
  Timer as TimerIcon,
  RotateCcw,
  ChevronUp,
  FileText,
  ChevronDown,
  Dumbbell,
  BarChart2,
  Layers,
  Compass,
  Volume2,
  ExternalLink,
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
    handlePrev: handleAudioPrev,
    currentTime: audioCurrentTime,
    duration: audioDuration,
    handleSeek: audioSeekTo,
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
    startTimer,
  } = timerContext || {
    isRunning: false,
    secondsLeft: 0,
    selectedDuration: 90,
    formattedTime: '00:00',
    pauseTimer: () => {},
    resumeTimer: () => {},
    resetTimer: () => {},
    startTimer: () => {},
  };

  const isAr = lang === 'ar';

  // Determine active states
  const isAudioActive = currentTrack !== null || currentTrackIndex >= 0;
  const isTimerActive = isTimerRunning || (secondsLeft > 0 && secondsLeft < selectedDuration);
  const hasActiveActivity = isAudioActive || isTimerActive;

  // Active page index inside floating control (0: audio, 1: timer, 2: nav)
  const [pageIndex, setPageIndex] = useState<number>(
    isAudioActive ? 0 : isTimerActive ? 1 : 2
  );

  const pages: { id: 'audio' | 'timer' | 'nav'; label: string }[] = [
    { id: 'audio', label: isAr ? 'الصوتيات' : 'Audio' },
    { id: 'timer', label: isAr ? 'المؤقت' : 'Timer' },
    { id: 'nav', label: isAr ? 'التنقل السريع' : 'Navigation' },
  ];

  // Floating Dynamic Island Expansion State
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Ref for click outside detection
  const islandRef = useRef<HTMLDivElement>(null);

  // Auto-switch page & expand when new activity starts
  const prevAudioPlaying = useRef(isAudioPlaying);
  const prevTimerRunning = useRef(isTimerRunning);

  useEffect(() => {
    if (isAudioPlaying && !prevAudioPlaying.current) {
      setPageIndex(0); // Jump to audio
      setIsExpanded(true);
    }
    prevAudioPlaying.current = isAudioPlaying;
  }, [isAudioPlaying]);

  useEffect(() => {
    if (isTimerRunning && !prevTimerRunning.current) {
      setPageIndex(1); // Jump to timer
      setIsExpanded(true);
    }
    prevTimerRunning.current = isTimerRunning;
  }, [isTimerRunning]);

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
    for (let i = 0; i < currentTrack.lyrics.length; i++) {
      if (audioCurrentTime >= currentTrack.lyrics[i].time) {
        active = currentTrack.lyrics[i];
      } else {
        break;
      }
    }
    return active;
  }, [currentTrack, audioCurrentTime]);

  const hasLyrics = Boolean(currentTrack && currentTrack.lyrics && currentTrack.lyrics.length > 0);

  // Click Outside Listener
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

  // Switch pages helper
  const goToPage = (index: number) => {
    triggerHaptic('selection');
    const clamped = (index + pages.length) % pages.length;
    setPageIndex(clamped);
  };

  return (
    <div className="w-full flex justify-center pointer-events-none select-none">
      <motion.div
        key="dynamic-island-header"
        ref={islandRef}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 380,
          damping: 28,
        }}
        className={`pointer-events-auto bg-[#080a09]/95 backdrop-blur-2xl border-x border-b border-white/15 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] relative overflow-visible transition-[width,height,padding,border-radius] duration-300 ease-out ${
          isExpanded
            ? 'w-[calc(100vw-20px)] max-w-[380px] rounded-t-none rounded-b-[26px] sm:rounded-b-[30px] px-3.5 pt-2 pb-2.5'
            : 'w-[285px] sm:w-[335px] h-[48px] sm:h-[50px] rounded-t-none rounded-b-[22px] sm:rounded-b-[24px] px-3.5 flex items-center justify-between cursor-pointer hover:bg-[#0c100d] active:scale-[0.98]'
        }`}
        onClick={() => {
          if (!isExpanded) {
            triggerHaptic('selection');
            // Retain user's current pageIndex when re-opening
            setIsExpanded(true);
          }
        }}
      >
        {/* Refined Natural Top Notch Shoulder Transitions (Organic 18px Fillet to Screen Top) */}
        <svg
          className="absolute -left-[18px] top-0 w-[18px] h-[18px] pointer-events-none z-30"
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            d="M 0 0 C 9.5 0 18 8.5 18 18 L 18 0 Z"
            fill="#080a09"
            fillOpacity="0.95"
          />
          <path
            d="M 0 0 C 9.5 0 18 8.5 18 18"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
          />
        </svg>

        <svg
          className="absolute -right-[18px] top-0 w-[18px] h-[18px] pointer-events-none z-30"
          viewBox="0 0 18 18"
          fill="none"
        >
          <path
            d="M 18 0 C 8.5 0 0 8.5 0 18 L 0 0 Z"
            fill="#080a09"
            fillOpacity="0.95"
          />
          <path
            d="M 18 0 C 8.5 0 0 8.5 0 18"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1"
          />
        </svg>
        <AnimatePresence mode="popLayout" initial={false}>
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
              {/* Left Wing: Activity Icon & Title */}
              <div className="flex-1 flex items-center gap-1.5 min-w-0 justify-start">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  {pageIndex === 0 && isAudioActive ? (
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
                  ) : pageIndex === 1 && isTimerActive ? (
                    <TimerIcon className={`w-3 h-3 text-amber-400 ${isTimerRunning ? 'animate-spin-slow' : ''}`} />
                  ) : (
                    <Dumbbell className="w-3 h-3 text-emerald-400 transform -rotate-12" />
                  )}
                </div>

                <p className="text-[11px] font-bold text-zinc-200 truncate leading-tight">
                  {pageIndex === 0 && isAudioActive
                    ? currentTrack?.name || (isAr ? 'الصوتيات' : 'Audio')
                    : pageIndex === 1 && isTimerActive
                    ? isAr ? 'مؤقت الراحة' : 'Rest Timer'
                    : isAr ? 'تمارين وصوتيات' : 'Gym & Audio'}
                </p>
              </div>

              {/* CENTER FORBIDDEN ZONE: Phone Camera Lens Notch Cutout */}
              <div className="w-12 sm:w-16 h-3.5 sm:h-4 bg-black/95 rounded-full border border-white/10 flex items-center justify-center gap-1.5 flex-shrink-0 mx-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a0d] border border-zinc-700/80 flex items-center justify-center shadow-[inset_0_0_2px_rgba(30,144,255,0.5)]">
                  <div className="w-1 h-1 rounded-full bg-indigo-900/80" />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#0d0d10] border border-zinc-800 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-emerald-500/60 animate-pulse" />
                </div>
              </div>

              {/* Right Wing: Duration / Time / Status Indicator */}
              <div className="flex-1 flex items-center gap-1.5 min-w-0 justify-end">
                {pageIndex === 0 && isAudioActive ? (
                  <span className="text-[10px] font-mono text-emerald-400/90 font-semibold tracking-tight">
                    {formatTime(audioCurrentTime)}
                  </span>
                ) : pageIndex === 1 && isTimerActive ? (
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
              className="w-full flex flex-col gap-2 relative pt-0.5"
            >
              {/* Camera Notch Indicator in Expanded Top Center */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-14 h-2.5 bg-black/90 rounded-b-full border-x border-b border-white/10 flex items-center justify-center gap-1 shadow-xs z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 border border-zinc-700/60 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-blue-500/70" />
                </div>
                <div className="w-1 h-1 rounded-full bg-emerald-500/60 animate-pulse" />
              </div>

              {/* Clean Minimal Top Header Bar */}
              <div className="flex items-center justify-between pt-0.5 pb-1 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-extrabold text-zinc-300 tracking-wide">
                    {pages[pageIndex].label}
                  </span>
                </div>

                {/* Minimize Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('light');
                    setIsExpanded(false);
                  }}
                  className="w-5.5 h-5.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition-all active:scale-95"
                  title={isAr ? 'تقليص' : 'Minimieren'}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Swipeable Motion Content Box with Fixed Spacious Height */}
              <motion.div
                key={`page-content-${pageIndex}`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -30) {
                    goToPage(pageIndex + 1);
                  } else if (info.offset.x > 30) {
                    goToPage(pageIndex - 1);
                  }
                }}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.18 }}
                className="w-full h-[122px] min-h-[122px] touch-pan-y cursor-grab active:cursor-grabbing flex flex-col justify-between py-1 px-0.5"
              >
                {/* PAGE 0: AUDIO CONTROL */}
                {pageIndex === 0 && (
                  <div className="flex flex-col justify-between h-full">
                    {/* Track Info */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            onNavigateTab('audio');
                            setIsExpanded(false);
                          }}
                          className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-xs cursor-pointer hover:border-emerald-400/60 transition-colors"
                        >
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        </div>

                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            onNavigateTab('audio');
                            setIsExpanded(false);
                          }}
                          className="flex flex-col min-w-0 cursor-pointer"
                        >
                          <h4 className="text-xs font-bold text-white truncate leading-tight">
                            {currentTrack?.name || (isAr ? 'لم يتم اختيار مقطع' : 'Kein Track')}
                          </h4>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5 font-medium">
                            {currentTrack?.folderName || (isAr ? 'اضغط للانتقال لمكتبة الصوتيات' : 'Zur Audiothek')}
                          </p>
                        </div>
                      </div>

                      {/* Direct Jump to Audio Tab */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('selection');
                          onNavigateTab('audio');
                          setIsExpanded(false);
                        }}
                        className="px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition-all flex-shrink-0"
                      >
                        <span>{isAr ? 'المكتبة' : 'Bibliothek'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Progress Bar (Strict LTR left-to-right seeking) */}
                    <div className="flex flex-col gap-1 px-0.5" dir="ltr">
                      <div
                        className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (audioDuration > 0) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                            audioSeekTo(ratio * audioDuration);
                          }
                        }}
                      >
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all duration-75"
                          style={{
                            width: `${audioProgress}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-zinc-400 font-mono font-semibold tracking-tight">
                        <span>{formatTime(audioCurrentTime)}</span>
                        <span>{formatTime(audioDuration)}</span>
                      </div>
                    </div>

                    {/* Centered Controls Bar */}
                    <div className="relative flex items-center justify-center min-h-[34px]">
                      {/* Lyrics Toggle on side */}
                      {hasLyrics && (
                        <div className="absolute left-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('selection');
                              setIsLyricDrawerOpen((prev) => !prev);
                            }}
                            className={`h-6 px-2 rounded-full flex items-center gap-1 text-[10px] font-bold transition-all ${
                              isLyricDrawerOpen
                                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                                : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                            }`}
                          >
                            <FileText className="w-3 h-3" />
                            <span className="hidden sm:inline">
                              {isAr ? 'الكلمات' : 'Text'}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Main Centered Playback Controls */}
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            handleAudioPrev();
                          }}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 flex items-center justify-center active:scale-95 transition-all shadow-xs"
                          title={isAr ? 'السابق' : 'Zurück'}
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
                          className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-md active:scale-95 transition-all"
                          title={isAudioPlaying ? (isAr ? 'إيقاف' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
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
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 flex items-center justify-center active:scale-95 transition-all shadow-xs"
                          title={isAr ? 'التالي' : 'Weiter'}
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE 1: TIMER CONTROL */}
                {pageIndex === 1 && (
                  <div className="flex flex-col justify-between h-full">
                    {/* Header Row */}
                    <div className="flex items-center justify-between px-0.5">
                      <div className="flex flex-col">
                        <h4 className="text-xs font-bold text-white leading-tight">
                          {isAr ? 'مؤقت الراحة بين المجموعات' : 'Satzpause Timer'}
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {isTimerRunning
                            ? isAr ? 'المؤقت يعمل حالياً' : 'Timer läuft'
                            : isAr ? 'اختر مدة الراحة أو ابدأ' : 'Wähle Pause'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-base font-black font-mono text-amber-400 tracking-wider">
                          {formattedTime}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('selection');
                            onNavigateTab('timer');
                            setIsExpanded(false);
                          }}
                          className="p-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-amber-300 transition-all"
                          title={isAr ? 'فتح صفحة المؤقت' : 'Öffnen'}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden" dir="ltr">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${timerProgress}%` }}
                      />
                    </div>

                    {/* Single Unified Bottom Row: Presets on Left, Actions on Right */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Presets */}
                      <div className="flex items-center gap-1">
                        {[30, 60, 90, 120].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('selection');
                              startTimer(sec);
                            }}
                            className={`px-1.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
                              selectedDuration === sec && isTimerRunning
                                ? 'bg-amber-500 text-black border-amber-400'
                                : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/15'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                            resetTimer();
                          }}
                          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 flex items-center justify-center active:scale-95 transition-all"
                          title={isAr ? 'إعادة' : 'Reset'}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('medium');
                            if (isTimerRunning) pauseTimer();
                            else resumeTimer();
                          }}
                          className="h-7 px-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1 text-[11px] font-black shadow-md active:scale-95 transition-all"
                        >
                          {isTimerRunning ? (
                            <>
                              <Pause className="w-3 h-3 fill-current" />
                              <span>{isAr ? 'إيقاف' : 'Pause'}</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current translate-x-0.5" />
                              <span>{isAr ? 'بدء' : 'Start'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAGE 2: QUICK NAVIGATION */}
                {pageIndex === 2 && (
                  <div className="flex flex-col justify-between h-full py-0.5">
                    <p className="text-[10px] text-zinc-400 font-medium px-0.5">
                      {isAr ? 'التنقل السريع بين أقسام التطبيق:' : 'Schnellnavigation:'}
                    </p>

                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('selection');
                          onNavigateTab('plan');
                          setIsExpanded(false);
                        }}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 border transition-all ${
                          currentTab === 'plan'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/15'
                        }`}
                      >
                        <Layers className="w-4 h-4 text-emerald-400" />
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
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 border transition-all ${
                          currentTab === 'audio'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/15'
                        }`}
                      >
                        <Headphones className="w-4 h-4 text-emerald-400" />
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
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 border transition-all ${
                          currentTab === 'timer'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/15'
                        }`}
                      >
                        <TimerIcon className="w-4 h-4 text-amber-400" />
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
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 border transition-all ${
                          currentTab === 'stats'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/15'
                        }`}
                      >
                        <BarChart2 className="w-4 h-4 text-emerald-400" />
                        <span>{isAr ? 'الإحصائيات' : 'Stats'}</span>
                      </button>
                    </div>

                    <div className="text-center">
                      <p className="text-[9px] text-zinc-500 font-medium">
                        {isAr ? 'اسحب للتنقل بين التحكم بالصوت والمؤقت' : 'Wische zwischen Audio & Timer'}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Bottom Interactive Swipe Page Indicator Dots */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {pages.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPage(idx);
                    }}
                    className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                      pageIndex === idx
                        ? idx === 1
                          ? 'w-6 bg-amber-400 shadow-xs'
                          : 'w-6 bg-emerald-400 shadow-xs'
                        : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                    }`}
                    title={p.label}
                  />
                ))}
              </div>

              {/* Inline Live Lyric Drawer */}
              <AnimatePresence>
                {isLyricDrawerOpen && pageIndex === 0 && isAudioActive && (
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
                        {activeLiveLyric
                          ? activeLiveLyric.text
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
