import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Layout, 
  Palette, 
  Clock, 
  Music, 
  Flame, 
  Check, 
  HelpCircle, 
  Smartphone,
  Sliders,
  Sparkles,
  Dumbbell,
  SkipBack,
  Play,
  SkipForward,
  Info,
  Lightbulb
} from 'lucide-react';
import { Language } from '../types';
import { notifyModalChange } from '../utils/modalManager';
import { triggerHaptic } from '../utils/haptics';

interface WidgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const WidgetSettingsModal: React.FC<WidgetSettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'themes' | 'guide'>('preview');
  const [selectedTheme, setSelectedTheme] = useState<'emerald' | 'obsidian' | 'navy'>('emerald');
  const [timerDuration, setTimerDuration] = useState<number>(90);
  const [selectedWidget, setSelectedWidget] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      notifyModalChange(true);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (isOpen) {
        notifyModalChange(false);
      }
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  const widgetList = [
    {
      id: 1,
      title: isAr ? 'ويدجت خطة التمارين المتقدم' : 'Workout Plan Widget',
      size: '4×2',
      desc: isAr ? 'عرض نسبة الإنجاز والوصول السريع لخطة التمارين والمؤقت والصوتيات' : 'Shows progress and quick links to Plan, Timer & Audio',
      icon: Layout,
    },
    {
      id: 2,
      title: isAr ? 'ويدجت مشغل الصوتيات' : 'Audio Player Widget',
      size: '4×2',
      desc: isAr ? 'تحكم سريع بمشغل الموسيقى وتغيير التراكات فوراً من الشاشة الرئيسية' : 'Instant music controls right from home screen',
      icon: Music,
    },
    {
      id: 3,
      title: isAr ? 'ويدجت مؤقت الراحة السريع' : 'Quick Rest Timer Widget',
      size: '2×2',
      desc: isAr ? 'بدء مؤقت الراحة بضغطة زر واحدة بين الجولات (60ث، 90ث، 120ث)' : 'One-tap rest timers between workout sets',
      icon: Clock,
    },
    {
      id: 4,
      title: isAr ? 'ويدجت التتابع والتحفيز' : 'Streak & Quote Widget',
      size: '4×1',
      desc: isAr ? 'متابعة عدد أيام التدريب المتواصلة وعبارة تحفيزية يومية' : 'Daily streak counter and motivational fitness quotes',
      icon: Flame,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#15221b] text-white rounded-t-3xl sm:rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-emerald-900/60 flex items-center justify-between bg-[#121c17]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-base text-white">
                  {isAr ? 'تخصيص ويدجتات الشاشة الرئيسية' : 'Home Screen Widgets'}
                </h2>
                <p className="text-xs text-emerald-300/70">
                  {isAr ? 'معاينة وضبط مظهر الويدجتات على الجوال' : 'Customize widgets style and launch targets'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-emerald-900/40 bg-[#0f1713] p-1.5 gap-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('preview');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300/60 hover:text-white'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>{isAr ? 'أنواع الويدجتات (4)' : 'Widgets (4)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('themes');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'themes'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300/60 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{isAr ? 'التصاميم والخيارات' : 'Options'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab('guide');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300/60 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isAr ? 'طريقة الإضافة' : 'How to add'}</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2.5">
                  {widgetList.map((w) => {
                    const Icon = w.icon;
                    const isSel = selectedWidget === w.id;
                    return (
                      <div
                        key={w.id}
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedWidget(w.id);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSel
                            ? 'bg-emerald-950/80 border-emerald-400 text-white ring-1 ring-emerald-400/50'
                            : 'bg-emerald-950/20 border-emerald-900/50 hover:border-emerald-800 text-emerald-200/80'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${isSel ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-900/40 text-emerald-400'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-white">{w.title}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/20">
                              {w.size}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-300/70 mt-1 leading-snug">{w.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Simulated Widget Live Preview */}
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-b from-[#0e1d16] to-[#0a1510] border border-emerald-500/30">
                  <span className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isAr ? 'معاينة شكل الويدجت بجميع المقاسات:' : 'Live Widget Preview:'}
                  </span>

                  {selectedWidget === 1 && (
                    <div className="p-3.5 rounded-2xl bg-[#143428] border border-emerald-500/30 text-white space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Dumbbell className="w-4 h-4 text-emerald-400 stroke-[2.2]" />
                          <span>{isAr ? 'خطة التمارين اليومية' : 'Daily Workout Plan'}</span>
                        </span>
                        <span className="text-[10px] bg-[#265a44] text-emerald-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>3 {isAr ? 'أيام' : 'Days'}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <div className="bg-[#265a44] p-2 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1">
                          <Layout className="w-3.5 h-3.5" />
                          <span>الخطة</span>
                        </div>
                        <div className="bg-[#265a44] p-2 rounded-xl text-center font-bold text-xs text-emerald-300 flex items-center justify-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>المؤقت</span>
                        </div>
                        <div className="bg-[#265a44] p-2 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1">
                          <Music className="w-3.5 h-3.5" />
                          <span>الصوتيات</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedWidget === 2 && (
                    <div className="p-3.5 rounded-2xl bg-[#143428] border border-emerald-500/30 text-white space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Music className="w-4 h-4 text-emerald-400" />
                          <span>{isAr ? 'مشغل الصوتيات والموسيقى' : 'Audio Player'}</span>
                        </span>
                        <span className="text-[10px] bg-[#265a44] text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                          {isAr ? 'نشط' : 'Active'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#1a3d2f] text-xs font-medium text-emerald-200 truncate flex items-center gap-2">
                        <Music className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{isAr ? 'قائمة المحفزات الصوتية' : 'Motivation Tracklist'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                        <div className="bg-[#265a44] p-2 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1">
                          <SkipBack className="w-3.5 h-3.5" />
                          <span>{isAr ? 'السابق' : 'Prev'}</span>
                        </div>
                        <div className="bg-[#265a44] p-2 rounded-xl text-center font-bold text-xs text-emerald-300 flex items-center justify-center gap-1">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isAr ? 'تشغيل' : 'Play'}</span>
                        </div>
                        <div className="bg-[#265a44] p-2 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-1">
                          <span>{isAr ? 'التالي' : 'Next'}</span>
                          <SkipForward className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedWidget === 3 && (
                    <div className="p-3.5 rounded-2xl bg-[#143428] border border-emerald-500/30 text-white space-y-2">
                      <div className="text-center font-bold text-xs flex items-center justify-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span>{isAr ? 'مؤقت الراحة السريع' : 'Quick Rest Timer'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <div className="bg-[#265a44] p-2 rounded-xl text-center font-bold text-xs">
                          60 {isAr ? 'ث' : 's'}
                        </div>
                        <div className="bg-[#265a44] p-2 rounded-xl text-center font-bold text-xs text-emerald-300">
                          90 {isAr ? 'ث' : 's'}
                        </div>
                        <div className="bg-[#265a44] p-2 rounded-xl text-center font-bold text-xs">
                          120 {isAr ? 'ث' : 's'}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedWidget === 4 && (
                    <div className="p-3.5 rounded-2xl bg-[#143428] border border-emerald-500/30 text-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span>{isAr ? 'مؤشر الاستمرارية' : 'Fitness Streak'}</span>
                        </span>
                        <span className="text-[10px] bg-[#265a44] text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                          3 {isAr ? 'أيام' : 'Days'}
                        </span>
                      </div>
                      <div className="bg-[#265a44] p-2 rounded-xl text-center font-bold text-xs text-white flex items-center justify-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5 text-emerald-300" />
                        <span>{isAr ? 'بدء تمرين اليوم' : 'Start Today Workout'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'themes' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-2">
                    {isAr ? 'نمط وألوان الويدجت:' : 'Widget Theme Style:'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'emerald', name: isAr ? 'زمردي داكن' : 'Emerald', bg: 'bg-[#143428] border-emerald-500' },
                      { id: 'obsidian', name: isAr ? 'أسود ملكي' : 'Obsidian', bg: 'bg-[#18181b] border-zinc-600' },
                      { id: 'navy', name: isAr ? 'كحلي عميق' : 'Deep Navy', bg: 'bg-[#0f172a] border-blue-500' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedTheme(t.id as any);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedTheme === t.id
                            ? 'ring-2 ring-emerald-400 font-bold'
                            : 'opacity-70 hover:opacity-100'
                        } ${t.bg}`}
                      >
                        <span className="text-xs text-white">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-2">
                    {isAr ? 'المدة الافتراضية لمؤقت الراحة السريع:' : 'Default Rest Duration:'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[60, 90, 120].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setTimerDuration(sec);
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                          timerDuration === sec
                            ? 'bg-emerald-600 border-emerald-400 text-white'
                            : 'bg-emerald-950/40 border-emerald-900 text-emerald-300 hover:bg-emerald-900/60'
                        }`}
                      >
                        {sec} {isAr ? 'ثانية' : 'sec'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200/90 leading-relaxed flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                  <span>
                    {isAr
                      ? 'تتم مزامنة هذه الخيارات تلقائياً مع نظام أندرويد لتعمل كافة الويدجتات بسلاسة مع لاونشر جوالك.'
                      : 'Preferences sync with Android Launcher automatically.'}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'guide' && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'خطوات إضافة الويدجت لشاشة الجوال:' : 'How to add to Home Screen:'}</span>
                </h3>

                <ol className="space-y-2.5 text-xs text-emerald-100/90 list-decimal list-inside leading-relaxed bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-900/50">
                  <li className="font-medium">
                    {isAr ? 'انتقل إلى شاشة الجوال الرئيسية واضغط مطولاً في أي مكان فارغ.' : 'Go to your home screen and long press any empty area.'}
                  </li>
                  <li className="font-medium">
                    {isAr ? 'اختر "إضافة ويدجت" أو "Widgets" من القائمة السفلية.' : 'Tap "Widgets" from the launcher menu.'}
                  </li>
                  <li className="font-medium">
                    {isAr ? 'ابحث عن اسم التطبيق ("Trainingsplan Full Body").' : 'Search for "Trainingsplan Full Body".'}
                  </li>
                  <li className="font-medium">
                    {isAr ? 'اختر الويدجت المناسب (الخطة، المؤقت، الصوتيات، أو التتابع) واسحبه إلى شاشة هاتفك.' : 'Choose your favorite widget and drag it to your screen.'}
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-emerald-900/60 bg-[#121c17] flex justify-end">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('success');
                onClose();
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'حفظ وإغلاق' : 'Done & Save'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
