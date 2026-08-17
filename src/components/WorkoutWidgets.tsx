import React from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Volume2, 
  Clock, 
  Music,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface WorkoutWidgetsProps {
  currentLang: 'ar' | 'de';
  completedCount: number;
  totalExercises: number;
  currentStreak: number;
  totalSessions: number;
  onNavigateTab: (tab: 'plan' | 'timer' | 'audio' | 'stats' | 'tools') => void;
  // Audio state
  currentTrackName?: string;
  isPlayingAudio?: boolean;
  onTogglePlayAudio?: () => void;
}

export const WorkoutWidgets: React.FC<WorkoutWidgetsProps> = ({
  currentLang,
  completedCount,
  totalExercises,
  currentStreak,
  totalSessions,
  onNavigateTab,
  currentTrackName,
  isPlayingAudio,
  onTogglePlayAudio,
}) => {
  const percent = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  return (
    <div className="space-y-3.5 mb-6">
      {/* Top Banner Widget: Daily Progress & Motivation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#1b3d2f] via-[#215641] to-[#163629] text-white shadow-md relative overflow-hidden"
      >
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3.5">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-emerald-300 flex items-center gap-1 border border-white/10">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                {currentLang === 'ar' ? 'ملخص الجلسة' : 'Session Tracker'}
              </span>
              <span className="text-[11px] text-emerald-200/80 font-medium flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {currentLang === 'ar' ? `التتابع: ${currentStreak || 1} أيام` : `Streak: ${currentStreak || 1} Tage`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onNavigateTab('stats');
              }}
              className="text-[11px] font-bold text-emerald-300 hover:text-white flex items-center gap-0.5 transition-colors"
            >
              <span>{currentLang === 'ar' ? 'الإحصائيات' : 'Statistiken'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress Bar & Stats */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
                  {completedCount} <span className="text-sm font-medium text-emerald-300/80">/ {totalExercises}</span>
                </span>
                <span className="text-xs text-emerald-200/80 font-medium">
                  {currentLang === 'ar' ? 'تمارين مكتملة' : 'Übungen abgeschlossen'}
                </span>
              </div>
              <span className="text-sm font-extrabold text-emerald-300 font-mono">
                {percent}%
              </span>
            </div>

            {/* Custom rounded progress bar */}
            <div className="w-full h-2.5 bg-black/25 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-teal-300 via-emerald-400 to-emerald-300 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]"
              />
            </div>
          </div>

          {/* Motivation Quote / Status */}
          <div className="flex items-center justify-between text-xs text-emerald-100/90 pt-1 border-t border-white/10">
            <span className="truncate flex items-center gap-1.5">
              {percent === 100 ? (
                <>
                  <Award className="w-3.5 h-3.5 text-amber-300 inline flex-shrink-0" />
                  <span>
                    {currentLang === 'ar'
                      ? 'رائع! أنجزت كل تمارين الخطة اليوم!'
                      : 'Großartig! Workout für heute beendet!'}
                  </span>
                </>
              ) : percent > 0 ? (
                currentLang === 'ar'
                  ? 'استمر، أنت تتقدم بشكل رائع اليوم!'
                  : 'Bleib dran, du machst tolle Fortschritte!'
              ) : currentLang === 'ar' ? (
                'ابدأ أول تمرين واضغط علامة الإنجاز'
              ) : (
                'Starte die erste Übung und markiere den Fortschritt'
              )}
            </span>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onNavigateTab('timer');
              }}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white border border-white/15 flex-shrink-0"
            >
              <Clock className="w-3 h-3 text-teal-300" />
              <span>{currentLang === 'ar' ? 'المؤقت' : 'Timer'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mini Companion Widgets Row */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Widget 1: Quick Audio Player Companion */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('light');
            onNavigateTab('audio');
          }}
          className="p-3.5 rounded-2xl bg-white border border-[#dbe4dc] shadow-xs hover:border-[#bad3c3] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-[#eef4f0] text-[#215641] flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            {onTogglePlayAudio && currentTrackName && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('medium');
                  onTogglePlayAudio();
                }}
                className="w-7 h-7 rounded-lg bg-[#215641] text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform"
              >
                {isPlayingAudio ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>
            )}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#75877d]">
              {currentLang === 'ar' ? 'المشغل الصوتي' : 'Audio Player'}
            </div>
            <div className="text-xs font-bold text-[#15221b] truncate mt-0.5">
              {currentTrackName || (currentLang === 'ar' ? 'تصفح المقاطع' : 'Tracks öffnen')}
            </div>
          </div>
        </motion.div>

        {/* Widget 2: Quick Tools & Calculator */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('light');
            onNavigateTab('tools');
          }}
          className="p-3.5 rounded-2xl bg-white border border-[#dbe4dc] shadow-xs hover:border-[#bad3c3] transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-[#eef4f0] text-[#215641] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#75877d]">
              {currentLang === 'ar' ? 'أدوات وحاسبة' : 'Fitness Rechner'}
            </div>
            <div className="text-xs font-bold text-[#15221b] truncate mt-0.5">
              {currentLang === 'ar' ? '1RM & حاسبة السعرات' : '1RM & Kalorien'}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
