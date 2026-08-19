import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  ChevronDown,
  Info,
  Plus,
  Dumbbell,
  Calendar,
  SlidersHorizontal,
  Trash2,
  Film,
  Image as ImageIcon,
  Play,
} from 'lucide-react';
import { ExerciseItem, Language, WorkoutPlan, ViewTab, ExerciseMediaItem } from '../types';
import { I18N } from '../data/workoutData';
import { WorkoutWidgets } from './WorkoutWidgets';
import { triggerHaptic } from '../utils/haptics';
import { MediaViewerModal } from './MediaViewerModal';
import { getAllExerciseMediaMap } from '../utils/mediaStorage';

interface PlanViewProps {
  exercises: ExerciseItem[];
  completedExercises: Set<number>;
  openPanels: Set<number>;
  currentLang: Language;
  onToggleExercise: (id: number) => void;
  onTogglePanel: (id: number) => void;
  onResetToday?: () => void;
  onNavigateTab?: (tab: ViewTab) => void;
  totalSessions?: number;
  plan?: WorkoutPlan;
  onStartActiveWorkout?: () => void;
  onOpenLibrary?: () => void;
  onOpenEditExercise?: (exercise: ExerciseItem) => void;
  onRemoveExercise?: (id: number) => void;
  onClearPlan?: () => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  exercises,
  completedExercises,
  currentLang,
  onToggleExercise,
  onNavigateTab,
  totalSessions = 1,
  plan,
  onStartActiveWorkout,
  onOpenLibrary,
  onOpenEditExercise,
  onClearPlan,
}) => {
  const t = I18N[currentLang];
  const isAr = currentLang === 'ar';
  const [notesOpen, setNotesOpen] = useState(false);
  const [mediaMap, setMediaMap] = useState<Record<number, ExerciseMediaItem[]>>({});
  const [activeMediaViewer, setActiveMediaViewer] = useState<{
    name: string;
    list: ExerciseMediaItem[];
    index: number;
  } | null>(null);

  useEffect(() => {
    getAllExerciseMediaMap().then((map) => {
      if (map) setMediaMap(map);
    });
  }, [exercises]);

  const completedCount = exercises.filter((e) => completedExercises.has(e.id)).length;

  const selectedDays =
    plan?.trainingDays && plan.trainingDays.length > 0 ? plan.trainingDays : [0, 2, 4];
  const scheduleDaysText = selectedDays.map((d) => t.days[d]).join(' · ');

  const notesList = plan
    ? currentLang === 'de'
      ? plan.notesDe
      : plan.notesAr
    : t.notes;

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Primary Companion Widget */}
      {onNavigateTab && (
        <WorkoutWidgets
          currentLang={currentLang}
          completedCount={completedCount}
          totalExercises={exercises.length}
          currentStreak={Math.max(1, completedCount > 0 ? 3 : 1)}
          totalSessions={totalSessions}
          onNavigateTab={onNavigateTab}
          onStartActiveWorkout={onStartActiveWorkout}
          onOpenLibrary={onOpenLibrary}
        />
      )}

      {/* Schedule Control Bar */}
      <section className="bg-white rounded-3xl border border-[#e2ebe4] p-4 sm:p-4.5 shadow-2xs flex items-center justify-between gap-3 min-w-0">
        {/* Schedule Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#edf5f0] text-[#215641] flex items-center justify-center flex-shrink-0 border border-[#d2e2d7]">
            <Calendar className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-extrabold text-sm sm:text-base text-[#15241c] truncate">
              {scheduleDaysText}
            </h2>
            <span className="text-xs text-[#6e8276] font-medium block truncate mt-0.5">
              {selectedDays.length} {isAr ? 'أيام أسبوعياً' : 'Tage pro Woche'} · {exercises.length} {isAr ? 'أجهزة' : 'Geräte'}
            </span>
          </div>
        </div>

        {/* Cohesive Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onOpenLibrary && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onOpenLibrary();
              }}
              className="px-3.5 py-2 rounded-2xl bg-[#edf5f0] hover:bg-[#e0ece3] text-[#1b4332] font-display font-bold text-xs sm:text-sm transition-all border border-[#d0e0d5] flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>{isAr ? 'تخصيص' : 'Anpassen'}</span>
            </button>
          )}

          {onClearPlan && exercises.length > 0 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('warning');
                onClearPlan();
              }}
              className="px-3 py-2 rounded-2xl bg-[#fafcfa] hover:bg-red-50 text-[#7a8e82] hover:text-red-600 border border-[#dbe6de] hover:border-red-200 transition-all font-display font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
              title={isAr ? 'تفريغ الجدول' : 'Plan leeren'}
              aria-label={isAr ? 'تفريغ الجدول' : 'Plan leeren'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'تفريغ' : 'Leeren'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Exercises List */}
      <section className="space-y-3.5 min-w-0" aria-label="Übungen">
        {exercises.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-[#bad5c2] p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#edf5f0] text-[#215641] mx-auto flex items-center justify-center">
              <Dumbbell className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="font-display font-extrabold text-base sm:text-lg text-[#15241c]">
                {isAr ? 'لا توجد أجهزة في جدولك حالياً' : 'Noch keine Geräte im Plan'}
              </h3>
              <p className="text-xs sm:text-sm text-[#6e8276] leading-relaxed">
                {isAr
                  ? 'اضغط أدناه لتصفح مكتبة الأجهزة وإضافة التمارين التي ترغب بها إلى جدول تمرينك.'
                  : 'Wähle Übungen aus der Bibliothek aus, um deinen individuellen Trainingsplan zusammenzustellen.'}
              </p>
            </div>
            {onOpenLibrary && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onOpenLibrary();
                }}
                className="px-6 py-3 rounded-2xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-sm inline-flex items-center gap-2 shadow-xs active:scale-95 transition-all"
              >
                <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
                <span>{isAr ? 'إضافة أجهزة من المكتبة' : 'Geräte aus Bibliothek hinzufügen'}</span>
              </button>
            )}
          </div>
        ) : (
          exercises.map((item, index) => {
            const isDone = completedExercises.has(item.id);
            const itemMedia = (item.media && item.media.length > 0) ? item.media : (mediaMap[item.id] || []);
            const firstMedia = itemMedia.length > 0 ? itemMedia[0] : null;

            return (
              <article
                key={item.id}
                className={`group rounded-3xl border transition-all duration-200 p-4 sm:p-5 min-w-0 ${
                  isDone
                    ? 'bg-[#f4f9f6] border-[#bad5c2] shadow-2xs'
                    : 'bg-white border-[#e2ece5] hover:border-[#c5dbce] shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                  {/* Thumbnail Cover or Sequence Number */}
                  {firstMedia ? (
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setActiveMediaViewer({
                            name: item.nameDe,
                            list: itemMedia,
                            index: 0,
                          });
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden relative border border-[#cbe3d3] bg-[#edf5f0] shadow-2xs block group-hover:border-[#96c4a8] transition-all cursor-pointer active:scale-95 text-start"
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
                              <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                                <Play className="w-3 h-3 fill-white translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={firstMedia.url}
                            alt={item.nameDe}
                            className="w-full h-full object-cover pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        )}

                        {/* Multiple Media Count Badge */}
                        {itemMedia.length > 1 && (
                          <div className="absolute bottom-1 end-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold font-mono leading-none">
                            +{itemMedia.length - 1}
                          </div>
                        )}

                        {/* Completion Dark Overlay */}
                        {isDone && (
                          <div className="absolute inset-0 bg-[#215641]/80 backdrop-blur-[1px] flex items-center justify-center text-white animate-in fade-in duration-200">
                            <Check className="w-6 h-6 stroke-[3]" />
                          </div>
                        )}
                      </button>

                      {/* Quick Done/Undone Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('selection');
                          onToggleExercise(item.id);
                        }}
                        aria-label={isDone ? (isAr ? 'إلغاء الإكمال' : 'Als unvollständig markieren') : (isAr ? 'تحديد كمكتمل' : 'Als erledigt markieren')}
                        className={`absolute -top-1.5 -start-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-xs z-10 cursor-pointer ${
                          isDone
                            ? 'bg-[#215641] text-white ring-2 ring-white scale-100'
                            : 'bg-white text-[#6b8274] hover:text-[#215641] hover:bg-[#edf5f0] border border-[#cbe0d3] scale-90 sm:scale-75 group-hover:scale-100 hover:scale-105'
                        }`}
                        title={isDone ? (isAr ? 'مكتمل (انقر للإلغاء)' : 'Erledigt') : (isAr ? 'تحديد كمكتمل' : 'Als erledigt markieren')}
                      >
                        <Check className={`w-3.5 h-3.5 stroke-[3] ${isDone ? 'text-white' : 'text-[#75877d]'}`} />
                      </button>
                    </div>
                  ) : (
                    /* Fallback: Sequence & Completion Button */
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        onToggleExercise(item.id);
                      }}
                      aria-label={`Übung ${index + 1} abschließen`}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-display font-black text-sm sm:text-base transition-all flex-shrink-0 active:scale-90 cursor-pointer ${
                        isDone
                          ? 'bg-[#215641] text-white shadow-xs'
                          : 'bg-[#edf5f0] text-[#215641] hover:bg-[#e2ede6] border border-[#d2e2d7]'
                      }`}
                    >
                      {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : index + 1}
                    </button>
                  )}

                  {/* Title & Muscle Label (Tap to Edit) */}
                  <div
                    onClick={() => onOpenEditExercise && onOpenEditExercise(item)}
                    className="flex-1 min-w-0 cursor-pointer py-0.5"
                  >
                    <h3
                      className={`font-display font-extrabold text-base sm:text-lg leading-snug truncate transition-colors ${
                        isDone
                          ? 'text-[#4e6b5c] line-through decoration-[#86b59b]'
                          : 'text-[#15241c] group-hover:text-[#215641]'
                      }`}
                    >
                      {item.nameDe}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-[#5a7364] truncate mt-0.5">
                      {isAr ? item.muscleAr : item.muscleDe}
                    </p>
                  </div>

                  {/* Sets × Reps Pill (Tap to Edit) */}
                  <button
                    type="button"
                    onClick={() => onOpenEditExercise && onOpenEditExercise(item)}
                    className="px-3.5 sm:px-4 py-2 rounded-2xl bg-[#edf5f0] hover:bg-[#e2ede6] border border-[#d2e2d7] text-[#173e2d] font-display font-black text-xs sm:text-sm transition-all active:scale-95 flex-shrink-0 cursor-pointer"
                    title={isAr ? 'تعديل أو استبدال الجهاز' : 'Übung bearbeiten'}
                  >
                    <span>{item.sets} × {item.reps}</span>
                  </button>
                </div>
              </article>
            );
          })
        )}

        {/* Add Exercise Button */}
        {onOpenLibrary && exercises.length > 0 && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onOpenLibrary();
            }}
            className="w-full py-4 px-5 rounded-3xl border-2 border-dashed border-[#bad5c2] hover:border-[#215641] bg-[#f9fcfa] hover:bg-[#edf5f0] text-[#215641] font-display font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-2xs"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>{isAr ? 'إضافة جهاز أو تمرين من المكتبة' : 'Übung aus Bibliothek hinzufügen'}</span>
          </button>
        )}
      </section>

      {/* Important Notes Section */}
      <section className="bg-white rounded-3xl border border-[#e2ebe4] overflow-hidden shadow-xs min-w-0">
        <button
          type="button"
          onClick={() => setNotesOpen(!notesOpen)}
          className="w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-[#fafcfa] transition-colors min-w-0"
        >
          <div className="flex items-center gap-2.5 text-[#215641] min-w-0">
            <Info className="w-4.5 h-4.5 flex-shrink-0 stroke-[2.2]" />
            <h3 className="font-display font-extrabold text-sm sm:text-base text-[#15241c] truncate">
              {t.notesTitle}
            </h3>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#75877d] transition-transform duration-200 flex-shrink-0 ${
              notesOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {notesOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="px-4.5 pb-4.5 pt-1 border-t border-[#edf4ee] space-y-2 overflow-hidden min-w-0"
            >
              <ul className="space-y-2 min-w-0">
                {notesList.map((note, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-[#4f6156] leading-relaxed min-w-0"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#215641] flex-shrink-0" />
                    <span className="break-words">{note}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Global Media Lightbox / Video Player Modal */}
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
  );
};
