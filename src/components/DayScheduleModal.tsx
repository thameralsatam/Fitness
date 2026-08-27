import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Copy,
  Link2,
  Unlink,
  Dumbbell,
  Coffee,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { DayIndex, Language, WorkoutPlan } from '../types';
import {
  DAYS_NAMES_AR,
  DAYS_NAMES_DE,
  getExercisesForDay,
  isDayRestDay,
  getLinkedDay,
  setDayRestStatus,
  linkDayToSource,
  copyExercisesFromDay,
  unlinkDay,
} from '../utils/scheduleManager';
import { triggerHaptic } from '../utils/haptics';

interface DayScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayIndex: DayIndex;
  plan: WorkoutPlan;
  currentLang: Language;
  onUpdatePlan: (updatedPlan: WorkoutPlan) => void;
  showToast: (msg: string) => void;
}

export const DayScheduleModal: React.FC<DayScheduleModalProps> = ({
  isOpen,
  onClose,
  dayIndex,
  plan,
  currentLang,
  onUpdatePlan,
  showToast,
}) => {
  const isAr = currentLang === 'ar';
  const dayName = isAr ? DAYS_NAMES_AR[dayIndex] : DAYS_NAMES_DE[dayIndex];
  const isRest = isDayRestDay(plan, dayIndex);
  const linkedTo = getLinkedDay(plan, dayIndex);
  const currentExercises = getExercisesForDay(plan, dayIndex);

  const [selectedSourceDay, setSelectedSourceDay] = useState<DayIndex>(() => {
    // Default to Monday (0) or first other day
    return dayIndex === 0 ? 1 : 0;
  });

  if (!isOpen) return null;

  const handleToggleRest = (rest: boolean) => {
    triggerHaptic('selection');
    const updated = setDayRestStatus(plan, dayIndex, rest);
    onUpdatePlan(updated);
    showToast(
      rest
        ? isAr
          ? `تم تعيين يوم ${dayName} كيوم راحة واستشفاء`
          : `${dayName} als Ruhetag festgelegt`
        : isAr
        ? `تم تفعيل يوم ${dayName} كيوم تدريب`
        : `${dayName} als Trainingstag aktiviert`
    );
  };

  const handleLinkDay = (sourceDay: DayIndex) => {
    triggerHaptic('success');
    const sourceName = isAr ? DAYS_NAMES_AR[sourceDay] : DAYS_NAMES_DE[sourceDay];
    const updated = linkDayToSource(plan, dayIndex, sourceDay);
    onUpdatePlan(updated);
    showToast(
      isAr
        ? `تم ربط وتطابق يوم ${dayName} مع ${sourceName}`
        : `${dayName} dauerhaft mit ${sourceName} synchronisiert`
    );
    onClose();
  };

  const handleUnlink = () => {
    triggerHaptic('selection');
    const updated = unlinkDay(plan, dayIndex);
    onUpdatePlan(updated);
    showToast(
      isAr
        ? `تم فصل الربط، وأصبح يوم ${dayName} جدولاً مستقلاً`
        : `${dayName} ist jetzt ein eigenständiger Plan`
    );
  };

  const handleCopyFromDay = (sourceDay: DayIndex) => {
    triggerHaptic('success');
    const sourceName = isAr ? DAYS_NAMES_AR[sourceDay] : DAYS_NAMES_DE[sourceDay];
    const sourceExercises = getExercisesForDay(plan, sourceDay);
    const updated = copyExercisesFromDay(plan, dayIndex, sourceDay);
    onUpdatePlan(updated);
    showToast(
      isAr
        ? `تم نسخ ${sourceExercises.length} أجهزة من يوم ${sourceName} إلى ${dayName}`
        : `${sourceExercises.length} Übungen von ${sourceName} nach ${dayName} kopiert`
    );
    onClose();
  };

  const otherDays: DayIndex[] = ([0, 1, 2, 3, 4, 5, 6] as DayIndex[]).filter((d) => d !== dayIndex);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#dbe4dc] space-y-5 overflow-hidden text-[#15221b] max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#e6eee8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#edf5f0] text-[#215641] flex items-center justify-center border border-[#d2e2d7]">
                <Calendar className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#215641] uppercase tracking-wider block font-bold">
                  {isAr ? 'تخصيص جدول اليوم' : 'Tagesplanung & Rhythmus'}
                </span>
                <h3 className="font-display font-black text-lg sm:text-xl text-[#15221b]">
                  {isAr ? `يوم ${dayName}` : dayName}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#edf4ef] hover:bg-[#e2ede5] text-[#4f6156] hover:text-[#15221b] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Schließen"
            >
              <X className="w-4 h-4 stroke-[2.4]" />
            </button>
          </div>

          {/* 1. Day Mode Selector (Training vs Rest) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6e8276] uppercase tracking-wider block">
              {isAr ? 'نوع اليوم' : 'Tagesart'}
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#f4f7f5] rounded-2xl border border-[#e2ece5]">
              <button
                type="button"
                onClick={() => handleToggleRest(false)}
                className={`py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !isRest
                    ? 'bg-[#215641] text-white shadow-xs'
                    : 'text-[#5a7364] hover:text-[#15221b]'
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                <span>{isAr ? 'يوم تدريب' : 'Trainingstag'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleRest(true)}
                className={`py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isRest
                    ? 'bg-[#215641] text-white shadow-xs'
                    : 'text-[#5a7364] hover:text-[#15221b]'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>{isAr ? 'يوم راحة واستشفاء' : 'Ruhetag'}</span>
              </button>
            </div>
          </div>

          {/* 2. Content based on Day Type */}
          {isRest ? (
            /* Rest Day State */
            <div className="p-5 rounded-2xl bg-[#fafcfa] border border-[#dbe6de] text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#edf5f0] text-[#215641] flex items-center justify-center mx-auto">
                <Coffee className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#15221b]">
                  {isAr ? 'يوم راحة واسترخاء عضلي' : 'Geplanter Ruhetag'}
                </h4>
                <p className="text-xs text-[#6e8276] mt-1 max-w-xs mx-auto leading-relaxed">
                  {isAr
                    ? 'الاستشفاء ضروري لنمو الألياف العضلية وتجديد الطاقة. لن تظهر أجهزة أو تمارين لهذا اليوم.'
                    : 'Regeneration ist entscheidend für den Muskelaufbau. An diesem Tag sind keine Übungen geplant.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleRest(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#edf5f0] hover:bg-[#e0ece3] text-[#215641] text-xs font-bold transition-all border border-[#bad5c2] active:scale-95"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحويله إلى يوم تدريب' : 'Zu Trainingstag wechseln'}</span>
              </button>
            </div>
          ) : (
            /* Training Day State */
            <div className="space-y-4">
              {/* Status & Link Info Banner */}
              {linkedTo !== null ? (
                <div className="p-3.5 rounded-2xl bg-[#edf5f0] border border-[#bad5c2] flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#215641] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[#1b4332] truncate">
                        {isAr
                          ? `متطابق تلقائياً مع (${DAYS_NAMES_AR[linkedTo]})`
                          : `Gekoppelt mit (${DAYS_NAMES_DE[linkedTo]})`}
                      </div>
                      <div className="text-[11px] text-[#4f6b59]">
                        {isAr ? 'أي تعديل في أي منهما يُطبق على الاثنين' : 'Änderungen gelten für beide Tage'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleUnlink}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-xs text-[#5a7364] hover:text-amber-800 border border-[#d2e2d7] font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 active:scale-95"
                    title={isAr ? 'فصل الربط ليصبح جدولاً مستقلاً' : 'Entkoppeln'}
                  >
                    <Unlink className="w-3 h-3" />
                    <span>{isAr ? 'فصل' : 'Trennen'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#fafcfa] border border-[#e2ebe4] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#215641]" />
                    <span className="text-xs font-bold text-[#15221b]">
                      {isAr ? 'جدول مستقل وخاص' : 'Eigenständiger Plan'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#215641] font-display">
                    {currentExercises.length} {isAr ? 'أجهزة' : 'Übungen'}
                  </span>
                </div>
              )}

              {/* Matching & Template Options (المطابقة والنسخ) */}
              <div className="p-4 rounded-2xl bg-[#f8faf8] border border-[#e2ece5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#15221b] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#215641]" />
                    <span>{isAr ? 'تطابق أو نسخ من يوم آخر' : 'Von anderem Tag übernehmen'}</span>
                  </span>
                </div>

                {/* Day Picker Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#6e8276] block">
                    {isAr ? 'اختر اليوم المطلوب:' : 'Wähle den Referenz-Tag:'}
                  </label>
                  <select
                    value={selectedSourceDay}
                    onChange={(e) => setSelectedSourceDay(parseInt(e.target.value, 10) as DayIndex)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#dbe6de] text-xs font-bold text-[#15221b] focus:outline-none focus:border-[#215641] transition-all cursor-pointer shadow-2xs"
                  >
                    {otherDays.map((d) => {
                      const exCount = getExercisesForDay(plan, d).length;
                      const isSourceRest = isDayRestDay(plan, d);
                      const name = isAr ? DAYS_NAMES_AR[d] : DAYS_NAMES_DE[d];
                      return (
                        <option key={d} value={d}>
                          {name} {isSourceRest ? (isAr ? '(راحة)' : '(Ruhe)') : `(${exCount} ${isAr ? 'أجهزة' : 'Übungen'})`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Two Distinct Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* Option 1: Sync & Link (مزامنة وتطابق) */}
                  <button
                    type="button"
                    onClick={() => handleLinkDay(selectedSourceDay)}
                    className="p-3 rounded-xl bg-[#edf5f0] hover:bg-[#e0ece3] border border-[#bad5c2] text-start transition-all active:scale-97 cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1b4332] mb-1">
                      <Link2 className="w-3.5 h-3.5 text-[#215641] group-hover:scale-110 transition-transform" />
                      <span>{isAr ? 'مزامنة وربط دائم' : 'Dauerhaft verknüpfen'}</span>
                    </div>
                    <p className="text-[10px] text-[#55705f] leading-snug">
                      {isAr
                        ? `مطابقة تامة مع ${DAYS_NAMES_AR[selectedSourceDay]} (أي تعديل يتزامن تلقائياً)`
                        : `Gleicher Inhalt wie ${DAYS_NAMES_DE[selectedSourceDay]}`}
                    </p>
                  </button>

                  {/* Option 2: Copy Once (نسخ لمرة واحدة) */}
                  <button
                    type="button"
                    onClick={() => handleCopyFromDay(selectedSourceDay)}
                    className="p-3 rounded-xl bg-white hover:bg-[#f0f5f1] border border-[#dbe6de] text-start transition-all active:scale-97 cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#15221b] mb-1">
                      <Copy className="w-3.5 h-3.5 text-[#4f6156] group-hover:scale-110 transition-transform" />
                      <span>{isAr ? 'نسخ لمرة واحدة' : 'Als Kopie einfügen'}</span>
                    </div>
                    <p className="text-[10px] text-[#75877d] leading-snug">
                      {isAr
                        ? `نسخ الأجهزة كمسودة مستقلة لتعديلها بحرية`
                        : `Kopiert die Übungen als eigene Vorlage`}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Close / Done Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isAr ? 'حفظ وإغلاق' : 'Fertig & Schließen'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
