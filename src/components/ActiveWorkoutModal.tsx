import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Minus,
  Flame,
  Award,
  Dumbbell,
  Clock,
  Layers,
  ArrowRight,
  Save,
  Trash2,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import { ExerciseItem, Language, WorkoutPlan, ExerciseMediaItem } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';
import { MediaViewerModal } from './MediaViewerModal';
import { getExerciseMediaList } from '../utils/mediaStorage';
import { useTimer } from '../context/TimerContext';

interface ActiveWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: WorkoutPlan;
  currentLang: Language;
  onFinishWorkout: (completedIds: number[]) => void;
  onOpenLibrary?: () => void;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  currentLang,
  onFinishWorkout,
  onOpenLibrary,
}) => {
  const isAr = currentLang === 'ar';
  const exercises = plan.exercises || [];

  const { startTimer, pauseTimer, resumeTimer, resetTimer } = useTimer();

  const [currentExIdx, setCurrentExIdx] = useState<number>(0);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [restSeconds, setRestSeconds] = useState<number>(90);
  const [totalRestDuration, setTotalRestDuration] = useState<number>(90);
  const [isRestPaused, setIsRestPaused] = useState<boolean>(false);
  const [completedExIds, setCompletedExIds] = useState<Set<number>>(new Set());
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [showAlternatives, setShowAlternatives] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [currentMediaList, setCurrentMediaList] = useState<ExerciseMediaItem[]>([]);
  const [activeMediaViewer, setActiveMediaViewer] = useState<{
    name: string;
    list: ExerciseMediaItem[];
    index: number;
  } | null>(null);

  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentExercise: ExerciseItem | undefined = exercises[currentExIdx];

  // Load media whenever current exercise changes
  useEffect(() => {
    if (currentExercise) {
      if (currentExercise.media && currentExercise.media.length > 0) {
        setCurrentMediaList(currentExercise.media);
      } else {
        getExerciseMediaList(currentExercise.id).then((stored) => {
          setCurrentMediaList(stored || []);
        });
      }
    } else {
      setCurrentMediaList([]);
    }
  }, [currentExercise]);

  // Lock body scroll & modal notification
  useEffect(() => {
    if (isOpen) {
      notifyModalChange(true);
      document.body.style.overflow = 'hidden';
      // Reset workout state on open
      setCurrentExIdx(0);
      setCurrentSet(1);
      setIsResting(false);
      setRestSeconds(90);
      setTotalRestDuration(90);
      setIsRestPaused(false);
      setCompletedExIds(new Set());
      setIsFinished(false);
      setShowAlternatives(false);
      setShowExitConfirm(false);

      return () => {
        notifyModalChange(false);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const totalSets = currentExercise ? Math.max(1, parseInt(currentExercise.sets, 10) || 3) : 3;

  // Sound chime helper
  const playBeep = (type: 'tick' | 'complete') => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'tick') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // AudioContext unavailable
    }
  };

  // Rest Timer loop
  useEffect(() => {
    if (isResting && !isRestPaused && !isFinished) {
      timerRef.current = window.setInterval(() => {
        setRestSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            playBeep('complete');
            triggerHaptic('success');
            handleEndRest();
            return 0;
          }
          if (prev <= 4) {
            playBeep('tick');
            triggerHaptic('light');
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isResting, isRestPaused, isFinished, currentExIdx, currentSet]);

  const handleCompleteSet = () => {
    triggerHaptic('medium');
    playBeep('tick');

    if (currentSet < totalSets) {
      // More sets remaining in this exercise
      setRestSeconds(90);
      setTotalRestDuration(90);
      setIsRestPaused(false);
      setIsResting(true);
      startTimer(90);
    } else {
      // Finished all sets for this exercise
      if (currentExercise) {
        setCompletedExIds((prev) => new Set([...prev, currentExercise.id]));
      }

      if (currentExIdx < exercises.length - 1) {
        // More exercises in the plan
        setRestSeconds(90);
        setTotalRestDuration(90);
        setIsRestPaused(false);
        setIsResting(true);
        startTimer(90);
      } else {
        // Entire workout finished!
        triggerHaptic('success');
        playBeep('complete');
        resetTimer();
        setIsFinished(true);
      }
    }
  };

  const handleEndRest = () => {
    setIsResting(false);
    setIsRestPaused(false);
    resetTimer();

    if (currentSet < totalSets) {
      setCurrentSet((prev) => prev + 1);
    } else {
      if (currentExIdx < exercises.length - 1) {
        setCurrentExIdx((prev) => prev + 1);
        setCurrentSet(1);
      } else {
        setIsFinished(true);
      }
    }
  };

  const handleAdjustRestTime = (secondsDelta: number) => {
    triggerHaptic('light');
    setRestSeconds((prev) => {
      const next = Math.max(5, prev + secondsDelta);
      setTotalRestDuration((old) => Math.max(next, old + secondsDelta));
      startTimer(next);
      return next;
    });
  };

  const handleTogglePauseRest = () => {
    triggerHaptic('selection');
    if (isRestPaused) {
      resumeTimer();
    } else {
      pauseTimer();
    }
    setIsRestPaused((prev) => !prev);
  };

  const handleSkipToNextExercise = () => {
    triggerHaptic('light');
    resetTimer();
    if (currentExercise) {
      setCompletedExIds((prev) => new Set([...prev, currentExercise.id]));
    }
    if (currentExIdx < exercises.length - 1) {
      setCurrentExIdx((prev) => prev + 1);
      setCurrentSet(1);
      setIsResting(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleFinishAndSave = () => {
    triggerHaptic('success');
    const finalCompleted = currentExercise
      ? Array.from(new Set([...completedExIds, currentExercise.id]))
      : Array.from(completedExIds);
    onFinishWorkout(finalCompleted);
    onClose();
  };

  const handleRequestClose = () => {
    triggerHaptic('selection');
    if (isFinished) {
      onClose();
    } else {
      // Show exit confirmation modal to save or discard
      setShowExitConfirm(true);
    }
  };

  const handleSaveCurrentAndExit = () => {
    triggerHaptic('success');
    onFinishWorkout(Array.from(completedExIds));
    setShowExitConfirm(false);
    onClose();
  };

  const handleDiscardAndExit = () => {
    triggerHaptic('warning');
    setShowExitConfirm(false);
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Gracefully handle empty exercises case
  if (exercises.length === 0 || !currentExercise) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 border border-[#dbe4dc] shadow-2xl text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center mx-auto border border-[#dbe4dc]">
              <Dumbbell className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display font-extrabold text-lg text-[#15221b]">
                {isAr ? 'الجدول فارغ حالياً' : 'Keine Übungen vorhanden'}
              </h3>
              <p className="text-xs text-[#6e8276] leading-relaxed">
                {isAr
                  ? 'لا توجد تمارين مضافة في هذا الجدول لبدء التدريب. يمكنك إضافة أجهزة من المكتبة أولاً.'
                  : 'Füge zuerst Übungen aus der Bibliothek zu deinem Plan hinzu, um das Training zu starten.'}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {onOpenLibrary && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLibrary();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAr ? 'تصفح وإضافة من المكتبة' : 'Übungen hinzufügen'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 text-xs font-bold text-[#75877d] hover:text-[#15221b] transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Schließen'}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/45 backdrop-blur-md pt-16 pb-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white text-[#15221b] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#dbe4dc] max-h-[85vh] sm:max-h-[88vh] my-auto"
        >
          {/* Top Progress & Header Bar */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#e2ebe3] bg-[#fbfcfb]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#edf4ef] text-[#215641] flex items-center justify-center border border-[#dbe4dc]">
                <Dumbbell className="w-4 h-4 stroke-[2.4]" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#215641] uppercase tracking-wider block font-bold">
                  {isAr
                    ? `التمرين ${currentExIdx + 1} من ${exercises.length}`
                    : `Übung ${currentExIdx + 1} von ${exercises.length}`}
                </span>
                <span className="text-xs font-bold text-[#15221b] truncate max-w-[200px] block">
                  {currentLang === 'de' ? plan.nameDe : plan.nameAr}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestClose}
              className="w-8 h-8 rounded-full bg-[#edf4ef] hover:bg-[#e2ede5] text-[#4f6156] hover:text-[#15221b] flex items-center justify-center transition-colors"
              aria-label={isAr ? 'إغلاق' : 'Schließen'}
            >
              <X className="w-4 h-4 stroke-[2.4]" />
            </button>
          </div>

          {/* Top Mini Step Dots */}
          <div className="flex gap-1 px-5 pt-2 pb-1.5 bg-[#fbfcfb] border-b border-[#eef3ef]">
            {exercises.map((ex, idx) => {
              const isDone = completedExIds.has(ex.id) || idx < currentExIdx;
              const isCurrent = idx === currentExIdx;
              return (
                <div
                  key={ex.id}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    isCurrent
                      ? 'bg-[#215641]'
                      : isDone
                      ? 'bg-[#bad3c3]'
                      : 'bg-[#e2ebe3]'
                  }`}
                />
              );
            })}
          </div>

          {/* Main Stage Content */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between space-y-4">
            {!isFinished && !isResting && (
              <motion.div
                key={`ex-${currentExercise.id}-${currentSet}`}
                initial={{ opacity: 0, x: isAr ? 12 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isAr ? -12 : 12 }}
                className="space-y-4 my-auto"
              >
                {/* Muscle Badge & Exercise Title */}
                <div className="space-y-2 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#edf4ef] border border-[#dbe4dc] text-[#215641] text-xs font-bold">
                    {isAr ? currentExercise.muscleAr : currentExercise.muscleDe}
                  </span>
                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#15221b] tracking-tight leading-snug">
                    {currentExercise.nameDe}
                  </h2>
                </div>

                {/* Big Sets & Reps Card */}
                <div className="bg-[#f8faf8] border border-[#dbe4dc] rounded-2xl p-5 text-center space-y-2.5">
                  <div className="text-xs font-bold text-[#75877d] uppercase tracking-wider">
                    {isAr ? 'المجموعة الحالية' : 'Aktueller Satz'}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-display font-black text-4xl sm:text-5xl text-[#215641]">
                      {currentSet}
                    </span>
                    <span className="text-xl text-[#75877d] font-bold">/</span>
                    <span className="font-display font-bold text-2xl text-[#4f6156]">
                      {totalSets}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#dbe4dc] text-xs font-bold text-[#215641]">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{currentExercise.reps} {isAr ? 'عدّات مع RIR 2' : 'Wdh. (RIR 2)'}</span>
                  </div>
                </div>

                {/* Technique Demo Media Button (Photos / Videos) */}
                {currentMediaList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveMediaViewer({
                        name: currentExercise.nameDe,
                        list: currentMediaList,
                        index: 0,
                      });
                    }}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#edf5f0] hover:bg-[#e0ece3] border border-[#d2e2d7] text-[#1b4332] text-xs font-display font-bold transition-all flex items-center justify-center gap-2 active:scale-98 shadow-2xs cursor-pointer"
                  >
                    {currentMediaList.some((m) => m.type === 'video') ? (
                      <Film className="w-4 h-4 text-[#215641]" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-[#215641]" />
                    )}
                    <span>
                      {isAr
                        ? `مشاهدة فيديو/صور أداء التمرين (${currentMediaList.length})`
                        : `Ausführungs-Video/Foto ansehen (${currentMediaList.length})`}
                    </span>
                  </button>
                )}

                {/* Alternatives Accordion */}
                {currentExercise.alternatives && currentExercise.alternatives.length > 0 && (
                  <div className="border border-[#dbe4dc] rounded-xl bg-[#f8faf8] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowAlternatives(!showAlternatives)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-[#4f6156] hover:text-[#15221b]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#215641]" />
                        <span>{isAr ? 'الجهاز مشغول؟ البدائل المتاحة' : 'Gerät belegt? Alternativen'}</span>
                      </div>
                      <span className="text-[10px] text-[#215641] font-bold">
                        {showAlternatives ? (isAr ? 'إخفاء' : 'Verbergen') : (isAr ? 'عرض' : 'Anzeigen')}
                      </span>
                    </button>
                    {showAlternatives && (
                      <div className="px-3.5 pb-3 pt-1 border-t border-[#e2ebe3] space-y-1.5 text-xs text-[#15221b]">
                        {currentExercise.alternatives.map((alt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#215641] flex-shrink-0" />
                            <span>{alt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* REST TIMER STAGE */}
            {!isFinished && isResting && (
              <motion.div
                key="rest-stage"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="space-y-5 my-auto text-center"
              >
                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#edf4ef] border border-[#dbe4dc] text-[#215641] text-xs font-bold">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {isAr ? 'فترة الراحة والاستشفاء' : 'Erholungspause'}
                  </span>
                  <p className="text-xs text-[#75877d]">
                    {currentSet < totalSets
                      ? (isAr ? `استعد للمجموعة ${currentSet + 1} من ${totalSets}` : `Bereitmachen für Satz ${currentSet + 1} von ${totalSets}`)
                      : (isAr ? 'استعد للتمرين التالي' : 'Bereitmachen für die nächste Übung')}
                  </p>
                </div>

                {/* Big Countdown Timer Display */}
                <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="text-[#edf4ef]"
                      strokeWidth="6"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="text-[#215641] transition-all duration-1000 ease-linear"
                      strokeWidth="6"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * restSeconds) / Math.max(1, totalRestDuration)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono font-black text-4xl text-[#15221b] tracking-wider">
                      {formatTime(restSeconds)}
                    </span>
                    <span className="text-[11px] text-[#215641] font-bold mt-1">
                      {isRestPaused ? (isAr ? 'مؤقت متوقف' : 'Pausiert') : (isAr ? 'تنفس بعمق' : 'Tief atmen')}
                    </span>
                  </div>
                </div>

                {/* Rest Control Buttons (-30s / Pause / +30s) */}
                <div className="flex items-center justify-center gap-2.5">
                  {/* -30s button */}
                  <button
                    type="button"
                    onClick={() => handleAdjustRestTime(-30)}
                    className="px-3.5 py-2 rounded-xl bg-[#edf4ef] hover:bg-[#e2ede5] active:scale-95 text-xs font-bold text-[#215641] border border-[#dbe4dc] flex items-center gap-1 transition-all"
                    title={isAr ? 'إنقاص 30 ثانية' : '-30s verringern'}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>30s</span>
                  </button>

                  {/* Pause / Resume button */}
                  <button
                    type="button"
                    onClick={handleTogglePauseRest}
                    className="px-4 py-2 rounded-xl bg-[#215641] hover:bg-[#184232] active:scale-95 text-xs font-bold text-white flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    {isRestPaused ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current text-white" />
                        <span>{isAr ? 'استئناف' : 'Weiter'}</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current text-white" />
                        <span>{isAr ? 'إيقاف' : 'Pause'}</span>
                      </>
                    )}
                  </button>

                  {/* +30s button */}
                  <button
                    type="button"
                    onClick={() => handleAdjustRestTime(30)}
                    className="px-3.5 py-2 rounded-xl bg-[#edf4ef] hover:bg-[#e2ede5] active:scale-95 text-xs font-bold text-[#215641] border border-[#dbe4dc] flex items-center gap-1 transition-all"
                    title={isAr ? 'زيادة 30 ثانية' : '+30s hinzufügen'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>30s</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* FINISHED WORKOUT STAGE */}
            {isFinished && (
              <motion.div
                key="finished-stage"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 my-auto text-center p-4"
              >
                <div className="w-18 h-18 rounded-3xl bg-[#edf4ef] text-[#215641] border border-[#bad3c3] flex items-center justify-center mx-auto shadow-sm">
                  <Award className="w-10 h-10 stroke-[2.5]" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#15221b]">
                    {isAr ? 'أحسنت! اكتملت الجلسة بنجاح' : 'Hervorragend! Workout beendet'}
                  </h2>
                  <p className="text-xs text-[#4f6156] max-w-xs mx-auto">
                    {isAr
                      ? 'أنجزت جميع تمارين الخطة بتكنيك RIR 2 والتزام كامل بالفترات الزمنية.'
                      : 'Du hast alle geplanten Übungen mit voller Disziplin absolviert.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#f8faf8] border border-[#dbe4dc] rounded-2xl p-4">
                  <div>
                    <span className="text-[10px] text-[#75877d] block font-semibold">{isAr ? 'التمارين المنجزة' : 'Übungen'}</span>
                    <span className="font-display font-black text-xl text-[#215641]">{exercises.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#75877d] block font-semibold">{isAr ? 'معدل الالتزام' : 'Abschluss'}</span>
                    <span className="font-display font-black text-xl text-[#15221b]">100%</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Bottom Action Controls */}
            <div className="space-y-2 pt-3 border-t border-[#e2ebe3]">
              {!isFinished ? (
                isResting ? (
                  <button
                    type="button"
                    onClick={handleEndRest}
                    className="w-full py-3.5 px-4 bg-[#215641] hover:bg-[#184232] active:scale-[0.98] text-white font-display font-bold text-sm sm:text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>{isAr ? 'تخطي الراحة والبدء فوراً' : 'Pause beenden & Starten'}</span>
                    <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompleteSet}
                    className="w-full py-3.5 px-4 bg-[#215641] hover:bg-[#184232] active:scale-[0.98] text-white font-display font-bold text-sm sm:text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Check className="w-5 h-5 stroke-[2.6]" />
                    <span>
                      {currentSet === totalSets
                        ? isAr
                          ? 'إنهاء التمرين والانتقال للتالي'
                          : 'Übung abschließen'
                        : isAr
                        ? `إتمام المجموعة ${currentSet}`
                        : `Satz ${currentSet} beenden`}
                    </span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleFinishAndSave}
                  className="w-full py-3.5 px-4 bg-[#215641] hover:bg-[#184232] active:scale-[0.98] text-white font-display font-bold text-sm sm:text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Check className="w-5 h-5 stroke-[2.6]" />
                  <span>{isAr ? 'حفظ الجلسة وإغلاق' : 'Speichern & Beenden'}</span>
                </button>
              )}

              {/* Skip Exercise button */}
              {!isFinished && !isResting && (
                <button
                  type="button"
                  onClick={handleSkipToNextExercise}
                  className="w-full py-2 text-xs text-[#75877d] hover:text-[#15221b] transition-colors"
                >
                  {isAr ? 'تخطي هذا الجهاز' : 'Diese Übung überspringen'}
                </button>
              )}
            </div>
          </div>

          {/* Exit Confirmation Dialog (Save Current / Discard All / Continue) */}
          <AnimatePresence>
            {showExitConfirm && (
              <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.93, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.93, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="w-full max-w-sm bg-white rounded-3xl p-5 border border-[#dbe4dc] shadow-xl text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center mx-auto border border-[#dbe4dc]">
                    <Save className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base text-[#15221b]">
                      {isAr ? 'إنهاء جلسة التدريب؟' : 'Workout beenden?'}
                    </h3>
                    <p className="text-xs text-[#4f6156] leading-relaxed">
                      {isAr
                        ? `لديك ${completedExIds.size} تمارين مكتملة. هل ترغب بحفظ ما تم إنجازه أم تجاهل الجلسة؟`
                        : `Du hast ${completedExIds.size} Übungen absolviert. Möchtest du den aktuellen Fortschritt speichern oder verwerfen?`}
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Option 1: Save current progress & exit */}
                    <button
                      type="button"
                      onClick={handleSaveCurrentAndExit}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#215641] hover:bg-[#184232] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>
                        {isAr
                          ? `حفظ المنجز (${completedExIds.size}) والخروج`
                          : `Fortschritt (${completedExIds.size}) speichern & beenden`}
                      </span>
                    </button>

                    {/* Option 2: Discard all & exit */}
                    <button
                      type="button"
                      onClick={handleDiscardAndExit}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#fdf2f2] hover:bg-[#fde8e8] text-[#c53030] font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تجاهل الجلسة بالكامل' : 'Ohne Speichern verwerfen'}</span>
                    </button>

                    {/* Option 3: Continue workout */}
                    <button
                      type="button"
                      onClick={() => setShowExitConfirm(false)}
                      className="w-full py-2 px-3 text-xs text-[#75877d] hover:text-[#15221b] font-medium"
                    >
                      {isAr ? 'متابعة التمرين' : 'Weiter trainieren'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Media Technique Lightbox Modal */}
        {activeMediaViewer && (
          <MediaViewerModal
            isOpen={!!activeMediaViewer}
            onClose={() => setActiveMediaViewer(null)}
            exerciseName={activeMediaViewer.name}
            mediaList={activeMediaViewer.list}
            initialIndex={activeMediaViewer.index}
            currentLang={currentLang}
          />
        )}
      </div>
    </AnimatePresence>
  );
};
