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
  ArrowLeft,
  ArrowRight,
  Sparkles,
  RotateCcw,
  MoreHorizontal,
  Film,
  Image as ImageIcon,
  Play,
} from 'lucide-react';
import { ExerciseItem, Language, WorkoutPlan, ExerciseMediaItem } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';
import {
  addLibraryExercise,
  updateLibraryExercise,
  deleteLibraryExercise,
  resetLibraryToDefaults,
  saveLibraryExercises,
} from '../utils/libraryManager';
import { ConfirmModal } from './ConfirmModal';
import { ExerciseMediaUploader } from './ExerciseMediaUploader';
import { MediaViewerModal } from './MediaViewerModal';
import {
  getExerciseMediaList,
  saveExerciseMediaFile,
  deleteExerciseMediaItem,
  getAllExerciseMediaMap,
} from '../utils/mediaStorage';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
  libraryExercises: ExerciseItem[];
  onUpdateLibrary: (exercises: ExerciseItem[]) => void;
  activePlan: WorkoutPlan;
  onAddExerciseToPlan: (exercise: ExerciseItem) => void;
}

const MUSCLE_PRESETS = [
  { key: 'brust', de: 'Brust', ar: 'الصدر' },
  { key: 'beine', de: 'Beine', ar: 'الأرجل' },
  { key: 'ruecken', de: 'Rücken', ar: 'الظهر' },
  { key: 'schultern', de: 'Schultern', ar: 'الأكتاف' },
  { key: 'arm', de: 'Arme', ar: 'الذراعين' },
  { key: 'bauch', de: 'Bauch', ar: 'البطن' },
  { key: 'waden', de: 'Waden', ar: 'السمانة' },
];

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
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('all');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [mediaMap, setMediaMap] = useState<Record<number, ExerciseMediaItem[]>>({});

  // Close 3-dot actions menu on any outside click / touch interaction
  useEffect(() => {
    if (!showActionsMenu) return;
    const handleOutside = (e: MouseEvent | TouchEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-library-actions-menu]')) {
        return;
      }
      setShowActionsMenu(false);
    };
    window.addEventListener('pointerdown', handleOutside, true);
    window.addEventListener('touchstart', handleOutside, true);
    window.addEventListener('click', handleOutside, true);
    return () => {
      window.removeEventListener('pointerdown', handleOutside, true);
      window.removeEventListener('touchstart', handleOutside, true);
      window.removeEventListener('click', handleOutside, true);
    };
  }, [showActionsMenu]);
  const [activeMediaViewer, setActiveMediaViewer] = useState<{
    name: string;
    list: ExerciseMediaItem[];
    index: number;
  } | null>(null);

  // Confirmation dialog state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    type: 'delete' | 'danger' | 'reset';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    cancelText: '',
    type: 'delete',
    onConfirm: () => {},
  });

  // Form State
  const [nameDe, setNameDe] = useState('');
  const [selectedMuscleKey, setSelectedMuscleKey] = useState<string>('brust');
  const [customMuscleDe, setCustomMuscleDe] = useState('');
  const [customMuscleAr, setCustomMuscleAr] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('8–12');
  const [alternativesText, setAlternativesText] = useState('');
  const [formMediaList, setFormMediaList] = useState<ExerciseMediaItem[]>([]);
  const [formMediaPreviewIndex, setFormMediaPreviewIndex] = useState<number | null>(null);

  // Lock scroll and load media map
  useEffect(() => {
    if (isOpen) {
      notifyModalChange(true);
      document.body.style.overflow = 'hidden';
      getAllExerciseMediaMap().then((map) => {
        if (map) setMediaMap(map);
      });
      return () => {
        notifyModalChange(false);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, libraryExercises]);

  const muscleFilterTabs = [
    { key: 'all', de: 'Alle', ar: 'الكل' },
    ...MUSCLE_PRESETS.map((m) => ({ key: m.de, de: m.de.split(' ')[0], ar: m.ar.split(' ')[0] })),
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
    setSelectedMuscleKey('brust');
    setCustomMuscleDe('');
    setCustomMuscleAr('');
    setSets('3');
    setReps('8–12');
    setAlternativesText('');
    setFormMediaList([]);
    setIsAddingNew(true);
  };

  const handleOpenEditForm = (ex: ExerciseItem) => {
    triggerHaptic('selection');
    setEditingExercise(ex);
    setNameDe(ex.nameDe);

    // Try to match preset
    const preset = MUSCLE_PRESETS.find(
      (m) =>
        m.de.toLowerCase().includes(ex.muscleDe.toLowerCase()) ||
        ex.muscleDe.toLowerCase().includes(m.de.toLowerCase()) ||
        m.ar.includes(ex.muscleAr)
    );

    if (preset) {
      setSelectedMuscleKey(preset.key);
      setCustomMuscleDe('');
      setCustomMuscleAr('');
    } else {
      setSelectedMuscleKey('custom');
      setCustomMuscleDe(ex.muscleDe);
      setCustomMuscleAr(ex.muscleAr);
    }

    setSets(ex.sets);
    setReps(ex.reps);
    setAlternativesText(ex.alternatives.join(', '));

    // Load media
    getExerciseMediaList(ex.id).then((stored) => {
      if (stored && stored.length > 0) {
        setFormMediaList(stored);
      } else if (ex.media && ex.media.length > 0) {
        setFormMediaList(ex.media);
      } else {
        setFormMediaList([]);
      }
    });

    setIsAddingNew(true);
  };

  const handleUploadFormFiles = async (files: File[]) => {
    const tempId = editingExercise ? editingExercise.id : Date.now();
    const uploaded: ExerciseMediaItem[] = [];
    for (const file of files) {
      const item = await saveExerciseMediaFile(tempId, file);
      uploaded.push(item);
    }
    setFormMediaList((prev) => [...prev, ...uploaded]);
  };

  const handleDeleteFormMedia = async (mediaId: string) => {
    await deleteExerciseMediaItem(mediaId);
    setFormMediaList((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameDe.trim()) return;

    triggerHaptic('medium');

    let finalMuscleDe = customMuscleDe.trim();
    let finalMuscleAr = customMuscleAr.trim();

    if (selectedMuscleKey !== 'custom') {
      const preset = MUSCLE_PRESETS.find((m) => m.key === selectedMuscleKey);
      if (preset) {
        finalMuscleDe = preset.de;
        finalMuscleAr = preset.ar;
      }
    }

    if (!finalMuscleDe) finalMuscleDe = 'Brust (Pectoralis)';
    if (!finalMuscleAr) finalMuscleAr = 'الصدر';

    const alts = alternativesText
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingExercise) {
      const updated: ExerciseItem = {
        ...editingExercise,
        nameDe: nameDe.trim(),
        muscleDe: finalMuscleDe,
        muscleAr: finalMuscleAr,
        sets: sets.trim() || '3',
        reps: reps.trim() || '8–12',
        alternatives: alts,
        media: formMediaList,
      };
      const newLib = updateLibraryExercise(updated);
      onUpdateLibrary(newLib);
    } else {
      const created = addLibraryExercise({
        nameDe: nameDe.trim(),
        muscleDe: finalMuscleDe,
        muscleAr: finalMuscleAr,
        sets: sets.trim() || '3',
        reps: reps.trim() || '8–12',
        alternatives: alts,
        media: formMediaList,
      });
      const newLib = [created, ...libraryExercises.filter((e) => e.id !== created.id)];
      onUpdateLibrary(newLib);
    }

    setIsAddingNew(false);
    setEditingExercise(null);
  };

  const handleRequestDeleteExercise = (ex: ExerciseItem) => {
    triggerHaptic('warning');
    setConfirmState({
      isOpen: true,
      title: isAr ? 'حذف جهاز من المكتبة' : 'Gerät aus Bibliothek löschen',
      description: isAr
        ? `هل أنت متأكد من رغبتك في حذف جهاز "${ex.nameDe}" من المكتبة؟`
        : `Möchtest du das Gerät "${ex.nameDe}" wirklich aus der Bibliothek löschen?`,
      confirmText: isAr ? 'نعم، حذف الجهاز' : 'Ja, Gerät löschen',
      cancelText: isAr ? 'إلغاء' : 'Abbrechen',
      type: 'delete',
      onConfirm: () => {
        triggerHaptic('success');
        const newLib = deleteLibraryExercise(ex.id);
        onUpdateLibrary(newLib);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleRequestRestoreDefaults = () => {
    triggerHaptic('warning');
    setConfirmState({
      isOpen: true,
      title: isAr ? 'استعادة الأجهزة الافتراضية' : '103 Standard-Geräte wiederherstellen',
      description: isAr
        ? 'سيتم إعادة تحميل كافة الأجهزة والتمارين الافتراضية (103 جهاز وتمرين) إلى مكتبتك وحفظها محلياً.'
        : 'Möchtest du die vollständige Liste aller 103 Standard-Geräte und Übungen wiederherstellen?',
      confirmText: isAr ? 'نعم، استعادة الـ 103 جهاز' : 'Ja, 103 Geräte laden',
      cancelText: isAr ? 'إلغاء' : 'Abbrechen',
      type: 'reset',
      onConfirm: () => {
        triggerHaptic('success');
        const newLib = resetLibraryToDefaults();
        onUpdateLibrary(newLib);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleRequestClearLibrary = () => {
    triggerHaptic('warning');
    setConfirmState({
      isOpen: true,
      title: isAr ? 'تفريغ المكتبة بالكامل' : 'Bibliothek leeren',
      description: isAr
        ? 'هل أنت متأكد من رغبتك في تفريغ كافة الأجهزة من المكتبة؟ يمكنك استعادتها في أي وقت.'
        : 'Möchtest du wirklich alle Geräte aus der Bibliothek entfernen? Du kannst sie jederzeit wiederherstellen.',
      confirmText: isAr ? 'نعم، تفريغ المكتبة' : 'Ja, alle leeren',
      cancelText: isAr ? 'إلغاء' : 'Abbrechen',
      type: 'danger',
      onConfirm: () => {
        triggerHaptic('success');
        saveLibraryExercises([]);
        onUpdateLibrary([]);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-2xl bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-[#dbe4dc] z-10 overflow-hidden max-h-[92vh] flex flex-col text-[#15221b]"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2ebe3] bg-[#fafcfa] flex-shrink-0">
            <div className="flex items-center gap-3">
              {isAddingNew ? (
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="w-9 h-9 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center hover:bg-[#e2ece5] transition-colors"
                >
                  <BackArrow className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center shadow-xs">
                  <BookOpen className="w-5 h-5 stroke-[2.2]" />
                </div>
              )}
              <div>
                <h3 className="font-display font-extrabold text-base text-[#15221b] flex items-center gap-2">
                  <span>
                    {isAddingNew
                      ? editingExercise
                        ? isAr ? 'تعديل الجهاز' : 'Gerät bearbeiten'
                        : isAr ? 'إضافة جهاز جديد' : 'Neues Gerät anlegen'
                      : isAr ? 'مكتبة الأجهزة والتمارين' : 'Geräte-Bibliothek'}
                  </span>
                  {!isAddingNew && (
                    <span className="px-2 py-0.5 rounded-full bg-[#edf4ef] text-[#215641] text-[11px] font-bold">
                      {libraryExercises.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[#75877d]">
                  {isAddingNew
                    ? isAr
                      ? 'حدد اسم الجهاز والعضلة وإعدادات المجموعات وصور/فيديوهات الأداء'
                      : 'Passe Name, Muskelgruppe, Sätze & Medien an'
                    : isAr
                    ? 'تصفح وأضف أي جهاز أو تمرين لجدولك بسهولة'
                    : 'Wähle Übungen für deinen individuellen Trainingsplan'}
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

          {/* ADD / EDIT FORM VIEW */}
          {isAddingNew ? (
            <form onSubmit={handleSaveForm} className="flex-1 p-6 overflow-y-auto space-y-5">
              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#15221b] block">
                  {isAr ? 'اسم الجهاز أو التمرين (بالألمانية/الإنجليزية):' : 'Gerätename:'}
                </label>
                <input
                  type="text"
                  required
                  value={nameDe}
                  onChange={(e) => setNameDe(e.target.value)}
                  placeholder="z.B. Beinpresse 45° / Hackenschmidt"
                  className="w-full h-12 bg-[#f8faf8] border border-[#d2dfd5] rounded-2xl px-4 text-sm font-extrabold text-[#15221b] focus:outline-none focus:border-[#215641]"
                />
              </div>

              {/* Target Muscle Group Presets */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-[#15221b] block">
                  {isAr ? 'العضلة المستهدفة:' : 'Muskelgruppe:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MUSCLE_PRESETS.map((m) => {
                    const isSelected = selectedMuscleKey === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setSelectedMuscleKey(m.key)}
                        className={`p-3 rounded-2xl border text-start transition-all active:scale-98 ${
                          isSelected
                            ? 'bg-[#215641] text-white border-[#215641] shadow-2xs'
                            : 'bg-[#f8faf8] border-[#d2dfd5] text-[#4f6156] hover:border-[#b9ccbf]'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">
                          {isAr ? m.ar : m.de}
                        </div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-emerald-100' : 'text-[#75877d]'}`}>
                          {isAr ? m.de : m.ar}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Sets & Reps Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-[#15221b] block">
                    {isAr ? 'عدد المجموعات (Sätze):' : 'Standard-Sätze:'}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['2', '3', '4'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSets(s)}
                        className={`py-2.5 text-center rounded-2xl border text-xs font-black transition-all ${
                          sets === s
                            ? 'bg-[#215641] text-white border-[#215641]'
                            : 'bg-[#f8faf8] text-[#4f6156] border-[#d2dfd5]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-[#15221b] block">
                    {isAr ? 'نطاق التكرارات (Wdh.):' : 'Standard-Wdh.:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {['6–8', '8–12', '10–12', '12–15'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReps(r)}
                        className={`py-2.5 text-center rounded-2xl border text-[11px] font-black transition-all ${
                          reps === r
                            ? 'bg-[#215641] text-white border-[#215641]'
                            : 'bg-[#f8faf8] text-[#4f6156] border-[#d2dfd5]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Media Uploader (Images & Technique Videos) */}
              <div className="space-y-2 pt-2 border-t border-[#edf4ef]">
                <label className="text-xs font-extrabold text-[#215641] block">
                  {isAr ? 'صور وفيديوهات التكنيك لهذا الجهاز (اختياري):' : 'Fotos & Form-Videos für dieses Gerät:'}
                </label>
                <ExerciseMediaUploader
                  mediaList={formMediaList}
                  onUploadFiles={handleUploadFormFiles}
                  onDeleteMedia={handleDeleteFormMedia}
                  onPreviewMedia={(idx) => setFormMediaPreviewIndex(idx)}
                  currentLang={currentLang}
                />
              </div>

              {/* Alternative Machines Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#15221b] block">
                  {isAr ? 'الأجهزة البديلة المتاحة (اختياري):' : 'Alternative Geräte (Optional):'}
                </label>
                <input
                  type="text"
                  value={alternativesText}
                  onChange={(e) => setAlternativesText(e.target.value)}
                  placeholder={isAr ? 'مثال: بوش أب، بنش برس بالبار' : 'z.B. Brustpresse, Bankdrücken'}
                  className="w-full h-11 bg-[#f8faf8] border border-[#d2dfd5] rounded-2xl px-4 text-xs text-[#15221b] focus:outline-none focus:border-[#215641]"
                />
              </div>

              {/* Form Actions Footer */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#edf4ef]">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-5 py-3 rounded-2xl border border-[#dbe4dc] text-xs font-extrabold text-[#4f6156] hover:bg-gray-50 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Abbrechen'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-[#215641] hover:bg-[#1b4836] text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  {editingExercise
                    ? isAr ? 'حفظ التعديلات' : 'Änderungen speichern'
                    : isAr ? 'إضافة إلى المكتبة' : 'Gerät hinzufügen'}
                </button>
              </div>
            </form>
          ) : (
            /* LIST MODE */
            <>
              {/* Search & Muscle Filters */}
              {libraryExercises.length > 0 && (
                <div className="px-6 pt-4 pb-3 space-y-3 bg-[#fafcfa] border-b border-[#eef4f0] flex-shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#75877d] absolute top-1/2 -translate-y-1/2 start-3.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isAr ? 'بحث عن جهاز أو عضلة...' : 'Gerät oder Muskel suchen...'}
                      className="w-full ps-10 pe-3 py-2.5 bg-white rounded-2xl border border-[#dbe4dc] text-xs text-[#15221b] placeholder:text-[#95a59c] focus:outline-none focus:border-[#215641]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute top-1/2 -translate-y-1/2 end-3 text-[#95a59c] hover:text-[#15221b]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    {muscleFilterTabs.map((m) => {
                      const isActive = selectedMuscleFilter === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setSelectedMuscleFilter(m.key);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
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
              )}

              {/* Scrollable Items List */}
              <div className="flex-1 p-6 overflow-y-auto space-y-3">
                {filteredExercises.length === 0 ? (
                  <div className="py-12 px-6 text-center space-y-4 bg-[#fafcfa] rounded-3xl border border-dashed border-[#d2dfd5] my-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center mx-auto border border-[#d5e3d8]">
                      <Dumbbell className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h4 className="font-display font-extrabold text-base text-[#15221b]">
                        {isAr ? 'المكتبة فارغة (0 أجهزة)' : 'Bibliothek ist leer (0 Geräte)'}
                      </h4>
                      <p className="text-xs text-[#6e8276] leading-relaxed">
                        {isAr
                          ? 'يمكنك الآن إضافة أجهزتك الخاصة وتخصيصها بالكامل مع صورها وفيديوهاتها.'
                          : '0 Geräte gespeichert. Füge deine eigenen Lieblingsgeräte hinzu.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddForm}
                      className="px-5 py-2.5 rounded-2xl bg-[#215641] hover:bg-[#1a4634] text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-xs active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{isAr ? 'إضافة جهاز جديد' : 'Neues Gerät hinzufügen'}</span>
                    </button>
                  </div>
                ) : (
                  filteredExercises.map((ex) => {
                    const isInActivePlan = activePlanExerciseIds.has(ex.id);
                    const itemMedia = (ex.media && ex.media.length > 0) ? ex.media : (mediaMap[ex.id] || []);
                    const firstMedia = itemMedia.length > 0 ? itemMedia[0] : null;

                    return (
                      <div
                        key={ex.id}
                        className="p-4 rounded-2xl bg-[#fafcfa] border border-[#e2ebe3] hover:border-[#c5d8cb] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {firstMedia && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                setActiveMediaViewer({
                                  name: ex.nameDe,
                                  list: itemMedia,
                                  index: 0,
                                });
                              }}
                              className="w-12 h-12 rounded-xl overflow-hidden relative border border-[#d2e2d7] bg-[#edf5f0] shadow-2xs flex-shrink-0 cursor-pointer active:scale-95 text-start"
                              title={isAr ? 'مشاهدة صورة وفيديو التكنيك' : 'Medien ansehen'}
                            >
                              {firstMedia.type === 'video' ? (
                                <div className="w-full h-full relative bg-black flex items-center justify-center">
                                  <video
                                    src={firstMedia.url}
                                    className="w-full h-full object-cover pointer-events-none"
                                    preload="metadata"
                                    muted
                                    playsInline
                                  />
                                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                    <div className="w-5 h-5 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                                      <Play className="w-2.5 h-2.5 fill-white translate-x-0.5" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={firstMedia.url}
                                  alt={ex.nameDe}
                                  className="w-full h-full object-cover pointer-events-none"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              {itemMedia.length > 1 && (
                                <div className="absolute bottom-0.5 end-0.5 px-1 py-0.2 rounded bg-black/70 text-white text-[8px] font-bold font-mono leading-none">
                                  +{itemMedia.length - 1}
                                </div>
                              )}
                            </button>
                          )}

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-md bg-[#edf4ef] text-[#215641] text-[10px] font-bold">
                                {isAr ? ex.muscleAr : ex.muscleDe}
                              </span>
                              <span className="text-[11px] font-mono text-[#75877d]">
                                {ex.sets} × {ex.reps}
                              </span>
                              {isInActivePlan && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5">
                                  <Check className="w-3 h-3" />
                                  <span>{isAr ? 'في الجدول' : 'Im Plan'}</span>
                                </span>
                              )}
                            </div>

                            <h4 className="font-display font-extrabold text-sm text-[#15221b] truncate">
                              {ex.nameDe}
                            </h4>

                            {ex.alternatives && ex.alternatives.length > 0 && (
                              <p className="text-[11px] text-[#75877d] truncate">
                                <span className="font-semibold">{isAr ? 'البدائل: ' : 'Alt: '}</span>
                                {ex.alternatives.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                          {!isInActivePlan && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('success');
                                onAddExerciseToPlan(ex);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#215641] hover:bg-[#1b4836] text-white text-xs font-bold transition-all flex items-center gap-1 active:scale-95 shadow-2xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isAr ? 'إدراج' : 'Einfügen'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(ex)}
                            className="p-2 rounded-xl text-[#75877d] hover:text-[#215641] hover:bg-[#edf4ef] transition-colors cursor-pointer"
                            title={isAr ? 'تعديل' : 'Bearbeiten'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRequestDeleteExercise(ex)}
                            className="p-2 rounded-xl text-[#95a59c] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title={isAr ? 'حذف' : 'Löschen'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Footer Actions Bar */}
              <div className="p-4 border-t border-[#e2ebe3] bg-[#fafcfa] flex items-center justify-between gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="px-4 py-2.5 rounded-2xl bg-[#215641] hover:bg-[#184232] text-white text-xs font-extrabold flex items-center gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAr ? 'إضافة جهاز جديد' : 'Neues Gerät hinzufügen'}</span>
                </button>

                <div data-library-actions-menu className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setShowActionsMenu(!showActionsMenu);
                    }}
                    className="p-2.5 rounded-2xl border border-[#dbe4dc] bg-white text-[#4f6156] hover:bg-[#f1f6f3] hover:text-[#15221b] transition-colors cursor-pointer"
                    title={isAr ? 'خيارات إضافية' : 'Optionen'}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showActionsMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setShowActionsMenu(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.94, y: 6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.94, y: 6 }}
                          transition={{ duration: 0.14, ease: 'easeOut' }}
                          className={`absolute bottom-full mb-2 ${
                            isAr ? 'left-0' : 'right-0'
                          } z-30 w-60 bg-white rounded-2xl shadow-xl border border-[#dbe6df] py-1.5 overflow-hidden`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setShowActionsMenu(false);
                              handleRequestRestoreDefaults();
                            }}
                            className="w-full px-3.5 py-2.5 text-left rtl:text-right text-xs font-semibold text-[#183a2c] hover:bg-[#f1f7f3] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-[#215641]" />
                            <span>
                              {isAr ? 'استعادة الأجهزة الافتراضية (103)' : '103 Standard-Geräte laden'}
                            </span>
                          </button>

                          <div className="h-px bg-[#eef4f0] my-1 mx-2" />

                          <button
                            type="button"
                            onClick={() => {
                              setShowActionsMenu(false);
                              handleRequestClearLibrary();
                            }}
                            className="w-full px-3.5 py-2.5 text-left rtl:text-right text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>
                              {isAr ? 'تفريغ المكتبة بالكامل' : 'Bibliothek komplett leeren'}
                            </span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          description={confirmState.description}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          type={confirmState.type}
          currentLang={currentLang}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Form Media Preview Lightbox */}
        {formMediaPreviewIndex !== null && formMediaList.length > 0 && (
          <MediaViewerModal
            isOpen={formMediaPreviewIndex !== null}
            onClose={() => setFormMediaPreviewIndex(null)}
            exerciseName={nameDe || (isAr ? 'تمرين جديد' : 'Neue Übung')}
            mediaList={formMediaList}
            initialIndex={formMediaPreviewIndex}
            onDeleteMedia={handleDeleteFormMedia}
            currentLang={currentLang}
          />
        )}

        {/* Library Media Lightbox */}
        {activeMediaViewer && (
          <MediaViewerModal
            isOpen={!!activeMediaViewer}
            onClose={() => setActiveMediaViewer(null)}
            exerciseName={activeMediaViewer.name}
            mediaList={activeMediaViewer.list}
            initialIndex={activeMediaViewer.index}
            currentLang={currentLang}
          />
        )}
      </div>
    </AnimatePresence>
  );
};
