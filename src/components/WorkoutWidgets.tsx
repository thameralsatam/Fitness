import React from 'react';
import { motion } from 'motion/react';
import { Play, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { ViewTab } from '../types';

interface WorkoutWidgetsProps {
  currentLang: 'ar' | 'de';
  completedCount: number;
  totalExercises: number;
  currentStreak?: number;
  totalSessions?: number;
  onNavigateTab?: (tab: ViewTab) => void;
  onStartActiveWorkout?: () => void;
}

export const WorkoutWidgets: React.FC<WorkoutWidgetsProps> = ({
  currentLang,
  completedCount,
  totalExercises,
  onStartActiveWorkout,
}) => {
  const percent = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;
  const isAr = currentLang === 'ar';
  const isAllDone = totalExercises > 0 && completedCount === totalExercises;

  return (
    <div className="w-full">
      {/* Calm, Minimalist Daily Progress Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#e4ede7] text-[#15221b] shadow-[0_2px_12px_rgba(20,40,30,0.03)] space-y-4">
        {/* Progress Numbers & Label */}
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#6e8276] uppercase tracking-wider">
              {isAr ? 'تقدم اليوم' : 'Tagesfortschritt'}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black font-display text-[#15221b] tracking-tight">
                {completedCount}{' '}
                <span className="text-xs sm:text-sm font-semibold text-[#75877d]">
                  / {totalExercises}
                </span>
              </span>
              <span className="text-xs text-[#526b5c] font-medium">
                {isAr ? 'تمارين مكتملة' : 'abgeschlossen'}
              </span>
            </div>
          </div>

          <div className="text-end">
            <span className="text-xl sm:text-2xl font-black text-[#215641] font-mono">
              {percent}%
            </span>
          </div>
        </div>

        {/* Minimalist Progress Bar */}
        <div className="w-full h-2 bg-[#edf5f0] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-[#215641] rounded-full"
          />
        </div>

        {/* Single Focused Action Button */}
        {onStartActiveWorkout && totalExercises > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('success');
                onStartActiveWorkout();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#215641] hover:bg-[#184232] active:scale-[0.99] text-white font-display font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {isAllDone ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                  <span>{isAr ? 'إعادة تشغيل جلسة التمرين' : 'Workout erneut starten'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    {completedCount > 0
                      ? isAr
                        ? 'متابعة جلسة التمرين'
                        : 'Workout fortsetzen'
                      : isAr
                      ? 'بدء جلسة التمرين'
                      : 'Workout starten'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
