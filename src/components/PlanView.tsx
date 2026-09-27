import React, { useState, useEffect } from 'react';
import {
  Check,
  Plus,
  Dumbbell,
  SlidersHorizontal,
  Play,
  Coffee,
  Link2,
  Sparkles,
} from 'lucide-react';
import { ExerciseItem, Language, WorkoutPlan, ViewTab, ExerciseMediaItem, DayIndex } from '../types';
import { I18N } from '../data/workoutData';
import { WorkoutWidgets } from './WorkoutWidgets';
import { triggerHaptic } from '../utils/haptics';
import { MediaViewerModal } from './MediaViewerModal';
import { VideoThumbnail } from './VideoThumbnail';
import { getAllExerciseMediaMap, getExerciseMediaList } from '../utils/mediaStorage';
import {
  DAYS_NAMES_AR,
  DAYS_NAMES_DE,
  DAYS_SHORT_AR,
  DAYS_SHORT_DE,
  getExercisesForDay,
  isDayRestDay,
  getLinkedDay,
  getTodayDayIndex,
} from '../utils/scheduleManager';
import { DayScheduleModal } from './DayScheduleModal';

interface PlanViewProps {
  exercises: ExerciseItem[];
  completedExercises: Set<number>;
  openPanels: Set<number>;
  currentLang: Language;
  selectedDayIndex: DayIndex;
  onSelectDayIndex: (day: DayIndex) => void;
  onToggleExercise: (id: number) => void;
  onTogglePanel: (id: number) => void;
  onResetToday?: () => void;
  onNavigateTab?: (tab: ViewTab) => void;
  totalSessions?: number;
  plan: WorkoutPlan;
  onUpdatePlan: (plan: WorkoutPlan) => void;
  onStartActiveWorkout?: () => void;
  onOpenAddExercise?: () => void;
  onOpenEditExercise?: (exercise: ExerciseItem) => void;
  onRemoveExercise?: (id: number) => void;
  onClearPlan?: () => void;
  showToast: (msg: string) => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  exercises,
  completedExercises,
  currentLang,
  selectedDayIndex,
  onSelectDayIndex,
  onToggleExercise,
  onNavigateTab,
  totalSessions = 1,
  plan,
  onUpdatePlan,
  onStartActiveWorkout,
  onOpenAddExercise,
  onOpenEditExercise,
  onClearPlan,
  showToast,
}) => {
  const t = I18N[currentLang];
  const isAr = currentLang === 'ar';
  const todayIndex = getTodayDayIndex();

  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
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

  const handleOpenExerciseMedia = async (item: ExerciseItem, currentMedia: ExerciseMediaItem[]) => {
    triggerHaptic('light');

    // Always fetch fresh, active object URLs from IndexedDB to ensure video plays reliably
    try {
      const freshStored = await getExerciseMediaList(item.id);
      if (freshStored && freshStored.length > 0) {
        setMediaMap((prev) => ({ ...prev, [item.id]: freshStored }));
        setActiveMediaViewer({
          name: item.nameDe,
          list: freshStored,
          index: 0,
        });
        return;
      }
    } catch {
      // fallback
    }

    const listToUse = currentMedia.length > 0 ? currentMedia : (item.media || []);
    if (listToUse.length > 0) {
      setActiveMediaViewer({
        name: item.nameDe,
        list: listToUse,
        index: 0,
      });
    }
  };

  const completedCount = exercises.filter((e) => completedExercises.has(e.id)).length;
  const isRest = isDayRestDay(plan, selectedDayIndex);
  const linkedTo = getLinkedDay(plan, selectedDayIndex);
  const currentDayName = isAr ? DAYS_NAMES_AR[selectedDayIndex] : DAYS_NAMES_DE[selectedDayIndex];

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 sm:space-y-7 animate-in fade-in duration-200">
      {/* Primary Companion Widget */}
      {onNavigateTab && exercises.length > 0 && (
        <WorkoutWidgets
          currentLang={currentLang}
          completedCount={completedCount}
          totalExercises={exercises.length}
          currentStreak={Math.max(1, completedCount > 0 ? 3 : 1)}
          totalSessions={totalSessions}
          onNavigateTab={onNavigateTab}
          onStartActiveWorkout={onStartActiveWorkout}
        />
      )}

      {/* Unified Weekly Schedule & Day Hub (شريط وجدول الأيام بتصميم مريح وغير مزدحم) */}
      <section
        className="bg-white rounded-3xl border border-[#e4ede7] p-4 sm:p-5 shadow-[0_2px_12px_rgba(20,40,30,0.03)] space-y-4"
        aria-label="Wochenübersicht"
      >
        {/* Day Header Row with Single Options Control */}
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#edf4ee] min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                isRest
                  ? 'bg-[#faf3eb] text-[#a06828] border-[#ebdccb]'
                  : 'bg-[#edf5f0] text-[#215641] border-[#d2e2d7]'
              }`}
            >
              {isRest ? <Coffee className="w-5 h-5 stroke-[2.2]" /> : <Dumbbell className="w-5 h-5 stroke-[2.2]" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-base sm:text-lg text-[#15241c] truncate">
                  {isAr ? `جدول ${currentDayName}` : currentDayName}
                </h2>
                {selectedDayIndex === todayIndex && (
                  <span className="px-2 py-0.5 rounded-md bg-[#edf5f0] text-[#215641] text-[10px] font-bold border border-[#bad5c2] flex-shrink-0">
                    {isAr ? 'اليوم' : 'Heute'}
                  </span>
                )}
              </div>

              <p className="text-xs text-[#6e8276] truncate mt-0.5">
                {isRest ? (
                  isAr ? 'يوم استشفاء وراحة عضلية' : 'Ruhetag & Regeneration'
                ) : linkedTo !== null ? (
                  <span className="inline-flex items-center gap-1 text-[#215641] font-semibold">
                    <Link2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {isAr ? `متطابق مع ${DAYS_NAMES_AR[linkedTo]}` : `Gleich wie ${DAYS_NAMES_DE[linkedTo]}`}
                    </span>
                  </span>
                ) : (
                  <span>
                    {exercises.length} {isAr ? 'أجهزة مخصصة لهذا اليوم' : 'Übungen eingetragen'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Single Day Options Control */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setIsDayModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#edf5f0] hover:bg-[#e2ede5] text-[#215641] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#bad5c2]/70 cursor-pointer active:scale-95"
              title={isAr ? 'خيارات وتخصيص جدول اليوم' : 'Tages-Einstellungen'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isAr ? 'خيارات اليوم' : 'Optionen'}</span>
            </button>
          </div>
        </div>

        {/* 7 Days Selector Strip (Clean, calm indicator for today with NO distracting yellow dot) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => {
            const dayIdx = d as DayIndex;
            const isSelected = selectedDayIndex === dayIdx;
            const isToday = todayIndex === dayIdx;
            const dayRest = isDayRestDay(plan, dayIdx);
            const dayExs = getExercisesForDay(plan, dayIdx);
            const shortName = isAr ? DAYS_SHORT_AR[dayIdx] : DAYS_SHORT_DE[dayIdx];

            return (
              <button
                key={dayIdx}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectDayIndex(dayIdx);
                }}
                className={`py-2 sm:py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                  isSelected
                    ? 'bg-[#215641] text-white shadow-sm ring-1 ring-[#215641] scale-[1.02]'
                    : isToday
                    ? 'bg-[#edf6f1] text-[#1b4332] border-2 border-[#72a687] hover:bg-[#e2ede6]'
                    : dayRest
                    ? 'bg-[#f7faf8] text-[#86998e] hover:bg-[#edf4ef] border border-transparent'
                    : 'bg-[#fafcfa] text-[#2c4235] hover:bg-[#edf5f0] border border-[#e2ebe4]'
                }`}
              >
                {/* Short Day Name */}
                <span className="font-display font-black text-xs sm:text-sm leading-none">
                  {shortName}
                </span>

                {/* Sub-label: Exercise count or Rest icon */}
                <div className="mt-1 flex items-center justify-center">
                  {dayRest ? (
                    <Coffee className={`w-3 h-3 ${isSelected ? 'text-emerald-200' : 'text-[#9cb0a4]'}`} />
                  ) : (
                    <span
                      className={`text-[10px] font-mono font-bold leading-none ${
                        isSelected ? 'text-emerald-200' : 'text-[#4f6156]'
                      }`}
                    >
                      {dayExs.length}
                    </span>
                  )}
                </div>

                {/* Subtle, calm today label (replaces the harsh yellow dot) */}
                {isToday && (
                  <span
                    className={`text-[8px] font-black leading-none mt-1 ${
                      isSelected ? 'text-emerald-200' : 'text-[#215641]'
                    }`}
                  >
                    {isAr ? 'اليوم' : 'Heute'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Exercises List OR Rest Day State */}
      <section className="space-y-4 min-w-0" aria-label="Übungen">
        {isRest ? (
          /* Rest Day Card (يوم راحة مريح وهادئ) */
          <div className="bg-white rounded-3xl border border-[#e8efe9] p-7 sm:p-10 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#faf3eb] text-[#a06828] mx-auto flex items-center justify-center border border-[#ebdccb]">
              <Coffee className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="font-display font-extrabold text-base sm:text-lg text-[#15241c]">
                {isAr ? `يوم ${currentDayName} هو يوم راحة واستشفاء` : `${currentDayName} ist ein Ruhetag`}
              </h3>
              <p className="text-xs sm:text-sm text-[#6e8276] leading-relaxed">
                {isAr
                  ? 'الاستشفاء والنوم الكافي والتغذية السليمة هي الركائز الأساسية لنمو العضلات وتجديد الطاقة للجلسات القادمة.'
                  : 'Ausreichend Schlaf und Erholung sind entscheidend für Muskelaufbau und Regeneration.'}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setIsDayModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-[#edf5f0] hover:bg-[#e0ece3] text-[#1b4332] font-display font-bold text-xs sm:text-sm inline-flex items-center gap-2 border border-[#bad5c2] shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{isAr ? 'تغيير إلى يوم تدريب' : 'Zu Trainingstag ändern'}</span>
              </button>
            </div>
          </div>
        ) : exercises.length === 0 ? (
          /* Empty Training Day Card */
          <div className="bg-white rounded-3xl border border-dashed border-[#bad5c2] p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#edf5f0] text-[#215641] mx-auto flex items-center justify-center">
              <Dumbbell className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="font-display font-extrabold text-base sm:text-lg text-[#15241c]">
                {isAr ? `لا توجد أجهزة في جدول ${currentDayName}` : `Noch keine Geräte für ${currentDayName}`}
              </h3>
              <p className="text-xs sm:text-sm text-[#6e8276] leading-relaxed">
                {isAr
                  ? 'أضف أجهزتك وتمارينك يدويًا لهذا اليوم، أو انسخها من يوم تدريبي آخر.'
                  : 'Füge deine Übungen manuell hinzu oder übernimm sie von einem anderen Tag.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {onOpenAddExercise && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    onOpenAddExercise();
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-[#215641] hover:bg-[#184232] text-white font-display font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAr ? 'إضافة جهاز / تمرين' : 'Übung hinzufügen'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setIsDayModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-[#edf5f0] hover:bg-[#e0ece3] text-[#1b4332] font-display font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 border border-[#bad5c2] active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'نسخ أو ربط من يوم آخر' : 'Von anderem Tag kopieren'}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {linkedTo !== null && (
              <div className="p-3 px-4 rounded-2xl bg-[#edf5f0] border border-[#bad5c2] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#1b4332] font-semibold min-w-0">
                  <Link2 className="w-3.5 h-3.5 text-[#215641] flex-shrink-0" />
                  <span className="truncate">
                    {isAr
                      ? `هذا الجدول متطابق تلقائياً مع يوم (${DAYS_NAMES_AR[linkedTo]})`
                      : `Dieser Tag ist mit (${DAYS_NAMES_DE[linkedTo]}) verknüpft`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDayModalOpen(true)}
                  className="text-xs font-bold text-[#215641] hover:underline flex-shrink-0 cursor-pointer"
                >
                  {isAr ? 'تعديل الربط' : 'Bearbeiten'}
                </button>
              </div>
            )}
            {exercises.map((item, index) => {
            const isDone = completedExercises.has(item.id);
            const itemMedia = (mediaMap[item.id] && mediaMap[item.id].length > 0)
              ? mediaMap[item.id]
              : (item.media || []);
            const firstMedia = itemMedia.length > 0 ? itemMedia[0] : null;

            return (
              <article
                key={item.id}
                className={`group rounded-2xl border transition-all duration-150 p-3.5 sm:p-4 min-w-0 ${
                  isDone
                    ? 'bg-[#f4f8f5] border-[#c0dac8]'
                    : 'bg-white border-[#e2ece5] hover:border-[#bad3c3]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Clean Accessible Completion Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('selection');
                      onToggleExercise(item.id);
                    }}
                    aria-label={isDone ? (isAr ? 'إلغاء الإكمال' : 'Als unvollständig markieren') : (isAr ? 'تحديد كمكتمل' : 'Als erledigt markieren')}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                      isDone
                        ? 'bg-[#215641] text-white'
                        : 'border-2 border-[#bad3c3] hover:border-[#215641] bg-white text-transparent'
                    }`}
                    title={isDone ? (isAr ? 'مكتمل' : 'Erledigt') : (isAr ? 'تحديد كمكتمل' : 'Als erledigt markieren')}
                  >
                    <Check className={`w-4 h-4 stroke-[3] ${isDone ? 'opacity-100' : 'opacity-0'}`} />
                  </button>

                  {/* Optional Media Thumbnail */}
                  {firstMedia && (
                    <button
                      type="button"
                      onClick={() => handleOpenExerciseMedia(item, itemMedia)}
                      className="w-12 h-12 rounded-xl overflow-hidden relative border border-[#cbe3d3] bg-[#edf5f0] flex-shrink-0 cursor-pointer active:scale-95 text-start"
                      title={isAr ? 'مشاهدة صورة وفيديو التكنيك' : 'Medien ansehen'}
                    >
                      {firstMedia.type === 'video' ? (
                        <div className="w-full h-full relative bg-black flex items-center justify-center">
                          <VideoThumbnail
                            src={firstMedia.url}
                            alt={item.nameDe}
                            className="w-full h-full object-cover pointer-events-none"
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
                          alt={item.nameDe}
                          className="w-full h-full object-cover pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </button>
                  )}

                  {/* Title & Muscle Label (Tap to Edit) */}
                  <div
                    onClick={() => onOpenEditExercise && onOpenEditExercise(item)}
                    className="flex-1 min-w-0 cursor-pointer py-0.5"
                  >
                    <h3
                      className={`font-display font-bold text-sm sm:text-base leading-snug truncate transition-colors ${
                        isDone
                          ? 'text-[#5a7364] line-through decoration-[#86b59b]'
                          : 'text-[#15241c] hover:text-[#215641]'
                      }`}
                    >
                      {item.nameDe}
                    </h3>
                    <p className="text-xs text-[#6e8276] truncate mt-0.5">
                      {isAr ? item.muscleAr : item.muscleDe}
                    </p>
                  </div>

                  {/* Sets × Reps Metadata (Tap to Edit) */}
                  <div
                    onClick={() => onOpenEditExercise && onOpenEditExercise(item)}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#edf5f0] text-[#1b4332] font-display font-bold text-xs sm:text-sm flex-shrink-0 cursor-pointer hover:bg-[#e0ece3] transition-colors"
                    title={isAr ? 'تعديل الجهاز' : 'Bearbeiten'}
                  >
                    <span>{item.sets} × {item.reps}</span>
                  </div>
                </div>
              </article>
            );
          })}
          </>
        )}

        {/* Add Exercise Button */}
        {!isRest && onOpenAddExercise && exercises.length > 0 && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onOpenAddExercise();
            }}
            className="w-full py-4 px-5 rounded-3xl border-2 border-dashed border-[#bad5c2] hover:border-[#215641] bg-[#f9fcfa] hover:bg-[#edf5f0] text-[#215641] font-display font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-2xs cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>
              {isAr
                ? `إضافة جهاز إلى جدول ${currentDayName}`
                : `Übung zu ${currentDayName} hinzufügen`}
            </span>
          </button>
        )}
      </section>

      {/* Day Customization Modal (نسخ / ربط / تغيير نوع اليوم) */}
      <DayScheduleModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        dayIndex={selectedDayIndex}
        plan={plan}
        currentLang={currentLang}
        onUpdatePlan={onUpdatePlan}
        onClearExercises={onClearPlan}
        showToast={showToast}
      />

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
