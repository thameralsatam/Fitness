import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Edit3,
  X,
  Check,
  RefreshCw,
  Trash2,
  Dumbbell,
  Layers,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import { ExerciseItem, Language } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';

interface ExerciseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: ExerciseItem | null;
  currentLang: Language;
  libraryExercises: ExerciseItem[];
  onSaveExercise: (updated: ExerciseItem) => void;
  onRemoveFromPlan: (id: number) => void;
  onSwapExercise: (oldId: number, newExercise: ExerciseItem) => void;
  onOpenFullLibrary: () => void;
}

export const ExerciseEditModal: React.FC<ExerciseEditModalProps> = ({
  isOpen,
  onClose,
  exercise,
  currentLang,
  libraryExercises,
  onSaveExercise,
  onRemoveFromPlan,
  onSwapExercise,
  onOpenFullLibrary,
}) => {
  const isAr = currentLang === 'ar';

  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('8–12');
  const [showSwapPicker, setShowSwapPicker] = useState(false);

  useEffect(() => {
    if (isOpen && exercise) {
      notifyModalChange(true);
      document.body.style.overflow = 'hidden';
      setSets(exercise.sets);
      setReps(exercise.reps);
      setShowSwapPicker(false);

      return () => {
        notifyModalChange(false);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, exercise]);

  if (!isOpen || !exercise) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    onSaveExercise({
      ...exercise,
      sets: sets.trim() || '3',
      reps: reps.trim() || '8–12',
    });
    onClose();
  };

  const handleSelectSwap = (replacement: ExerciseItem) => {
    triggerHaptic('selection');
    onSwapExercise(exercise.id, replacement);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-[#e2ebe3] z-10 overflow-hidden max-h-[90vh] flex flex-col text-[#15221b]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#eef4f0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center border border-[#dbe4dc] shadow-2xs">
                <Dumbbell className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-extrabold text-base sm:text-lg text-[#15221b] truncate">
                  {exercise.nameDe}
                </h3>
                <p className="text-xs text-[#75877d]">
                  {isAr ? exercise.muscleAr : exercise.muscleDe}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-[#f1f6f3] text-[#4f6156] hover:text-[#15221b] hover:bg-[#e2ece5] flex items-center justify-center transition-all active:scale-95"
              aria-label={isAr ? 'إغلاق' : 'Schließen'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto">
            {!showSwapPicker ? (
              <form onSubmit={handleSave} className="space-y-4">
                {/* Sets & Reps Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4f6156] block">
                      {isAr ? 'عدد المجموعات' : 'Sätze'}
                    </label>
                    <input
                      type="text"
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                      placeholder="3"
                      className="w-full px-3 py-2 bg-[#f8faf8] rounded-xl border border-[#dbe4dc] text-sm font-bold text-[#15221b] focus:ring-2 focus:ring-[#215641]/20 focus:border-[#215641]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4f6156] block">
                      {isAr ? 'التكرارات (Reps)' : 'Wiederholungen'}
                    </label>
                    <input
                      type="text"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      placeholder="8–12"
                      className="w-full px-3 py-2 bg-[#f8faf8] rounded-xl border border-[#dbe4dc] text-sm font-bold text-[#15221b] focus:ring-2 focus:ring-[#215641]/20 focus:border-[#215641]"
                    />
                  </div>
                </div>

                {/* Quick Swap with Library Exercise Button */}
                <div className="pt-2 border-t border-[#eef4f0] space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setShowSwapPicker(true);
                    }}
                    className="w-full p-3 rounded-2xl bg-[#edf4ef]/70 hover:bg-[#edf4ef] border border-[#dbe4dc] text-[#215641] text-xs font-bold transition-all flex items-center justify-between group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>{isAr ? 'تبديل التمرين بجهاز آخر من المكتبة' : 'Übung durch anderes Gerät ersetzen'}</span>
                    </div>
                    <span className="text-[11px] text-[#75877d]">{libraryExercises.length} {isAr ? 'أجهزة' : 'Geräte'}</span>
                  </button>
                </div>

                {/* Submit & Remove Actions */}
                <div className="pt-3 border-t border-[#eef4f0] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('warning');
                      onRemoveFromPlan(exercise.id);
                      onClose();
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حذف من الجدول' : 'Entfernen'}</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#215641] hover:bg-[#1b4836] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isAr ? 'حفظ التغيير' : 'Speichern'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Swap Picker Stage */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#215641]">
                    {isAr ? 'اختر الجهاز البديل من مكتبتك:' : 'Wähle ein Ersatzgerät:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSwapPicker(false)}
                    className="text-xs text-[#75877d] hover:text-[#15221b]"
                  >
                    {isAr ? 'رجوع' : 'Zurück'}
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {libraryExercises
                    .filter((item) => item.id !== exercise.id)
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSwap(item)}
                        className="w-full p-2.5 rounded-xl bg-[#fafcfa] border border-[#e2ebe3] hover:border-[#215641] text-start transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-[#215641] block">
                            {isAr ? item.muscleAr : item.muscleDe}
                          </span>
                          <span className="text-xs font-bold text-[#15221b] truncate block">
                            {item.nameDe}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#75877d] flex-shrink-0">
                          {item.sets} × {item.reps}
                        </span>
                      </button>
                    ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullLibrary();
                  }}
                  className="w-full py-2 text-center text-xs font-bold text-[#215641] hover:underline flex items-center justify-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فتح المكتبة الشاملة وإضافة أجهزة جديدة' : 'Ganze Bibliothek öffnen'}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
