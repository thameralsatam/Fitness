import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, 
  Globe, 
  Copy, 
  Layers, 
  RotateCcw, 
  Sliders, 
  Dumbbell, 
  Moon, 
  Sun 
} from 'lucide-react';
import { Language } from '../types';
import { I18N } from '../data/workoutData';

interface HeaderProps {
  currentLang: Language;
  onToggleLang: () => void;
  onCopyPlan: () => void;
  onToggleAllAlts: () => void;
  onResetProgress: () => void;
  onOpenWidgetSettings: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onToggleLang,
  onCopyPlan,
  onToggleAllAlts,
  onResetProgress,
  onOpenWidgetSettings,
  isDarkMode,
  onToggleDarkMode,
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
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors ${
      isDarkMode 
        ? 'bg-[#121c17]/90 border-emerald-900/60 text-white' 
        : 'bg-[#f6f8f6]/90 border-[#e2ebe3] text-[#15221b]'
    }`}>
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1b3d2f] to-[#255c45] border border-emerald-500/30 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-b from-[#18392c] to-[#0f241c] flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-emerald-400 stroke-[2.4] drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] transform -rotate-12" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className={`font-display font-extrabold text-[15px] sm:text-[16px] tracking-tight leading-tight ${
              isDarkMode ? 'text-white' : 'text-[#15221b]'
            }`}>
              {t.brandTitle}
            </h1>
            <span className={`font-body text-[11px] sm:text-[12px] font-medium leading-tight ${
              isDarkMode ? 'text-emerald-300/70' : 'text-[#75877d]'
            }`}>
              {t.brandSubtitle}
            </span>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-1.5">
          {/* Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all outline-none ${
              isDarkMode 
                ? 'text-emerald-400 hover:bg-emerald-900/50' 
                : 'text-[#4f6156] hover:text-[#15221b] hover:bg-[#eef4f0]'
            }`}
            title={isAr ? (isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي') : (isDarkMode ? 'Light Mode' : 'Dark Mode')}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#215641]" />}
          </button>

          {/* 3-Dots Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Optionen"
              aria-expanded={menuOpen}
              className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-all outline-none ${
                isDarkMode 
                  ? 'text-emerald-300 hover:bg-emerald-900/50' 
                  : 'text-[#4f6156] hover:text-[#15221b] hover:bg-[#eef4f0]'
              }`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div
                className={`absolute top-full mt-2 ${
                  currentLang === 'ar' ? 'left-0' : 'right-0'
                } w-64 rounded-2xl shadow-xl border p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isDarkMode 
                    ? 'bg-[#15221b] border-emerald-800 text-white' 
                    : 'bg-white border-[#dbe4dc] text-[#15221b]'
                }`}
              >
                {/* Widget Customization */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenWidgetSettings();
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold rounded-xl transition-colors ${
                    isDarkMode 
                      ? 'text-emerald-300 hover:bg-emerald-900/60' 
                      : 'text-[#215641] hover:bg-[#f1f6f3]'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{isAr ? 'تخصيص ويدجتات الجوال' : 'Widget Customization'}</span>
                </button>

                <div className={`h-[1px] my-1 ${isDarkMode ? 'bg-emerald-900/60' : 'bg-[#e2ebe3]'}`} />

                {/* Language Switch */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleLang();
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-colors ${
                    isDarkMode 
                      ? 'text-emerald-100 hover:bg-emerald-900/40' 
                      : 'text-[#15221b] hover:bg-[#f1f6f3]'
                  }`}
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-colors ${
                    isDarkMode 
                      ? 'text-emerald-100 hover:bg-emerald-900/40' 
                      : 'text-[#15221b] hover:bg-[#f1f6f3]'
                  }`}
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-colors ${
                    isDarkMode 
                      ? 'text-emerald-100 hover:bg-emerald-900/40' 
                      : 'text-[#15221b] hover:bg-[#f1f6f3]'
                  }`}
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-colors ${
                    isDarkMode 
                      ? 'text-emerald-100 hover:bg-emerald-900/40' 
                      : 'text-[#15221b] hover:bg-[#f1f6f3]'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 text-[#215641] flex-shrink-0" />
                  <span>{t.menuReset}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
