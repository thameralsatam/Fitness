import React from 'react';
import { ViewTab, Language } from '../types';
import { I18N } from '../data/workoutData';
import { useIsModalOpen } from '../utils/modalManager';

const ACTIVE_COLOR = "#15221b";
const INACTIVE_COLOR = "#3c4e44";

interface MobileBottomNavProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  currentLang: Language;
  isHidden?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  currentLang,
  isHidden = false,
}) => {
  const t = I18N[currentLang];
  const isAnyModalOpen = useIsModalOpen();
  const shouldHide = isHidden || isAnyModalOpen;

  const navItems: {
    id: ViewTab;
    label: string;
    icon: (isActive: boolean) => React.ReactNode;
  }[] = [
    {
      id: 'plan',
      label: t.navPlan,
      icon: (isActive: boolean) => (
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
          strokeWidth={isActive ? "2.2" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      id: 'tools',
      label: t.navTools,
      icon: (isActive: boolean) => (
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
          strokeWidth={isActive ? "2.2" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="10" y2="14" />
          <line x1="14" y1="14" x2="16" y2="14" />
          <line x1="8" y1="18" x2="10" y2="18" />
          <line x1="14" y1="18" x2="16" y2="18" />
        </svg>
      ),
    },
    {
      id: 'audio',
      label: t.navAudio,
      icon: (isActive: boolean) => (
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
          strokeWidth={isActive ? "2.2" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      ),
    },
    {
      id: 'stats',
      label: t.navStats,
      icon: (isActive: boolean) => (
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
          strokeWidth={isActive ? "2.2" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: t.navProfile || (currentLang === 'ar' ? 'البروفايل' : 'Profil'),
      icon: (isActive: boolean) => (
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
          strokeWidth={isActive ? "2.2" : "1.8"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Hauptnavigation"
      className={`fixed z-40 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[390px] transition-all duration-300 ease-out outline-none ${
        shouldHide
          ? 'translate-y-36 opacity-0 pointer-events-none scale-95'
          : 'translate-y-0 opacity-100 pointer-events-auto scale-100'
      }`}
      style={{
        bottom: "max(12px, env(safe-area-inset-bottom, 12px))"
      }}
    >
      <div className="relative w-full rounded-3xl">
        {/* Liquid glass & frosted blur layer */}
        <div className="bn-liquid-glass" />

        {/* Row of navigation buttons */}
        <div className="relative z-10 flex items-center justify-around px-2 py-1.5 w-full">
          {navItems.map(({ id, icon, label }) => {
            const isActive = currentTab === id;

            return (
              <button
                type="button"
                key={id}
                onClick={() => onTabChange(id)}
                className="flex-1 bg-transparent border-0 cursor-pointer flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl relative group outline-none select-none transition-transform active:scale-95"
              >
                {/* Subtle glass lens pill background when active */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      inset: "2px",
                      borderRadius: "20px",
                      background: "rgba(255, 255, 255, 0.52)",
                      border: "1px solid rgba(255, 255, 255, 0.85)",
                      boxShadow: "0 2px 8px rgba(15, 34, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
                      animation: "bn-active-bg-in 0.35s cubic-bezier(0.34,1.4,0.64,1) forwards",
                    }}
                  />
                )}

                {/* Icon with bounce-in animation on enter */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    filter: "drop-shadow(0 1px 0 rgba(255, 255, 255, 0.7))",
                    animation: isActive
                      ? "bn-icon-enter 0.4s cubic-bezier(0.34,1.4,0.64,1)"
                      : undefined,
                  }}
                >
                  {icon(isActive)}
                </div>

                {/* Active dot / indicator bar */}
                <div
                  style={{
                    height: "3.5px",
                    borderRadius: "2px",
                    background: isActive ? "#215641" : "transparent",
                    boxShadow: isActive ? "0 1px 2px rgba(33, 86, 65, 0.35)" : "none",
                    transition: "all 0.3s ease",
                    animation: isActive
                      ? "bn-dot-expand 0.35s cubic-bezier(0.34,1.4,0.64,1) forwards"
                      : undefined,
                    width: isActive ? "16px" : "0px",
                    position: "relative",
                    zIndex: 2,
                  }}
                />

                <span className="sr-only">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
