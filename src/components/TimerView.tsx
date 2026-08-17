import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Bell, Sliders } from 'lucide-react';
import { Language } from '../types';
import { I18N } from '../data/workoutData';
import { useTimer } from '../context/TimerContext';
import { triggerHaptic } from '../utils/haptics';

interface TimerViewProps {
  currentLang: Language;
}

export const TimerView: React.FC<TimerViewProps> = ({ currentLang }) => {
  const t = I18N[currentLang];
  
  const {
    secondsLeft,
    selectedDuration,
    isRunning,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    formattedTime,
    setTimerConfig,
  } = useTimer();

  // Custom configuration states
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customHours, setCustomHours] = useState<number>(0);
  const [customMinutes, setCustomMinutes] = useState<number>(1);
  const [customSeconds, setCustomSeconds] = useState<number>(30);

  // Sync custom inputs to timer configuration when in custom mode and not running
  useEffect(() => {
    if (isCustomMode && !isRunning) {
      const totalSec = customHours * 3600 + customMinutes * 60 + customSeconds;
      setTimerConfig(totalSec);
    }
  }, [customHours, customMinutes, customSeconds, isCustomMode, isRunning]);

  // If selected duration changes (e.g. from preset click), ensure custom inputs are synced
  useEffect(() => {
    if (!isCustomMode) {
      const hrs = Math.floor(selectedDuration / 3600);
      const mins = Math.floor((selectedDuration % 3600) / 60);
      const secs = selectedDuration % 60;
      setCustomHours(hrs);
      setCustomMinutes(mins);
      setCustomSeconds(secs);
    }
  }, [selectedDuration, isCustomMode]);

  const handleSelectPreset = (seconds: number) => {
    setIsCustomMode(false);
    setTimerConfig(seconds);
    triggerHaptic('light');
  };

  const togglePlayback = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  };

  const progressFraction = selectedDuration > 0 ? (selectedDuration - secondsLeft) / selectedDuration : 0;
  const strokeDashoffset = 440 * (1 - progressFraction);

  const CustomUnitCounter = ({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) => (
    <div className="flex flex-col items-center gap-1 bg-[#f6f8f6] border border-[#e2ebe3] rounded-2xl p-2.5 min-w-[80px]">
      <span className="text-[9px] font-bold text-[#75877d] uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={isRunning}
          onClick={() => {
            onChange(Math.max(0, value - 1));
            triggerHaptic('selection');
          }}
          className="w-7 h-7 rounded-lg bg-white border border-[#dbe4dc] flex items-center justify-center text-[#15221b] hover:bg-[#eef4f0] active:scale-90 disabled:opacity-40 disabled:pointer-events-none transition-all font-bold text-sm"
        >
          -
        </button>
        <span className="font-display font-extrabold text-sm text-[#15221b] min-w-[20px] text-center">
          {String(value).padStart(2, '0')}
        </span>
        <button
          type="button"
          disabled={isRunning}
          onClick={() => {
            onChange(Math.min(max, value + 1));
            triggerHaptic('selection');
          }}
          className="w-7 h-7 rounded-lg bg-white border border-[#dbe4dc] flex items-center justify-center text-[#15221b] hover:bg-[#eef4f0] active:scale-90 disabled:opacity-40 disabled:pointer-events-none transition-all font-bold text-sm"
        >
          +
        </button>
      </div>
    </div>
  );

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
              className="fill-none stroke-[#215641] transition-all duration-300 ease-linear"
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

        {/* Preset & Custom Selectors */}
        <div className="space-y-4 w-full max-w-sm">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1 bg-[#f1f6f3] p-1 rounded-2xl border border-[#e2ebe3]">
              {[
                { sec: 60, label: '60s' },
                { sec: 90, label: currentLang === 'ar' ? '90s (موصى به)' : '90s (Empfohlen)' },
                { sec: 120, label: '120s' },
              ].map((preset) => (
                <button
                  key={preset.sec}
                  type="button"
                  disabled={isRunning}
                  onClick={() => handleSelectPreset(preset.sec)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 ${
                    !isCustomMode && selectedDuration === preset.sec
                      ? 'bg-[#215641] text-white shadow-xs font-bold'
                      : 'text-[#4f6156] hover:bg-white/50 hover:text-[#15221b]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <span className="w-px h-5 bg-[#e2ebe3] mx-1" />

            <button
              type="button"
              disabled={isRunning}
              onClick={() => {
                setIsCustomMode(!isCustomMode);
                if (!isCustomMode) {
                  const totalSec = customHours * 3600 + customMinutes * 60 + customSeconds;
                  setTimerConfig(totalSec);
                }
                triggerHaptic('light');
              }}
              title={currentLang === 'ar' ? 'تخصيص الوقت' : 'Zeit anpassen'}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all disabled:opacity-40 active:scale-95 ${
                isCustomMode
                  ? 'bg-[#215641] text-white border-transparent shadow-xs'
                  : 'bg-white text-[#4f6156] border-[#dbe4dc] hover:bg-[#edf4ef] hover:text-[#215641]'
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          {/* Tactile Custom Picker Panel */}
          {isCustomMode && (
            <div className="p-3.5 bg-[#fbfcfb] border border-[#e2ebe3] rounded-2xl flex items-center justify-center gap-2 sm:gap-3 shadow-2xs animate-in slide-in-from-top-3 duration-150">
              <CustomUnitCounter
                label={currentLang === 'ar' ? 'ساعة' : 'Std'}
                value={customHours}
                onChange={setCustomHours}
                max={23}
              />
              <CustomUnitCounter
                label={currentLang === 'ar' ? 'دقيقة' : 'Min'}
                value={customMinutes}
                onChange={setCustomMinutes}
                max={59}
              />
              <CustomUnitCounter
                label={currentLang === 'ar' ? 'ثانية' : 'Sek'}
                value={customSeconds}
                onChange={setCustomSeconds}
                max={59}
              />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={togglePlayback}
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
            onClick={resetTimer}
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
        <div className="text-xs text-[#4f6156] leading-relaxed text-right">
          <span className="font-bold text-[#15221b] block mb-0.5 text-right">
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
