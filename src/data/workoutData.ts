import { ExerciseItem, GoalItem, ProgressionPhase, MuscleVolume, WorkoutPlan } from '../types';

export const EXERCISES_DATA: ExerciseItem[] = [
  {
    id: 1,
    muscleDe: "Beine (Quadrizeps / Gluteus)",
    muscleAr: "الأرجل (الفخذ الأمامي والأرداف)",
    nameDe: "Beinpresse 45°",
    sets: "3",
    reps: "8–12",
    alternatives: [
      "Beinpresse 45 Grad Pivot",
      "Hackenschmidt Beinpresse",
      "Beinpresse sitzend",
      "Beinpresse liegend",
      "Vertikale Beinpresse"
    ]
  },
  {
    id: 2,
    muscleDe: "Brust (Pectoralis Major)",
    muscleAr: "الصدر (عضلات الصدر الكبرى)",
    nameDe: "Brustpresse sitzend",
    sets: "3",
    reps: "8–12",
    alternatives: [
      "Bankdrückmaschine sitzend dual",
      "Bankdrückmaschine liegend dual",
      "Bankdrücken",
      "Schrägbankdrückmaschine dual"
    ]
  },
  {
    id: 3,
    muscleDe: "Rücken / Lat (Latissimus)",
    muscleAr: "الظهر / اللاتس (عضلة الظهر العريضة)",
    nameDe: "Latzugstation mit Oberschenkelpolster",
    sets: "3",
    reps: "8–12",
    alternatives: [
      "Rückenzugmaschine",
      "Rückenzugmaschine dual",
      "Überzugmaschine",
      "Überzugmaschine mit Ellenbogenpolstern"
    ]
  },
  {
    id: 4,
    muscleDe: "Rücken (Mittlerer Rücken / Trapez)",
    muscleAr: "الظهر (منتصف الظهر والترابيز)",
    nameDe: "Rudermaschine sitzend dual",
    sets: "3",
    reps: "8–12",
    alternatives: [
      "Rudermaschine mit Brustpolster",
      "Low Row dual",
      "High Row dual",
      "Rudergerät (T-Bar)"
    ]
  },
  {
    id: 5,
    muscleDe: "Hinterer Oberschenkel (Ischiocrurale)",
    muscleAr: "الفخذ الخلفي (Hamstrings)",
    nameDe: "Beinbeuger liegend",
    sets: "3",
    reps: "8–12",
    alternatives: [
      "Beinbeuger sitzend",
      "Beinbeuger liegend Plateloadet",
      "Beinbeuger stehend",
      "Inverser Beinbeuger"
    ]
  },
  {
    id: 6,
    muscleDe: "Schultern (Deltoideus)",
    muscleAr: "الأكتاف (الدالية)",
    nameDe: "Schulterpressmaschine",
    sets: "2",
    reps: "8–12",
    alternatives: [
      "Schulterdrückmaschine sitzend dual",
      "Seithebemaschine",
      "Schulterpresse dual mit Scheibenaufnahme"
    ]
  },
  {
    id: 7,
    muscleDe: "Unterer Rücken (Erector Spinae)",
    muscleAr: "أسفل الظهر (ناصبات العمود الفقري)",
    nameDe: "Rückenstrecker-Maschine sitzend",
    sets: "2",
    reps: "10–15",
    alternatives: [
      "Hyperextensions-Bank (45° / 90°)",
      "Good Mornings (an der Maschine)",
      "Rückenstrecker dual"
    ]
  },
  {
    id: 8,
    muscleDe: "Bauch (Rectus Abdominis)",
    muscleAr: "عضلات البطن (Abs)",
    nameDe: "Bauchmaschine",
    sets: "2",
    reps: "10–15",
    alternatives: [
      "Bauchmuskelmaschine Ab Swing",
      "Bauchmuskelmaschine Crunch liegend",
      "Klappsitz Bauchmaschine sitzend",
      "Klappsitz Bauchmaschine liegend"
    ]
  }
];

