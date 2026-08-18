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
} from 'lucide-react';
import { Language, ProgressionPhase, MuscleVolume, WorkoutPlan, ExerciseItem } from '../types';
import { 
  I18N, 
  PHASES_DATA, 
  MUSCLE_DIST_DATA, 
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
}

type StatsSubTab = 'overview' | 'logbook' | 'guidelines';

export const StatsView: React.FC<StatsViewProps> = ({
  currentLang,
  completedExercises,
  plan,
}) => {
  const t = I18N[currentLang];
  const [activeSubTab, setActiveSubTab] = useState<StatsSubTab>('overview');

  const exercises = plan ? plan.exercises : EXERCISES_DATA;
  const totalExercisesCount = exercises.length;
  const allExerciseIds = exercises.map((e) => e.id);
  const trainingDays = plan?.trainingDays ?? [0, 2, 4];
  const muscleDistData = getPlanMuscleDistribution(exercises);
  const repRangeText = getPlanRepRangeSummary(exercises);
  const planNotes = plan ? (currentLang === 'de' ? plan.notesDe : plan.notesAr) : t.notes;

  // Stored Session Logs in localStorage
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>(() => {
    try {
      const saved = localStorage.getItem('gym_session_logs');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Default initial seed log for good UX
    return [
      {
        id: 'seed_1',
        date: currentLang === 'ar' ? 'الجلسة السابقة (الأربعاء)' : 'Vorherige Einheit (Mi)',
        timestamp: Date.now() - 2 * 24 * 3600 * 1000,
        completedExerciseIds: allExerciseIds,
        exercisesCompleted: totalExercisesCount,
        totalExercises: totalExercisesCount,
        notes: currentLang === 'ar' 
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

  // Handle opening form for NEW session log
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

  // Handle editing an existing log
  const handleEditLog = (log: SessionLog) => {
    setEditingLogId(log.id);
    setLogNotesInput(log.notes || '');
    setSelectedExerciseIds(log.completedExerciseIds || allExerciseIds);
    setIsLogFormOpen(true);
  };

  // Toggle exercise checkbox in form
  const handleToggleExerciseInForm = (id: number) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllExercises = () => {
    setSelectedExerciseIds(allExerciseIds);
  };

  const handleDeselectAllExercises = () => {
    setSelectedExerciseIds([]);
  };

  // Save session log (Create or Update)
  const handleSaveSessionLog = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (editingLogId) {
      // Update existing
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
      // Create new
      const now = new Date();
      const formattedDate =
        currentLang === 'ar'
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

  // Compute Statistics
  const totalLoggedSessionsCount = sessionLogs.length;
  const totalMachineSetsExecuted = sessionLogs.reduce(
    (acc, log) => acc + (log.completedExerciseIds ? log.completedExerciseIds.length : log.exercisesCompleted),
    0
  );

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

  // Most completed machine
  const machineFrequencyMap: Record<number, number> = {};
  sessionLogs.forEach((log) => {
    const ids = log.completedExerciseIds || allExerciseIds;
    ids.forEach((id) => {
      machineFrequencyMap[id] = (machineFrequencyMap[id] || 0) + 1;
    });
  });

  const guidanceRules =
    currentLang === 'ar'
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
    <div className="w-full max-w-full min-w-0 space-y-4 animate-in fade-in duration-200">
      {/* Title Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#dbe4dc] space-y-1 shadow-xs">
        <h2 className="font-display font-bold text-lg sm:text-xl text-[#15221b]">
          {currentLang === 'ar' ? 'الإحصائيات وسجل التوثيق تفصيلياً' : 'Statistik & Detailliertes Logbuch'}
        </h2>
        <p className="text-xs sm:text-sm text-[#4f6156]">
          {currentLang === 'ar'
            ? 'حدد الأجهزة المنجزة في كل جلسة لتدخل رسمياً في إحصائيات ونسب الالتزام.'
            : 'Wähle deine absolvierten Geräte pro Einheit aus für exakte Statistiken.'}
        </p>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 min-w-0">
        <div className="bg-white rounded-2xl border border-[#dbe4dc] p-3 sm:p-4 space-y-0.5 shadow-2xs min-w-0">
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#75877d] block truncate">
            {currentLang === 'ar' ? 'الجلسات الموثقة' : 'Protokollierte Einheiten'}
          </span>
          <div className="font-display font-black text-xl sm:text-2xl text-[#15221b]">
            {totalLoggedSessionsCount}
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#95a59c] block truncate">
            {currentLang === 'ar' ? 'في سجل التوثيق' : 'im Tagebuch'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#dbe4dc] p-3 sm:p-4 space-y-0.5 shadow-2xs min-w-0">
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#75877d] block truncate">
            {currentLang === 'ar' ? 'إجمالي الأجهزة المنفذة' : 'Ausgeführte Geräte'}
          </span>
          <div className="font-display font-black text-xl sm:text-2xl text-[#215641]">
            {totalMachineSetsExecuted}
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#95a59c] block truncate">
            {currentLang === 'ar' ? 'تمت بنجاح' : 'Absolviert'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#dbe4dc] p-3 sm:p-4 space-y-0.5 shadow-2xs min-w-0">
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#75877d] block truncate">
            {currentLang === 'ar' ? 'معدل إنجاز الأجهزة' : 'Geräte-Erfüllung'}
          </span>
          <div className="font-display font-black text-xl sm:text-2xl text-[#15221b]">
            {avgCompletionRate}%
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#215641] font-bold block truncate">
            {currentLang === 'ar' ? 'معدل التزام ممتاز' : 'Hohe Disziplin'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#dbe4dc] p-3 sm:p-4 space-y-0.5 shadow-2xs min-w-0">
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#75877d] block truncate">
            {currentLang === 'ar' ? 'نطاق التكرارات' : 'Wdh.-Bereich'}
          </span>
          <div className="font-display font-black text-xl sm:text-2xl text-[#15221b]">
            {repRangeText}
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#95a59c] block truncate">
            {currentLang === 'ar' ? 'تكرار لكل مجموعة' : 'Wdh. pro Satz'}
          </span>
        </div>
      </div>

      {/* Sub-Navigation Tabs - Free floating without container box */}
      <div className="grid grid-cols-3 gap-2 py-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all active:scale-98 ${
            activeSubTab === 'overview'
              ? 'bg-[#215641] text-white shadow-xs'
              : 'bg-white border border-[#dbe4dc] text-[#4f6156] hover:text-[#15221b] hover:bg-[#f8faf8] hover:border-[#c5d7cc]'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{currentLang === 'ar' ? 'الإحصائيات والمراحل' : 'Übersicht'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logbook')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all active:scale-98 ${
            activeSubTab === 'logbook'
              ? 'bg-[#215641] text-white shadow-xs'
              : 'bg-white border border-[#dbe4dc] text-[#4f6156] hover:text-[#15221b] hover:bg-[#f8faf8] hover:border-[#c5d7cc]'
          }`}
        >
          <History className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{currentLang === 'ar' ? 'سجل التوثيق التفصيلي' : 'Tagebuch'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('guidelines')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl text-xs font-bold transition-all active:scale-98 ${
            activeSubTab === 'guidelines'
              ? 'bg-[#215641] text-white shadow-xs'
              : 'bg-white border border-[#dbe4dc] text-[#4f6156] hover:text-[#15221b] hover:bg-[#f8faf8] hover:border-[#c5d7cc]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{currentLang === 'ar' ? 'قواعد التمارين' : 'Regeln'}</span>
        </button>
      </div>

      {/* Sub-view Content */}
      <AnimatePresence mode="wait">
        {/* 1. OVERVIEW SUB-VIEW */}
        {activeSubTab === 'overview' && (
          <motion.div
            key="overview-sub"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Machine Completion Stats Breakdown */}
            <div className="bg-white rounded-3xl border border-[#dbe4dc] p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-[#edf4ef] pb-3">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#215641]" />
                  <h3 className="font-display font-bold text-xs sm:text-sm text-[#15221b]">
                    {currentLang === 'ar' ? 'إحصائيات إنجاز كل جهاز' : 'Geräte-Statistik'}
                  </h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#edf4ef] text-[#215641]">
                  {totalExercisesCount} {currentLang === 'ar' ? 'أجهزة رئيسية' : 'Geräte'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {exercises.map((ex) => {
                  const count = machineFrequencyMap[ex.id] || 0;
                  const pct = totalLoggedSessionsCount > 0 ? Math.round((count / totalLoggedSessionsCount) * 100) : 0;
                  return (
                    <div
                      key={ex.id}
                      className="p-3 rounded-2xl bg-[#fafcfa] border border-[#e2ece5] flex items-center justify-between gap-2 min-w-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-[#15221b] truncate">
                          {ex.id}. {ex.nameDe}
                        </div>
                        <div className="text-[11px] text-[#75877d] truncate">
                          {currentLang === 'ar' ? ex.muscleAr : ex.muscleDe}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-display font-bold text-xs text-[#215641] block">
                          {count} {currentLang === 'ar' ? 'مرات' : 'Mal'}
                        </span>
                        <span className="text-[10px] text-[#95a59c] font-mono">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Multi-Week Progression Plan */}
            <div className="bg-white rounded-3xl border border-[#dbe4dc] p-4 sm:p-5 space-y-3 shadow-xs min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <h3 className="font-display font-bold text-xs sm:text-sm text-[#15221b] truncate">
                  {t.statsProgTitle}
                </h3>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#edf4ef] text-[#215641] flex-shrink-0">
                  {t.statsProgBadge}
                </span>
              </div>

              <div className="space-y-2 min-w-0">
                {PHASES_DATA.map((phase: ProgressionPhase, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 sm:p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all min-w-0 ${
                      phase.isCurrent
                        ? 'bg-[#f1f6f3] border-[#bad3c3]'
                        : 'bg-[#f8faf8] border-[#e3ede5]'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-display font-bold text-xs sm:text-sm text-[#15221b]">
                        {currentLang === 'de' ? phase.weekDe : phase.weekAr}
                      </div>
                      <div className="text-[11px] text-[#4f6156] break-words">
                        {currentLang === 'de' ? phase.focusDe : phase.focusAr}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-center flex-shrink-0">
                      {phase.sessions.map((done, sIdx) => (
                        <span
                          key={sIdx}
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            done
                              ? 'bg-[#215641] text-white'
                              : 'bg-white border border-[#dbe4dc] text-[#75877d]'
                          }`}
                        >
                          {sIdx + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekday Rhythm Breakdown */}
            <div className="bg-white rounded-3xl border border-[#dbe4dc] p-4 sm:p-5 space-y-3 shadow-xs min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <h3 className="font-display font-bold text-xs sm:text-sm text-[#15221b] truncate">
                  {t.statsWeekTitle}
                </h3>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#edf4ef] text-[#215641] flex-shrink-0">
                  {t.statsWeekBadge}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center min-w-0">
                {t.days.map((day, idx) => {
                  const isTraining = trainingDays.includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`py-2 px-0.5 rounded-xl flex flex-col items-center gap-1.5 border transition-all min-w-0 ${
                        isTraining
                          ? 'bg-[#f1f6f3] border-[#bad3c3]'
                          : 'bg-[#f8faf8] border-[#e2ebe3]'
                      }`}
                    >
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#15221b] truncate w-full">
                        {day}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isTraining ? 'bg-[#215641]' : 'bg-[#dbe4dc]'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Muscle Volume Breakdown */}
            <div className="bg-white rounded-3xl border border-[#dbe4dc] p-4 sm:p-5 space-y-3 shadow-xs min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <h3 className="font-display font-bold text-xs sm:text-sm text-[#15221b] truncate">
                  {t.statsVolumeTitle}
                </h3>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#edf4ef] text-[#215641] flex-shrink-0">
                  {t.statsVolumeBadge}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                {muscleDistData.map((m: MuscleVolume, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 sm:p-3 bg-[#f8faf8] rounded-2xl border border-[#e2ebe3] min-w-0 gap-2"
                  >
                    <span className="text-xs font-semibold text-[#15221b] truncate">
                      {currentLang === 'de' ? m.nameDe : m.nameAr}
                    </span>
                    <span className="font-display font-bold text-xs text-[#215641] flex-shrink-0">
                      {currentLang === 'de' ? m.setsDe : m.setsAr}
                    </span>
                  </div>
                ))}
              </div>
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
            <div className="bg-gradient-to-br from-[#1b4332] to-[#15221b] text-white rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 border border-[#23382c]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#7be3af]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xs sm:text-sm text-white">
                      {currentLang === 'ar' ? 'توثيق أجهزة جلسة اليوم' : 'Geräte der Einheit protokollieren'}
                    </h3>
                    <p className="text-[11px] text-[#a3b8ac]">
                      {currentLang === 'ar'
                        ? 'حدد الأجهزة التي قمت بتمارينها اليوم بالتفصيل'
                        : 'Wähle genau die Geräte aus, die du absolviert hast'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenNewLogForm}
                  className="px-3 py-1.5 bg-[#7be3af] hover:bg-[#68d19d] text-[#15221b] font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentLang === 'ar' ? 'توثيق جلسة' : 'Protokollieren'}</span>
                </button>
              </div>

              {/* Interactive Machine Selection Form */}
              <AnimatePresence>
                {isLogFormOpen && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSaveSessionLog}
                    className="pt-3 border-t border-white/15 space-y-3 overflow-hidden text-white"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#7be3af]">
                        {currentLang === 'ar'
                          ? `حدد الأجهزة المنفذة (${selectedExerciseIds.length}/${totalExercisesCount}):`
                          : `Absolvierte Geräte (${selectedExerciseIds.length}/${totalExercisesCount}):`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSelectAllExercises}
                          className="text-[10px] text-white/80 hover:text-white underline"
                        >
                          {currentLang === 'ar' ? 'تحديد الكل' : 'Alle wählen'}
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={handleDeselectAllExercises}
                          className="text-[10px] text-white/60 hover:text-white underline"
                        >
                          {currentLang === 'ar' ? 'إلغاء الكل' : 'Keine'}
                        </button>
                      </div>
                    </div>

                    {/* Machine Checkboxes Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {exercises.map((ex) => {
                        const isChecked = selectedExerciseIds.includes(ex.id);
                        return (
                          <button
                            type="button"
                            key={ex.id}
                            onClick={() => handleToggleExerciseInForm(ex.id)}
                            className={`p-2.5 rounded-xl border text-right flex items-center justify-between gap-2 transition-all ${
                              isChecked
                                ? 'bg-[#7be3af]/20 border-[#7be3af] text-white'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                          >
                            <div className="min-w-0 flex-1 text-right">
                              <div className="font-bold text-xs truncate">
                                {ex.id}. {ex.nameDe}
                              </div>
                              <div className="text-[10px] text-white/70 truncate">
                                {currentLang === 'ar' ? ex.muscleAr : ex.muscleDe}
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

                    {/* Optional Note */}
                    <input
                      type="text"
                      value={logNotesInput}
                      onChange={(e) => setLogNotesInput(e.target.value)}
                      placeholder={
                        currentLang === 'ar'
                          ? 'ملاحظات الجلسة (مثلاً: زيادات الأوزان أو الشعور بالطاقة)...'
                          : 'Optionale Notiz (z.B. Gewichtssteigerungen)...'
                      }
                      className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-hidden focus:border-[#7be3af]"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsLogFormOpen(false)}
                        className="px-3 py-1.5 bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-semibold"
                      >
                        {currentLang === 'ar' ? 'إلغاء' : 'Abbrechen'}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#7be3af] hover:bg-[#68d19d] text-[#15221b] font-bold rounded-xl text-xs transition-all shadow-sm"
                      >
                        {editingLogId
                          ? currentLang === 'ar'
                            ? 'تحديث التوثيق'
                            : 'Aktualisieren'
                          : currentLang === 'ar'
                          ? 'حفظ الجلسة في السجل'
                          : 'Speichern'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Toast Feedback */}
              {showLogSuccessToast && (
                <div className="bg-[#7be3af]/20 border border-[#7be3af]/40 text-[#7be3af] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{currentLang === 'ar' ? 'تم حفظ الجلسة والأجهزة بنجاح!' : 'Erfolgreich gespeichert!'}</span>
                </div>
              )}
            </div>

            {/* Session History List */}
            <div className="bg-white rounded-3xl border border-[#dbe4dc] p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-[#edf4ef] pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#215641]" />
                  <h4 className="font-display font-bold text-xs sm:text-sm text-[#15221b]">
                    {currentLang === 'ar' ? 'سجل الجلسات والأجهزة السابقة' : 'Trainings-Historie'}
                  </h4>
                  <span className="text-[11px] font-bold bg-[#edf4ef] text-[#215641] px-2 py-0.5 rounded-full">
                    {sessionLogs.length}
                  </span>
                </div>

                {sessionLogs.length > 0 && (
                  <span className="text-[11px] text-[#75877d]">
                    {currentLang === 'ar' ? 'محفوظ محلياً' : 'Lokal gesichert'}
                  </span>
                )}
              </div>

              {sessionLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#75877d] italic space-y-1">
                  <p>
                    {currentLang === 'ar'
                      ? 'لا توجد جلسات موثقة بعد. انقر على "توثيق جلسة" أعلاه لربط الأجهزة بالسجل.'
                      : 'Noch keine Einheiten protokolliert. Klicke oben auf "Protokollieren".'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionLogs.map((log) => {
                    const isExpanded = expandedLogIds.has(log.id);
                    const completedIds = log.completedExerciseIds || [1, 2, 3, 4, 5, 6, 7, 8];

                    return (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl bg-[#fafcfa] border border-[#e2ece5] space-y-2.5 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-[#eef4f0] text-[#215641] flex items-center justify-center font-bold text-xs flex-shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-[#15221b] truncate">
                                  {log.date}
                                </span>
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#edf4ef] text-[#215641]">
                                  {completedIds.length}/8 {currentLang === 'ar' ? 'أجهزة' : 'Geräte'}
                                </span>
                              </div>
                              {log.notes && (
                                <p className="text-[11px] text-[#4f6156] mt-0.5 truncate">
                                  {log.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Expand / Collapse Button */}
                            <button
                              type="button"
                              onClick={() => toggleExpandLog(log.id)}
                              className="p-1.5 text-[#4f6156] hover:text-[#15221b] rounded-lg hover:bg-[#eef4f0] transition-colors flex items-center gap-1 text-[11px] font-semibold"
                            >
                              <span>{currentLang === 'ar' ? 'التفاصيل' : 'Details'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleEditLog(log)}
                              className="p-1.5 text-[#75877d] hover:text-[#215641] rounded-lg hover:bg-[#eef4f0] transition-colors"
                              title={currentLang === 'ar' ? 'تعديل الأجهزة' : 'Bearbeiten'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 text-[#95a59c] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title={currentLang === 'ar' ? 'حذف من السجل' : 'Löschen'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Detailed Machine Breakdown Grid */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pt-2 border-t border-[#edf4ef] overflow-hidden"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                                {exercises.map((ex) => {
                                  const done = completedIds.includes(ex.id);
                                  return (
                                    <div
                                      key={ex.id}
                                      className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 ${
                                        done
                                          ? 'bg-[#eef4f0] border-[#bad3c3] text-[#15221b]'
                                          : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'
                                      }`}
                                    >
                                      <div className="truncate">
                                        <span className="font-bold">{ex.id}. {ex.nameDe}</span>
                                        <span className="text-[10px] text-[#75877d] block truncate">
                                          {currentLang === 'ar' ? ex.muscleAr : ex.muscleDe}
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
            {/* Golden Rules Grid */}
            <div className="bg-white rounded-3xl border border-[#dbe4dc] p-4 sm:p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#edf4ef] pb-3">
                <Award className="w-4 h-4 text-[#215641]" />
                <h4 className="font-display font-bold text-xs sm:text-sm text-[#15221b]">
                  {currentLang === 'ar'
                    ? 'قواعد التدريب والاستشفاء الذهبية'
                    : 'Goldene Trainings- & Erholungsregeln'}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {guidanceRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#fafcfa] border border-[#e2ece5] space-y-1"
                  >
                    <div className="flex items-center gap-2 font-display font-bold text-xs text-[#15221b]">
                      <div className="w-6 h-6 rounded-lg bg-[#eef4f0] flex items-center justify-center flex-shrink-0">
                        {rule.icon}
                      </div>
                      <span className="truncate">{rule.title}</span>
                    </div>
                    <p className="text-[11px] text-[#4f6156] leading-relaxed">
                      {rule.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Workout Notes */}
            <div className="bg-white rounded-3xl border border-[#dbe4dc] p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#edf4ef] pb-3">
                <Sparkles className="w-4 h-4 text-[#215641]" />
                <h4 className="font-display font-bold text-xs sm:text-sm text-[#15221b]">
                  {t.notesTitle}
                </h4>
              </div>

              <ul className="space-y-2 text-xs text-[#4f6156] leading-relaxed">
                {planNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#215641] mt-1.5 flex-shrink-0" />
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
