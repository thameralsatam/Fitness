import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { triggerHaptic } from '../utils/haptics';
import { Language } from '../types';

interface TimerContextType {
  secondsLeft: number;
  selectedDuration: number;
  isRunning: boolean;
  startTimer: (seconds: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  formattedTime: string;
  setTimerConfig: (seconds: number) => void;
  currentLang: Language;
  setCurrentLang: (lang: Language) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode; lang: Language }> = ({ children, lang }) => {
  const [currentLang, setCurrentLang] = useState<Language>(lang);
  const [selectedDuration, setSelectedDuration] = useState<number>(90);
  const [secondsLeft, setSecondsLeft] = useState<number>(90);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync language prop
  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  // Request local notification permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const check = await LocalNotifications.checkPermissions();
        if (check.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } catch (e) {
        console.warn('[TimerContext] Could not request notification permissions:', e);
      }
    };
    requestPermissions();
  }, []);

  // Hydrate timer state from localStorage on load to recover if app was closed
  useEffect(() => {
    try {
      const storedEndTime = localStorage.getItem('timer_endTime');
      const storedDuration = localStorage.getItem('timer_duration');
      const storedIsRunning = localStorage.getItem('timer_isRunning');

      if (storedDuration) {
        const dur = parseInt(storedDuration, 10);
        setSelectedDuration(dur);
        setSecondsLeft(dur);
      }

      if (storedIsRunning === 'true' && storedEndTime) {
        const endTime = parseInt(storedEndTime, 10);
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        
        if (remaining > 0) {
          setSecondsLeft(remaining);
          setIsRunning(true);
        } else {
          // Timer finished while app was completely closed
          setSecondsLeft(0);
          setIsRunning(false);
          clearStorage();
        }
      }
    } catch (e) {
      console.error('[TimerContext] Failed to restore timer state:', e);
    }
  }, []);

  const clearStorage = () => {
    localStorage.removeItem('timer_endTime');
    localStorage.removeItem('timer_isRunning');
  };

  // Sound generator fallback
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.35);

      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.1);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch {
      // Audio fallback
    }
  };

  const triggerCompletionEffects = () => {
    playChime();
    
    // Success vibration sequence on active completion
    triggerHaptic('success');
    setTimeout(() => triggerHaptic('medium'), 200);
    setTimeout(() => triggerHaptic('heavy'), 450);
  };

  // Schedule background local notification
  const scheduleNotification = async (seconds: number) => {
    try {
      // Cancel first
      await LocalNotifications.cancel({ notifications: [{ id: 42 }] });

      const isAr = currentLang === 'ar';
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 42,
            title: isAr ? 'انتهت فترة الراحة!' : 'Erholung abgeschlossen!',
            body: isAr ? 'انتهت الراحة! حان الوقت للعودة للتمرين بنشاط عالي.' : 'Die Pause ist vorbei! Bereit für den nächsten Satz.',
            schedule: { at: new Date(Date.now() + seconds * 1000) },
            sound: 'beep.wav',
            actionTypeId: 'rest_timer_done',
          }
        ]
      });
    } catch (e) {
      console.warn('[TimerContext] Failed to schedule background notification:', e);
    }
  };

  const cancelNotification = async () => {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 42 }] });
    } catch (e) {
      console.warn('[TimerContext] Failed to cancel local notification:', e);
    }
  };

  // Core ticking effect
  useEffect(() => {
    if (isRunning) {
      // Periodic check based on absolute timestamps to remain robust to background throttling
      timerRef.current = setInterval(() => {
        const storedEndTime = localStorage.getItem('timer_endTime');
        if (storedEndTime) {
          const endTime = parseInt(storedEndTime, 10);
          const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
          
          setSecondsLeft(remaining);

          if (remaining <= 0) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            triggerCompletionEffects();
            clearStorage();
          }
        } else {
          // Fallback if endTime is missing
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              if (timerRef.current) clearInterval(timerRef.current);
              triggerCompletionEffects();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, currentLang]);

  // Handle actions
  const startTimer = (seconds: number) => {
    if (seconds <= 0) return;
    
    const targetEndTime = Date.now() + seconds * 1000;
    localStorage.setItem('timer_endTime', targetEndTime.toString());
    localStorage.setItem('timer_duration', seconds.toString());
    localStorage.setItem('timer_isRunning', 'true');

    setSelectedDuration(seconds);
    setSecondsLeft(seconds);
    setIsRunning(true);

    triggerHaptic('selection');
    scheduleNotification(seconds);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    localStorage.setItem('timer_isRunning', 'false');
    localStorage.removeItem('timer_endTime');
    cancelNotification();
    triggerHaptic('medium');
  };

  const resumeTimer = () => {
    if (secondsLeft <= 0) return;
    
    const targetEndTime = Date.now() + secondsLeft * 1000;
    localStorage.setItem('timer_endTime', targetEndTime.toString());
    localStorage.setItem('timer_isRunning', 'true');

    setIsRunning(true);
    triggerHaptic('selection');
    scheduleNotification(secondsLeft);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(selectedDuration);
    clearStorage();
    cancelNotification();
    triggerHaptic('light');
  };

  const setTimerConfig = (seconds: number) => {
    setSelectedDuration(seconds);
    setSecondsLeft(seconds);
    setIsRunning(false);
    localStorage.setItem('timer_duration', seconds.toString());
    clearStorage();
    cancelNotification();
  };

  // Convert time to string
  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const remainderSeconds = secondsLeft % 60;

  let formattedTime = '';
  if (hours > 0) {
    formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainderSeconds).padStart(2, '0')}`;
  } else {
    formattedTime = `${String(minutes).padStart(2, '0')}:${String(remainderSeconds).padStart(2, '0')}`;
  }

  return (
    <TimerContext.Provider
      value={{
        secondsLeft,
        selectedDuration,
        isRunning,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        formattedTime,
        setTimerConfig,
        currentLang,
        setCurrentLang,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
