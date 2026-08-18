import React, { useState } from 'react';
import { Check, ChevronDown, Info, RotateCcw, Edit2, Plus, Dumbbell } from 'lucide-react';
import { ExerciseItem, Language, WorkoutPlan, ViewTab } from '../types';
import { I18N } from '../data/workoutData';
import { WorkoutWidgets } from './WorkoutWidgets';
import { triggerHaptic } from '../utils/haptics';

interface PlanViewProps {
  exercises: ExerciseItem[];
  completedExercises: Set<number>;
  openPanels: Set<number>;
  currentLang: Language;
  onToggleExercise: (id: number) => void;
  onTogglePanel: (id: number) => void;
  onResetToday: () => void;
  onNavigateTab?: (tab: ViewTab) => void;
  totalSessions?: number;
  plan?: WorkoutPlan;
  onStartActiveWorkout?: () => void;
  onOpenLibrary?: () => void;
  onOpenEditExercise?: (exercise: ExerciseItem) => void;
}

export const PlanView: React.FC<PlanViewProps> = ({
  exercises,
  completedExercises,
  openPanels,
  currentLang,
  onToggleExercise,
  onTogglePanel,
  onResetToday,
  onNavigateTab,
  totalSessions = 1,
  plan,
  onStartActiveWorkout,
  onOpenLibrary,
  onOpenEditExercise,
}) => {
  const t = I18N[currentLang];
  const isAr = currentLang === 'ar';
  const [notesOpen, setNotesOpen] = useState(false);

  const completedCount = exercises.filter((e) => completedExercises.has(e.id)).length;
  const progressPercent = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  const scheduleDaysText = plan 
    ? (currentLang === 'de' ? plan.scheduleDaysDe : plan.scheduleDaysAr)
    : t.scheduleDays;

  const scheduleSubText = plan
    ? (currentLang === 'de' ? plan.frequencyDe : plan.frequencyAr)
    : t.scheduleSub;

  const notesList = plan
    ? (currentLang === 'de' ? plan.notesDe : plan.notesAr)
    : t.notes;

  return (
    <div className="w-full max-w-full min-w-0 space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Interactive Companion Widgets */}
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

      {/* Schedule Hero Card */}
      <section className="bg-white rounded-2xl border border-[#dbe4dc] p-4 sm:p-5 shadow-xs min-w-0">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#e2ebe3] min-w-0">
          <div className="min-w-0">
            <h2 className="font-display font-black text-sm sm:text-lg text-[#15221b] tracking-tight truncate">
              {scheduleDaysText}
            </h2>
            <span className="text-[11px] sm:text-xs font-semibold text-[#215641] block truncate">
              {scheduleSubText}
            </span>
          </div>

          {onOpenLibrary && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onOpenLibrary();
              }}
              className="text-xs font-bold text-[#215641] hover:underline flex items-center gap-1 flex-shrink-0"
            >
              <span>{isAr ? 'تخصيص الخطة' : 'Plan anpassen'}</span>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="pt-3 space-y-1.5 min-w-0">
          <div className="flex items-center justify-between text-xs min-w-0">
            <span className="font-medium text-[#4f6156] truncate">{t.progressLabel}</span>
            <span className="font-display font-bold text-[#215641] flex-shrink-0">
              {completedCount} / {exercises.length} {t.progressDoneText} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#edf4ef] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#215641] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Exercises List */}
      <section className="space-y-3 min-w-0" aria-label="Übungen">
        {exercises.map((item, index) => {
          const isDone = completedExercises.has(item.id);
          const isOpen = openPanels.has(item.id);

          return (
            <article
              key={item.id}
              className={`rounded-2xl border transition-all duration-200 p-3.5 sm:p-4 min-w-0 ${
                isDone
                  ? 'bg-[#f1f6f3] border-[#bad3c3]'
                  : 'bg-white border-[#dbe4dc] hover:border-[#c4d6c8]'
              } shadow-xs`}
            >
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                {/* Number & Completion Button */}
                <button
                  type="button"
                  onClick={() => onToggleExercise(item.id)}
                  aria-label={`Übung ${index + 1} abschließen`}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-display font-black text-sm transition-all flex-shrink-0 active:scale-95 ${
                    isDone
                      ? 'bg-[#215641] text-white shadow-xs'
                      : 'bg-[#e6f1eb] text-[#215641] hover:bg-[#d6e8de]'
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5 stroke-[2.8]" /> : index + 1}
                </button>

                {/* Details (Click to edit) */}
                <div
                  onClick={() => onOpenEditExercise && onOpenEditExercise(item)}
                  className="flex-1 min-w-0 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#edf4ef] text-[#1b4b38] text-[11px] font-semibold">
                      {currentLang === 'de' ? item.muscleDe : item.muscleAr}
                    </span>
                    {onOpenEditExercise && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#75877d] flex items-center gap-0.5">
                        <Edit2 className="w-2.5 h-2.5" />
                        <span>{isAr ? 'تعديل' : 'Bearbeiten'}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-xs sm:text-base text-[#15221b] group-hover:text-[#215641] transition-colors mt-1 leading-snug break-words">
                    {item.nameDe}
                  </h3>
                </div>

                {/* Sets & Reps Capsule */}
                <button
                  type="button"
                  onClick={() => onOpenEditExercise && onOpenEditExercise(item)}
                  className="flex flex-col items-end text-right flex-shrink-0 bg-[#eef4f0] hover:bg-[#e4ede6] px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-[#e2ebe3] transition-colors cursor-pointer"
                  title={isAr ? 'تعديل المجموعات والتكرارات' : 'Sätze & Wdh. anpassen'}
                >
                  <span className="font-display font-black text-xs sm:text-sm text-[#15221b] whitespace-nowrap">
                    {item.sets} × {item.reps}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-medium text-[#75877d] whitespace-nowrap">
                    {t.capsuleLabel}
                  </span>
                </button>
              </div>

              {/* Alternatives Accordion */}
              {item.alternatives && item.alternatives.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#e2ebe3]/70 min-w-0">
                  <button
                    type="button"
                    onClick={() => onTogglePanel(item.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#215641] hover:underline"
                  >
                    <span>{isOpen ? t.altHide : t.altShow}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="mt-2 p-3 bg-[#f8faf8] rounded-xl border border-[#e3ede5] space-y-1.5 animate-in fade-in zoom-in-98 duration-150 min-w-0">
                      <div className="text-[11px] font-bold text-[#75877d] uppercase tracking-wider">
                        {t.altHeader}
                      </div>
                      <ul className="space-y-1 min-w-0">
                        {item.alternatives.map((alt, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-xs text-[#15221b] font-medium min-w-0"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#215641] flex-shrink-0" />
                            <span className="break-words">{alt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {/* Add Exercise from Library Shortcut */}
        {onOpenLibrary && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onOpenLibrary();
            }}
            className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-[#bad3c3] hover:border-[#215641] bg-[#f8faf8] hover:bg-[#edf4ef] text-[#215641] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة جهاز أو تمرين من المكتبة إلى الجدول' : 'Übung aus Bibliothek hinzufügen'}</span>
          </button>
        )}
      </section>

      {/* Important Notes Section */}
      <section className="bg-white rounded-2xl border border-[#dbe4dc] overflow-hidden shadow-xs min-w-0">
        <button
          type="button"
          onClick={() => setNotesOpen(!notesOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-[#f8faf8] transition-colors min-w-0"
        >
          <div className="flex items-center gap-2 text-[#215641] min-w-0">
            <Info className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-display font-bold text-sm sm:text-base text-[#15221b] truncate">
              {t.notesTitle}
            </h3>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#75877d] transition-transform duration-200 flex-shrink-0 ${
              notesOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {notesOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-[#e2ebe3] space-y-2.5 animate-in fade-in duration-150 min-w-0">
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
          </div>
        )}
      </section>
    </div>
  );
};
