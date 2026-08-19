import React from 'react';
import { motion } from 'motion/react';
import { Language } from '../types';
import { AudioPlayerSection } from './AudioPlayerSection';

interface AudioViewProps {
  currentLang: Language;
}

export const AudioView: React.FC<AudioViewProps> = ({ currentLang }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Audio Player Section */}
      <AudioPlayerSection currentLang={currentLang} />
    </motion.div>
  );
};
