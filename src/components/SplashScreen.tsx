import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Dumbbell } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface SplashScreenProps {
  onFinish: () => void;
  lang: 'ar' | 'de';
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, lang }) => {
  useEffect(() => {
    triggerHaptic('light');
    const timer = setTimeout(() => {
      onFinish();
    }, 900); // 900ms quick calm transition

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#13271e] text-white select-none px-6 overflow-hidden"
    >
      {/* Soft Ambient Glow */}
      <div className="absolute w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Calm Logo & Minimal Title */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="flex flex-col items-center text-center relative z-10"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center mb-5 shadow-lg">
          <Dumbbell className="w-10 h-10 text-emerald-400 stroke-[2] transform -rotate-12" />
        </div>

        <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
          {lang === 'ar' ? 'خطة تدريب الجسم بالكامل' : 'Trainingsplan Full Body'}
        </h1>

        <p className="text-xs font-medium text-emerald-300/70 mt-1.5">
          {lang === 'ar' ? 'جاري التحميل...' : 'Wird geladen...'}
        </p>
      </motion.div>
    </motion.div>
  );
};
