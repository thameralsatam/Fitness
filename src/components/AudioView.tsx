import React from 'react';
import { motion } from 'motion/react';
import { Language } from '../types';
import { I18N } from '../data/workoutData';
import { AudioPlayerSection } from './AudioPlayerSection';

interface AudioViewProps {
  currentLang: Language;
}

export const AudioView: React.FC<AudioViewProps> = ({ currentLang }) => {
  const t = I18N[currentLang];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* View Header */}
      <div className="bg-white rounded-3xl p-5 border border-[#dbe4dc] space-y-1 shadow-xs">
        <h2 className="font-display font-bold text-lg sm:text-xl text-[#15221b]">
          {t.audioViewTitle}
        </h2>
        <p className="text-xs sm:text-sm text-[#4f6156]">
          {t.audioViewDesc}
        </p>
      </div>

      {/* Audio Player Section */}
      <AudioPlayerSection currentLang={currentLang} />
    </motion.div>
  );
};
