import React from 'react';
import { UniversalFloatingControl } from './UniversalFloatingControl';
import { ViewTab, Language } from '../types';

interface FloatingMiniPlayerProps {
  currentTab: ViewTab;
  onNavigateTab: (tab: ViewTab) => void;
  lang: Language;
  onActiveStatusChange?: (isActive: boolean) => void;
  onExpandStatusChange?: (isExpanded: boolean) => void;
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  currentTab,
  onNavigateTab,
  lang,
  onActiveStatusChange,
  onExpandStatusChange,
}) => {
  return (
    <UniversalFloatingControl
      currentTab={currentTab}
      onNavigateTab={onNavigateTab}
      lang={lang}
      onActiveStatusChange={onActiveStatusChange}
      onExpandStatusChange={onExpandStatusChange}
    />
  );
};
