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
    }, 1500); // 1.5s calm smooth presentation

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f6f8f6] text-[#15221b] select-none px-6 overflow-hidden"
    >
      {/* Calm Logo & Title - Minimal light motion to avoid mobile stutter */}
      <div className="flex flex-col items-center text-center relative z-10">
        {/* Dumbbell Icon Container matching Header */}
        <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-[#13271e] via-[#1b3d2f] to-[#255c45] border border-emerald-500/30 flex items-center justify-center text-white shadow-md mb-4 flex-shrink-0">
          <div className="w-full h-full rounded-[22px] bg-gradient-to-b from-[#18392c] to-[#0f241c] flex items-center justify-center">
            <Dumbbell className="w-10 h-10 text-emerald-400 stroke-[2.4] drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] transform -rotate-12" />
          </div>
        </div>

        <h1 className="font-display text-lg sm:text-xl font-extrabold text-[#15221b] tracking-tight">
          {lang === 'ar' ? 'خطة تدريب الجسم بالكامل' : 'Trainingsplan Full Body'}
        </h1>

        <p className="font-body text-xs font-semibold text-[#215641] mt-1">
          {lang === 'ar' ? '3 أيام أسبوعياً · تمارين متكاملة' : '3× pro Woche · Ganzkörper'}
        </p>
      </div>
    </motion.div>
  );
};
