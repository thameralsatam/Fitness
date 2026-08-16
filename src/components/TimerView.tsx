import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Bell } from 'lucide-react';
import { Language } from '../types';
import { I18N } from '../data/workoutData';

interface TimerViewProps {
  currentLang: Language;
}

export const TimerView: React.FC<TimerViewProps> = ({ currentLang }) => {
  const t = I18N[currentLang];
  const [selectedDuration, setSelectedDuration] = useState(90);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleSelectPreset = (seconds: number) => {
    setSelectedDuration(seconds);
    setSecondsLeft(seconds);
    setIsRunning(false);
  };

  const handleReset = () => {
    setSecondsLeft(selectedDuration);
    setIsRunning(false);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const remainderSeconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(remainderSeconds).padStart(2, '0')}`;

  const progressFraction = selectedDuration > 0 ? (selectedDuration - secondsLeft) / selectedDuration : 0;
  const strokeDashoffset = 440 * (1 - progressFraction);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="space-y-1">
        <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[#15221b] tracking-tight">
          {t.timerViewTitle}
        </h2>
        <p className="text-sm text-[#4f6156] leading-relaxed">
          {t.timerViewDesc}
        </p>
      </div>

      {/* Main Dial Card */}
      <div className="bg-white rounded-3xl border border-[#dbe4dc] p-6 sm:p-10 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
        {/* Dial */}
        <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle
              className="fill-none stroke-[#edf4ef]"
              cx="80"
              cy="80"
              r="70"
              strokeWidth="7"
            />
            <circle
              className="fill-none stroke-[#215641] transition-all duration-700 ease-linear"
              cx="80"
              cy="80"
              r="70"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="440"
              style={{ strokeDashoffset }}
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-display font-black text-4xl sm:text-5xl text-[#15221b] tracking-tighter">
              {formattedTime}
            </span>
            <span className="text-[11px] font-bold text-[#75877d] uppercase tracking-widest mt-1">
              {secondsLeft === 0
                ? t.timerDone
                : isRunning
                ? currentLang === 'ar' ? 'جاري الاستراحة...' : 'PAUSE LÄUFT'
                : currentLang === 'ar' ? 'مؤقت الراحة' : 'BEREIT'}
            </span>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[
            { sec: 60, label: '60s' },
            { sec: 90, label: currentLang === 'ar' ? '90 ثانية (موصى به)' : '90s (Empfohlen)' },
            { sec: 120, label: '120s' },
          ].map((preset) => (
            <button
              key={preset.sec}
              type="button"
              onClick={() => handleSelectPreset(preset.sec)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedDuration === preset.sec
                  ? 'bg-[#215641] text-white shadow-xs'
                  : 'bg-[#edf4ef] text-[#4f6156] hover:bg-[#e2ebe3]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#215641] text-white font-display font-bold text-sm hover:bg-[#163d2e] active:scale-95 transition-all shadow-sm"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>{t.timerPause}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{t.timerStart}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-[#edf4ef] text-[#4f6156] hover:text-[#15221b] hover:bg-[#e2ede5] font-semibold text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.timerReset}</span>
          </button>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="bg-[#edf4ef] rounded-2xl p-4 flex items-start gap-3 border border-[#dbe4dc]/80">
        <div className="p-2 rounded-xl bg-white text-[#215641] shadow-2xs flex-shrink-0">
          <Bell className="w-4 h-4" />
        </div>
        <div className="text-xs text-[#4f6156] leading-relaxed">
          <span className="font-bold text-[#15221b] block mb-0.5">
            {currentLang === 'ar' ? 'فائدة الـ 90 ثانية:' : 'Warum 90 Sekunden?'}
          </span>
          {currentLang === 'ar'
            ? 'تتيح الراحة بين 60-90 ثانية لعضلاتك استعادة مخزون فوسفات الكرياتين (ATP-CP) مما يضمن الحفاظ على نفس الشدة والأداء في المجموعة التالية دون هبوط مفاجئ.'
            : 'Eine 90-sekündige Pause ermöglicht die fast vollständige Regeneration der ATP- und Kreatinphosphatspeicher für maximale Kraft im nächsten Satz.'}
        </div>
      </div>
    </div>
  );
};
