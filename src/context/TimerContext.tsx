import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { triggerHaptic } from '../utils/haptics';
import { Language } from '../types';

interface TimerContextType {
  remainingMs: number;
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
  const [remainingMs, setRemainingMs] = useState<number>(90 * 1000);
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
      const storedRemainingMs = localStorage.getItem('timer_remainingMs');
      const storedIsRunning = localStorage.getItem('timer_isRunning');

      let dur = 90;
      if (storedDuration) {
        dur = parseInt(storedDuration, 10);
        setSelectedDuration(dur);
      }

      if (storedIsRunning === 'true' && storedEndTime) {
        const endTime = parseInt(storedEndTime, 10);
        const left = Math.max(0, endTime - Date.now());
        
        if (left > 0) {
          setRemainingMs(left);
          setIsRunning(true);
        } else {
          // Timer finished while app was completely closed
          setRemainingMs(0);
          setIsRunning(false);
          clearStorage();
        }
      } else if (storedRemainingMs) {
        const ms = parseInt(storedRemainingMs, 10);
        setRemainingMs(ms);
        setIsRunning(false);
      } else {
        setRemainingMs(dur * 1000);
        setIsRunning(false);
      }
    } catch (e) {
      console.error('[TimerContext] Failed to restore timer state:', e);
    }
  }, []);

  const clearStorage = () => {
    localStorage.removeItem('timer_endTime');
    localStorage.removeItem('timer_remainingMs');
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

      setTimeout(() => {
        try {
          ctx.close().catch(() => {});
        } catch {
          // ignore
        }
      }, 1000);
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

  // Core ticking effect with smooth 50ms sub-second precision
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        const storedEndTime = localStorage.getItem('timer_endTime');
        if (storedEndTime) {
          const endTime = parseInt(storedEndTime, 10);
          const left = Math.max(0, endTime - Date.now());
          
          setRemainingMs(left);

          if (left <= 0) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            triggerCompletionEffects();
            clearStorage();
          }
        } else {
          setRemainingMs((prev) => {
            const next = Math.max(0, prev - 50);
            if (next <= 0) {
              setIsRunning(false);
              if (timerRef.current) clearInterval(timerRef.current);
              triggerCompletionEffects();
              clearStorage();
              return 0;
            }
            return next;
          });
        }
      }, 50);
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
    
    const ms = seconds * 1000;
    const targetEndTime = Date.now() + ms;
    localStorage.setItem('timer_endTime', targetEndTime.toString());
    localStorage.setItem('timer_duration', seconds.toString());
    localStorage.setItem('timer_remainingMs', ms.toString());
    localStorage.setItem('timer_isRunning', 'true');

    setSelectedDuration(seconds);
    setRemainingMs(ms);
    setIsRunning(true);

    triggerHaptic('selection');
    scheduleNotification(seconds);
  };

  const pauseTimer = () => {
    const storedEndTime = localStorage.getItem('timer_endTime');
    let currentLeft = remainingMs;
    if (storedEndTime) {
      currentLeft = Math.max(0, parseInt(storedEndTime, 10) - Date.now());
    }
    
    setRemainingMs(currentLeft);
    setIsRunning(false);

    localStorage.setItem('timer_remainingMs', currentLeft.toString());
    localStorage.setItem('timer_isRunning', 'false');
    localStorage.removeItem('timer_endTime');

    cancelNotification();
    triggerHaptic('medium');
  };

  const resumeTimer = () => {
    if (remainingMs <= 0) return;
    
    const targetEndTime = Date.now() + remainingMs;
    localStorage.setItem('timer_endTime', targetEndTime.toString());
    localStorage.setItem('timer_isRunning', 'true');

    setIsRunning(true);
    triggerHaptic('selection');
    scheduleNotification(remainingMs / 1000);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const ms = selectedDuration * 1000;
    setRemainingMs(ms);
    clearStorage();
    cancelNotification();
    triggerHaptic('light');
  };

  const setTimerConfig = (seconds: number) => {
    setSelectedDuration(seconds);
    const ms = seconds * 1000;
    setRemainingMs(ms);
    setIsRunning(false);
    localStorage.setItem('timer_duration', seconds.toString());
    clearStorage();
    cancelNotification();
  };

  // Convert time to formatted string (clean MM:SS / HH:MM:SS) while keeping millisecond precision in the background
  const displaySeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(displaySeconds / 3600);
  const minutes = Math.floor((displaySeconds % 3600) / 60);
  const remainderSeconds = displaySeconds % 60;

  let formattedTime = '';
  if (hours > 0) {
    formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainderSeconds).padStart(2, '0')}`;
  } else {
    formattedTime = `${String(minutes).padStart(2, '0')}:${String(remainderSeconds).padStart(2, '0')}`;
  }

  const secondsLeft = displaySeconds;

  return (
    <TimerContext.Provider
      value={{
        remainingMs,
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
