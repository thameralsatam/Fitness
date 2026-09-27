import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Dumbbell, Sparkles } from 'lucide-react';
import { ExerciseItem, Language, ExerciseMediaItem } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';
import { ExerciseMediaUploader } from './ExerciseMediaUploader';
import { saveExerciseMediaFile, deleteExerciseMediaItem } from '../utils/mediaStorage';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  onAddExercise: (exercise: ExerciseItem) => void;
  dayName?: string;
}

const COMMON_MUSCLES = [
  { ar: 'عضلات الصدر', de: 'Brust' },
  { ar: 'عضلات الظهر', de: 'Rücken' },
  { ar: 'الأكتاف', de: 'Schultern' },
  { ar: 'الأرجل والأرداف', de: 'Beine & Gesäß' },
  { ar: 'البايسبس', de: 'Arme (Bizeps)' },
  { ar: 'الترايسبس', de: 'Arme (Trizeps)' },
  { ar: 'عضلات البطن', de: 'Bauch' },
  { ar: 'عضلات الساق (السمانة)', de: 'Waden' },
  { ar: 'أسفل الظهر', de: 'Unterer Rücken' },
];

const SETS_PRESETS = ['2', '3', '4', '5'];
const REPS_PRESETS = ['6–8', '8–12', '10–12', '12–15', '15–20'];

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onAddExercise,
  dayName,
}) => {
  const isAr = currentLang === 'ar';

  const [tempId] = useState(() => Date.now());
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('عضلات الصدر');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('8–12');
  const [mediaList, setMediaList] = useState<ExerciseMediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      notifyModalChange(true);
      document.body.style.overflow = 'hidden';
      setName('');
      setMuscle('عضلات الصدر');
      setSets('3');
      setReps('8–12');
      setMediaList([]);
      setError(null);

      return () => {
        notifyModalChange(false);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUploadFiles = async (files: File[]) => {
    const uploadedItems: ExerciseMediaItem[] = [];
    for (const file of files) {
      const item = await saveExerciseMediaFile(tempId, file);
      uploadedItems.push(item);
    }
    setMediaList((prev) => [...prev, ...uploadedItems]);
  };

  const handleDeleteMedia = async (mediaId: string) => {
    await deleteExerciseMediaItem(mediaId);
    setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError(isAr ? 'يرجى كتابة اسم الجهاز أو التمرين' : 'Bitte Übungsnamen eingeben');
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('success');
    const newExercise: ExerciseItem = {
      id: tempId,
      nameDe: cleanName,
      muscleAr: muscle.trim() || 'عام',
      muscleDe: muscle.trim() || 'Allgemein',
      sets: sets.trim() || '3',
      reps: reps.trim() || '8–12',
      alternatives: [],
      media: mediaList,
    };

    onAddExercise(newExercise);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-[#e2ebe3] z-10 overflow-hidden max-h-[92vh] flex flex-col text-[#15221b]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#eef4f0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#edf5f0] text-[#215641] flex items-center justify-center border border-[#bad5c2] shadow-2xs">
                <Dumbbell className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-extrabold text-base sm:text-lg text-[#15221b] truncate">
                  {isAr ? 'إضافة جهاز / تمرين جديد' : 'Neue Übung hinzufügen'}
                </h3>
                <p className="text-xs text-[#75877d] truncate">
                  {dayName
                    ? isAr
                      ? `إضافة مباشرة إلى جدول (${dayName})`
                      : `Direkt zu (${dayName}) hinzufügen`
                    : isAr
                    ? 'إضافة يدوية مباشرة'
                    : 'Direkte manuelle Eingabe'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-[#f1f6f3] text-[#4f6156] hover:text-[#15221b] hover:bg-[#e2ece5] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Schließen'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {/* Exercise Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#215641] flex items-center justify-between">
                <span>{isAr ? 'اسم الجهاز أو التمرين *' : 'Name der Übung / des Geräts *'}</span>
                {error && <span className="text-red-500 font-normal text-[11px]">{error}</span>}
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={isAr ? 'مثال: بنش برس بار مستوي، سحب عالي للظهر...' : 'z.B. Bankdrücken, Latzug...'}
                className="w-full px-3.5 py-2.5 bg-[#f8faf8] rounded-2xl border border-[#bad5c2] text-sm font-bold text-[#15221b] focus:ring-2 focus:ring-[#215641]/20 focus:border-[#215641] outline-hidden placeholder:text-[#95a89d]"
              />
            </div>

            {/* Target Muscle Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#215641] block">
                {isAr ? 'العضلة المستهدفة:' : 'Zielmuskel:'}
              </label>

              {/* Muscle Quick Tags */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_MUSCLES.map((m) => {
                  const label = isAr ? m.ar : m.de;
                  const isSelected = muscle === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setMuscle(label);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-[#215641] text-white shadow-2xs'
                          : 'bg-[#edf5f0] text-[#2c4b3a] hover:bg-[#dfeee3] border border-[#bad5c2]/60'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Muscle Input (if needed) */}
              <input
                type="text"
                value={muscle}
                onChange={(e) => setMuscle(e.target.value)}
                placeholder={isAr ? 'أو اكتب عضلة أخرى مخصصة...' : 'Oder anderen Muskel eingeben...'}
                className="w-full px-3 py-2 bg-[#f8faf8] rounded-xl border border-[#dbe4dc] text-xs font-semibold text-[#15221b] focus:ring-2 focus:ring-[#215641]/20 focus:border-[#215641] outline-hidden"
              />
            </div>

            {/* Sets & Reps Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Sets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#215641] block">
                  {isAr ? 'عدد المجموعات' : 'Sätze'}
                </label>
                <div className="flex items-center gap-1">
                  {SETS_PRESETS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSets(s);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        sets === s
                          ? 'bg-[#215641] text-white'
                          : 'bg-[#edf5f0] text-[#2c4b3a] hover:bg-[#dfeee3]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  placeholder="3"
                  className="w-full px-3 py-2 bg-[#f8faf8] rounded-xl border border-[#dbe4dc] text-xs font-bold text-[#15221b] focus:ring-2 focus:ring-[#215641]/20 focus:border-[#215641] outline-hidden text-center"
                />
              </div>

              {/* Reps */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#215641] block">
                  {isAr ? 'التكرارات (Reps)' : 'Wiederholungen'}
                </label>
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {REPS_PRESETS.slice(0, 3).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setReps(r);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        reps === r
                          ? 'bg-[#215641] text-white'
                          : 'bg-[#edf5f0] text-[#2c4b3a] hover:bg-[#dfeee3]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="8–12"
                  className="w-full px-3 py-2 bg-[#f8faf8] rounded-xl border border-[#dbe4dc] text-xs font-bold text-[#15221b] focus:ring-2 focus:ring-[#215641]/20 focus:border-[#215641] outline-hidden text-center"
                />
              </div>
            </div>

            {/* Media Upload Section (Optional) */}
            <div className="pt-2 border-t border-[#eef4f0] space-y-2">
              <label className="text-xs font-bold text-[#215641] block">
                {isAr ? 'صور أو فيديو للتكنيك (اختياري):' : 'Fotos / Videos (optional):'}
              </label>
              <ExerciseMediaUploader
                mediaList={mediaList}
                onUploadFiles={handleUploadFiles}
                onDeleteMedia={handleDeleteMedia}
                currentLang={currentLang}
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#eef4f0] flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="px-4 py-3 rounded-2xl bg-[#f1f6f3] hover:bg-[#e2ece5] text-[#4f6156] font-bold text-xs transition-all cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Abbrechen'}
              </button>

              <button
                type="submit"
                className="flex-1 py-3 px-5 rounded-2xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{isAr ? 'إضافة إلى الجدول مباشرة' : 'Zum Plan hinzufügen'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
