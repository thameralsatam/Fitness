import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewTab, Language, WorkoutPlan, ExerciseItem, DayIndex } from './types';
import { DEFAULT_WORKOUT_PLAN, I18N } from './data/workoutData';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PlanView } from './components/PlanView';
import { TimerView } from './components/TimerView';
import { AudioView } from './components/AudioView';
import { StatsView } from './components/StatsView';
import { ToolsView } from './components/ToolsView';
import { ConfirmModal } from './components/ConfirmModal';
import { SplashScreen } from './components/SplashScreen';
import { AudioProvider } from './context/AudioContext';
import { TimerProvider } from './context/TimerContext';
import { FloatingMiniPlayer } from './components/FloatingMiniPlayer';
import { FontSettingsModal } from './components/FontSettingsModal';
import { DebugLogsModal } from './components/DebugLogsModal';
import { SettingsModal } from './components/SettingsModal';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { LibraryModal } from './components/LibraryModal';
import { ExerciseEditModal } from './components/ExerciseEditModal';
import { ProfileView } from './components/ProfileView';
import { triggerHaptic } from './utils/haptics';
import { initializeCustomFonts } from './utils/customFonts';
import {
  getStoredLibraryExercises,
  saveLibraryExercises,
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
  swapExerciseOnDay,
  removeExerciseFromDay,
  clearDayExercises,
  setTrainingDays,
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
  // Library & Workout Plan states backed by localStorage
  const [libraryExercises, setLibraryExercises] = useState<ExerciseItem[]>(() => {
    return getStoredLibraryExercises();
  });

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
  const [isDebugLogsOpen, setIsDebugLogsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isActiveWorkoutOpen, setIsActiveWorkoutOpen] = useState<boolean>(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState<boolean>(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);
  const [hasActiveFloatingControl, setHasActiveFloatingControl] = useState<boolean>(false);
  const [isFloatingExpanded, setIsFloatingExpanded] = useState<boolean>(false);

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

  // Restore custom fonts on app boot
  useEffect(() => {
    initializeCustomFonts();
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

  const handleToggleAllAlts = () => {
    triggerHaptic('selection');
    if (openPanels.size === activePlan.exercises.length) {
      setOpenPanels(new Set());
    } else {
      setOpenPanels(new Set(activePlan.exercises.map((e) => e.id)));
    }
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
        if (item.alternatives.length > 0) {
          text += `   ${isAr ? 'البدائل:' : 'Alternativen:'} ${item.alternatives.join(', ')}\n`;
        }
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

  // Derived current day exercises & rest status
  const currentDayExercises = getExercisesForDay(activePlan, selectedDayIndex);
  const isCurrentDayRest = isDayRestDay(activePlan, selectedDayIndex);

  // Library & Plan Modification Handlers
  const handleUpdateLibrary = (newLib: ExerciseItem[]) => {
    setLibraryExercises(newLib);
    saveLibraryExercises(newLib);
    showToast(currentLang === 'ar' ? 'تم تحديث مكتبة الأجهزة' : 'Bibliothek aktualisiert');
  };

  const handleAddExerciseToPlan = (exercise: ExerciseItem) => {
    const updatedPlan = addExerciseToDay(activePlan, selectedDayIndex, exercise);
    setActivePlan(updatedPlan);
    saveActivePlan(updatedPlan);
    showToast(
      currentLang === 'ar'
        ? `تمت إضافة "${exercise.nameDe}" إلى جدول التمرين`
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

  const handleStartActiveWorkout = () => {
    if (isCurrentDayRest || currentDayExercises.length === 0) {
      triggerHaptic('warning');
      showToast(
        currentLang === 'ar'
          ? 'هذا اليوم فارغ أو يوم راحة! أضف أجهزة أولاً لبدء التدريب'
          : 'Dieser Tag ist leer oder ein Ruhetag! Füge zuerst Übungen hinzu.'
      );
      setIsLibraryModalOpen(true);
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

  const handleSwapExerciseInPlan = (oldId: number, replacement: ExerciseItem) => {
    const updatedPlan = swapExerciseOnDay(activePlan, selectedDayIndex, oldId, replacement);
    setActivePlan(updatedPlan);
    saveActivePlan(updatedPlan);
    showToast(
      currentLang === 'ar'
        ? `تم استبدال الجهاز بـ "${replacement.nameDe}"`
        : `Ersetzt durch "${replacement.nameDe}"`
    );
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

        {/* Top Header */}
        <Header
          currentLang={currentLang}
          planTitle={currentLang === 'de' ? activePlan.nameDe : activePlan.nameAr}
          hasActiveFloatingControl={hasActiveFloatingControl}
          isExpanded={isFloatingExpanded}
        />

        {/* Main View Container */}
        <main className="flex-1 w-full max-w-2xl mx-auto px-3.5 sm:px-4 py-4 sm:py-6 overflow-x-hidden min-w-0 pb-28">
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
                  onOpenLibrary={() => setIsLibraryModalOpen(true)}
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
                <AudioView currentLang={currentLang} />
              </motion.div>
            )}

            {currentTab === 'tools' && (
              <motion.div
                key="view-tools"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ToolsView currentLang={currentLang} />
              </motion.div>
            )}

            {currentTab === 'stats' && (
              <motion.div
                key="view-stats"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <StatsView
                  currentLang={currentLang}
                  completedExercises={completedExercises}
                  totalSessions={totalSessions}
                  plan={activePlan}
                  onUpdateTrainingDays={(newDays) => {
                    const updated = setTrainingDays(activePlan, newDays);
                    setActivePlan(updated);
                    saveActivePlan(updated);
                  }}
                />
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
                <ProfileView
                  currentLang={currentLang}
                  onSelectLang={handleLanguageChange}
                  onOpenFontSettings={() => setIsFontModalOpen(true)}
                  onOpenDebugLogs={() => setIsDebugLogsOpen(true)}
                  onOpenLibrary={() => setIsLibraryModalOpen(true)}
                  onResetProgress={handleRequestResetProgress}
                  onCopyPlan={handleCopyPlan}
                  totalSessions={totalSessions}
                  completedExercisesCount={completedExercises.size}
                  plan={activePlan}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Universal Floating Control (Audio & Rest Timer) */}
        <FloatingMiniPlayer
          currentTab={currentTab}
          onNavigateTab={handleTabChange}
          lang={currentLang}
          onActiveStatusChange={setHasActiveFloatingControl}
          onExpandStatusChange={setIsFloatingExpanded}
        />

        {/* Liquid Glass Bottom Navigation Dock */}
        <MobileBottomNav
          currentTab={currentTab}
          onTabChange={handleTabChange}
          currentLang={currentLang}
        />

        {/* Active Guided Workout Session Modal */}
        <ActiveWorkoutModal
          isOpen={isActiveWorkoutOpen}
          onClose={() => setIsActiveWorkoutOpen(false)}
          plan={{
            ...activePlan,
            exercises: currentDayExercises,
          }}
          currentLang={currentLang}
          onFinishWorkout={handleFinishActiveWorkout}
          onOpenLibrary={() => setIsLibraryModalOpen(true)}
        />

        {/* Full Exercise & Machine Library Modal */}
        <LibraryModal
          isOpen={isLibraryModalOpen}
          onClose={() => setIsLibraryModalOpen(false)}
          currentLang={currentLang}
          libraryExercises={libraryExercises}
          onUpdateLibrary={handleUpdateLibrary}
          activePlan={{
            ...activePlan,
            exercises: currentDayExercises,
          }}
          onAddExerciseToPlan={handleAddExerciseToPlan}
        />

        {/* Quick Exercise Card Editor / Swapper Modal */}
        <ExerciseEditModal
          isOpen={editingExercise !== null}
          onClose={() => setEditingExercise(null)}
          exercise={editingExercise}
          currentLang={currentLang}
          libraryExercises={libraryExercises}
          onSaveExercise={handleSaveExerciseInPlan}
          onRemoveFromPlan={handleRemoveExerciseFromPlan}
          onSwapExercise={handleSwapExerciseInPlan}
          onOpenFullLibrary={() => setIsLibraryModalOpen(true)}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentLang={currentLang}
          onSelectLang={(lang) => {
            setCurrentLang(lang);
            showToast(lang === 'ar' ? 'تم ضبط لغة التطبيق إلى العربية' : 'Sprache auf Deutsch festgelegt');
          }}
          onOpenFontSettings={() => setIsFontModalOpen(true)}
          onOpenDebugLogs={() => setIsDebugLogsOpen(true)}
          onOpenLibrary={() => setIsLibraryModalOpen(true)}
          onResetProgress={handleRequestResetProgress}
          onCopyPlan={handleCopyPlan}
          onFactoryReset={handleFactoryReset}
          libraryExercisesCount={libraryExercises.length}
        />

        {/* Font Settings Modal */}
        <FontSettingsModal
          isOpen={isFontModalOpen}
          onClose={() => setIsFontModalOpen(false)}
          lang={currentLang}
          currentTitleFont={titleFont}
          currentBodyFont={bodyFont}
          onSelectTitleFont={setTitleFont}
          onSelectBodyFont={setBodyFont}
        />

        {/* Debug Logs Console */}
        <DebugLogsModal
          isOpen={isDebugLogsOpen}
          onClose={() => setIsDebugLogsOpen(false)}
          currentLang={currentLang}
        />

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
