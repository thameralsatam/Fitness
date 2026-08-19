import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Settings,
  Languages,
  Type,
  BookOpen,
  Copy,
  RotateCcw,
  Terminal,
  Check,
  Edit2,
  Camera,
  ChevronRight,
  ChevronLeft,
  Scale,
  Ruler,
  Target,
  Sparkles,
  Award,
  Activity,
  Flame,
  X,
} from 'lucide-react';
import { Language, WorkoutPlan } from '../types';
import { I18N } from '../data/workoutData';
import { triggerHaptic } from '../utils/haptics';
import {
  UserProfile,
  PRESET_AVATARS,
  PresetAvatar,
  getStoredUserProfile,
  saveUserProfile,
} from '../utils/profileManager';
import { SaudiFlagSvg, GermanFlagSvg, AvatarIconRenderer } from './SvgIcons';

interface ProfileViewProps {
  currentLang: Language;
  onSelectLang: (lang: Language) => void;
  onOpenFontSettings: () => void;
  onOpenDebugLogs: () => void;
  onOpenLibrary: () => void;
  onResetProgress: () => void;
  onCopyPlan: () => void;
  totalSessions: number;
  completedExercisesCount: number;
  plan: WorkoutPlan;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentLang,
  onSelectLang,
  onOpenFontSettings,
  onOpenDebugLogs,
  onOpenLibrary,
  onResetProgress,
  onCopyPlan,
  totalSessions,
  completedExercisesCount,
  plan,
}) => {
  const t = I18N[currentLang];
  const isAr = currentLang === 'ar';
  const ArrowIcon = isAr ? ChevronLeft : ChevronRight;

  const [profile, setProfile] = useState<UserProfile>(() => getStoredUserProfile());
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(profile.name);
  const [editBio, setEditBio] = useState<string>(profile.bio);
  const [editWeight, setEditWeight] = useState<number>(profile.weightKg);
  const [editHeight, setEditHeight] = useState<number>(profile.heightCm);
  const [editWeeklyTarget, setEditWeeklyTarget] = useState<number>(profile.weeklyTarget);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(profile.presetId);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>(profile.avatarUrl);

  const handleSaveProfile = () => {
    triggerHaptic('success');
    const updated: UserProfile = {
      ...profile,
      name: editName.trim() || (isAr ? 'بطل التدريب' : 'Champion'),
      bio: editBio.trim() || (isAr ? 'بناء عضلي ولياقة شاملة' : 'Fitness & Hypertrophy'),
      weightKg: Math.max(30, editWeight || 75),
      heightCm: Math.max(100, editHeight || 175),
      weeklyTarget: Math.max(1, editWeeklyTarget || 3),
      presetId: selectedPresetId,
      avatarUrl: customAvatarUrl,
      avatarType: customAvatarUrl ? 'custom' : 'preset',
    };
    setProfile(updated);
    saveUserProfile(updated);
    setIsEditingProfile(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        setCustomAvatarUrl(dataUrl);
        triggerHaptic('selection');
      };
      reader.readAsDataURL(file);
    }
  };

  const activePreset: PresetAvatar =
    PRESET_AVATARS.find((p) => p.id === profile.presetId) || PRESET_AVATARS[0];

  // Calculate BMI
  const heightInMeters = profile.heightCm / 100;
  const bmi =
    heightInMeters > 0 ? (profile.weightKg / (heightInMeters * heightInMeters)).toFixed(1) : '22.5';

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 sm:space-y-8 py-2 sm:py-4 px-1 animate-in fade-in duration-300">
      {/* 1. Serene & Spacious Profile Header */}
      <div className="bg-white rounded-3xl border border-[#e2ebe3] p-6 sm:p-8 shadow-xs text-center relative overflow-hidden transition-all">
        {/* Top-Right/Left Edit Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setEditName(profile.name);
            setEditBio(profile.bio);
            setEditWeight(profile.weightKg);
            setEditHeight(profile.heightCm);
            setEditWeeklyTarget(profile.weeklyTarget);
            setSelectedPresetId(profile.presetId);
            setCustomAvatarUrl(profile.avatarUrl);
            setIsEditingProfile(true);
          }}
          className="absolute top-5 end-5 px-3 py-1.5 rounded-full bg-[#f4f8f5] hover:bg-[#e8f1eb] text-[#215641] text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border border-[#dbe6de]"
          title={isAr ? 'تعديل البيانات' : 'Profil bearbeiten'}
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>{isAr ? 'تعديل' : 'Bearbeiten'}</span>
        </button>

        {/* Centered Avatar with Gentle Breathing Room */}
        <div className="flex justify-center mb-4">
          <div
            className="relative group cursor-pointer"
            onClick={() => {
              triggerHaptic('selection');
              setIsEditingProfile(true);
            }}
          >
            <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full p-1 bg-white border border-[#d2dfd6] shadow-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              {profile.avatarType === 'custom' && profile.avatarUrl ? (
                <div className="w-full h-full rounded-full overflow-hidden bg-[#e8f1eb]">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={`w-full h-full rounded-full bg-gradient-to-tr ${activePreset.gradient} text-white flex items-center justify-center shadow-inner relative overflow-hidden`}
                >
                  <AvatarIconRenderer
                    iconKey={activePreset.iconKey}
                    className="w-10 h-10 sm:w-11 sm:h-11 relative z-10"
                  />
                </div>
              )}
            </div>

            {/* Quick Edit Badge on Avatar */}
            <div className="absolute -bottom-0.5 -end-0.5 w-7 h-7 rounded-full bg-[#215641] text-white flex items-center justify-center shadow-md border-2 border-white transition-transform group-hover:scale-110">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* User Identity */}
        <h2 className="font-display font-black text-xl sm:text-2xl text-[#15221b] tracking-tight">
          {profile.name}
        </h2>
        <p className="text-xs sm:text-sm text-[#5d7165] font-medium mt-1 max-w-sm mx-auto">
          {profile.bio}
        </p>

        {/* Discreet Metrics Row */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[#75877d] font-semibold">
          <span>{profile.weightKg} kg</span>
          <span className="w-1 h-1 rounded-full bg-[#cbd8cf]" />
          <span>{profile.heightCm} cm</span>
          <span className="w-1 h-1 rounded-full bg-[#cbd8cf]" />
          <span>BMI {bmi}</span>
        </div>

        {/* Activity Highlight Strip */}
        <div className="mt-6 pt-5 border-t border-[#f0f5f1] grid grid-cols-3 gap-2 sm:gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-[#75877d] uppercase tracking-wider block">
              {isAr ? 'الجلسات' : 'Sessions'}
            </span>
            <span className="font-display font-black text-lg sm:text-xl text-[#215641] block">
              {totalSessions}
            </span>
          </div>

          <div className="space-y-0.5 border-x border-[#f0f5f1]">
            <span className="text-[11px] font-bold text-[#75877d] uppercase tracking-wider block">
              {isAr ? 'التمارين المكتملة' : 'Übungen'}
            </span>
            <span className="font-display font-black text-lg sm:text-xl text-[#15221b] block">
              {completedExercisesCount}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-[#75877d] uppercase tracking-wider block">
              {isAr ? 'الهدف الأسبوعي' : 'Wochenziel'}
            </span>
            <span className="font-display font-black text-lg sm:text-xl text-[#215641] block">
              {profile.weeklyTarget}x / {isAr ? 'أسبوع' : 'W'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Structured Settings & Options Groups (Apple-style grouped cards) */}
      <div className="space-y-6">
        {/* Group A: Preferences & Customization */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#5d7165] px-3 uppercase tracking-wider">
            {isAr ? 'التفضيلات والمكتبة' : 'Einstellungen & Bibliothek'}
          </span>

          <div className="bg-white rounded-3xl border border-[#e2ebe3] shadow-xs overflow-hidden divide-y divide-[#f2f6f3]">
            {/* Language Setting with Seamless Inline Toggle */}
            <div className="p-4 sm:p-4.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0">
                  <Languages className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#15221b]">
                    {isAr ? 'لغة التطبيق' : 'Sprache'}
                  </div>
                  <div className="text-[11px] text-[#75877d]">
                    {isAr ? 'العربية والألمانية' : 'Deutsch & Arabisch'}
                  </div>
                </div>
              </div>

              {/* Compact Segmented Language Switcher */}
              <div className="flex items-center p-1 rounded-2xl bg-[#f2f6f3] border border-[#e2ebe3] gap-1">
                <button
                  type="button"
                  onClick={() => onSelectLang('ar')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentLang === 'ar'
                      ? 'bg-white text-[#215641] shadow-xs'
                      : 'text-[#5d7165] hover:text-[#15221b]'
                  }`}
                >
                  <SaudiFlagSvg className="w-4 h-2.8" />
                  <span>العربية</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectLang('de')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentLang === 'de'
                      ? 'bg-white text-[#215641] shadow-xs'
                      : 'text-[#5d7165] hover:text-[#15221b]'
                  }`}
                >
                  <GermanFlagSvg className="w-4 h-2.8" />
                  <span>DE</span>
                </button>
              </div>
            </div>

            {/* Exercise & Machine Library */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onOpenLibrary();
              }}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-start hover:bg-[#fafcfa] active:bg-[#f2f7f4] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0 group-hover:bg-[#215641] group-hover:text-white transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#15221b]">
                    {isAr ? 'مكتبة الأجهزة والتمارين' : 'Übungs- & Geräte-Bibliothek'}
                  </div>
                  <div className="text-[11px] text-[#75877d]">
                    {isAr ? 'تخصيص الأجهزة المتاحة وإدارتها' : 'Geräte verwalten und anpassen'}
                  </div>
                </div>
              </div>
              <ArrowIcon className="w-4 h-4 text-[#9ab0a3] group-hover:text-[#215641] transition-colors" />
            </button>

            {/* Typography Settings */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onOpenFontSettings();
              }}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-start hover:bg-[#fafcfa] active:bg-[#f2f7f4] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0 group-hover:bg-[#215641] group-hover:text-white transition-colors">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#15221b]">
                    {isAr ? 'إعدادات الخطوط والطباعة' : 'Schriftarten & Typografie'}
                  </div>
                  <div className="text-[11px] text-[#75877d]">
                    {isAr ? 'تخصيص خطوط العناوين والنصوص' : 'Display- & Fließtext-Schriften anpassen'}
                  </div>
                </div>
              </div>
              <ArrowIcon className="w-4 h-4 text-[#9ab0a3] group-hover:text-[#215641] transition-colors" />
            </button>
          </div>
        </div>

        {/* Group B: Plan Management & Data */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#5d7165] px-3 uppercase tracking-wider">
            {isAr ? 'الخطة والبيانات' : 'Trainingsplan & Daten'}
          </span>

          <div className="bg-white rounded-3xl border border-[#e2ebe3] shadow-xs overflow-hidden divide-y divide-[#f2f6f3]">
            {/* Copy Plan */}
            <button
              type="button"
              onClick={onCopyPlan}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-start hover:bg-[#fafcfa] active:bg-[#f2f7f4] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0 group-hover:bg-[#215641] group-hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#15221b]">
                    {isAr ? 'نسخ الجدول كاملاً' : 'Trainingsplan kopieren'}
                  </div>
                  <div className="text-[11px] text-[#75877d]">
                    {isAr ? 'نسخ نصي لتمارين اليوم والخطة للحافظة' : 'In die Zwischenablage kopieren'}
                  </div>
                </div>
              </div>
              <ArrowIcon className="w-4 h-4 text-[#9ab0a3] group-hover:text-[#215641] transition-colors" />
            </button>

            {/* Reset Today's Progress */}
            <button
              type="button"
              onClick={onResetProgress}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-start hover:bg-[#fdf9f9] active:bg-[#fae8e8] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#fdf2f2] text-[#c53030] flex items-center justify-center flex-shrink-0 group-hover:bg-[#c53030] group-hover:text-white transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#c53030]">
                    {isAr ? 'إعادة ضبط علامات إنجاز اليوم' : 'Heutigen Fortschritt zurücksetzen'}
                  </div>
                  <div className="text-[11px] text-[#a85858]">
                    {isAr ? 'تصفير مربعات التأشير للجلسة الحالية' : 'Tages-Checkboxen zurücksetzen'}
                  </div>
                </div>
              </div>
              <ArrowIcon className="w-4 h-4 text-[#d99b9b] group-hover:text-[#c53030] transition-colors" />
            </button>
          </div>
        </div>

        {/* Group C: Diagnostics & System */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#5d7165] px-3 uppercase tracking-wider">
            {isAr ? 'النظام والمعلومات' : 'System & Diagnose'}
          </span>

          <div className="bg-white rounded-3xl border border-[#e2ebe3] shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onOpenDebugLogs();
              }}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-start hover:bg-[#fafcfa] active:bg-[#f2f7f4] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0 group-hover:bg-[#215641] group-hover:text-white transition-colors">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#15221b]">
                    {isAr ? 'سجل تشخيص النظام' : 'System & Debug Logs'}
                  </div>
                  <div className="text-[11px] text-[#75877d]">
                    {isAr ? 'فحص السجلات وحالة المشغل الصوتي' : 'Diagnosekonsole und Logs anzeigen'}
                  </div>
                </div>
              </div>
              <ArrowIcon className="w-4 h-4 text-[#9ab0a3] group-hover:text-[#215641] transition-colors" />
            </button>
          </div>
        </div>

        {/* Peaceful Footer */}
        <div className="text-center pt-2 pb-6 text-xs text-[#8da095] space-y-1">
          <p className="font-semibold">{isAr ? 'تطبيق اللياقة البدنية والتمارين الذكي' : 'Smarter Trainingsbegleiter'}</p>
          <p className="text-[11px] text-[#a4b5ab]">v1.4.0 · Local & Offline-First</p>
        </div>
      </div>

      {/* ================= MODAL: Profile Edit ================= */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#dbe4dc] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#e2ebe3]">
                <h3 className="font-display font-black text-base text-[#15221b]">
                  {isAr ? 'تعديل بيانات البروفايل' : 'Profil anpassen'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="w-8 h-8 rounded-full bg-[#f8faf8] hover:bg-[#edf4ef] text-[#75877d] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar Live Preview & Selection */}
              <div className="space-y-3">
                {/* Live Preview Circle */}
                <div className="flex items-center justify-center py-1">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full p-1 bg-white border border-[#d2dfd6] shadow-sm flex items-center justify-center">
                      {customAvatarUrl ? (
                        <div className="w-full h-full rounded-full overflow-hidden bg-[#e8f1eb]">
                          <img
                            src={customAvatarUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        (() => {
                          const previewPreset =
                            PRESET_AVATARS.find((p) => p.id === selectedPresetId) ||
                            PRESET_AVATARS[0];
                          return (
                            <div
                              className={`w-full h-full rounded-full bg-gradient-to-tr ${previewPreset.gradient} text-white flex items-center justify-center shadow-inner relative overflow-hidden`}
                            >
                              <AvatarIconRenderer
                                iconKey={previewPreset.iconKey}
                                className="w-9 h-9 relative z-10"
                              />
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </div>

                <label className="text-xs font-bold text-[#4f6156] block text-center">
                  {isAr ? 'اختر رمز الأفاتار الرياضي (SVG)' : 'Avatar-Symbol auswählen'}
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {PRESET_AVATARS.map((av) => {
                    const isSelected = !customAvatarUrl && selectedPresetId === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          setSelectedPresetId(av.id);
                          setCustomAvatarUrl('');
                          triggerHaptic('light');
                        }}
                        className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all relative overflow-hidden ${
                          isSelected
                            ? 'ring-2 ring-[#215641] ring-offset-2 scale-105 shadow-md'
                            : 'opacity-70 hover:opacity-100 hover:scale-102'
                        } bg-gradient-to-tr ${av.gradient}`}
                      >
                        <AvatarIconRenderer iconKey={av.iconKey} className="w-5 h-5" />
                        <span className="text-[9px] font-bold text-white/90 mt-0.5">
                          {isAr ? av.labelAr.split(' ')[0] : av.labelDe.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Photo Upload */}
                <div className="pt-1">
                  <label className="w-full py-2.5 px-3 rounded-2xl border-2 border-dashed border-[#bad3c3] hover:border-[#215641] flex items-center justify-center gap-2 cursor-pointer text-[#215641] bg-[#f8faf8] active:scale-95 transition-all text-xs font-bold">
                    <Camera className="w-4 h-4" />
                    <span>{isAr ? 'أو رفع صورة شخصية من جهازك' : 'Eigenes Foto hochladen'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#4f6156] block">
                  {isAr ? 'الاسم' : 'Name'}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#dbe4dc] focus:border-[#215641] outline-none text-xs sm:text-sm font-semibold bg-[#fbfcfb]"
                />
              </div>

              {/* Bio Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#4f6156] block">
                  {isAr ? 'الهدف / الوصف الرياضي' : 'Ziel / Fitness-Fokus'}
                </label>
                <input
                  type="text"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-[#dbe4dc] focus:border-[#215641] outline-none text-xs sm:text-sm font-semibold bg-[#fbfcfb]"
                />
              </div>

              {/* Physical Metrics */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#4f6156] block text-center">
                    {isAr ? 'الوزن (kg)' : 'Gewicht (kg)'}
                  </label>
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-2 rounded-2xl border border-[#dbe4dc] text-xs font-bold text-center bg-[#fbfcfb]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#4f6156] block text-center">
                    {isAr ? 'الطول (cm)' : 'Größe (cm)'}
                  </label>
                  <input
                    type="number"
                    value={editHeight}
                    onChange={(e) => setEditHeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-2 rounded-2xl border border-[#dbe4dc] text-xs font-bold text-center bg-[#fbfcfb]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#4f6156] block text-center">
                    {isAr ? 'الهدف/أسبوع' : 'Ziel/Woche'}
                  </label>
                  <input
                    type="number"
                    value={editWeeklyTarget}
                    onChange={(e) => setEditWeeklyTarget(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2 py-2 rounded-2xl border border-[#dbe4dc] text-xs font-bold text-center bg-[#fbfcfb]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-[#e2ebe3]">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 rounded-2xl bg-[#215641] hover:bg-[#184232] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  {isAr ? 'حفظ التعديلات' : 'Änderungen speichern'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-3 rounded-2xl bg-[#edf4ef] hover:bg-[#e2ede5] text-[#4f6156] font-bold text-xs transition-all"
                >
                  {isAr ? 'إلغاء' : 'Abbrechen'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
