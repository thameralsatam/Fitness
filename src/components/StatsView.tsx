import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  BookOpen,
  Sparkles,
  Flame,
  Moon,
  Apple,
  ShieldCheck,
  Award,
  History,
  Pencil,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Dumbbell,
  BarChart2,
  Layers,
  Clock,
  Activity,
} from 'lucide-react';
import { Language, ProgressionPhase, MuscleVolume, WorkoutPlan } from '../types';
import { 
  I18N, 
  PHASES_DATA, 
  EXERCISES_DATA,
  getPlanMuscleDistribution,
  getPlanRepRangeSummary
} from '../data/workoutData';

export interface SessionLog {
  id: string;
  date: string;
  timestamp: number;
  completedExerciseIds: number[];
  exercisesCompleted: number;
  totalExercises: number;
  notes?: string;
}

interface StatsViewProps {
  currentLang: Language;
  completedExercises?: Set<number>;
  totalSessions: number;
  plan?: WorkoutPlan;
  onUpdateTrainingDays?: (days: number[]) => void;
}

type StatsSubTab = 'overview' | 'logbook' | 'guidelines';
type OverviewSection = 'machines' | 'progression' | 'rhythm' | 'volume' | null;

export const StatsView: React.FC<StatsViewProps> = ({
  currentLang,
  completedExercises,
  plan,
  onUpdateTrainingDays,
}) => {
  const t = I18N[currentLang];
  const isAr = currentLang === 'ar';
  const [activeSubTab, setActiveSubTab] = useState<StatsSubTab>('overview');

  const exercises = plan ? plan.exercises : EXERCISES_DATA;
  const totalExercisesCount = exercises.length;
  const allExerciseIds = exercises.map((e) => e.id);
  const trainingDays = plan?.trainingDays ?? [0, 2, 4];
  const muscleDistData = getPlanMuscleDistribution(exercises);
  const planNotes = plan ? (currentLang === 'de' ? plan.notesDe : plan.notesAr) : t.notes;

  // Single active section state (accordion) to keep the layout clean & un-cluttered
  const [activeSection, setActiveSection] = useState<OverviewSection>('machines');

  const toggleSection = (section: OverviewSection) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  // Stored Session Logs in localStorage
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>(() => {
    try {
      const saved = localStorage.getItem('gym_session_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'seed_1',
        date: isAr ? 'الجلسة السابقة (الأربعاء)' : 'Vorherige Einheit (Mi)',
        timestamp: Date.now() - 2 * 24 * 3600 * 1000,
        completedExerciseIds: allExerciseIds,
        exercisesCompleted: totalExercisesCount,
        totalExercises: totalExercisesCount,
        notes: isAr 
          ? `التزام تام بجميع الأجهزة ${totalExercisesCount} مع RIR 2` 
          : `Alle ${totalExercisesCount} Geräte mit RIR 2 absolviert`,
      },
    ];
  });

  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logNotesInput, setLogNotesInput] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>(allExerciseIds);
  const [showLogSuccessToast, setShowLogSuccessToast] = useState(false);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set(['seed_1']));

  // Persist session logs
  useEffect(() => {
    try {
      localStorage.setItem('gym_session_logs', JSON.stringify(sessionLogs));
    } catch {
      // fallback
    }
  }, [sessionLogs]);

  const handleOpenNewLogForm = () => {
    setEditingLogId(null);
    setLogNotesInput('');
    if (completedExercises && completedExercises.size > 0) {
      setSelectedExerciseIds(Array.from(completedExercises));
    } else {
      setSelectedExerciseIds(allExerciseIds);
    }
    setIsLogFormOpen(true);
  };

  const handleEditLog = (log: SessionLog) => {
    setEditingLogId(log.id);
    setLogNotesInput(log.notes || '');
    setSelectedExerciseIds(log.completedExerciseIds || allExerciseIds);
    setIsLogFormOpen(true);
  };

  const handleToggleExerciseInForm = (id: number) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveSessionLog = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (editingLogId) {
      setSessionLogs((prev) =>
        prev.map((log) => {
          if (log.id === editingLogId) {
            return {
              ...log,
              completedExerciseIds: selectedExerciseIds,
              exercisesCompleted: selectedExerciseIds.length,
              totalExercises: totalExercisesCount,
              notes: logNotesInput.trim() || undefined,
            };
          }
          return log;
        })
      );
    } else {
      const now = new Date();
      const formattedDate = isAr
        ? now.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : now.toLocaleDateString('de-DE', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

      const newLog: SessionLog = {
        id: `log_${Date.now()}`,
        date: formattedDate,
        timestamp: Date.now(),
        completedExerciseIds: selectedExerciseIds,
        exercisesCompleted: selectedExerciseIds.length,
        totalExercises: totalExercisesCount,
        notes: logNotesInput.trim() || undefined,
      };

      setSessionLogs((prev) => [newLog, ...prev]);
    }

    setLogNotesInput('');
    setIsLogFormOpen(false);
    setEditingLogId(null);
    setShowLogSuccessToast(true);
    setTimeout(() => setShowLogSuccessToast(false), 3000);
  };

  const handleDeleteLog = (id: string) => {
    setSessionLogs((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleExpandLog = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Compute Stats
  const totalLoggedSessionsCount = sessionLogs.length;
  const avgCompletionRate =
    totalLoggedSessionsCount > 0 && totalExercisesCount > 0
      ? Math.round(
          (sessionLogs.reduce(
            (acc, log) =>
              acc +
              (log.completedExerciseIds ? log.completedExerciseIds.length : log.exercisesCompleted) /
                (log.totalExercises || totalExercisesCount),
            0
          ) /
            totalLoggedSessionsCount) *
            100
        )
      : 0;

  const machineFrequencyMap: Record<number, number> = {};
  sessionLogs.forEach((log) => {
    const ids = log.completedExerciseIds || allExerciseIds;
    ids.forEach((id) => {
      machineFrequencyMap[id] = (machineFrequencyMap[id] || 0) + 1;
    });
  });

  const guidanceRules = isAr
    ? [
        {
          icon: <Flame className="w-4 h-4 text-[#215641]" />,
          title: 'معيار الجهد RIR 2',
          desc: 'التوقف قبل الفشل العضلي بتكرارين يحمي مفاصلك ويضمن الاستشفاء السريع للجلسة القادمة.',
        },
        {
          icon: <Moon className="w-4 h-4 text-[#215641]" />,
          title: 'النوم العميق (7-8 ساعات)',
          desc: 'البناء العضلي الفعلي وإفراز هرمون النمو يحدث أثناء فترات النوم المتصلة والمريحة.',
        },
        {
          icon: <Apple className="w-4 h-4 text-[#215641]" />,
          title: 'البروتين والسوائل',
          desc: 'احرص على تناول 1.6 إلى 2 غرام بروتين لكل كغ من وزنك مع شرب 3 لترات ماء يومياً.',
        },
        {
          icon: <ShieldCheck className="w-4 h-4 text-[#215641]" />,
          title: 'أسبوع تخفيف الحمل (Deload)',
          desc: 'كل 8-10 أسابيع خفف الأحمال بمقدار 40% لتجديد الجهاز العصبي وحماية الأوتار.',
        },
      ]
    : [
        {
          icon: <Flame className="w-4 h-4 text-[#215641]" />,
          title: 'RIR 2 Belastungsnorm',
          desc: '2 Wiederholungen vor dem Muskelversagen stoppen schützt Gelenke und fördert Regeneration.',
        },
        {
          icon: <Moon className="w-4 h-4 text-[#215641]" />,
          title: '7–8 Stunden Tiefschlaf',
          desc: 'Muskelhypertrophie und Hormonausschüttung finden primär im Schlaf statt.',
        },
        {
          icon: <Apple className="w-4 h-4 text-[#215641]" />,
          title: 'Protein & Hydration',
          desc: '1,6–2,0g Protein pro kg Körpergewicht und mind. 2,5–3 Liter Wasser täglich.',
        },
        {
          icon: <ShieldCheck className="w-4 h-4 text-[#215641]" />,
          title: 'Geplanter Deload',
          desc: 'Alle 8–10 Wochen das Volumen um 40% reduzieren zur Entlastung des ZNS.',
        },
      ];

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-6 py-1 sm:py-2 px-1 animate-in fade-in duration-300">
      {/* Sub-Navigation Tabs */}
      <div className="grid grid-cols-3 gap-2 bg-[#f4f8f5] p-1.5 rounded-2xl border border-[#e2ebe3]">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold transition-all active:scale-98 ${
            activeSubTab === 'overview'
              ? 'bg-[#215641] text-white shadow-xs'
              : 'text-[#5a6e61] hover:text-[#15221b] hover:bg-white/60'
          }`}
        >
          <BarChart2 className="w-4 h-4 flex-shrink-0 stroke-[2.2]" />
          <span className="truncate">{isAr ? 'الإحصائيات' : 'Übersicht'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logbook')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold transition-all active:scale-98 ${
            activeSubTab === 'logbook'
              ? 'bg-[#215641] text-white shadow-xs'
              : 'text-[#5a6e61] hover:text-[#15221b] hover:bg-white/60'
          }`}
        >
          <History className="w-4 h-4 flex-shrink-0 stroke-[2.2]" />
          <span className="truncate">{isAr ? 'السجل' : 'Tagebuch'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('guidelines')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-bold transition-all active:scale-98 ${
            activeSubTab === 'guidelines'
              ? 'bg-[#215641] text-white shadow-xs'
              : 'text-[#5a6e61] hover:text-[#15221b] hover:bg-white/60'
          }`}
        >
          <BookOpen className="w-4 h-4 flex-shrink-0 stroke-[2.2]" />
          <span className="truncate">{isAr ? 'القواعد' : 'Regeln'}</span>
        </button>
      </div>

      {/* Sub-view Content */}
      <AnimatePresence mode="wait">
        {/* 1. OVERVIEW SUB-VIEW (Single Accordion to avoid overcrowding) */}
        {activeSubTab === 'overview' && (
          <motion.div
            key="overview-sub"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Accordion Item 1: Machine Statistics */}
            <div className="bg-white rounded-3xl border border-[#e2ebe3] shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleSection('machines')}
                className="w-full p-5 sm:p-6 flex items-center justify-between text-start hover:bg-[#fcfdfc] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-[#15221b]">
                      {isAr ? 'إحصائيات إنجاز الأجهزة' : 'Geräte-Statistik'}
                    </h3>
                    <p className="text-xs text-[#6e8276] mt-0.5">
                      {isAr ? 'مرات تنفيذ كل جهاز محلياً' : 'Absolvierte Geräte-Einheiten'}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#f1f6f3] text-[#4f6156] flex items-center justify-center flex-shrink-0">
                  {activeSection === 'machines' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              <AnimatePresence>
                {activeSection === 'machines' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 sm:px-6 pb-6 pt-1 border-t border-[#edf4ef]"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {exercises.map((ex) => {
                        const count = machineFrequencyMap[ex.id] || 0;
                        const pct = totalLoggedSessionsCount > 0 ? Math.round((count / totalLoggedSessionsCount) * 100) : 0;
                        return (
                          <div
                            key={ex.id}
                            className="p-3.5 rounded-2xl bg-[#fafcfa] border border-[#e2ebe3] flex items-center justify-between gap-3 min-w-0"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-xs text-[#15221b] truncate">
                                {ex.id}. {ex.nameDe}
                              </div>
                              <div className="text-[11px] text-[#6e8276] truncate mt-0.5">
                                {isAr ? ex.muscleAr : ex.muscleDe}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-display font-black text-xs text-[#215641] block">
                                {count} {isAr ? 'مرات' : 'Mal'}
                              </span>
                              <span className="text-[10px] text-[#95a59c] font-mono">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion Item 2: Multi-Week Progression Plan */}
            <div className="bg-white rounded-3xl border border-[#e2ebe3] shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleSection('progression')}
                className="w-full p-5 sm:p-6 flex items-center justify-between text-start hover:bg-[#fcfdfc] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-[#15221b]">
                      {t.statsProgTitle}
                    </h3>
                    <p className="text-xs text-[#6e8276] mt-0.5">
                      {t.statsProgBadge}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#f1f6f3] text-[#4f6156] flex items-center justify-center flex-shrink-0">
                  {activeSection === 'progression' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              <AnimatePresence>
                {activeSection === 'progression' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 sm:px-6 pb-6 pt-1 border-t border-[#edf4ef]"
                  >
                    <div className="space-y-2.5 pt-2">
                      {PHASES_DATA.map((phase: ProgressionPhase, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            phase.isCurrent
                              ? 'bg-[#f1f6f3] border-[#bad3c3]'
                              : 'bg-[#f8faf8] border-[#e2ebe3]'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="font-display font-extrabold text-xs sm:text-sm text-[#15221b]">
                              {currentLang === 'de' ? phase.weekDe : phase.weekAr}
                            </div>
                            <div className="text-xs text-[#5a6e61]">
                              {currentLang === 'de' ? phase.focusDe : phase.focusAr}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {phase.sessions.map((done, sIdx) => (
                              <span
                                key={sIdx}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                                  done
                                    ? 'bg-[#215641] text-white'
                                    : 'bg-white border border-[#d2dfd5] text-[#75877d]'
                                }`}
                              >
                                {sIdx + 1}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion Item 3: Weekday Rhythm Breakdown */}
            <div className="bg-white rounded-3xl border border-[#e2ebe3] shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleSection('rhythm')}
                className="w-full p-5 sm:p-6 flex items-center justify-between text-start hover:bg-[#fcfdfc] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-[#15221b]">
                      {t.statsWeekTitle}
                    </h3>
                    <p className="text-xs font-bold text-[#215641] mt-0.5">
                      {trainingDays.length} {isAr ? 'أيام تمرين أسبوعياً (توزيع مخصص)' : 'Tage pro Woche (Individuell)'}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#f1f6f3] text-[#4f6156] flex items-center justify-center flex-shrink-0">
                  {activeSection === 'rhythm' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              <AnimatePresence>
                {activeSection === 'rhythm' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 sm:px-6 pb-6 pt-1 border-t border-[#edf4ef] space-y-3"
                  >
                    <p className="text-[11px] text-[#6e8276] font-medium pt-1">
                      {isAr
                        ? 'انقر على الأيام لتحديد أو تعديل جدول تمرينك الأسبوعي المفضّل:'
                        : 'Klicke auf die Tage, um deine aktiven Trainingstage festzulegen:'}
                    </p>

                    <div className="grid grid-cols-7 gap-1.5 text-center min-w-0">
                      {t.days.map((day, idx) => {
                        const isTraining = trainingDays.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const nextDays = isTraining
                                ? trainingDays.filter((d) => d !== idx)
                                : [...trainingDays, idx].sort((a, b) => a - b);
                              if (onUpdateTrainingDays) {
                                onUpdateTrainingDays(nextDays);
                              }
                            }}
                            className={`py-3 px-1 rounded-2xl flex flex-col items-center gap-2 border transition-all active:scale-95 ${
                              isTraining
                                ? 'bg-[#215641] text-white border-[#215641] shadow-2xs'
                                : 'bg-[#f8faf8] border-[#e2ebe3] text-[#4f6156] hover:border-[#bad3c3]'
                            }`}
                          >
                            <span className="text-xs font-extrabold truncate w-full">
                              {day}
                            </span>
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isTraining ? 'bg-emerald-300' : 'bg-[#d2dfd5]'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion Item 4: Muscle Volume Breakdown */}
            <div className="bg-white rounded-3xl border border-[#e2ebe3] shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleSection('volume')}
                className="w-full p-5 sm:p-6 flex items-center justify-between text-start hover:bg-[#fcfdfc] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0">
                    <Layers className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-[#15221b]">
                      {t.statsVolumeTitle}
                    </h3>
                    <p className="text-xs text-[#6e8276] mt-0.5">
                      {t.statsVolumeBadge}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#f1f6f3] text-[#4f6156] flex items-center justify-center flex-shrink-0">
                  {activeSection === 'volume' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              <AnimatePresence>
                {activeSection === 'volume' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 sm:px-6 pb-6 pt-1 border-t border-[#edf4ef]"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 min-w-0">
                      {muscleDistData.map((m: MuscleVolume, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3.5 bg-[#f8faf8] rounded-2xl border border-[#e2ebe3] min-w-0 gap-2"
                        >
                          <span className="text-xs font-bold text-[#15221b] truncate">
                            {currentLang === 'de' ? m.nameDe : m.nameAr}
                          </span>
                          <span className="font-display font-black text-xs text-[#215641] flex-shrink-0">
                            {currentLang === 'de' ? m.setsDe : m.setsAr}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* 2. LOGBOOK & DOCUMENTATION SUB-VIEW */}
        {activeSubTab === 'logbook' && (
          <motion.div
            key="logbook-sub"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Quick Log Action Card */}
            <div className="bg-gradient-to-br from-[#1b4332] to-[#15221b] text-white rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 border border-[#23382c]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#7be3af] shadow-xs">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                      {isAr ? 'توثيق أجهزة جلسة اليوم' : 'Geräte der Einheit protokollieren'}
                    </h3>
                    <p className="text-xs text-[#a3b8ac] mt-0.5">
                      {isAr ? 'حدد الأجهزة المنفذة اليوم' : 'Wähle die absolvierten Geräte'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenNewLogForm}
                  className="px-4 py-2 bg-[#7be3af] hover:bg-[#68d19d] text-[#15221b] font-black text-xs rounded-2xl transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{isAr ? 'توثيق' : 'Protokollieren'}</span>
                </button>
              </div>

              {/* Form Drawer */}
              <AnimatePresence>
                {isLogFormOpen && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSaveSessionLog}
                    className="pt-4 border-t border-white/15 space-y-3.5 overflow-hidden text-white"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#7be3af]">
                        {isAr
                          ? `الأجهزة المنفذة (${selectedExerciseIds.length}/${totalExercisesCount}):`
                          : `Geräte (${selectedExerciseIds.length}/${totalExercisesCount}):`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedExerciseIds(allExerciseIds)}
                          className="text-xs text-white/80 hover:text-white underline font-semibold"
                        >
                          {isAr ? 'الكل' : 'Alle'}
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedExerciseIds([])}
                          className="text-xs text-white/60 hover:text-white underline font-semibold"
                        >
                          {isAr ? 'إلغاء' : 'Keine'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {exercises.map((ex) => {
                        const isChecked = selectedExerciseIds.includes(ex.id);
                        return (
                          <button
                            type="button"
                            key={ex.id}
                            onClick={() => handleToggleExerciseInForm(ex.id)}
                            className={`p-3 rounded-2xl border text-right flex items-center justify-between gap-2 transition-all ${
                              isChecked
                                ? 'bg-[#7be3af]/20 border-[#7be3af] text-white'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                          >
                            <div className="min-w-0 flex-1 text-right">
                              <div className="font-extrabold text-xs truncate">
                                {ex.id}. {ex.nameDe}
                              </div>
                              <div className="text-[11px] text-white/70 truncate mt-0.5">
                                {isAr ? ex.muscleAr : ex.muscleDe}
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                                isChecked
                                  ? 'bg-[#7be3af] border-[#7be3af] text-[#15221b]'
                                  : 'border-white/30 bg-transparent'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      value={logNotesInput}
                      onChange={(e) => setLogNotesInput(e.target.value)}
                      placeholder={
                        isAr
                          ? 'ملاحظات الجلسة (اختياري)...'
                          : 'Optionale Notiz...'
                      }
                      className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#7be3af]"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsLogFormOpen(false)}
                        className="px-4 py-2 bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold"
                      >
                        {isAr ? 'إلغاء' : 'Abbrechen'}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#7be3af] hover:bg-[#68d19d] text-[#15221b] font-extrabold rounded-xl text-xs transition-all shadow-xs"
                      >
                        {editingLogId ? (isAr ? 'تحديث' : 'Aktualisieren') : (isAr ? 'حفظ' : 'Speichern')}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {showLogSuccessToast && (
                <div className="bg-[#7be3af]/20 border border-[#7be3af]/40 text-[#7be3af] text-xs font-extrabold px-4 py-2 rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'تم الحفظ بنجاح!' : 'Erfolgreich gespeichert!'}</span>
                </div>
              )}
            </div>

            {/* Session History List */}
            <div className="bg-white rounded-3xl border border-[#e2ebe3] p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-[#edf4ef] pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#215641]" />
                  <h4 className="font-display font-extrabold text-sm text-[#15221b]">
                    {isAr ? 'سجل الجلسات' : 'Trainings-Historie'}
                  </h4>
                  <span className="text-xs font-black bg-[#edf4ef] text-[#215641] px-2 py-0.5 rounded-full">
                    {sessionLogs.length}
                  </span>
                </div>
              </div>

              {sessionLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#6e8276] italic">
                  {isAr ? 'لا توجد جلسات موثقة بعد.' : 'Noch keine Einheiten protokolliert.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionLogs.map((log) => {
                    const isExpanded = expandedLogIds.has(log.id);
                    const completedIds = log.completedExerciseIds || allExerciseIds;

                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl bg-[#fafcfa] border border-[#e2ebe3] space-y-3 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-[#eef4f0] text-[#215641] flex items-center justify-center font-black text-xs flex-shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold text-[#15221b] truncate">
                                  {log.date}
                                </span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#edf4ef] text-[#215641]">
                                  {completedIds.length}/{totalExercisesCount} {isAr ? 'أجهزة' : 'Geräte'}
                                </span>
                              </div>
                              {log.notes && (
                                <p className="text-xs text-[#5a6e61] mt-0.5 truncate font-medium">
                                  {log.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleExpandLog(log.id)}
                              className="px-2 py-1 text-[#5a6e61] hover:text-[#15221b] rounded-lg hover:bg-[#eef4f0] text-xs font-bold flex items-center gap-1"
                            >
                              <span>{isAr ? 'تفاصيل' : 'Details'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEditLog(log)}
                              className="p-1.5 text-[#75877d] hover:text-[#215641] rounded-lg hover:bg-[#eef4f0]"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 text-[#95a59c] hover:text-red-600 rounded-lg hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pt-3 border-t border-[#edf4ef] overflow-hidden"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {exercises.map((ex) => {
                                  const done = completedIds.includes(ex.id);
                                  return (
                                    <div
                                      key={ex.id}
                                      className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 ${
                                        done
                                          ? 'bg-[#eef4f0] border-[#bad3c3] text-[#15221b] font-bold'
                                          : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'
                                      }`}
                                    >
                                      <div className="truncate">
                                        <span>{ex.id}. {ex.nameDe}</span>
                                        <span className="text-[10px] text-[#6e8276] block truncate font-normal">
                                          {isAr ? ex.muscleAr : ex.muscleDe}
                                        </span>
                                      </div>
                                      <span className="flex-shrink-0">
                                        {done ? (
                                          <Check className="w-3.5 h-3.5 text-[#215641] stroke-[3]" />
                                        ) : (
                                          <X className="w-3.5 h-3.5 text-gray-400" />
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 3. GUIDELINES SUB-VIEW */}
        {activeSubTab === 'guidelines' && (
          <motion.div
            key="guidelines-sub"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-3xl border border-[#e2ebe3] p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#edf4ef] pb-3">
                <Award className="w-4 h-4 text-[#215641]" />
                <h4 className="font-display font-extrabold text-sm text-[#15221b]">
                  {isAr ? 'القواعد الذهبية' : 'Goldene Regeln'}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {guidanceRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#fafcfa] border border-[#e2ebe3] space-y-1.5"
                  >
                    <div className="flex items-center gap-2 font-display font-extrabold text-xs text-[#15221b]">
                      <div className="w-6.5 h-6.5 rounded-xl bg-[#eef4f0] flex items-center justify-center flex-shrink-0">
                        {rule.icon}
                      </div>
                      <span className="truncate">{rule.title}</span>
                    </div>
                    <p className="text-xs text-[#5a6e61] leading-relaxed">
                      {rule.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#e2ebe3] p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#edf4ef] pb-3">
                <Sparkles className="w-4 h-4 text-[#215641]" />
                <h4 className="font-display font-extrabold text-sm text-[#15221b]">
                  {t.notesTitle}
                </h4>
              </div>

              <ul className="space-y-2 text-xs text-[#5a6e61] leading-relaxed">
                {planNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#215641] mt-1.5 flex-shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
