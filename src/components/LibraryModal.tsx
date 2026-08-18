import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Search,
  Check,
  X,
  Dumbbell,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ExerciseItem, Language, WorkoutPlan } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';
import {
  addLibraryExercise,
  updateLibraryExercise,
  deleteLibraryExercise,
  resetLibraryToDefaults,
} from '../utils/libraryManager';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  libraryExercises: ExerciseItem[];
  onUpdateLibrary: (exercises: ExerciseItem[]) => void;
  activePlan: WorkoutPlan;
  onAddExerciseToPlan: (exercise: ExerciseItem) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  libraryExercises,
  onUpdateLibrary,
  activePlan,
  onAddExerciseToPlan,
}) => {
  const isAr = currentLang === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);

  // Form State
  const [nameDe, setNameDe] = useState('');
  const [muscleDe, setMuscleDe] = useState('Beine');
  const [muscleAr, setMuscleAr] = useState('الأرجل');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('8–12');
  const [alternativesText, setAlternativesText] = useState('');

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      notifyModalChange(true);
      document.body.style.overflow = 'hidden';
      return () => {
        notifyModalChange(false);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const musclePresets = [
    { key: 'all', de: 'Alle', ar: 'الكل' },
    { key: 'Beine', de: 'Beine / Quadrizeps', ar: 'الأرجل (الفخذ الأمامي)' },
    { key: 'Brust', de: 'Brust (Pectoralis)', ar: 'الصدر' },
    { key: 'Rücken', de: 'Rücken / Lat', ar: 'الظهر / اللاتس' },
    { key: 'Hinterer Oberschenkel', de: 'Hinterer Oberschenkel', ar: 'الفخذ الخلفي' },
    { key: 'Schultern', de: 'Schultern (Deltoideus)', ar: 'الأكتاف' },
    { key: 'Unterer Rücken', de: 'Unterer Rücken', ar: 'أسفل الظهر' },
    { key: 'Bauch', de: 'Bauch (Abs)', ar: 'عضلات البطن' },
  ];

  const filteredExercises = useMemo(() => {
    return libraryExercises.filter((ex) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ex.nameDe.toLowerCase().includes(q) ||
        ex.muscleDe.toLowerCase().includes(q) ||
        ex.muscleAr.toLowerCase().includes(q) ||
        ex.alternatives.some((alt) => alt.toLowerCase().includes(q));

      const matchesMuscle =
        selectedMuscleFilter === 'all' ||
        ex.muscleDe.toLowerCase().includes(selectedMuscleFilter.toLowerCase()) ||
        ex.muscleAr.toLowerCase().includes(selectedMuscleFilter.toLowerCase());

      return matchesSearch && matchesMuscle;
    });
  }, [libraryExercises, searchQuery, selectedMuscleFilter]);

  const activePlanExerciseIds = useMemo(() => {
    return new Set(activePlan.exercises.map((e) => e.id));
  }, [activePlan.exercises]);

  const handleOpenAddForm = () => {
    triggerHaptic('selection');
    setEditingExercise(null);
    setNameDe('');
    setMuscleDe('Brust (Pectoralis)');
    setMuscleAr('الصدر');
    setSets('3');
    setReps('8–12');
    setAlternativesText('');
    setIsAddingNew(true);
  };

  const handleOpenEditForm = (ex: ExerciseItem) => {
    triggerHaptic('selection');
    setEditingExercise(ex);
    setNameDe(ex.nameDe);
    setMuscleDe(ex.muscleDe);
    setMuscleAr(ex.muscleAr);
    setSets(ex.sets);
    setReps(ex.reps);
    setAlternativesText(ex.alternatives.join(', '));
    setIsAddingNew(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameDe.trim()) return;

    triggerHaptic('medium');

    const alts = alternativesText
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingExercise) {
      // Update existing
      const updated: ExerciseItem = {
        ...editingExercise,
        nameDe: nameDe.trim(),
        muscleDe: muscleDe.trim(),
        muscleAr: muscleAr.trim(),
        sets: sets.trim() || '3',
        reps: reps.trim() || '8–12',
        alternatives: alts,
      };
      const newLib = updateLibraryExercise(updated);
      onUpdateLibrary(newLib);
    } else {
      // Create new
      const created = addLibraryExercise({
        nameDe: nameDe.trim(),
        muscleDe: muscleDe.trim(),
        muscleAr: muscleAr.trim(),
        sets: sets.trim() || '3',
        reps: reps.trim() || '8–12',
        alternatives: alts,
      });
      const newLib = [created, ...libraryExercises.filter((e) => e.id !== created.id)];
      onUpdateLibrary(newLib);
    }

    setIsAddingNew(false);
    setEditingExercise(null);
  };

  const handleDeleteExercise = (id: number) => {
    triggerHaptic('warning');
    const newLib = deleteLibraryExercise(id);
    onUpdateLibrary(newLib);
  };

  const handleResetDefaults = () => {
    triggerHaptic('warning');
    const newLib = resetLibraryToDefaults();
    onUpdateLibrary(newLib);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative w-full max-w-xl bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border border-[#e2ebe3] z-10 overflow-hidden max-h-[92vh] flex flex-col text-[#15221b]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#eef4f0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center border border-[#dbe4dc] shadow-2xs">
                <BookOpen className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg text-[#15221b] leading-tight">
                  {isAr ? 'مكتبة التمارين والأجهزة' : 'Übungs- & Geräte-Bibliothek'}
                </h3>
                <p className="text-xs text-[#75877d] mt-0.5">
                  {isAr
                    ? `${libraryExercises.length} أجهزة محفوظة محلياً`
                    : `${libraryExercises.length} Geräte & Übungen lokal gespeichert`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="px-3 py-1.5 bg-[#215641] hover:bg-[#1b4836] active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة جهاز' : 'Neu'}</span>
              </button>

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
          </div>

          {/* Search & Filter Bar */}
          <div className="px-5 pt-3 pb-2 space-y-2.5 bg-[#fafcfa] border-b border-[#eef4f0]">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#75877d] absolute top-1/2 -translate-y-1/2 start-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن اسم الجهاز، العضلة، أو البديل...' : 'Gerät, Muskel oder Alternative suchen...'}
                className="w-full ps-9 pe-3 py-2 bg-white rounded-xl border border-[#dbe4dc] text-xs text-[#15221b] placeholder:text-[#95a59c] focus:outline-hidden focus:ring-2 focus:ring-[#215641]/20 focus:border-[#215641]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[#95a59c] hover:text-[#15221b]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Muscle Group Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {musclePresets.map((m) => {
                const isActive = selectedMuscleFilter === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedMuscleFilter(m.key);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#215641] text-white shadow-2xs'
                        : 'bg-white border border-[#dbe4dc] text-[#4f6156] hover:bg-[#f1f6f3]'
                    }`}
                  >
                    {isAr ? m.ar : m.de}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add / Edit Form Drawer */}
          <AnimatePresence>
            {isAddingNew && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSaveForm}
                className="p-5 bg-[#edf4ef]/50 border-b border-[#bad3c3] space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#215641]">
                  <span>
                    {editingExercise
                      ? isAr
                        ? 'تعديل بيانات الجهاز في المكتبة'
                        : 'Gerät in der Bibliothek bearbeiten'
                      : isAr
                      ? 'إضافة جهاز أو تمرين جديد للمكتبة'
                      : 'Neues Gerät zur Bibliothek hinzufügen'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-[#75877d] hover:text-[#15221b]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#4f6156] block mb-1">
                      {isAr ? 'اسم الجهاز (بالألمانية أو الإنجليزية)' : 'Gerätename'}
                    </label>
                    <input
                      type="text"
                      required
                      value={nameDe}
                      onChange={(e) => setNameDe(e.target.value)}
                      placeholder="z.B. Beinpresse 45° / Hackenschmidt"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#dbe4dc] text-xs font-bold text-[#15221b] focus:ring-2 focus:ring-[#215641]/20 focus:border-[#215641]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-[#4f6156] block mb-1">
                        {isAr ? 'العضلة المستهدفة (بالألمانية)' : 'Muskelgruppe (DE)'}
                      </label>
                      <input
                        type="text"
                        value={muscleDe}
                        onChange={(e) => setMuscleDe(e.target.value)}
                        placeholder="z.B. Brust (Pectoralis)"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-[#dbe4dc] text-xs text-[#15221b]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#4f6156] block mb-1">
                        {isAr ? 'العضلة المستهدفة (بالعربية)' : 'Muskelgruppe (AR)'}
                      </label>
                      <input
                        type="text"
                        value={muscleAr}
                        onChange={(e) => setMuscleAr(e.target.value)}
                        placeholder="مثال: الصدر / الأرجل"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-[#dbe4dc] text-xs text-[#15221b]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-[#4f6156] block mb-1">
                        {isAr ? 'عدد المجموعات الافتراضي' : 'Standard-Sätze'}
                      </label>
                      <input
                        type="text"
                        value={sets}
                        onChange={(e) => setSets(e.target.value)}
                        placeholder="3"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-[#dbe4dc] text-xs text-[#15221b]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#4f6156] block mb-1">
                        {isAr ? 'نطاق التكرارات الافتراضي' : 'Standard-Wdh.'}
                      </label>
                      <input
                        type="text"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        placeholder="8–12"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-[#dbe4dc] text-xs text-[#15221b]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#4f6156] block mb-1">
                      {isAr ? 'الأجهزة البديلة (افصل بينها بفاصلة)' : 'Alternative Geräte (Kommagetrennt)'}
                    </label>
                    <input
                      type="text"
                      value={alternativesText}
                      onChange={(e) => setAlternativesText(e.target.value)}
                      placeholder="z.B. Brustpresse sitzend, Bankdrücken"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-[#dbe4dc] text-xs text-[#15221b]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#dbe4dc] text-xs text-[#4f6156] hover:bg-white"
                  >
                    {isAr ? 'إلغاء' : 'Abbrechen'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#215641] text-white font-bold text-xs hover:bg-[#1b4836] shadow-2xs active:scale-95"
                  >
                    {editingExercise
                      ? isAr ? 'حفظ التعديل' : 'Änderung speichern'
                      : isAr ? 'إضافة إلى المكتبة' : 'Hinzufügen'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Exercise List Content */}
          <div className="flex-1 p-5 overflow-y-auto space-y-2.5">
            {filteredExercises.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-[#15221b]">
                    {isAr ? 'لا توجد أجهزة مطابقة' : 'Keine passenden Geräte gefunden'}
                  </h4>
                  <p className="text-xs text-[#75877d]">
                    {isAr ? 'جرب البحث باسم آخر أو اضغط زر إضافة جهاز جديد' : 'Passe deinen Suchbegriff an oder füge ein neues Gerät hinzu'}
                  </p>
                </div>
              </div>
            ) : (
              filteredExercises.map((ex) => {
                const isInActivePlan = activePlanExerciseIds.has(ex.id);
                return (
                  <div
                    key={ex.id}
                    className="p-3.5 rounded-2xl bg-[#fafcfa] border border-[#e2ebe3] hover:border-[#c5d8cb] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#edf4ef] text-[#215641] text-[10px] font-bold">
                          {isAr ? ex.muscleAr : ex.muscleDe}
                        </span>
                        <span className="text-[11px] font-mono text-[#75877d]">
                          {ex.sets} × {ex.reps}
                        </span>
                        {isInActivePlan && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            <span>{isAr ? 'في الجدول الحالي' : 'Im Plan'}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-display font-bold text-sm text-[#15221b] truncate">
                        {ex.nameDe}
                      </h4>

                      {ex.alternatives && ex.alternatives.length > 0 && (
                        <p className="text-[11px] text-[#75877d] truncate">
                          <span className="font-semibold">{isAr ? 'البدائل: ' : 'Alt: '}</span>
                          {ex.alternatives.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                      {!isInActivePlan && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('success');
                            onAddExerciseToPlan(ex);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[#215641] hover:bg-[#1b4836] text-white text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إدراج بالجدول' : 'In den Plan'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(ex)}
                        className="p-2 rounded-xl text-[#75877d] hover:text-[#215641] hover:bg-[#edf4ef] transition-colors"
                        title={isAr ? 'تعديل بيانات الجهاز' : 'Bearbeiten'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteExercise(ex.id)}
                        className="p-2 rounded-xl text-[#95a59c] hover:text-red-600 hover:bg-red-50 transition-colors"
                        title={isAr ? 'حذف من المكتبة' : 'Löschen'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Reset option */}
          <div className="px-5 py-3 border-t border-[#eef4f0] bg-[#fafcfa] flex items-center justify-between text-xs">
            <span className="text-[#75877d]">
              {isAr ? 'البيانات محفوظة محلياً في جهازك' : 'Lokal im Browser gespeichert'}
            </span>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[#75877d] hover:text-[#215641] underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isAr ? 'استعادة الأجهزة الافتراضية' : 'Standardgeräte wiederherstellen'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
