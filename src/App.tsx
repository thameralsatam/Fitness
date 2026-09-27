import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewTab, Language, WorkoutPlan, ExerciseItem, DayIndex } from './types';
import { DEFAULT_WORKOUT_PLAN, I18N } from './data/workoutData';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PlanView } from './components/PlanView';
import { TimerView } from './components/TimerView';
import { ConfirmModal } from './components/ConfirmModal';
import { SplashScreen } from './components/SplashScreen';
import { AudioProvider } from './context/AudioContext';
import { TimerProvider } from './context/TimerContext';
import { ModernAudioMiniBar } from './components/ModernAudioMiniBar';
import { triggerHaptic } from './utils/haptics';
import { initializeCustomFonts } from './utils/customFonts';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Lazy-loaded secondary views and heavy modals for instant cold start
const AudioView = lazy(() => import('./components/AudioView').then((m) => ({ default: m.AudioView })));
const ProfileView = lazy(() => import('./components/ProfileView').then((m) => ({ default: m.ProfileView })));

const ActiveWorkoutModal = lazy(() => import('./components/ActiveWorkoutModal').then((m) => ({ default: m.ActiveWorkoutModal })));
const AddExerciseModal = lazy(() => import('./components/AddExerciseModal').then((m) => ({ default: m.AddExerciseModal })));
const ExerciseEditModal = lazy(() => import('./components/ExerciseEditModal').then((m) => ({ default: m.ExerciseEditModal })));
const PlanShareModal = lazy(() => import('./components/PlanShareModal').then((m) => ({ default: m.PlanShareModal })));
const FontSettingsModal = lazy(() => import('./components/FontSettingsModal').then((m) => ({ default: m.FontSettingsModal })));
import {
  getStoredActivePlan,
  saveActivePlan,
  hardResetApp,
} from './utils/libraryManager';
import {
  getTodayDayIndex,
  getExercisesForDay,
  isDayRestDay,
  addExerciseToDay,
  updateExerciseOnDay,
  removeExerciseFromDay,
  clearDayExercises,
  getScheduleSubtitle,
  DAYS_NAMES_AR,
  DAYS_NAMES_DE,
} from './utils/scheduleManager';

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  type: 'reset' | 'delete' | 'danger';
  onConfirm: () => void;
}

