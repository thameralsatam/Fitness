import React, { useState } from 'react';
import { Check, ChevronDown, Info, RotateCcw } from 'lucide-react';
import { ExerciseItem, Language } from '../types';
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
  onNavigateTab?: (tab: 'plan' | 'timer' | 'audio' | 'stats' | 'tools') => void;
  totalSessions?: number;
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
}) => {
  const t = I18N[currentLang];
  const [notesOpen, setNotesOpen] = useState(false);

  const completedCount = exercises.filter((e) => completedExercises.has(e.id)).length;
  const progressPercent = Math.round((completedCount / exercises.length) * 100);

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
        />
      )}

      {/* Schedule Hero Card */}
      <section className="bg-white rounded-2xl border border-[#dbe4dc] p-4 sm:p-5 shadow-xs min-w-0">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#e2ebe3] min-w-0">
          <div className="min-w-0">
            <h2 className="font-display font-black text-sm sm:text-lg text-[#15221b] tracking-tight truncate">
              {t.scheduleDays}
            </h2>
            <span className="text-[11px] sm:text-xs font-semibold text-[#215641] block truncate">
              {t.scheduleSub}
            </span>
          </div>

          <button
            type="button"
            onClick={onResetToday}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-[#75877d] hover:text-[#15221b] hover:bg-[#eef4f0] transition-colors flex-shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{t.progressReset}</span>
          </button>
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
        {exercises.map((item) => {
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
                  aria-label={`Übung ${item.id} abschließen`}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-display font-black text-sm transition-all flex-shrink-0 active:scale-95 ${
                    isDone
                      ? 'bg-[#215641] text-white shadow-xs'
                      : 'bg-[#e6f1eb] text-[#215641] hover:bg-[#d6e8de]'
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5 stroke-[2.8]" /> : item.id}
                </button>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#edf4ef] text-[#1b4b38] text-[11px] font-semibold">
                      {currentLang === 'de' ? item.muscleDe : item.muscleAr}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-xs sm:text-base text-[#15221b] mt-1 leading-snug break-words">
                    {item.nameDe}
                  </h3>
                </div>

                {/* Sets & Reps Capsule */}
                <div className="flex flex-col items-end text-right flex-shrink-0 bg-[#eef4f0] px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-[#e2ebe3]">
                  <span className="font-display font-black text-xs sm:text-sm text-[#15221b] whitespace-nowrap">
                    {item.sets} × {item.reps}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-medium text-[#75877d] whitespace-nowrap">
                    {t.capsuleLabel}
                  </span>
                </div>
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
              {t.notes.map((note, idx) => (
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