export const DEFAULT_GOALS: GoalItem[] = [
  {
    id: 1,
    titleDe: "3 Trainingseinheiten pro Woche einhalten",
    titleAr: "الالتزام بـ ٣ حصص تدريبية أسبوعياً",
    descDe: "Montag, Mittwoch, Freitag mit mind. 1 Tag Pause.",
    descAr: "الإثنين، الأربعاء، الجمعة مع يوم راحة بين كل حصة.",
    done: true
  },
  {
    id: 2,
    titleDe: "RIR 2 (Repetitions in Reserve) diszipliniert anwenden",
    titleAr: "تطبيق معيار الجهد RIR 2 بدقة",
    descDe: "Satz beenden, wenn noch 2 saubere Wiederholungen im Tank sind.",
    descAr: "إنهاء المجموعة عندما يتبقى تكراران ممكنان دون الوصول للفشل التام.",
    done: true
  },
  {
    id: 3,
    titleDe: "90 Sekunden Pause zwischen den Sätzen timen",
    titleAr: "ضبط 90 ثانية راحة بين المجموعات",
    descDe: "Sorgt für volle ATP-Wiederherstellung und saubere Sätze.",
    descAr: "يضمن استعادة طاقة العضلة وأداء المجموعات بكفاءة.",
    done: false
  },
  {
    id: 4,
    titleDe: "Erhöhung bei Erreichen des oberen Rep-Bereichs",
    titleAr: "زيادة الوزن عند الوصول للحد الأعلى من العدّات",
    descDe: "Sobald 12 bzw. 15 Wdh sauber fallen, Gewicht leicht steigern.",
    descAr: "بمجرد إتقان 12 أو 15 تكراراً بتكنيك نظيف، يتم التدرج بالوزن.",
    done: false
  }
];

export const PHASES_DATA: ProgressionPhase[] = [
  {
    weekDe: "Woche 1 – 2",
    weekAr: "الأسبوع ١ – ٢",
    focusDe: "Eingewöhnung: 2 Sätze pro Übung (Technik-Fokus)",
    focusAr: "مرحلة التكيف: مجموعتان فقط لكل تمرين (تركيز التكنيك)",
    sessions: [true, true, true],
    isCurrent: true
  },
  {
    weekDe: "Woche 3 – 4",
    weekAr: "الأسبوع ٣ – ٤",
    focusDe: "Volle Satzanzahl: 3 Sätze (Basis-Progression)",
    focusAr: "الانتقال للحجم الكامل: ٣ مجموعات (تثبيت التدرج)",
    sessions: [false, false, false],
    isCurrent: false
  },
  {
    weekDe: "Woche 5 – 8",
    weekAr: "الأسبوع ٥ – ٨",
    focusDe: "Intensivierung & Progressive Overload (RIR 2)",
    focusAr: "زيادة الحمل التدريجي ورفع الأوزان مع RIR 2",
    sessions: [false, false, false],
    isCurrent: false
  },
  {
    weekDe: "Woche 9+",
    weekAr: "الأسبوع ٩ وما بعده",
    focusDe: "Deload-Woche / Erhaltung & Muskelreiz-Kontinuität",
    focusAr: "أسبوع تخفيف الحمل (Deload) والاستمرارية المستدامة",
    sessions: [false, false, false],
    isCurrent: false
  }
];

export const DEFAULT_WORKOUT_PLAN: WorkoutPlan = {
  id: 'default_full_body_3day',
  nameDe: "Full Body · 3 Tage",
  nameAr: "جسم كامل · ٣ أيام",
  scheduleDaysDe: "Montag · Mittwoch · Freitag",
  scheduleDaysAr: "الإثنين · الأربعاء · الجمعة",
  frequencyDe: "3× pro Woche",
  frequencyAr: "٣ أيام أسبوعياً",
  trainingDays: [0, 2, 4], // 0=Mo, 2=Mi, 4=Fr
  exercises: EXERCISES_DATA,
  notesDe: [
    "Die ersten zwei Wochen: 2 Sätze pro Übung, danach auf die volle Satzanzahl steigern.",
    "Warm-up: 5–10 Minuten leicht vor dem Krafttraining.",
    "Pause: ca. 90 Sekunden zwischen den Sätzen.",
    "RIR 2: Satz beenden, wenn noch ca. 2 weitere Wiederholungen möglich wären, anstatt bis zum Muskelversagen zu gehen.",
    "Sobald die Obergrenze der Wiederholungen mit sauberer Technik leicht fällt, das Gewicht moderat steigern.",
    "Kein ständiger Wechsel des Trainingsplans nötig."
  ],
  notesAr: [
    "أول أسبوعين: مجموعتان (2 Sätze) لكل تمرين، ثم الانتقال إلى العدد الكامل.",
    "الإحماء (Warm-up): 5–10 دقائق خفيف قبل أوزان الحديد.",
    "الراحة (Pause): حوالي 90 ثانية بين المجموعات.",
    "مقياس الجهد (RIR 2): التوقف عندما يكون بالإمكان أداء حوالي تكرارين إضافيين، وليس أداءهما فعلياً.",
    "عند الوصول إلى الحد الأعلى من التكرارات بسهولة مع تكنيك جيد، تتم زيادة الوزن قليلاً.",
    "لا حاجة لتغيير البرنامج باستمرار."
  ]
};

