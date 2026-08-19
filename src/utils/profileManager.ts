export interface UserProfile {
  name: string;
  avatarUrl: string;
  avatarType: 'preset' | 'custom';
  presetId: string;
  bio: string;
  weightKg: number;
  heightCm: number;
  weeklyTarget: number;
}

export interface PresetAvatar {
  id: string;
  labelAr: string;
  labelDe: string;
  iconKey: 'dumbbell' | 'zap' | 'flame' | 'trophy' | 'shield' | 'crown' | 'activity' | 'sparkles';
  gradient: string;
  glowColor: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'ath1',
    labelAr: 'قوة الأثقال',
    labelDe: 'Kraft & Hantel',
    iconKey: 'dumbbell',
    gradient: 'from-[#132d22] via-[#1a4a35] to-[#246b4c]',
    glowColor: 'rgba(52, 211, 153, 0.4)',
  },
  {
    id: 'ath2',
    labelAr: 'طاقة وسرعة',
    labelDe: 'Energie & Speed',
    iconKey: 'zap',
    gradient: 'from-[#3a2007] via-[#854d0e] to-[#d97706]',
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'ath3',
    labelAr: 'حرق وعزيمة',
    labelDe: 'Burn & Power',
    iconKey: 'flame',
    gradient: 'from-[#380d0d] via-[#991b1b] to-[#dc2626]',
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  {
    id: 'ath4',
    labelAr: 'بطولة وفوز',
    labelDe: 'Champion & Sieg',
    iconKey: 'trophy',
    gradient: 'from-[#332205] via-[#a16207] to-[#eab308]',
    glowColor: 'rgba(234, 179, 8, 0.4)',
  },
  {
    id: 'ath5',
    labelAr: 'حماية وصلابة',
    labelDe: 'Stärke & Schutz',
    iconKey: 'shield',
    gradient: 'from-[#0e213d] via-[#1e40af] to-[#2563eb]',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
  {
    id: 'ath6',
    labelAr: 'ملكي متميز',
    labelDe: 'Krone & Elite',
    iconKey: 'crown',
    gradient: 'from-[#2c114d] via-[#6b21a8] to-[#9333ea]',
    glowColor: 'rgba(147, 51, 234, 0.4)',
  },
  {
    id: 'ath7',
    labelAr: 'لياقة مستمرة',
    labelDe: 'Ausdauer & Puls',
    iconKey: 'activity',
    gradient: 'from-[#381023] via-[#9d174d] to-[#e11d48]',
    glowColor: 'rgba(225, 29, 72, 0.4)',
  },
  {
    id: 'ath8',
    labelAr: 'تركيز وصفاء',
    labelDe: 'Fokus & Zen',
    iconKey: 'sparkles',
    gradient: 'from-[#092e2e] via-[#0f766e] to-[#14b8a6]',
    glowColor: 'rgba(20, 184, 166, 0.4)',
  },
];

const PROFILE_STORAGE_KEY = 'gym_user_profile';

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Champion',
  avatarUrl: '',
  avatarType: 'preset',
  presetId: 'ath1',
  bio: 'Fitness & Hypertrophy',
  weightKg: 78,
  heightCm: 178,
  weeklyTarget: 3,
};

export function getStoredUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
  return DEFAULT_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile:', err);
  }
}
