import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewTab, Language } from './types';
import { EXERCISES_DATA, I18N } from './data/workoutData';
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
import { triggerHaptic } from './utils/haptics';
import { initializeCustomFonts } from './utils/customFonts';

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
    return "'Kufam', sans-serif";
  });

  const [bodyFont, setBodyFont] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('gym_font_body');
      if (saved) return saved;
    } catch {
      // fallback
    }
    return "'IBM Plex Sans Arabic', sans-serif";
  });

  const [isFontModalOpen, setIsFontModalOpen] = useState<boolean>(false);
  const [isDebugLogsOpen, setIsDebugLogsOpen] = useState<boolean>(false);

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

  const [totalSessions] = useState<number>(() => {
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
      document.body.style.fontFamily = bodyFont;
      localStorage.setItem('gym_font_body', bodyFont);
    } catch {
      // fallback
    }
  }, [bodyFont]);

  // Persist completed exercises
  useEffect(() => {
    try {
      localStorage.setItem('gym_completed', JSON.stringify(Array.from(completedExercises)));
    } catch {
      // fallback
    }
  }, [completedExercises]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleToggleLang = () => {
    triggerHaptic('selection');
    const newLang = currentLang === 'de' ? 'ar' : 'de';
    setCurrentLang(newLang);
    showToast(newLang === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Sprache auf Deutsch geändert');
  };

  const handleToggleExercise = (id: number) => {
    triggerHaptic('medium');
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleTogglePanel = (id: number) => {
    triggerHaptic('selection');
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
    if (openPanels.size === EXERCISES_DATA.length) {
      setOpenPanels(new Set());
    } else {
      setOpenPanels(new Set(EXERCISES_DATA.map((e) => e.id)));
    }
  };

  const handleRequestResetProgress = () => {
    triggerHaptic('warning');
    setConfirmModal({
      isOpen: true,
      title: t.modalResetTitle,
      description: t.modalResetDesc,
      confirmText: t.confirmReset,
      cancelText: t.cancel,
      type: 'reset',
      onConfirm: () => {
        triggerHaptic('success');
        setCompletedExercises(new Set());
        setOpenPanels(new Set());
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast(currentLang === 'de' ? 'Fortschritt zurückgesetzt' : 'تم إعادة تعيين التقدم بنجاح');
      },
    });
  };

  const handleCopyPlan = () => {
    triggerHaptic('light');
    let text = `${t.brandTitle} · ${t.brandSubtitle}\n\n`;

    EXERCISES_DATA.forEach((item, index) => {
      const name = currentLang === 'de' ? item.nameDe : `${item.nameDe} (${item.muscleAr})`;
      const isDone = completedExercises.has(item.id);
      text += `${index + 1}. [${isDone ? '✓' : ' '}] ${name}\n`;
      text += `   ${item.sets} ${currentLang === 'de' ? 'Sätze' : 'مجموعات'} × ${item.reps}\n`;
      if (item.alternatives.length > 0) {
        text += `   ${currentLang === 'de' ? 'Alternativen:' : 'البدائل:'} ${item.alternatives.join(
          ', '
        )}\n`;
      }
    });

    text += `\n${currentLang === 'de' ? 'Hinweise:' : 'الملاحظات:'}\n`;
    t.notes.forEach((note) => {
      text += `• ${note}\n`;
    });

    try {
      navigator.clipboard.writeText(text);
      showToast(t.toastCopied);
    } catch {
      showToast('Kopiert!');
    }
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
            <SplashScreen onFinish={handleSplashFinish} lang={currentLang} />
          )}
        </AnimatePresence>

        {/* Top Header */}
        <Header
          currentLang={currentLang}
          onToggleLang={handleToggleLang}
          onCopyPlan={handleCopyPlan}
          onToggleAllAlts={handleToggleAllAlts}
          onResetProgress={handleRequestResetProgress}
          onOpenFontSettings={() => setIsFontModalOpen(true)}
          onOpenDebugLogs={() => setIsDebugLogsOpen(true)}
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
                  exercises={EXERCISES_DATA}
                  completedExercises={completedExercises}
                  openPanels={openPanels}
                  currentLang={currentLang}
                  onToggleExercise={handleToggleExercise}
                  onTogglePanel={handleTogglePanel}
                  onResetToday={handleRequestResetProgress}
                  onNavigateTab={handleTabChange}
                  totalSessions={totalSessions}
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
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Persistent Floating Mini Audio Player when browsing other tabs */}
        <FloatingMiniPlayer
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