// Dynamically compute muscle group volume distribution from any exercise list
export function getPlanMuscleDistribution(exercises: ExerciseItem[]): MuscleVolume[] {
  const muscleMap = new Map<string, { nameDe: string; nameAr: string; totalSets: number }>();

  exercises.forEach((ex) => {
    // Simplify muscle group key (e.g. "Beine", "Brust", "Rücken", etc.)
    const key = ex.muscleDe.split('(')[0].trim() || ex.muscleDe;
    const setsCount = parseInt(ex.sets, 10) || 2;

    const existing = muscleMap.get(key);
    if (existing) {
      existing.totalSets += setsCount;
    } else {
      muscleMap.set(key, {
        nameDe: ex.muscleDe,
        nameAr: ex.muscleAr,
        totalSets: setsCount,
      });
    }
  });

  return Array.from(muscleMap.values()).map((m) => ({
    nameDe: m.nameDe,
    nameAr: m.nameAr,
    setsDe: `${m.totalSets} Sätze / Einheit`,
    setsAr: `${m.totalSets} مجموعات / حصة`,
  }));
}

// Dynamically compute rep range from any exercise list
export function getPlanRepRangeSummary(exercises: ExerciseItem[]): string {
  if (!exercises || exercises.length === 0) return '8–12';
  const uniqueReps = Array.from(new Set(exercises.map((e) => e.reps.trim())));
  if (uniqueReps.length === 1) return uniqueReps[0];
  return uniqueReps.join(' / ');
}

export const MUSCLE_DIST_DATA: MuscleVolume[] = [
  { nameDe: "Beine & Gesäß", nameAr: "الأرجل والأرداف", setsDe: "6 Sätze / Einheit", setsAr: "٦ مجموعات / حصة" },
  { nameDe: "Rücken (Lat & Mitte)", nameAr: "الظهر (اللاتس والترابيز)", setsDe: "6 Sätze / Einheit", setsAr: "٦ مجموعات / حصة" },
  { nameDe: "Brust", nameAr: "عضلات الصدر", setsDe: "3 Sätze / Einheit", setsAr: "٣ مجموعات / حصة" },
  { nameDe: "Schultern", nameAr: "الأكتاف", setsDe: "2 Sätze / Einheit", setsAr: "مجموعتان / حصة" },
  { nameDe: "Unterer Rücken", nameAr: "أسفل الظهر", setsDe: "2 Sätze / Einheit", setsAr: "مجموعتان / حصة" },
  { nameDe: "Bauchmuskeln", nameAr: "عضلات البطن", setsDe: "2 Sätze / Einheit", setsAr: "مجموعتان / حصة" }
];

