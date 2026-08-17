import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Globe, Copy, Layers, RotateCcw, Printer, Dumbbell } from 'lucide-react';
import { Language } from '../types';
import { I18N } from '../data/workoutData';

interface HeaderProps {
  currentLang: Language;
  onToggleLang: () => void;
  onCopyPlan: () => void;
  onToggleAllAlts: () => void;
  onResetProgress: () => void;
  onPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onToggleLang,
  onCopyPlan,
  onToggleAllAlts,
  onResetProgress,
  onPrint,
}) => {
  const t = I18N[currentLang];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f6f8f6]/90 backdrop-blur-md border-b border-[#e2ebe3] transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1b3d2f] to-[#255c45] border border-emerald-500/30 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-[#18392c] to-[#0f241c] flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-emerald-400 stroke-[2.4] drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] transform -rotate-12" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-display font-extrabold text-[15px] sm:text-[16px] text-[#15221b] tracking-tight leading-tight">
              {t.brandTitle}
            </h1>
            <span className="font-body text-[11px] sm:text-[12px] font-medium text-[#75877d] leading-tight">
              {t.brandSubtitle}
            </span>
          </div>
        </div>

        {/* 3-Dots Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Optionen"
            aria-expanded={menuOpen}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#4f6156] hover:text-[#15221b] hover:bg-[#eef4f0] active:scale-95 transition-all outline-none"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div
              className={`absolute top-full mt-2 ${
                currentLang === 'ar' ? 'left-0' : 'right-0'
              } w-64 bg-white rounded-2xl shadow-xl border border-[#dbe4dc] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
            >
              {/* Language Switch */}
              <button
                type="button"
                onClick={() => {
                  onToggleLang();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-[#15221b] hover:bg-[#f1f6f3] rounded-xl transition-colors"
              >
                <Globe className="w-4 h-4 text-[#215641] flex-shrink-0" />
                <span>{t.menuLang}</span>
              </button>

              {/* Copy Plan */}
              <button
                type="button"
                onClick={() => {
                  onCopyPlan();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-[#15221b] hover:bg-[#f1f6f3] rounded-xl transition-colors"
              >
                <Copy className="w-4 h-4 text-[#215641] flex-shrink-0" />
                <span>{t.menuCopy}</span>
              </button>

              {/* Toggle Alternatives */}
              <button
                type="button"
                onClick={() => {
                  onToggleAllAlts();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-[#15221b] hover:bg-[#f1f6f3] rounded-xl transition-colors"
              >
                <Layers className="w-4 h-4 text-[#215641] flex-shrink-0" />
                <span>{t.menuAllAlts}</span>
              </button>

              {/* Reset Session */}
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-[#15221b] hover:bg-[#f1f6f3] rounded-xl transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-[#215641] flex-shrink-0" />
                <span>{t.menuReset}</span>
              </button>

              <div className="h-[1px] bg-[#e2ebe3] my-1" />

              {/* Print / PDF */}
              <button
                type="button"
                onClick={() => {
                  onPrint();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-[#15221b] hover:bg-[#f1f6f3] rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4 text-[#75877d] flex-shrink-0" />
                <span>{t.menuPrint}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
