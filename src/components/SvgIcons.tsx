import React from 'react';
import SA from 'country-flag-icons/react/3x2/SA';
import DE from 'country-flag-icons/react/3x2/DE';
import {
  Dumbbell,
  Zap,
  Flame,
  Trophy,
  ShieldCheck,
  Crown,
  Activity,
  Sparkles,
} from 'lucide-react';
import { PresetAvatar } from '../utils/profileManager';

const SafeSAFlag = SA as React.ComponentType<{ className?: string; title?: string }>;
const SafeDEFlag = DE as React.ComponentType<{ className?: string; title?: string }>;

export const SaudiFlagSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-4' }) => (
  <span
    className={`inline-flex items-center justify-center rounded-xs shadow-2xs overflow-hidden flex-shrink-0 ${className}`}
  >
    <SafeSAFlag className="w-full h-full object-cover" title="المملكة العربية السعودية" />
  </span>
);

export const GermanFlagSvg: React.FC<{ className?: string }> = ({ className = 'w-6 h-4' }) => (
  <span
    className={`inline-flex items-center justify-center rounded-xs shadow-2xs overflow-hidden flex-shrink-0 ${className}`}
  >
    <SafeDEFlag className="w-full h-full object-cover" title="Deutschland" />
  </span>
);

export const AvatarIconRenderer: React.FC<{
  iconKey: PresetAvatar['iconKey'];
  className?: string;
}> = ({ iconKey, className = 'w-6 h-6' }) => {
  switch (iconKey) {
    case 'dumbbell':
      return <Dumbbell className={`${className} stroke-[2.3] text-emerald-300 drop-shadow-sm`} />;
    case 'zap':
      return <Zap className={`${className} stroke-[2.3] text-amber-300 drop-shadow-sm`} />;
    case 'flame':
      return <Flame className={`${className} stroke-[2.3] text-red-300 drop-shadow-sm`} />;
    case 'trophy':
      return <Trophy className={`${className} stroke-[2.3] text-yellow-300 drop-shadow-sm`} />;
    case 'shield':
      return <ShieldCheck className={`${className} stroke-[2.3] text-blue-300 drop-shadow-sm`} />;
    case 'crown':
      return <Crown className={`${className} stroke-[2.3] text-purple-300 drop-shadow-sm`} />;
    case 'activity':
      return <Activity className={`${className} stroke-[2.3] text-rose-300 drop-shadow-sm`} />;
    case 'sparkles':
      return <Sparkles className={`${className} stroke-[2.3] text-teal-300 drop-shadow-sm`} />;
    default:
      return <Dumbbell className={`${className} stroke-[2.3] text-emerald-300`} />;
  }
};