export const I18N = {
  de: {
    htmlLang: "de",
    dir: "ltr" as const,
    brandTitle: "TRAININGSPLAN",
    brandSubtitle: "Full Body · 3 Tage",
    menuLang: "Sprache: العربية",
    menuCopy: "Plan kopieren",
    menuAllAlts: "Alle Alternativen",
    menuReset: "Heutigen Fortschritt zurücksetzen",
    menuPrint: "Drucken / PDF",
    toastCopied: "Trainingsplan in die Zwischenablage kopiert!",
    toastReset: "Fortschritt zurückgesetzt.",
    scheduleDays: "Montag · Mittwoch · Freitag",
    scheduleSub: "Full Body · 3× pro Woche",
    progressLabel: "Trainingsfortschritt:",
    progressDoneText: "erledigt",
    progressReset: "Zurücksetzen",
    capsuleLabel: "Sätze · Wdh.",
    altShow: "Alternativen anzeigen",
    altHide: "Alternativen ausblenden",
    altHeader: "Mögliche Alternativen:",
    notesTitle: "Wichtige Hinweise",
    navPlan: "Plan",
    navTimer: "Timer",
    navAudio: "Audio",
    navTools: "Tools",
    navStats: "Statistik",
    navGoals: "Ziele",
    navProfile: "Profil",
    audioViewTitle: "Smarter Workout-Audioplayer",
    audioViewDesc: "Eigene Trainings-Audio- & Videodateien lokal im Browser speichern und werbefrei abspielen.",
    toolsTitle: "Smarte Trainings-Tools",
    toolsDesc: "Interaktive Rechner und Audio-Tools, die dir das Training erleichtern.",
    plateCalcTitle: "Hantelscheiben-Rechner",
    plateCalcDesc: "Berechne sofort die exakten Gewichtsscheiben pro Seite für deine Langhantel.",
    oneRmTitle: "1RM & Aufwärm-Pyramide",
    oneRmDesc: "Ermittle dein Maximalgewicht und erhalte deinen perfekten Aufwärm-Stufenplan.",
    nutritionTitle: "Protein- & Wasser-Bedarf",
    nutritionDesc: "Tagesbedarf an Flüssigkeit und Eiweiß auf Knopfdruck abgestimmt auf dein Gewicht.",
    ambientTitle: "Fokus & Regenerations-Audio",
    ambientDesc: "Echtzeit-Soundgenerator (Brown Noise, Wellen, Fokus) für maximale Konzentration.",
    statsTitle: "Statistiken & Fortschritt",
    statsDesc: "Umfassende Langzeit-Übersicht über dein Training, Phasen und Muskelverteilung.",
    statSessions: "Trainingstage",
    statSessionsSub: "Gesamte Workouts",
    statExercises: "Übungen absolviert",
    statExercisesSub: "Gesamt-Sätze absolviert",
    statStreak: "Wochen-Serie",
    statStreakSub: "Ziel: 3 Einheiten / Woche",
    statRate: "Abschlussrate",
    statRateSub: "Heutiges Training",
    statsProgTitle: "Trainingszyklus & Phasen",
    statsProgBadge: "Woche 1–4",
    statsWeekTitle: "Wochenplan & Rhythmus",
    statsWeekBadge: "3× pro Woche",
    statsVolumeTitle: "Volumen-Verteilung pro Einheit",
    statsVolumeBadge: "8 Übungen",
    goalsTitle: "Trainingsziele & Disziplin",
    goalsDesc: "Regeln für maximalen Muskelaufbau und sichere Progression.",
    goalInputPlaceholder: "Eigenes Ziel hinzufügen...",
    goalAddBtn: "Hinzufügen",
    confirmResetTitle: "Trainingsfortschritt zurücksetzen?",
    confirmResetDesc: "Möchtest du alle als erledigt markierten Übungen für heute wirklich zurücksetzen?",
    confirmDeleteGoalTitle: "Ziel löschen?",
    confirmDeleteGoalDesc: "Möchtest du dieses Ziel wirklich dauerhaft entfernen?",
    confirmBtn: "Ja, zurücksetzen",
    confirmDeleteBtn: "Löschen",
    cancelBtn: "Abbrechen",
    timerViewTitle: "Pausen-Timer",
    timerViewDesc: "Optimale Erholung zwischen den Trainingssätzen (90s Richtwert).",
    timerStart: "Start",
    timerPause: "Pause",
    timerReset: "Reset",
    timerDone: "Fertig! Weiter geht's",
    notes: [
      "Die ersten zwei Wochen: 2 Sätze pro Übung, danach auf die volle Satzanzahl steigern.",
      "Warm-up: 5–10 Minuten leicht vor dem Krafttraining.",
      "Pause: ca. 90 Sekunden zwischen den Sätzen.",
      "RIR 2: Satz beenden, wenn noch ca. 2 weitere Wiederholungen möglich wären, anstatt bis zum Muskelversagen zu gehen.",
      "Sobald die Obergrenze der Wiederholungen mit sauberer Technik leicht fällt, das Gewicht moderat steigern.",
      "Kein ständiger Wechsel des Trainingsplans nötig."
    ],
    days: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
  },
  ar: {
    htmlLang: "ar",
    dir: "rtl" as const,
    brandTitle: "جدول التمرين",
    brandSubtitle: "جسم كامل · ٣ أيام",
    menuLang: "Sprache: Deutsch",
    menuCopy: "نسخ الجدول كاملاً",
    menuAllAlts: "فتح / إغلاق كل البدائل",
    menuReset: "إعادة ضبط تقدم اليوم",
    menuPrint: "طباعة / حفظ PDF",
    toastCopied: "تم نسخ جدول التمارين إلى الحافظة بنجاح!",
    toastReset: "تمت إعادة ضبط التقدم بنجاح.",
    scheduleDays: "الإثنين · الأربعاء · الجمعة",
    scheduleSub: "Full Body · 3× pro Woche",
    progressLabel: "تقدم التمرين اليوم:",
    progressDoneText: "مكتمل",
    progressReset: "إعادة ضبط",
    capsuleLabel: "مجموعات · عدّات",
    altShow: "عرض البدائل",
    altHide: "إخفاء البدائل",
    altHeader: "البدائل المتاحة:",
    notesTitle: "ملاحظات هامة",
    navPlan: "الجدول",
    navTimer: "المؤقت",
    navAudio: "الصوتيات",
    navTools: "الأدوات",
    navStats: "الإحصائيات",
    navGoals: "الأهداف",
    navProfile: "البروفايل",
    audioViewTitle: "مشغل صوتيات التمرين الذكي",
    audioViewDesc: "شغّل مقاطعك الصوتية والفيديوهات المحفوظة محلياً بجودة عالية وبدون إعلانات أثناء تمرينك.",
    toolsTitle: "أدوات ومساعد التدريب الذكي",
    toolsDesc: "حواسب رياضية وأصوات تركيز تفاعلية مصممة لتسهيل تمرينك وحساباتك بدقة.",
    plateCalcTitle: "حاسبة أوزان البار (الأقراص)",
    plateCalcDesc: "احسب فوراً الأقراص المطلوبة لكل جهة من البار بدون عناء الحساب الذهني.",
    oneRmTitle: "حاسبة أقصى وزن (1RM) ومجموعات الإحماء",
    oneRmDesc: "احسب طاقتك القصوى واحصل على جدول تدرج الإحماء المحكم لحماية مفاصلك.",
    nutritionTitle: "حاسبة البروتين والماء اليومي",
    nutritionDesc: "احسب احتياجك الدقيق من السوائل وجرامات البروتين بناءً على وزنك وهدفك.",
    ambientTitle: "أصوات التركيز والاستشفاء الصوتي",
    ambientDesc: "مولد صوتي نقي ولحظي (الضوضاء البنية، أمواج البحر، نبضات التركيز) لتهدئة الذهن بين الجولات.",
    statsTitle: "الإحصائيات والتقدم الشامل",
    statsDesc: "نظرة شاملة ومفصلة على استمراريتك ومراحل التدريب وتوزيع المجموعات العضلية.",
    statSessions: "أيام التمرين",
    statSessionsSub: "جلسات مكتملة",
    statExercises: "التمارين المنجزة",
    statExercisesSub: "إجمالي التمارين المؤداة",
    statStreak: "الاستمرارية",
    statStreakSub: "الهدف: ٣ حصص / أسبوع",
    statRate: "إنجاز اليوم",
    statRateSub: "نسبة التمرين الحالي",
    statsProgTitle: "مراحل البرنامج التدريبي (دورة الأسابيع)",
    statsProgBadge: "الأسابيع ١–٤",
    statsWeekTitle: "توزيع أيام الأسبوع",
    statsWeekBadge: "٣ حصص / أسبوع",
    statsVolumeTitle: "توزيع الحجم العضلي للحصة",
    statsVolumeBadge: "٨ تمارين أساسية",
    goalsTitle: "أهداف التمرين والانضباط",
    goalsDesc: "قواعد البناء العضلي السليم والتدرج الحركي الآمن.",
    goalInputPlaceholder: "أضف هدفاً أو قاعدة جديدة...",
    goalAddBtn: "إضافة",
    confirmResetTitle: "تأكيد إعادة ضبط التمرين",
    confirmResetDesc: "هل أنت متأكد من رغبتك في إعادة ضبط جميع التمارين المكتملة لليوم؟",
    confirmDeleteGoalTitle: "تأكيد حذف الهدف",
    confirmDeleteGoalDesc: "هل أنت متأكد من رغبتك في حذف هذا الهدف نهائياً؟",
    confirmBtn: "نعم، إعادة الضبط",
    confirmDeleteBtn: "نعم، حذف",
    cancelBtn: "إلغاء",
    timerViewTitle: "مؤقت الراحة بين المجموعات",
    timerViewDesc: "الاستشفاء الأمثل للطاقة العضلية (المعيار الموصى به: 90 ثانية).",
    timerStart: "بدء المؤقت",
    timerPause: "إيقاف مؤقت",
    timerReset: "إعادة ضبط",
    timerDone: "انتهت الراحة! ابدأ مجموعتك",
    notes: [
      "أول أسبوعين: مجموعتان (2 Sätze) لكل تمرين، ثم الانتقال إلى العدد الكامل.",
      "الإحماء (Warm-up): 5–10 دقائق خفيف قبل أوزان الحديد.",
      "الراحة (Pause): حوالي 90 ثانية بين المجموعات.",
      "مقياس الجهد (RIR 2): التوقف عندما يكون بالإمكان أداء حوالي تكرارين إضافيين، وليس أداءهما فعلياً.",
      "عند الوصول إلى الحد الأعلى من التكرارات بسهولة مع تكنيك جيد، تتم زيادة الوزن قليلاً.",
      "لا حاجة لتغيير البرنامج باستمرار."
    ],
    days: ["إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت", "أحد"]
  }
};
