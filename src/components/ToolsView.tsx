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
  const isAr = currentLang === 'ar';
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
      titleDe: 'Mobilisation & Stange',
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
    <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-6 py-1 sm:py-2 px-1 animate-in fade-in duration-300">
      {/* Sub-tools Navigation Bar */}
      <div className="grid grid-cols-3 gap-2 bg-[#f4f8f5] p-1.5 rounded-2xl border border-[#e2ebe3]">
        <button
          type="button"
          onClick={() => setActiveTab('plates')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold transition-all active:scale-98 ${
            activeTab === 'plates'
              ? 'bg-[#215641] text-white shadow-xs'
              : 'text-[#5a6e61] hover:text-[#15221b] hover:bg-white/60'
          }`}
        >
          <Dumbbell className="w-4 h-4 flex-shrink-0 stroke-[2.2]" />
          <span className="truncate">{isAr ? 'حاسبة البار' : 'Hantelscheiben'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('onerm')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold transition-all active:scale-98 ${
            activeTab === 'onerm'
              ? 'bg-[#215641] text-white shadow-xs'
              : 'text-[#5a6e61] hover:text-[#15221b] hover:bg-white/60'
          }`}
        >
          <Flame className="w-4 h-4 flex-shrink-0 stroke-[2.2]" />
          <span className="truncate">{isAr ? 'أقصى وزن 1RM' : '1RM & Warmup'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('nutrition')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold transition-all active:scale-98 ${
            activeTab === 'nutrition'
              ? 'bg-[#215641] text-white shadow-xs'
              : 'text-[#5a6e61] hover:text-[#15221b] hover:bg-white/60'
          }`}
        >
          <Droplets className="w-4 h-4 flex-shrink-0 stroke-[2.2]" />
          <span className="truncate">{isAr ? 'الماء والبروتين' : 'Nährstoffe'}</span>
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
            className="bg-white rounded-3xl border border-[#e2ebe3] p-6 sm:p-8 space-y-6 shadow-xs"
          >
            {/* Input Controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-[#15221b] block">
                  {isAr ? 'الوزن الإجمالي المطلوب (كغ):' : 'Gesamtgewicht (kg):'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="400"
                  step="2.5"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                  className="w-full h-12 bg-[#f8faf8] border border-[#d2dfd5] rounded-2xl px-4 text-lg font-black text-[#15221b] focus:outline-none focus:border-[#215641]"
                />

                {/* Steppers */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[-10, -5, -2.5, +2.5, +5, +10].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setTargetWeight((prev) => Math.max(barWeight, prev + step))}
                      className="px-3 py-1.5 bg-[#edf4ef] hover:bg-[#dbe7df] text-[#15221b] text-xs font-extrabold rounded-xl transition-all active:scale-95"
                    >
                      {step > 0 ? `+${step}` : step}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barbell Weight Selector */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-extrabold text-[#15221b] block">
                  {isAr ? 'نوع البار المستخدم:' : 'Hantelstange:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { weight: 20, label: '20 kg (Olympia)' },
                    { weight: 15, label: '15 kg (Frauen)' },
                    { weight: 10, label: '10 kg (Leicht)' },
                  ].map((b) => (
                    <button
                      key={b.weight}
                      type="button"
                      onClick={() => setBarWeight(b.weight)}
                      className={`py-2.5 px-1 text-center rounded-2xl border text-xs font-bold transition-all active:scale-98 ${
                        barWeight === b.weight
                          ? 'bg-[#215641] text-white border-[#215641] shadow-xs'
                          : 'bg-[#f8faf8] text-[#4f6156] border-[#d2dfd5] hover:border-[#b9ccbf]'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Barbell Sleeve Representation */}
            <div className="bg-[#15221b] rounded-3xl p-5 sm:p-6 text-white space-y-4 min-w-0">
              <div className="flex items-center justify-between text-xs text-[#a3b8ac] border-b border-white/10 pb-3">
                <span className="font-semibold">
                  {isAr ? 'الأقراص لكل جهة:' : 'Pro Seite aufstecken:'}
                </span>
                <span className="font-display font-black text-white text-base bg-[#215641] px-3.5 py-1 rounded-xl">
                  {plateResults.perSide} kg
                </span>
              </div>

              {/* Graphic Bar Sleeve */}
              <div
                dir="ltr"
                className="w-full bg-black/40 rounded-2xl p-4 border border-white/10 flex items-center justify-start gap-1.5 overflow-x-auto min-h-[96px]"
              >
                <div className="h-7 w-12 bg-gradient-to-r from-zinc-500 to-zinc-400 rounded-l-md flex-shrink-0 flex items-center justify-center text-[10px] text-zinc-300 font-mono">
                  BAR
                </div>
                <div className="h-16 w-3.5 bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-600 rounded-xs flex-shrink-0 border border-white/20 shadow-md" />
                <div className="h-9 w-2 bg-zinc-400 flex-shrink-0" />

                {plateResults.plates.length === 0 ? (
                  <div className="px-4 text-xs text-zinc-400 italic">
                    {isAr ? 'بار فارغ فقط بدون أقراص' : 'Nur leere Hantelstange'}
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
                        className="h-20 min-w-[36px] px-1 rounded-xl border-2 flex flex-col items-center justify-center font-black text-xs shadow-lg flex-shrink-0"
                      >
                        <span>{p.weight}</span>
                        <span className="text-[9px] opacity-80">kg</span>
                      </div>
                    ))
                  )
                )}

                <div className="h-7 flex-1 min-w-[30px] bg-gradient-to-r from-zinc-500 to-zinc-700 rounded-r-md" />
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {plateResults.plates.map((p) => (
                  <div
                    key={p.weight}
                    className="flex items-center justify-between bg-white/10 border border-white/10 rounded-2xl px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: p.color, borderColor: p.border }}
                      />
                      <span className="font-extrabold">{p.weight} kg</span>
                    </div>
                    <span className="font-black text-[#7be3af]">{p.count}x</span>
                  </div>
                ))}
              </div>

              {plateResults.remainder > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 p-3 rounded-2xl border border-amber-500/30">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {isAr
                      ? `متبقي ${plateResults.remainder * 2} كغ لا يمكن تجزئتها بالقطع المتاحة.`
                      : `Restgewicht von ${plateResults.remainder * 2} kg nicht darstellbar.`}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ---------------- 2. 1RM & WARMUP ---------------- */}
        {activeTab === 'onerm' && (
          <motion.div
            key="onerm-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-[#e2ebe3] p-6 sm:p-8 space-y-6 shadow-xs"
          >
            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#15221b] block">
                  {isAr ? 'الوزن المرفوع (كغ):' : 'Arbeitsgewicht (kg):'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="400"
                  step="2.5"
                  value={oneRmWeight}
                  onChange={(e) => setOneRmWeight(parseFloat(e.target.value) || 0)}
                  className="w-full h-12 bg-[#f8faf8] border border-[#d2dfd5] rounded-2xl px-4 text-base font-black text-[#15221b] focus:outline-none focus:border-[#215641]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#15221b] block">
                  {isAr ? 'التكرارات:' : 'Wiederholungen:'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={oneRmReps}
                  onChange={(e) => setOneRmReps(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-12 bg-[#f8faf8] border border-[#d2dfd5] rounded-2xl px-4 text-base font-black text-[#15221b] focus:outline-none focus:border-[#215641]"
                />
              </div>
            </div>

            {/* 1RM Result Banner */}
            <div className="bg-gradient-to-r from-[#edf4ef] to-[#e4f0e7] border border-[#cbe0d2] rounded-3xl p-6 flex items-center justify-between shadow-2xs">
              <div>
                <div className="text-xs font-extrabold text-[#215641]">
                  {isAr ? 'أقصى وزن تقديري (1RM):' : 'Geschätztes 1RM:'}
                </div>
                <div className="text-xs text-[#6e8276] mt-0.5">
                  {isAr ? 'معادلة إيبلي القياسية' : 'Epley-Formel'}
                </div>
              </div>
              <div className="text-3xl sm:text-4xl font-display font-black text-[#215641]">
                {estimated1RM} kg
              </div>
            </div>

            {/* Warmup Ramp Table */}
            <div className="space-y-3">
              <div className="text-xs font-extrabold text-[#15221b] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#215641]" />
                <span>{isAr ? 'مجموعات التحمية والتجهيز:' : 'Aufwärm-Sätze:'}</span>
              </div>

              <div className="space-y-2">
                {warmupSets.map((ws) => (
                  <div
                    key={ws.set}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-[#e2ebe3] bg-[#fafcfa]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-[#215641] text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                        {ws.set}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-[#15221b]">
                          {isAr ? ws.titleAr : ws.titleDe}
                        </div>
                        <div className="text-[11px] text-[#6e8276]">{ws.percent}</div>
                      </div>
                    </div>
                    <div className="text-right rtl:text-left">
                      <div className="text-sm font-black text-[#215641]">{ws.weight} kg</div>
                      <div className="text-xs font-bold text-[#5a6e61]">
                        {isAr ? ws.repsAr : ws.reps}
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
            className="bg-white rounded-3xl border border-[#e2ebe3] p-6 sm:p-8 space-y-6 shadow-xs"
          >
            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#15221b] block">
                  {isAr ? 'وزن الجسم (كغ):' : 'Körpergewicht (kg):'}
                </label>
                <input
                  type="number"
                  min="40"
                  max="180"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(parseFloat(e.target.value) || 70)}
                  className="w-full h-12 bg-[#f8faf8] border border-[#d2dfd5] rounded-2xl px-4 text-base font-black text-[#15221b] focus:outline-none focus:border-[#215641]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#15221b] block">
                  {isAr ? 'الهدف:' : 'Ziel:'}
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
                      className={`py-2.5 px-1 text-center rounded-2xl border text-xs font-extrabold transition-all active:scale-98 ${
                        fitnessGoal === g.id
                          ? 'bg-[#215641] text-white border-[#215641] shadow-xs'
                          : 'bg-[#f8faf8] text-[#4f6156] border-[#d2dfd5] hover:border-[#b9ccbf]'
                      }`}
                    >
                      {isAr ? g.ar : g.de}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#f0f7ff] border border-[#cbe2fc] rounded-3xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? 'الماء اليومي' : 'Tägliches Wasser'}</span>
                </div>
                <div className="text-3xl font-display font-black text-blue-900">
                  {totalWaterLiters} {isAr ? 'لتر' : 'Liter'}
                </div>
                <div className="text-xs font-semibold text-blue-700">
                  {isAr ? `ca. ${waterGlasses} أكواب ماء` : `ca. ${waterGlasses} Gläser (250ml)`}
                </div>
              </div>

              <div className="bg-[#f1f8f3] border border-[#c0dfcb] rounded-3xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-[#15221b] font-extrabold text-xs">
                  <Flame className="w-4 h-4 text-[#215641]" />
                  <span>{isAr ? 'البروتين اليومي' : 'Tägliches Protein'}</span>
                </div>
                <div className="text-3xl font-display font-black text-[#215641]">
                  {totalProtein} g
                </div>
                <div className="text-xs font-semibold text-[#4f6156]">
                  {isAr ? `ca. ${proteinPerMeal}غ / ٤ وجبات` : `ca. ${proteinPerMeal}g / 4 Mahlzeiten`}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
