import React from 'react';
import {
  Type,
  RotateCcw,
  ChevronLeft,
  ArrowUpDown,
  Globe,
  Trash2,
} from 'lucide-react';
import { Language } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface ProfileViewProps {
  currentLang?: Language;
  onSelectLang: (lang: Language) => void;
  onOpenFontSettings: () => void;
  onOpenPlanShare?: () => void;
  onResetProgress: () => void;
  onFactoryReset?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentLang = 'ar',
  onSelectLang,
  onOpenFontSettings,
  onOpenPlanShare,
  onResetProgress,
  onFactoryReset,
}) => {
  const isDe = currentLang === 'de';

  return (
    <div
      className="w-full max-w-xl mx-auto space-y-6 sm:space-y-7 py-2 sm:py-3 px-1 animate-in fade-in duration-300"
      dir={isDe ? 'ltr' : 'rtl'}
    >
      {/* 1. Calm, Focused Page Header */}
      <div className="px-2 pt-1 pb-1">
        <h1 className="font-display font-black text-xl sm:text-2xl text-[#15221b] tracking-tight">
          {isDe ? 'Einstellungen' : 'الإعدادات والبيانات'}
        </h1>
        <p className="text-xs sm:text-sm text-[#5d7165] font-medium mt-1">
          {isDe
            ? 'Typografie, Plan-Verwaltung und Systemoptionen'
            : 'تخصيص الخطوط، إدارة وتصدير الخطة، وخيارات النظام'}
        </p>
      </div>

      {/* 2. Structured Settings Groups */}
      <div className="space-y-5">
        {/* Group A: Preferences & Customization */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#5d7165] px-3 uppercase tracking-wider">
            {isDe ? 'Erscheinungsbild' : 'التفضيلات والمظهر'}
          </span>

          <div className="bg-white rounded-3xl border border-[#e2ebe3] shadow-xs overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-3 border-b border-[#f2f6f3]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#15221b] truncate">
                  {isDe ? 'Sprache' : 'اللغة'}
                </div>
              </div>
              <div className="flex p-1 bg-[#f1f6f3] rounded-xl flex-shrink-0">
                {(['ar', 'de'] as Language[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => { triggerHaptic('selection'); onSelectLang(l); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentLang === l ? 'bg-white text-[#15241c] shadow-2xs' : 'text-[#6e8276]'
                    }`}
                  >
                    {l === 'ar' ? 'العربية' : 'Deutsch'}
                  </button>
                ))}
              </div>
            </div>
            {/* Typography Settings */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onOpenFontSettings();
              }}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-start hover:bg-[#fafcfa] active:bg-[#f2f7f4] transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0 group-hover:bg-[#215641] group-hover:text-white transition-colors">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#15221b]">
                    {isDe ? 'Schriftarten & Typografie' : 'إعدادات الخطوط والطباعة'}
                  </div>
                  <div className="text-[11px] text-[#75877d]">
                    {isDe
                      ? 'Schriftarten für Titel und Texte anpassen'
                      : 'تخصيص خطوط العناوين والنصوص أو رفع خطك الخاص'}
                  </div>
                </div>
              </div>
              <ChevronLeft
                className={`w-4 h-4 text-[#9ab0a3] group-hover:text-[#215641] transition-colors ${
                  isDe ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Group B: Plan Management & Data */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#5d7165] px-3 uppercase tracking-wider">
            {isDe ? 'Plan & Daten' : 'الخطة والبيانات'}
          </span>

          <div className="bg-white rounded-3xl border border-[#e2ebe3] shadow-xs overflow-hidden divide-y divide-[#f2f6f3]">
            {/* Plan Export & Import */}
            {onOpenPlanShare && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onOpenPlanShare();
                }}
                className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-start hover:bg-[#fafcfa] active:bg-[#f2f7f4] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0 group-hover:bg-[#215641] group-hover:text-white transition-colors">
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#15221b]">
                      {isDe ? 'Plan exportieren & importieren' : 'تصدير واستيراد الخطة'}
                    </div>
                    <div className="text-[11px] text-[#75877d]">
                      {isDe
                        ? 'Backup-Datei speichern oder externen Plan laden'
                        : 'حفظ الخطة كملف نسخ احتياطي أو استيراد خطة بديلة'}
                    </div>
                  </div>
                </div>
                <ChevronLeft
                  className={`w-4 h-4 text-[#9ab0a3] group-hover:text-[#215641] transition-colors ${
                    isDe ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}

            {/* Reset Today's Progress */}
            <button
              type="button"
              onClick={onResetProgress}
              className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-3 text-start hover:bg-[#fdf9f9] active:bg-[#fae8e8] transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#fdf2f2] text-[#c53030] flex items-center justify-center flex-shrink-0 group-hover:bg-[#c53030] group-hover:text-white transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#c53030]">
                    {isDe ? 'Tagesfortschritt zurücksetzen' : 'إعادة ضبط علامات إنجاز اليوم'}
                  </div>
                  <div className="text-[11px] text-[#a85858]">
                    {isDe
                      ? 'Häkchen für das heutige Training entfernen'
                      : 'تصفير مربعات التأشير للجلسة الحالية'}
                  </div>
                </div>
              </div>
              <ChevronLeft
                className={`w-4 h-4 text-[#d99b9b] group-hover:text-[#c53030] transition-colors ${
                  isDe ? 'rotate-180' : ''
                }`}
              />
            </button>
            {onFactoryReset && (
              <button
                type="button"
                onClick={() => { triggerHaptic('warning'); onFactoryReset(); }}
                className="w-full p-4 flex items-center gap-3 text-start hover:bg-[#fdf9f9] active:bg-[#fae8e8] transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-2xl bg-[#fdf2f2] text-[#c53030] flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#c53030]">
                    {isDe ? 'App zurücksetzen' : 'إعادة ضبط التطبيق بالكامل'}
                  </div>
                  <div className="text-[11px] text-[#a85858]">
                    {isDe ? 'Alle lokalen Daten, Medien und Audios löschen' : 'حذف كل البيانات المحلية والوسائط والصوتيات'}
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Quiet Minimal Footer */}
        <div className="text-center pt-2 pb-6 text-xs text-[#8da095] space-y-1">
          <p className="font-semibold">
            {isDe ? 'Smarte Fitness- und Trainings-App' : 'تطبيق اللياقة البدنية والتمارين الذكي'}
          </p>
          <p className="text-[11px] text-[#a4b5ab]">v1.4.0 · Local & Offline-First</p>
        </div>
      </div>
    </div>
  );
};
