import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dumbbell, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface SplashScreenProps {
  onFinish: () => void;
  lang: 'ar' | 'de';
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, lang }) => {
  const [stage, setStage] = useState<number>(1);

  useEffect(() => {
    triggerHaptic('medium');
    const timer1 = setTimeout(() => {
      setStage(2);
      triggerHaptic('light');
    }, 1100);

    const timer2 = setTimeout(() => {
      triggerHaptic('success');
      onFinish();
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-gradient-to-b from-[#0e1d16] via-[#13271e] to-[#0a1510] text-white select-none px-6 py-12 overflow-hidden"
    >
      {/* Decorative ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Tag */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide backdrop-blur-md"
      >
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>{lang === 'ar' ? 'تطبيق اللياقة البدنية والتمارين' : 'Ganzkörper Trainingsplan'}</span>
      </motion.div>

      {/* Center Logo & Animation */}
      <div className="flex flex-col items-center text-center">
        {/* Glow Ring and Logo Card */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18 }}
          className="relative group mb-8"
        >
          {/* Pulsing ring */}
          <div className="absolute -inset-2.5 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 opacity-30 blur-lg animate-pulse" />
          
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#1b3d2f] to-[#255c45] border-2 border-emerald-400/40 p-0.5 shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="w-full h-full rounded-[22px] bg-gradient-to-b from-[#18392c] to-[#0f241c] flex items-center justify-center relative">
              <Dumbbell className="w-12 h-12 text-emerald-400 stroke-[2.2] drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] transform -rotate-12" />
              <Activity className="absolute bottom-2.5 right-2.5 w-4 h-4 text-teal-300 opacity-60" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
        >
          {lang === 'ar' ? 'خطة تدريب الجسم بالكامل' : 'Trainingsplan Full Body'}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-sm font-medium text-emerald-200/70 mt-2 max-w-xs leading-relaxed"
        >
          {lang === 'ar'
            ? 'تطبيق مستقل للتمارين، المؤقت الذكي، والمشغل الصوتي'
            : 'Offline Workout Companion, Smart Timer & Audio Player'}
        </motion.p>

        {/* Loading Progress Bar */}
        <div className="w-48 h-1.5 bg-emerald-950/80 rounded-full overflow-hidden mt-8 border border-emerald-500/20">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: stage === 1 ? '55%' : '100%' }}
            transition={{ duration: stage === 1 ? 0.9 : 0.8, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
          />
        </div>
      </div>

      {/* Bottom Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="flex items-center gap-2 text-xs text-emerald-300/60 font-medium"
      >
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>100% Offline & Native Ready</span>
      </motion.div>
    </motion.div>
  );
};
