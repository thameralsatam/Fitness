import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calculator,
  Dumbbell,
  Droplets,
  Flame,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Language } from '../types';
import { I18N } from '../data/workoutData';

interface ToolsViewProps {
  currentLang: Language;
}

type ToolTab = 'plates' | 'onerm' | 'nutrition';

export const ToolsView: React.FC<ToolsViewProps> = ({ currentLang }) => {
  const t = I18N[currentLang];
  const [activeTab, setActiveTab] = useState<ToolTab>('plates');

  // --- 1. Plate Calculator State ---
  const [targetWeight, setTargetWeight] = useState<number>(80);
  const [barWeight, setBarWeight] = useState<number>(20);

  const AVAILABLE_PLATES = [
    { weight: 25, color: '#dc2626', text: '#ffffff', label: '25 kg', border: '#b91c1c' },
    { weight: 20, color: '#2563eb', text: '#ffffff', label: '20 kg', border: '#1d4ed8' },
    { weight: 15, color: '#eab308', text: '#15221b', label: '15 kg', border: '#ca8a04' },
    { weight: 10, color: '#16a34a', text: '#ffffff', label: '10 kg', border: '#15803d' },
    { weight: 5, color: '#ffffff', text: '#15221b', label: '5 kg', border: '#cbd5e1' },
    { weight: 2.5, color: '#1e293b', text: '#ffffff', label: '2.5 kg', border: '#0f172a' },
    { weight: 1.25, color: '#94a3b8', text: '#ffffff', label: '1.25 kg', border: '#64748b' },
  ];

  const calculatePlates = () => {
    let weightPerSide = Math.max(0, (targetWeight - barWeight) / 2);
    const result: { weight: number; count: number; color: string; text: string; border: string; label: string }[] = [];

    for (const plate of AVAILABLE_PLATES) {
      if (weightPerSide >= plate.weight) {
        const count = Math.floor(weightPerSide / plate.weight);
        result.push({
          weight: plate.weight,
          count,
          color: plate.color,
          text: plate.text,
          border: plate.border,
          label: plate.label,
        });
        weightPerSide = Math.round((weightPerSide - count * plate.weight) * 100) / 100;
      }
    }

    return {
      perSide: Math.max(0, (targetWeight - barWeight) / 2),
      plates: result,
      remainder: weightPerSide,
    };
  };

  const plateResults = calculatePlates();

  // --- 2. 1RM & Warmup State ---
  const [oneRmWeight, setOneRmWeight] = useState<number>(75);
  const [oneRmReps, setOneRmReps] = useState<number>(6);

  const estimated1RM = Math.round(oneRmWeight * (1 + oneRmReps / 30));

  const warmupSets = [
    {
      set: 1,
      titleDe: 'Allgemeine Mobilisation & Stange',
      titleAr: 'تحمية عامة ومسار البار',
      weight: Math.min(20, oneRmWeight),
      reps: '10 Wdh.',
      repsAr: '١٠ تكرارات',
      percent: '20kg (Empty Bar)',
    },
    {
      set: 2,
      titleDe: 'Leichte Aktivierung (50%)',
      titleAr: 'تفعيل خفيف (٥٠٪)',
      weight: Math.round((oneRmWeight * 0.5) / 2.5) * 2.5,
      reps: '5 Wdh.',
      repsAr: '٥ تكرارات',
      percent: '50% des Arbeitsgewichts',
    },
    {
      set: 3,
      titleDe: 'Neuromuskulärer Aufbau (70%)',
      titleAr: 'تجهيز عصبي حركي (٧٠٪)',
      weight: Math.round((oneRmWeight * 0.7) / 2.5) * 2.5,
      reps: '3 Wdh.',
      repsAr: '٣ تكرارات',
      percent: '70% des Arbeitsgewichts',
    },
    {
      set: 4,
      titleDe: 'Nervensystem-Vorbereitung (85%)',
      titleAr: 'إيقاظ الجهاز العصبي (٨٥٪)',
      weight: Math.round((oneRmWeight * 0.85) / 2.5) * 2.5,
      reps: '1 Wdh.',
      repsAr: '١ تكرار فقط (بدون إرهاق)',
      percent: '85% des Arbeitsgewichts',
    },
  ];

  // --- 3. Nutrition & Water State ---
  const [bodyWeight, setBodyWeight] = useState<number>(75);
  const [fitnessGoal, setFitnessGoal] = useState<'bulk' | 'cut' | 'maintain'>('bulk');

  const proteinRatio = fitnessGoal === 'cut' ? 2.2 : fitnessGoal === 'bulk' ? 1.8 : 2.0;
  const totalProtein = Math.round(bodyWeight * proteinRatio);
  const totalWaterLiters = (Math.round((bodyWeight * 0.038 + 0.5) * 10) / 10).toFixed(1);
  const waterGlasses = Math.round(parseFloat(totalWaterLiters) / 0.25);
  const proteinPerMeal = Math.round(totalProtein / 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full max-w-full min-w-0 space-y-5"
    >
      {/* Header */}
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#eef4f0] text-[#215641] flex items-center justify-center flex-shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[#15221b] tracking-tight">
            {t.toolsTitle}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#4f6156] leading-relaxed">
          {t.toolsDesc}
        </p>
      </div>

      {/* Sub-tools Navigation Tabs */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('plates')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-98 ${
            activeTab === 'plates'
              ? 'bg-[#215641] border-[#215641] text-white shadow-xs'
              : 'bg-white border-[#dbe4dc] text-[#4f6156] hover:text-[#15221b] hover:border-[#c5d7cc]'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{currentLang === 'ar' ? 'حاسبة البار' : 'Hantelscheiben'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('onerm')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-98 ${
            activeTab === 'onerm'
              ? 'bg-[#215641] border-[#215641] text-white shadow-xs'
              : 'bg-white border-[#dbe4dc] text-[#4f6156] hover:text-[#15221b] hover:border-[#c5d7cc]'
          }`}
        >
          <Flame className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{currentLang === 'ar' ? 'أقصى وزن 1RM' : '1RM & Warmup'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('nutrition')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all active:scale-98 ${
            activeTab === 'nutrition'
              ? 'bg-[#215641] border-[#215641] text-white shadow-xs'
              : 'bg-white border-[#dbe4dc] text-[#4f6156] hover:text-[#15221b] hover:border-[#c5d7cc]'
          }`}
        >
          <Droplets className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{currentLang === 'ar' ? 'الماء والبروتين' : 'Nährstoffe'}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ---------------- 1. PLATE CALCULATOR ---------------- */}
        {activeTab === 'plates' && (
          <motion.div
            key="plates-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-[#dbe4dc] p-4 sm:p-6 space-y-5 shadow-xs"
          >
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base sm:text-lg text-[#15221b]">
                {t.plateCalcTitle}
              </h3>
              <p className="text-xs text-[#4f6156]">{t.plateCalcDesc}</p>
            </div>

            {/* Controls: Target Weight + Bar Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target Weight with Quick adjust buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#15221b] block">
                  {currentLang === 'ar' ? 'الوزن الإجمالي المطلوب (كغ):' : 'Gesamtgewicht (kg):'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="400"
                    step="2.5"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                    className="w-full h-11 bg-[#f8faf8] border border-[#dbe4dc] rounded-xl px-3.5 text-base font-bold text-[#15221b] focus:outline-none focus:border-[#215641]"
                  />
                </div>

                {/* Quick Steppers */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[-10, -5, -2.5, +2.5, +5, +10].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setTargetWeight((prev) => Math.max(barWeight, prev + step))}
                      className="px-2 py-1 bg-[#edf4ef] hover:bg-[#dbe7df] text-[#15221b] text-[11px] font-bold rounded-lg transition-colors active:scale-95"
                    >
                      {step > 0 ? `+${step}` : step}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barbell Weight */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#15221b] block">
                  {currentLang === 'ar' ? 'نوع ووزن البار:' : 'Hantelstange:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { weight: 20, label: '20 kg (Olympia)' },
                    { weight: 15, label: '15 kg (Women)' },
                    { weight: 10, label: '10 kg (Light)' },
                  ].map((b) => (
                    <button
                      key={b.weight}
                      type="button"
                      onClick={() => setBarWeight(b.weight)}
                      className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all active:scale-98 ${
                        barWeight === b.weight
                          ? 'bg-[#215641] text-white border-[#215641]'
                          : 'bg-[#f8faf8] text-[#4f6156] border-[#dbe4dc] hover:border-[#b9ccbf]'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Barbell Sleeve Representation - Forced LTR for 100% visibility & predictable layout */}
            <div className="bg-[#15221b] rounded-2xl p-4 sm:p-5 text-white space-y-4 min-w-0">
              <div className="flex items-center justify-between text-xs text-[#a3b8ac] border-b border-white/10 pb-3">
                <span className="font-medium">
                  {currentLang === 'ar' ? 'الأقراص لكل جهة (Per Side):' : 'Pro Seite aufstecken:'}
                </span>
                <span className="font-display font-black text-white text-base bg-[#215641] px-3 py-1 rounded-xl">
                  {plateResults.perSide} kg
                </span>
              </div>

              {/* Graphic Bar Sleeve - dir="ltr" ensures the sleeve is anchored on the left */}
              <div
                dir="ltr"
                className="w-full bg-black/40 rounded-2xl p-3 border border-white/10 flex items-center justify-start gap-1 overflow-x-auto min-h-[90px]"
              >
                {/* Bar Center & Collar */}
                <div className="h-6 w-12 bg-gradient-to-r from-zinc-500 to-zinc-400 rounded-l-md flex-shrink-0 flex items-center justify-center text-[10px] text-zinc-300 font-mono">
                  BAR
                </div>
                <div className="h-16 w-3 bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-600 rounded-sm flex-shrink-0 border border-white/20 shadow-md" />
                <div className="h-8 w-2 bg-zinc-400 flex-shrink-0" />

                {/* Plates Stack */}
                {plateResults.plates.length === 0 ? (
                  <div className="px-4 text-xs text-zinc-400 italic">
                    {currentLang === 'ar' ? 'بار فارغ فقط بدون أقراص' : 'Nur leere Hantelstange'}
                  </div>
                ) : (
                  plateResults.plates.flatMap((p) =>
                    Array.from({ length: p.count }).map((_, idx) => (
                      <div
                        key={`${p.weight}-${idx}`}
                        style={{
                          backgroundColor: p.color,
                          color: p.text,
                          borderColor: p.border,
                        }}
                        className="h-20 min-w-[34px] px-1 rounded-lg border-2 flex flex-col items-center justify-center font-black text-xs shadow-lg transition-transform hover:scale-105 flex-shrink-0"
                      >
                        <span>{p.weight}</span>
                        <span className="text-[9px] opacity-80">kg</span>
                      </div>
                    ))
                  )
                )}

                {/* Sleeve Extension Bar */}
                <div className="h-6 flex-1 min-w-[30px] bg-gradient-to-r from-zinc-500 to-zinc-700 rounded-r-md" />
              </div>

              {/* Clear Explicit Breakdown Cards */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#a3b8ac]">
                  {currentLang === 'ar' ? 'تفاصيل الأقراص المطلوب تركيبها:' : 'Scheiben-Zusammenstellung:'}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {plateResults.plates.length === 0 ? (
                    <div className="col-span-full text-xs text-zinc-400 italic py-1">
                      {currentLang === 'ar'
                        ? 'لا حاجة لأي أقراص، وزن البار كافٍ.'
                        : 'Keine Zusatzscheiben erforderlich.'}
                    </div>
                  ) : (
                    plateResults.plates.map((p) => (
                      <div
                        key={p.weight}
                        className="flex items-center justify-between bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 border"
                            style={{ backgroundColor: p.color, borderColor: p.border }}
                          />
                          <span className="font-bold">{p.weight} kg</span>
                        </div>
                        <span className="font-extrabold text-[#7be3af]">
                          {p.count} {currentLang === 'ar' ? 'قرص' : 'Stk.'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {plateResults.remainder > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 p-3 rounded-xl border border-amber-500/30">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {currentLang === 'ar'
                      ? `متبقي ${plateResults.remainder * 2} كغ لا يمكن تجزئتها بالأقراص المتوفرة.`
                      : `Restgewicht von ${plateResults.remainder * 2} kg nicht darstellbar.`}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ---------------- 2. 1RM & WARMUP PYRAMID ---------------- */}
        {activeTab === 'onerm' && (
          <motion.div
            key="onerm-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-[#dbe4dc] p-4 sm:p-6 space-y-5 shadow-xs"
          >
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base sm:text-lg text-[#15221b]">
                {t.oneRmTitle}
              </h3>
              <p className="text-xs text-[#4f6156]">{t.oneRmDesc}</p>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#15221b] block">
                  {currentLang === 'ar' ? 'الوزن الحالي المرفوع (كغ):' : 'Aktuelles Arbeitsgewicht (kg):'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="400"
                  step="2.5"
                  value={oneRmWeight}
                  onChange={(e) => setOneRmWeight(parseFloat(e.target.value) || 0)}
                  className="w-full h-11 bg-[#f8faf8] border border-[#dbe4dc] rounded-xl px-3.5 text-base font-bold text-[#15221b] focus:outline-none focus:border-[#215641]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#15221b] block">
                  {currentLang === 'ar' ? 'عدد التكرارات المنجزة:' : 'Wiederholungen:'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={oneRmReps}
                  onChange={(e) => setOneRmReps(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-11 bg-[#f8faf8] border border-[#dbe4dc] rounded-xl px-3.5 text-base font-bold text-[#15221b] focus:outline-none focus:border-[#215641]"
                />
              </div>
            </div>

            {/* 1RM Result Banner */}
            <div className="bg-[#eef4f0] border border-[#bad3c3] rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#4f6156]">
                  {currentLang === 'ar' ? 'أقصى وزن تقديري (1RM):' : 'Geschätztes Maximalgewicht (1RM):'}
                </div>
                <div className="text-[11px] text-[#75877d]">
                  {currentLang === 'ar' ? 'معادلة إيبلي المعتمدة' : 'Nach Epley-Formel'}
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-display font-black text-[#215641]">
                {estimated1RM} kg
              </div>
            </div>

            {/* Warmup Ramp Table */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#15221b] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#215641]" />
                <span>
                  {currentLang === 'ar' ? 'خطة الإحماء المحكم للمفاصل:' : 'Dein intelligenter Aufwärm-Plan:'}
                </span>
              </div>

              <div className="space-y-2">
                {warmupSets.map((ws) => (
                  <div
                    key={ws.set}
                    className="flex items-center justify-between p-3 rounded-2xl border border-[#dbe4dc] bg-[#fafcfa]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-[#215641] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {ws.set}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#15221b]">
                          {currentLang === 'ar' ? ws.titleAr : ws.titleDe}
                        </div>
                        <div className="text-[11px] text-[#75877d]">{ws.percent}</div>
                      </div>
                    </div>
                    <div className="text-right rtl:text-left">
                      <div className="text-sm font-black text-[#215641]">{ws.weight} kg</div>
                      <div className="text-[11px] font-semibold text-[#4f6156]">
                        {currentLang === 'ar' ? ws.repsAr : ws.reps}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ---------------- 3. NUTRITION & WATER CALCULATOR ---------------- */}
        {activeTab === 'nutrition' && (
          <motion.div
            key="nutrition-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-[#dbe4dc] p-4 sm:p-6 space-y-5 shadow-xs"
          >
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base sm:text-lg text-[#15221b]">
                {t.nutritionTitle}
              </h3>
              <p className="text-xs text-[#4f6156]">{t.nutritionDesc}</p>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#15221b] block">
                  {currentLang === 'ar' ? 'وزن الجسم (كغ):' : 'Körpergewicht (kg):'}
                </label>
                <input
                  type="number"
                  min="40"
                  max="180"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(parseFloat(e.target.value) || 70)}
                  className="w-full h-11 bg-[#f8faf8] border border-[#dbe4dc] rounded-xl px-3.5 text-base font-bold text-[#15221b] focus:outline-none focus:border-[#215641]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#15221b] block">
                  {currentLang === 'ar' ? 'الهدف الرياضي:' : 'Trainingsziel:'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'bulk', de: 'Aufbau', ar: 'تضخيم' },
                    { id: 'maintain', de: 'Halten', ar: 'ثبات' },
                    { id: 'cut', de: 'Definieren', ar: 'تنشيف' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFitnessGoal(g.id as 'bulk' | 'cut' | 'maintain')}
                      className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all active:scale-98 ${
                        fitnessGoal === g.id
                          ? 'bg-[#215641] text-white border-[#215641]'
                          : 'bg-[#f8faf8] text-[#4f6156] border-[#dbe4dc]'
                      }`}
                    >
                      {currentLang === 'ar' ? g.ar : g.de}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Water Card */}
              <div className="bg-[#f0f7ff] border border-[#cbe2fc] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500 text-white">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-[#0f2d4a]">
                      {currentLang === 'ar' ? 'الماء اليومي الموصى به' : 'Täglicher Wasserbedarf'}
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-display font-black text-blue-900">
                  {totalWaterLiters} {currentLang === 'ar' ? 'لتر' : 'Liter'}
                </div>
                <div className="text-[11px] text-blue-700">
                  {currentLang === 'ar'
                    ? `ما يعادل تقريباً ${waterGlasses} كوب ماء (٢٥٠ مل) يومياً.`
                    : `Entspricht ca. ${waterGlasses} Gläsern Wasser (250ml) pro Tag.`}
                </div>
              </div>

              {/* Protein Card */}
              <div className="bg-[#f1f8f3] border border-[#c0dfcb] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#215641] text-white">
                      <Flame className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-[#15221b]">
                      {currentLang === 'ar' ? 'البروتين اليومي المستهدف' : 'Tägliches Protein'}
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-display font-black text-[#215641]">
                  {totalProtein} g
                </div>
                <div className="text-[11px] text-[#4f6156]">
                  {currentLang === 'ar'
                    ? `مقسمة على ٤ وجبات بمعدل ${proteinPerMeal}غ بروتين لكل وجبة.`
                    : `Aufgeteilt auf 4 Mahlzeiten mit je ca. ${proteinPerMeal}g Protein.`}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