export default function App() {
  const [activePlan, setActivePlan] = useState<WorkoutPlan>(() => {
    return getStoredActivePlan();
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState<DayIndex>(() => {
    return getTodayDayIndex();
  });

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      const hasShown = sessionStorage.getItem('gym_splash_shown');
      return !hasShown;
    } catch {
      return true;
    }
  });

  const [currentLang, setCurrentLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('gym_lang');
      if (saved === 'ar' || saved === 'de') return saved;
    } catch {
      // fallback
    }
    return 'ar';
  });

  const [titleFont, setTitleFont] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('gym_font_display');
      if (saved) return saved;
    } catch {
      // fallback
    }
    return "'Thmanyah Sans', system-ui, -apple-system, sans-serif";
  });

  const [bodyFont, setBodyFont] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('gym_font_body');
      if (saved) return saved;
    } catch {
      // fallback
    }
    return "'Thmanyah Sans', system-ui, -apple-system, sans-serif";
  });

  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);
  const [isPlanShareModalOpen, setIsPlanShareModalOpen] = useState<boolean>(false);
  const [isActiveWorkoutOpen, setIsActiveWorkoutOpen] = useState<boolean>(false);
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState<boolean>(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);

  const [currentTab, setCurrentTab] = useState<ViewTab>('plan');

  const [completedExercises, setCompletedExercises] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('gym_completed');
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // fallback
    }
    return new Set();
  });

  const [openPanels, setOpenPanels] = useState<Set<number>>(new Set());

  const [totalSessions, setTotalSessions] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gym_sessions');
      if (saved) return parseInt(saved, 10) || 1;
    } catch {
      // fallback
    }
    return 1;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: '',
    cancelText: '',
    type: 'reset',
    onConfirm: () => {},
  });

  const t = I18N[currentLang];

  // Restore custom fonts & hide mobile native status bar for full screen mode on app boot
  useEffect(() => {
    initializeCustomFonts();
    const enableFullScreenMode = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.hide();
          await StatusBar.setOverlaysWebView({ overlay: true });
        } catch {
          // Fallback
        }
      }
    };
    enableFullScreenMode();
  }, []);

  // Sync language attribute to html document
  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('gym_lang', currentLang);
    } catch {
      // fallback
    }
  }, [currentLang]);

  // Apply selected fonts to CSS Custom Properties in real time
  useEffect(() => {
    try {
      document.documentElement.style.setProperty('--font-display', titleFont);
      localStorage.setItem('gym_font_display', titleFont);
    } catch {
      // fallback
    }
  }, [titleFont]);

  useEffect(() => {
    try {
      document.documentElement.style.setProperty('--font-body', bodyFont);
      localStorage.setItem('gym_font_body', bodyFont);
    } catch {
      // fallback
    }
  }, [bodyFont]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLanguageChange = (lang: Language) => {
    triggerHaptic('selection');
    setCurrentLang(lang);
  };

  const handleToggleExercise = (id: number) => {
    triggerHaptic('selection');
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        triggerHaptic('success');
      }
      try {
        localStorage.setItem('gym_completed', JSON.stringify(Array.from(next)));
      } catch {
        // fallback
      }
      return next;
    });
  };

  const handleTogglePanel = (id: number) => {
    triggerHaptic('light');
    setOpenPanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRequestResetProgress = () => {
    triggerHaptic('warning');
    setConfirmModal({
      isOpen: true,
      title: t.modalResetTitle || t.confirmResetTitle,
      description: t.modalResetDesc || t.confirmResetDesc,
      confirmText: t.confirmReset || t.confirmBtn,
      cancelText: t.cancel || t.cancelBtn,
      type: 'reset',
      onConfirm: () => {
        triggerHaptic('success');
        setCompletedExercises(new Set());
        setOpenPanels(new Set());
        try {
          localStorage.removeItem('gym_completed');
        } catch {
          // fallback
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast(currentLang === 'de' ? 'Fortschritt zurückgesetzt' : 'تم إعادة تعيين التقدم بنجاح');
      },
    });
  };

  const handleCopyPlan = () => {
    triggerHaptic('light');
    const isAr = currentLang === 'ar';
    const planTitle = isAr ? activePlan.nameAr : activePlan.nameDe;
    const scheduleSub = getScheduleSubtitle(activePlan, currentLang);
    const dayName = isAr ? DAYS_NAMES_AR[selectedDayIndex] : DAYS_NAMES_DE[selectedDayIndex];
    const isRest = isDayRestDay(activePlan, selectedDayIndex);

    let text = `🏋️ ${planTitle} · ${scheduleSub}\n`;
    text += `📅 ${isAr ? 'تمارين يوم' : 'Trainingstag'}: ${dayName}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;

    if (isRest) {
      text += isAr ? '☕ يوم راحة واستشفاء عضلي.\n' : '☕ Geplanter Ruhetag & Regeneration.\n';
    } else if (currentDayExercises.length === 0) {
      text += isAr ? 'لا توجد أجهزة مضافة لهذا اليوم بعد.\n' : 'Keine Übungen für diesen Tag eingetragen.\n';
    } else {
      currentDayExercises.forEach((item, index) => {
        const name = isAr ? `${item.nameDe} (${item.muscleAr})` : item.nameDe;
        const isDone = completedExercises.has(item.id);
        text += `${index + 1}. [${isDone ? '✓' : ' '}] ${name}\n`;
        text += `   ${item.sets} ${isAr ? 'مجموعات' : 'Sätze'} × ${item.reps}\n`;
      });
    }

    const notes = isAr ? activePlan.notesAr : activePlan.notesDe;
    if (notes && notes.length > 0) {
      text += `\n${isAr ? 'الملاحظات الإرشادية:' : 'Hinweise:'}\n`;
      notes.forEach((note) => {
        text += `• ${note}\n`;
      });
    }

    try {
      navigator.clipboard.writeText(text);
      showToast(t.toastCopied);
    } catch {
      showToast(isAr ? 'تم النسخ!' : 'Kopiert!');
    }
  };

  // Derived current day exercises & rest status (Memoized to prevent unnecessary re-renders)
  const currentDayExercises = useMemo(
    () => getExercisesForDay(activePlan, selectedDayIndex),
    [activePlan, selectedDayIndex]
  );
  const isCurrentDayRest = isDayRestDay(activePlan, selectedDayIndex);
  const currentDayName = currentLang === 'ar' ? DAYS_NAMES_AR[selectedDayIndex] : DAYS_NAMES_DE[selectedDayIndex];

  // Plan Modification Handlers
  const handleAddExerciseToPlan = (exercise: ExerciseItem) => {
    const updatedPlan = addExerciseToDay(activePlan, selectedDayIndex, exercise);
    setActivePlan(updatedPlan);
    saveActivePlan(updatedPlan);
    showToast(
      currentLang === 'ar'
        ? `تمت إضافة "${exercise.nameDe}" بنجاح`
        : `"${exercise.nameDe}" zum Plan hinzugefügt`
    );
  };

  const handleSaveExerciseInPlan = (updated: ExerciseItem) => {
    const updatedPlan = updateExerciseOnDay(activePlan, selectedDayIndex, updated);
    setActivePlan(updatedPlan);
    saveActivePlan(updatedPlan);
    showToast(currentLang === 'ar' ? 'تم حفظ تعديل التمرين' : 'Übung aktualisiert');
  };

  const handleRemoveExerciseFromPlan = (id: number) => {
    const updatedPlan = removeExerciseFromDay(activePlan, selectedDayIndex, id);
    setActivePlan(updatedPlan);
    saveActivePlan(updatedPlan);
    showToast(currentLang === 'ar' ? 'تم حذف الجهاز من الجدول' : 'Gerät aus dem Plan entfernt');
  };

  const handleClearAllExercisesFromPlan = () => {
    triggerHaptic('warning');
    setConfirmModal({
      isOpen: true,
      title: currentLang === 'ar' ? 'تفريغ جدول تمارين هذا اليوم' : 'Plan leeren',
      description:
        currentLang === 'ar'
          ? 'هل أنت متأكد من رغبتك في تفريغ جدول هذا اليوم وحذف جميع التمارين منه؟'
          : 'Möchtest du wirklich alle Übungen von diesem Tag entfernen?',
      confirmText: currentLang === 'ar' ? 'نعم، تفريغ الجدول' : 'Ja, Plan leeren',
      cancelText: currentLang === 'ar' ? 'إلغاء' : 'Abbrechen',
      type: 'danger',
      onConfirm: () => {
        triggerHaptic('success');
        const updatedPlan = clearDayExercises(activePlan, selectedDayIndex);
        setActivePlan(updatedPlan);
        saveActivePlan(updatedPlan);
        setCompletedExercises(new Set());
        setOpenPanels(new Set());
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast(currentLang === 'ar' ? 'تم تفريغ تمارين هذا اليوم بنجاح' : 'Plan wurde geleert');
      },
    });
  };

  const handleUpdatePlan = (newPlan: WorkoutPlan) => {
    setActivePlan(newPlan);
    saveActivePlan(newPlan);
  };

  const handleStartActiveWorkout = () => {
    if (isCurrentDayRest || currentDayExercises.length === 0) {
      triggerHaptic('warning');
      showToast(
        currentLang === 'ar'
          ? 'هذا اليوم فارغ أو يوم راحة! أضف أجهزة أولاً لبدء التدريب'
          : 'Dieser Tag ist leer oder ein Ruhetag! Füge zuerst Übungen hinzu.'
      );
      setIsAddExerciseOpen(true);
      return;
    }
    setIsActiveWorkoutOpen(true);
  };

  const handleFactoryReset = () => {
    triggerHaptic('warning');
    setConfirmModal({
      isOpen: true,
      title: currentLang === 'ar' ? 'إعادة ضبط مصنع شاملة للموقع' : 'Werkseinstellungen',
      description:
        currentLang === 'ar'
          ? 'هل أنت متأكد من رغبتك في مسح كافة التمارين وسجلات التخزين المحلي وإعادة ضبط الموقع بالكامل من الصفر؟'
          : 'Möchtest du wirklich alle lokalen Daten löschen und die Anwendung komplett neu starten?',
      confirmText: currentLang === 'ar' ? 'نعم، مسح وإعادة ضبط' : 'Ja, alles löschen',
      cancelText: currentLang === 'ar' ? 'إلغاء' : 'Abbrechen',
      type: 'danger',
      onConfirm: () => {
        hardResetApp();
      },
    });
  };

  const handleFinishActiveWorkout = (completedIds: number[]) => {
    setCompletedExercises((prev) => {
      const next = new Set([...prev, ...completedIds]);
      try {
        localStorage.setItem('gym_completed', JSON.stringify(Array.from(next)));
      } catch {
        // fallback
      }
      return next;
    });

    const newSessions = totalSessions + 1;
    setTotalSessions(newSessions);
    try {
      localStorage.setItem('gym_sessions', newSessions.toString());
    } catch {
      // fallback
    }

    showToast(
      currentLang === 'ar'
        ? 'رائع جداً! تم تسجيل الجلسة بنجاح'
        : 'Super! Workout erfolgreich absolviert'
    );
  };

  const handleTabChange = (tab: ViewTab) => {
    triggerHaptic('selection');
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSplashFinish = () => {
    try {
      sessionStorage.setItem('gym_splash_shown', 'true');
    } catch {
      // fallback
    }
    setShowSplash(false);
  };

  return (
    <TimerProvider lang={currentLang}>
      <AudioProvider lang={currentLang}>
      <div className="w-full min-h-screen max-w-[100vw] overflow-x-hidden flex flex-col bg-[#f6f8f6] text-[#15221b] selection:bg-[#215641]/15 selection:text-[#15221b] transition-colors duration-300">
        {/* Animated Native Splash Screen */}
        <AnimatePresence>
          {showSplash && (
            <SplashScreen
              onFinish={handleSplashFinish}
              lang={currentLang}
              planTitle={currentLang === 'de' ? activePlan.nameDe : activePlan.nameAr}
              planSubtitle={currentLang === 'de' ? activePlan.frequencyDe : activePlan.frequencyAr}
            />
          )}
        </AnimatePresence>

        {/* Main View Container (Clean, distraction-free top spacing) */}
        <main className="flex-1 w-full max-w-2xl mx-auto px-3.5 sm:px-4 pt-3.5 sm:pt-5 pb-28 overflow-x-hidden min-w-0">
          <AnimatePresence mode="wait">
            {currentTab === 'plan' && (
              <motion.div
                key="view-plan"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <PlanView
                  exercises={currentDayExercises}
                  completedExercises={completedExercises}
                  openPanels={openPanels}
                  currentLang={currentLang}
                  selectedDayIndex={selectedDayIndex}
                  onSelectDayIndex={setSelectedDayIndex}
                  onToggleExercise={handleToggleExercise}
                  onTogglePanel={handleTogglePanel}
                  onResetToday={handleRequestResetProgress}
                  onNavigateTab={handleTabChange}
                  totalSessions={totalSessions}
                  plan={activePlan}
                  onUpdatePlan={(updated) => {
                    setActivePlan(updated);
                    saveActivePlan(updated);
                  }}
                  onStartActiveWorkout={handleStartActiveWorkout}
                  onOpenAddExercise={() => setIsAddExerciseOpen(true)}
                  onOpenEditExercise={(exercise) => setEditingExercise(exercise)}
                  onRemoveExercise={handleRemoveExerciseFromPlan}
                  onClearPlan={handleClearAllExercisesFromPlan}
                  showToast={showToast}
                />
              </motion.div>
            )}

            {currentTab === 'timer' && (
              <motion.div
                key="view-timer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <TimerView currentLang={currentLang} />
              </motion.div>
            )}

            {currentTab === 'audio' && (
              <motion.div
                key="view-audio"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={null}>
                  <AudioView currentLang={currentLang} />
                </Suspense>
              </motion.div>
            )}

            {currentTab === 'profile' && (
              <motion.div
                key="view-profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Suspense fallback={null}>
                  <ProfileView
                    currentLang={currentLang}
                    onSelectLang={handleLanguageChange}
                    onOpenFontSettings={() => setIsFontModalOpen(true)}
                    onOpenPlanShare={() => setIsPlanShareModalOpen(true)}
                    onResetProgress={handleRequestResetProgress}
                    onCopyPlan={handleCopyPlan}
                    totalSessions={totalSessions}
                    completedExercisesCount={completedExercises.size}
                    plan={activePlan}
                  />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Modern Lightweight Audio Mini-Bar (Appears only when audio is actively playing outside audio tab) */}
        <ModernAudioMiniBar
          currentTab={currentTab}
          onNavigateTab={handleTabChange}
          lang={currentLang}
        />

        {/* Liquid Glass Bottom Navigation Dock */}
        <MobileBottomNav
          currentTab={currentTab}
          onTabChange={handleTabChange}
          currentLang={currentLang}
        />

        {/* Active Guided Workout Session Modal */}
        {isActiveWorkoutOpen && (
          <Suspense fallback={null}>
            <ActiveWorkoutModal
              isOpen={isActiveWorkoutOpen}
              onClose={() => setIsActiveWorkoutOpen(false)}
              plan={{
                ...activePlan,
                exercises: currentDayExercises,
              }}
              currentLang={currentLang}
              onFinishWorkout={handleFinishActiveWorkout}
            />
          </Suspense>
        )}

        {/* Direct Manual Add Exercise / Machine Modal */}
        {isAddExerciseOpen && (
          <Suspense fallback={null}>
            <AddExerciseModal
              isOpen={isAddExerciseOpen}
              onClose={() => setIsAddExerciseOpen(false)}
              currentLang={currentLang}
              onAddExercise={handleAddExerciseToPlan}
              dayName={currentDayName}
            />
          </Suspense>
        )}

        {/* Quick Exercise Card Editor Modal */}
        {editingExercise !== null && (
          <Suspense fallback={null}>
            <ExerciseEditModal
              isOpen={editingExercise !== null}
              onClose={() => setEditingExercise(null)}
              exercise={editingExercise}
              currentLang={currentLang}
              onSaveExercise={handleSaveExerciseInPlan}
              onRemoveFromPlan={handleRemoveExerciseFromPlan}
            />
          </Suspense>
        )}

        {/* Plan Export & Import Modal */}
        {isPlanShareModalOpen && (
          <Suspense fallback={null}>
            <PlanShareModal
              isOpen={isPlanShareModalOpen}
              onClose={() => setIsPlanShareModalOpen(false)}
              plan={activePlan}
              currentLang={currentLang}
              onUpdatePlan={handleUpdatePlan}
              showToast={showToast}
            />
          </Suspense>
        )}

        {/* Font Settings Modal */}
        {isFontModalOpen && (
          <Suspense fallback={null}>
            <FontSettingsModal
              isOpen={isFontModalOpen}
              onClose={() => setIsFontModalOpen(false)}
              lang={currentLang}
              currentTitleFont={titleFont}
              currentBodyFont={bodyFont}
              onSelectTitleFont={setTitleFont}
              onSelectBodyFont={setBodyFont}
            />
          </Suspense>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          type={confirmModal.type}
          currentLang={currentLang}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Floating Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#15221b] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-white/10"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </AudioProvider>
    </TimerProvider>
  );
}
