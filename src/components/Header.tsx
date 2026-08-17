import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, 
  Globe, 
  Copy, 
  Layers, 
  RotateCcw, 
  Type, 
  Dumbbell,
  Bug
} from 'lucide-react';
import { Language } from '../types';
import { I18N } from '../data/workoutData';

interface HeaderProps {
  currentLang: Language;
  onToggleLang: () => void;
  onCopyPlan: () => void;
  onToggleAllAlts: () => void;
  onResetProgress: () => void;
  onOpenFontSettings: () => void;
  onOpenDebugLogs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onToggleLang,
  onCopyPlan,
  onToggleAllAlts,
  onResetProgress,
  onOpenFontSettings,
  onOpenDebugLogs,
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

  const isAr = currentLang === 'ar';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b bg-[#f6f8f6]/95 border-[#e2ebe3] text-[#15221b] transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#13271e] via-[#1b3d2f] to-[#255c45] border border-emerald-500/30 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-[#18392c] to-[#0f241c] flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-emerald-400 stroke-[2.4] drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] transform -rotate-12" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-display font-extrabold text-[15px] sm:text-[16px] tracking-tight leading-tight text-[#15221b]">
              {t.brandTitle}
            </h1>
            <span className="font-body text-[11px] sm:text-[12px] font-medium leading-tight text-[#75877d]">
              {t.brandSubtitle}
            </span>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-1.5">
          {/* Quick Language Toggle Button */}
          <button
            type="button"
            onClick={onToggleLang}
            aria-label={isAr ? 'Wechseln zu Deutsch' : 'التحويل للعربية'}
            className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold bg-[#eef4f0] text-[#215641] hover:bg-[#e2ece5] active:scale-95 transition-all outline-none"
            title={isAr ? 'Deutsch' : 'العربية'}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isAr ? 'DE' : 'عربي'}</span>
          </button>

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
                } w-64 rounded-2xl shadow-xl border border-[#dbe4dc] bg-white text-[#15221b] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
              >
                {/* Font Settings Option */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenFontSettings();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl text-[#15221b] hover:bg-[#f1f6f3] transition-colors"
                >
                  <Type className="w-4 h-4 text-[#215641] flex-shrink-0" />
                  <span>{isAr ? 'خطوط التطبيق (النصوص والعناوين)' : 'Schriftarten anpassen'}</span>
                </button>

                {/* Debug Logs Console */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenDebugLogs();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold rounded-xl text-[#215641] bg-[#eef4f0]/50 hover:bg-[#eef4f0] transition-colors border border-[#dbe4dc]/50"
                >
                  <Bug className="w-4 h-4 text-[#215641] flex-shrink-0" />
                  <span>{isAr ? 'سجل التشخيص الفني' : 'Debug Logs Console'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

