import React from 'react';
import { UniversalFloatingControl } from './UniversalFloatingControl';
import { ViewTab, Language } from '../types';

interface HeaderProps {
  currentTab: ViewTab;
  onNavigateTab: (tab: ViewTab) => void;
  currentLang: Language;
  onActiveStatusChange?: (isActive: boolean) => void;
  onExpandStatusChange?: (isExpanded: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigateTab,
  currentLang,
  onActiveStatusChange,
  onExpandStatusChange,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] w-full pointer-events-none flex justify-center bg-transparent transform-gpu will-change-transform">
      <UniversalFloatingControl
        currentTab={currentTab}
        onNavigateTab={onNavigateTab}
        lang={currentLang}
        onActiveStatusChange={onActiveStatusChange}
        onExpandStatusChange={onExpandStatusChange}
      />
    </header>
  );
};
