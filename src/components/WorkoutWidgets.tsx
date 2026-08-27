import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause,
  RotateCcw,
  Zap, 
  BookOpen,
  Timer as TimerIcon,
  ChevronDown,
  Plus,
  Minus
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useTimer } from '../context/TimerContext';

interface WorkoutWidgetsProps {
  currentLang: 'ar' | 'de';
  completedCount: number;
  totalExercises: number;
  currentStreak: number;
  totalSessions: number;
  onNavigateTab?: (tab: 'plan' | 'audio' | 'tools' | 'stats' | 'profile') => void;
  onStartActiveWorkout?: () => void;
  onOpenLibrary?: () => void;
}

export const WorkoutWidgets: React.FC<WorkoutWidgetsProps> = ({
  currentLang,
  completedCount,
  totalExercises,
  currentStreak,
  onStartActiveWorkout,
  onOpenLibrary,
}) => {
  const percent = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;
  const isAr = currentLang === 'ar';
  const [showRestTimer, setShowRestTimer] = useState<boolean>(false);

  const {
    remainingMs,
    selectedDuration,
    isRunning,
    pauseTimer,
    resumeTimer,
    resetTimer,
    formattedTime,
    setTimerConfig,
  } = useTimer();

  const handleSelectPreset = (sec: number) => {
    triggerHaptic('light');
    setTimerConfig(sec);
  };

  const handleAdjustTime = (deltaSec: number) => {
    triggerHaptic('selection');
    const newSec = Math.max(10, selectedDuration + deltaSec);
    setTimerConfig(newSec);
  };

  const progressFraction = selectedDuration > 0 ? (selectedDuration * 1000 - remainingMs) / (selectedDuration * 1000) : 0;
  const strokeDashoffset = 264 * (1 - progressFraction);

  return (
    <div className="space-y-4">
      {/* Calm, Refined Daily Progress Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#e4ede7] text-[#15221b] shadow-[0_2px_12px_rgba(20,40,30,0.03)]">
        <div className="flex flex-col gap-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            {/* Streak Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf5f0] text-[#215641] text-xs font-bold border border-[#bad5c2]/60 shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-[#215641] fill-[#215641]/20 stroke-[2.3]" />
              <span>
                {isAr
                  ? `تتابع: ${currentStreak || 1} ${currentStreak === 1 ? 'يوم' : 'أيام'}`
                  : `Streak: ${currentStreak || 1} ${currentStreak === 1 ? 'Tag' : 'Tage'}`}
              </span>
            </div>

            {/* Actions: Inline Rest Timer Toggle & Library Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowRestTimer((prev) => !prev);
                }}
                title={isAr ? 'مؤقت الراحة' : 'Pausen-Timer'}
                aria-label={isAr ? 'مؤقت الراحة' : 'Pausen-Timer'}
                className={`p-2.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                  showRestTimer || isRunning
                    ? 'bg-[#215641] text-white border-[#215641] shadow-xs'
                    : 'bg-[#edf5f0] text-[#215641] hover:bg-[#e2ede5] border-[#bad5c2]/70'
                }`}
              >
                <TimerIcon className="w-4 h-4 stroke-[2.2]" />
              </button>

              {onOpenLibrary && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onOpenLibrary();
                  }}
                  title={isAr ? 'مكتبة الأجهزة والتمارين' : 'Geräte-Bibliothek'}
                  aria-label={isAr ? 'مكتبة الأجهزة والتمارين' : 'Geräte-Bibliothek'}
                  className="p-2.5 rounded-2xl bg-[#edf5f0] text-[#215641] hover:bg-[#e2ede5] border border-[#bad5c2]/70 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 stroke-[2.2]" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Numbers & Bar */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-display text-[#15221b] tracking-tight">
                  {completedCount} <span className="text-xs sm:text-sm font-semibold text-[#75877d]">/ {totalExercises}</span>
                </span>
                <span className="text-xs font-semibold text-[#4f6156]">
                  {isAr ? 'تمارين مكتملة' : 'Übungen abgeschlossen'}
                </span>
              </div>
              <span className="text-sm font-extrabold text-[#215641] font-mono">
                {percent}%
              </span>
            </div>

            {/* Minimalist Progress Bar */}
            <div className="w-full h-2.5 bg-[#edf5f0] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-[#215641] rounded-full"
              />
            </div>
          </div>

          {/* Start Workout Action */}
          {onStartActiveWorkout && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('success');
                  onStartActiveWorkout();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#215641] hover:bg-[#184232] active:scale-[0.99] text-white font-display font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {percent === 100
                    ? isAr
                      ? 'إعادة جلسة التمرين النشط'
                      : 'Workout erneut starten'
                    : isAr
                    ? 'بدء التمرين ومتابعة الجولات'
                    : 'Workout starten (Geführt)'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Integrated Pausen-Timer in Training Section */}
      <AnimatePresence>
        {showRestTimer && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#dbe4dc] text-[#15221b] shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#e2ebe3]">
                <div className="flex items-center gap-2 text-[#215641]">
                  <TimerIcon className="w-4 h-4 stroke-[2.4]" />
                  <span className="font-display font-bold text-sm text-[#15221b]">
                    {isAr ? 'مؤقت الراحة (Pausen-Timer)' : 'Pausen-Timer'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRestTimer(false)}
                  className="text-xs text-[#75877d] hover:text-[#15221b] font-medium"
                >
                  {isAr ? 'إخفاء' : 'Schließen'}
                </button>
              </div>

              {/* Dial & Controls Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Circular Mini Dial */}
                <div className="flex items-center gap-3.5">
                  <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="fill-none stroke-[#edf4ef]"
                        cx="50"
                        cy="50"
                        r="42"
                        strokeWidth="6"
                      />
                      <circle
                        className="fill-none stroke-[#215641] transition-all duration-300 ease-linear"
                        cx="50"
                        cy="50"
                        r="42"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="264"
                        style={{ strokeDashoffset }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="font-display font-extrabold text-base text-[#15221b]" dir="ltr">
                        {formattedTime}
                      </span>
                    </div>
                  </div>

                  {/* Main Play / Pause & Reset Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        if (isRunning) pauseTimer();
                        else resumeTimer();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#215641] text-white hover:bg-[#184232] active:scale-95 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                    >
                      {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                      <span>{isRunning ? (isAr ? 'إيقاف' : 'Pause') : (isAr ? 'تشغيل' : 'Start')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        resetTimer();
                      }}
                      className="p-2.5 rounded-xl bg-[#edf4ef] text-[#4f6156] hover:bg-[#e2ede5] active:scale-95 transition-all"
                      title={isAr ? 'إعادة ضبط' : 'Zurücksetzen'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Presets & +-30s Adjusters */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {[60, 90, 120].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleSelectPreset(sec)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                        selectedDuration === sec
                          ? 'bg-[#215641] text-white font-bold'
                          : 'bg-[#edf4ef] text-[#4f6156] hover:bg-[#e2ede5]'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}

                  <div className="h-4 w-px bg-[#dbe4dc] mx-0.5" />

                  {/* -30s button */}
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(-30)}
                    className="px-2 py-1.5 rounded-lg bg-[#edf4ef] hover:bg-[#e2ede5] text-[#215641] text-xs font-bold active:scale-95 flex items-center gap-0.5"
                    title={isAr ? 'إنقاص 30 ثانية' : '-30s verringern'}
                  >
                    <Minus className="w-3 h-3" />
                    <span>30s</span>
                  </button>

                  {/* +30s button */}
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(30)}
                    className="px-2 py-1.5 rounded-lg bg-[#edf4ef] hover:bg-[#e2ede5] text-[#215641] text-xs font-bold active:scale-95 flex items-center gap-0.5"
                    title={isAr ? 'زيادة 30 ثانية' : '+30s hinzufügen'}
                  >
                    <Plus className="w-3 h-3" />
                    <span>30s</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
