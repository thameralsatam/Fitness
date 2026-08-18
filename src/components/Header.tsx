import React from 'react';
import { Dumbbell } from 'lucide-react';
import { Language } from '../types';
import { I18N } from '../data/workoutData';

interface HeaderProps {
  currentLang: Language;
  planTitle?: string;
  planSubtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  planTitle,
  planSubtitle,
}) => {
  const t = I18N[currentLang];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b bg-[#f6f8f6]/95 border-[#e2ebe3] text-[#15221b] transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#13271e] via-[#1b3d2f] to-[#255c45] border border-emerald-500/30 flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-[#18392c] to-[#0f241c] flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-emerald-400 stroke-[2.4] drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] transform -rotate-12" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-display font-extrabold text-[15px] sm:text-[16px] tracking-tight leading-tight text-[#15221b]">
              {planTitle || t.brandTitle}
            </h1>
            <span className="font-body text-[11px] sm:text-[12px] font-medium leading-tight text-[#75877d]">
              {planSubtitle || t.brandSubtitle}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};



