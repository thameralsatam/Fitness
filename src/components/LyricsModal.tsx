import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Sparkles,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MoreVertical,
  Edit3,
  Sliders,
  Copy,
  Download,
  Upload,
  Trash2,
  Check,
  Plus,
  Clock,
  Music,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Volume2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioTrack } from '../utils/audioDb';
import { LyricLine, Language } from '../types';
import { useAudio } from '../context/AudioContext';
import {
  transcribeAudioTrack,
  parseLrcFormat,
  exportToLrcFormat,
} from '../utils/transcribeService';
import { triggerHaptic } from '../utils/haptics';
import { ConfirmModal } from './ConfirmModal';

interface LyricsModalProps {
  track: AudioTrack;
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
}

type SheetHeightMode = 'peek' | 'standard' | 'full';

export const LyricsModal: React.FC<LyricsModalProps> = ({
  track: initialTrack,
  isOpen,
  onClose,
  currentLang,
}) => {
  const isAr = currentLang === 'ar';
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    handleSeek,
    handleNext,
    handlePrev,
    updateTrackLyrics,
    playTrackById,
  } = useAudio();

  // Active track is dynamically synced with current playing track if available
  const activeTrack = useMemo(() => {
    if (currentTrack && currentTrack.id === initialTrack.id) {
      return currentTrack;
    }
    return currentTrack || initialTrack;
  }, [currentTrack, initialTrack]);

  // View mode: 'karaoke' | 'editor'
  const [viewMode, setViewMode] = useState<'karaoke' | 'editor'>('karaoke');

  // Sheet height: 'peek' (mini bottom view) | 'standard' (75vh) | 'full' (95vh)
  const [sheetHeight, setSheetHeight] = useState<SheetHeightMode>('standard');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOffsetOpen, setIsOffsetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Local lines synced with active track
  const [lines, setLines] = useState<LyricLine[]>(activeTrack.lyrics || []);

  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Close 3-dot dropdown menu on any outside click / touch interaction
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', handleOutsideClick, true);
    window.addEventListener('touchstart', handleOutsideClick, true);
    window.addEventListener('click', handleOutsideClick, true);
    return () => {
      window.removeEventListener('pointerdown', handleOutsideClick, true);
      window.removeEventListener('touchstart', handleOutsideClick, true);
      window.removeEventListener('click', handleOutsideClick, true);
    };
  }, [isMenuOpen]);

  // Keep lines synced whenever activeTrack or its lyrics change
  useEffect(() => {
    setLines(activeTrack.lyrics || []);
  }, [activeTrack.id, activeTrack.lyrics]);

  const isCurrentPlaying = currentTrack?.id === activeTrack.id;
  const activePlayTime = isCurrentPlaying ? currentTime : 0;
  const activeDuration = isCurrentPlaying ? duration || activeTrack.duration || 0 : activeTrack.duration || 0;

  // Calculate current active line index based on playback time
  const activeIndex = useMemo(() => {
    if (!lines || lines.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (activePlayTime >= lines[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lines, activePlayTime]);

  // Smooth scroll to active line
  useEffect(() => {
    if (!isOpen || viewMode !== 'karaoke' || activeIndex === -1) return;

    if (isInitialMount.current) {
      const timer = setTimeout(() => {
        isInitialMount.current = false;
        if (activeLineRef.current && lyricsScrollRef.current) {
          activeLineRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 250);
      return () => clearTimeout(timer);
    }

    if (activeLineRef.current && lyricsScrollRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, viewMode, isOpen]);

  // Reset initial mount on open
  useEffect(() => {
    if (isOpen) {
      isInitialMount.current = true;
    }
  }, [isOpen]);

  // Seek to specific timestamp
  const handleSeekLine = (time: number) => {
    triggerHaptic('selection');
    if (!isCurrentPlaying) {
      playTrackById(activeTrack.id);
      setTimeout(() => handleSeek(time), 100);
    } else {
      handleSeek(time);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Toggle Sheet Height
  const cycleHeight = () => {
    triggerHaptic('light');
    setSheetHeight((prev) => {
      if (prev === 'peek') return 'standard';
      if (prev === 'standard') return 'full';
      return 'peek';
    });
  };

  // Single-button toggle for Editing & Saving
  const toggleEditMode = async () => {
    triggerHaptic('selection');
    if (viewMode === 'karaoke') {
      setViewMode('editor');
      if (sheetHeight === 'peek') setSheetHeight('standard');
    } else {
      // Save & Exit to Karaoke View
      await updateTrackLyrics(activeTrack.id, lines);
      setViewMode('karaoke');
      triggerHaptic('success');
    }
  };

  // AI Transcription with Gemini
  const handleTranscribe = async () => {
    if (isProcessing) return;
    triggerHaptic('medium');
    setIsProcessing(true);
    setProcessStatus(isAr ? 'جاري الاستماع وتفريغ الكلمات...' : 'KI transkribiert Audio...');

    try {
      let audioBlob: Blob | null = activeTrack.blob || null;
      if (!audioBlob && activeTrack.url) {
        setProcessStatus(isAr ? 'قراءة ملف الصوت...' : 'Lade Datei...');
        const res = await fetch(activeTrack.url);
        audioBlob = await res.blob();
      }

      if (!audioBlob) {
        throw new Error(isAr ? 'تعذر قراءة ملف الصوت' : 'Audiodatei nicht gefunden');
      }

      const extracted = await transcribeAudioTrack(
        audioBlob,
        activeTrack.mimeType || 'audio/mp3',
        currentLang,
        activeTrack.name
      );

      if (!extracted || extracted.length === 0) {
        throw new Error(isAr ? 'لم يتم استخراج كلمات من المقطع' : 'Keine Lyrics erkannt');
      }

      setLines(extracted);
      await updateTrackLyrics(activeTrack.id, extracted);
      triggerHaptic('success');
      setViewMode('karaoke');
    } catch (err: any) {
      console.error('Transcription error:', err);
      alert(err.message || (isAr ? 'حدث خطأ أثناء التفريغ' : 'Fehler bei der Transkription'));
    } finally {
      setIsProcessing(false);
      setProcessStatus('');
    }
  };

  // Timing Offset
  const handleApplyOffset = async (offsetSec: number) => {
    if (!lines || lines.length === 0) return;
    triggerHaptic('light');

    const updated = lines.map((line) => ({
      ...line,
      time: Math.max(0, parseFloat((line.time + offsetSec).toFixed(2))),
    }));

    setLines(updated);
    await updateTrackLyrics(activeTrack.id, updated);
  };

  // Editor line updates
  const handleSaveLine = async (index: number, newText: string, newTime: number) => {
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      text: newText.trim(),
      time: Math.max(0, parseFloat(newTime.toFixed(2))),
    };
    updated.sort((a, b) => a.time - b.time);
    setLines(updated);
    await updateTrackLyrics(activeTrack.id, updated);
  };

  const handleDeleteLine = async (index: number) => {
    triggerHaptic('light');
    const updated = lines.filter((_, i) => i !== index);
    setLines(updated);
    await updateTrackLyrics(activeTrack.id, updated);
  };

  const handleAddLineNow = async () => {
    triggerHaptic('light');
    const targetTime = Math.max(0, parseFloat(activePlayTime.toFixed(2)));
    const newLine: LyricLine = {
      id: `line_${Date.now()}`,
      time: targetTime,
      text: isAr ? 'سطر جديد' : 'Neue Zeile',
    };
    const updated = [...lines, newLine].sort((a, b) => a.time - b.time);
    setLines(updated);
    await updateTrackLyrics(activeTrack.id, updated);
  };

  const handleClearAll = () => {
    setIsMenuOpen(false);
    setShowClearConfirm(true);
  };

  const handleConfirmClearAllLyrics = async () => {
    triggerHaptic('medium');
    setLines([]);
    await updateTrackLyrics(activeTrack.id, []);
    setShowClearConfirm(false);
  };

  const handleCopyText = async () => {
    if (!lines || lines.length === 0) return;
    const fullText = lines.map((l) => l.text).join('\n');
    await navigator.clipboard.writeText(fullText);
    setCopySuccess(true);
    triggerHaptic('success');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleExportLrc = () => {
    if (!lines || lines.length === 0) return;
    const lrcContent = exportToLrcFormat(lines, activeTrack.name);
    const blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTrack.name.replace(/\.[^/.]+$/, '')}.lrc`;
    link.click();
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
  };

  const handleImportLrcFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseLrcFormat(content);
        if (parsed.length > 0) {
          setLines(parsed);
          await updateTrackLyrics(activeTrack.id, parsed);
          triggerHaptic('success');
          setViewMode('karaoke');
        }
      }
    };
    reader.readAsText(file);
    setIsMenuOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  // Compute container height classes based on sheetHeight
  const heightClasses = useMemo(() => {
    switch (sheetHeight) {
      case 'peek':
        return 'h-[280px] max-h-[300px]';
      case 'full':
        return 'h-[95vh]';
      case 'standard':
      default:
        return 'h-[75vh] max-h-[700px]';
    }
  }, [sheetHeight]);

  return (
    <AnimatePresence>
      <div
        id="lyrics-bottom-sheet-backdrop"
        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/35 animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            triggerHaptic('light');
            onClose();
          }
        }}
      >
        <motion.div
          id="lyrics-bottom-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full bg-white text-[#15221b] rounded-t-[32px] sm:rounded-t-[36px] shadow-2xl border-t border-x border-[#e2ebe3] flex flex-col overflow-hidden max-w-3xl mx-auto transition-[height] duration-200 ease-out will-change-transform ${heightClasses}`}
        >
          {/* ================= 1. PULL HANDLE & CLEAN TOP HEADER ================= */}
          <div className="pt-2 pb-2.5 px-4 sm:px-5 bg-white border-b border-[#eef4f0] flex-shrink-0 flex flex-col gap-1.5">
            {/* Centered Clickable Pull Bar */}
            <button
              type="button"
              onClick={cycleHeight}
              className="w-full py-1 flex items-center justify-center cursor-pointer group"
              title={
                isAr
                  ? sheetHeight === 'peek'
                    ? 'توسيع'
                    : sheetHeight === 'standard'
                    ? 'تكبير كامل'
                    : 'تصغير للأسفل'
                  : 'Größe anpassen'
              }
            >
              <div className="w-12 h-1.5 bg-[#d8e3d9] group-hover:bg-[#215641]/50 rounded-full transition-colors" />
            </button>

            <div className="flex items-center justify-between gap-3 pt-0.5">
              {/* Track Info (Left) */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0 border border-[#dbe4dc] shadow-2xs">
                  <Music className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#15221b] truncate font-display">
                    {activeTrack.name}
                  </h3>
                  <div className="text-xs text-[#6b7c72] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#215641]" />
                    <span className="truncate">
                      {lines.length > 0
                        ? isAr
                          ? `${lines.length} سطر متزامن`
                          : `${lines.length} Zeilen`
                        : isAr
                        ? 'الكلمات المتزامنة'
                        : 'Lyrics'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Right) - Unified single edit button & clean controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Single Toggle Button: [ ✍️ تعديل ] OR [ ✔️ حفظ والانتهاء ] (Icon only, matches adjacent buttons) */}
                {sheetHeight !== 'peek' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlaying && isCurrentPlaying && viewMode === 'karaoke') return;
                      toggleEditMode();
                    }}
                    disabled={isPlaying && isCurrentPlaying && viewMode === 'karaoke'}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-2xs border ${
                      viewMode === 'editor'
                        ? 'bg-[#215641] text-white border-[#215641] shadow-xs'
                        : isPlaying && isCurrentPlaying
                        ? 'bg-[#f4f8f5] text-[#a0b0a6] border-[#dbe4dc] opacity-50 cursor-not-allowed'
                        : 'bg-[#f4f8f5] hover:bg-[#edf4ef] text-[#42544a] border-[#dbe4dc]'
                    }`}
                    title={
                      viewMode === 'editor'
                        ? isAr
                          ? 'حفظ التعديلات والانتهاء'
                          : 'Speichern & Fertig'
                        : isPlaying && isCurrentPlaying
                        ? isAr
                          ? 'أوقف التشغيل لتعديل الكلمات'
                          : 'Pausiere Wiedergabe zum Bearbeiten'
                        : isAr
                        ? 'تعديل الكلمات والتوقيت'
                        : 'Lyrics bearbeiten'
                    }
                  >
                    {viewMode === 'editor' ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Edit3 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Sheet Size / Peek / Expand Toggle Button */}
                <button
                  type="button"
                  onClick={cycleHeight}
                  className="w-8 h-8 rounded-xl bg-[#f4f8f5] hover:bg-[#edf4ef] text-[#42544a] flex items-center justify-center transition-all border border-[#dbe4dc] active:scale-95 shadow-2xs"
                  title={
                    isAr
                      ? sheetHeight === 'peek'
                        ? 'توسيع للأعلى'
                        : sheetHeight === 'standard'
                        ? 'شاشة كاملة'
                        : 'تصغير شريط سفلي'
                      : 'Größe'
                  }
                >
                  {sheetHeight === 'peek' ? (
                    <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                  ) : sheetHeight === 'standard' ? (
                    <Maximize2 className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  )}
                </button>

                {/* Combined Menu (...) for All Tools & Options */}
                <div ref={menuRef} data-lyrics-menu className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border active:scale-95 shadow-2xs ${
                      isMenuOpen
                        ? 'bg-[#215641] text-white border-[#215641]'
                        : 'bg-[#f4f8f5] hover:bg-[#edf4ef] text-[#42544a] border-[#dbe4dc]'
                    }`}
                    title={isAr ? 'الخيارات والأدوات' : 'Optionen'}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMenuOpen(false);
                        }}
                      />
                      <div
                        className="absolute top-10 ltr:right-0 rtl:left-0 z-40 w-56 bg-white rounded-2xl shadow-xl border border-[#dbe4dc] p-1.5 space-y-1 text-xs font-bold animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleTranscribe();
                        }}
                        disabled={isProcessing}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[#215641] hover:bg-[#edf4ef] rounded-xl transition-colors text-right"
                      >
                        <Sparkles className="w-4 h-4 text-[#215641]" />
                        <span>{isAr ? 'توليد الكلمات بالذكاء الاصطناعي' : 'KI-Transkription'}</span>
                      </button>

                      {lines.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsOffsetOpen(!isOffsetOpen);
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[#15221b] hover:bg-[#f4f8f5] rounded-xl transition-colors text-right"
                        >
                          <Sliders className="w-4 h-4 text-[#6b7c72]" />
                          <span>{isAr ? 'وزن وتعديل التوقيت (Offset)' : 'Timing anpassen'}</span>
                        </button>
                      )}

                      {lines.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            handleCopyText();
                            setIsMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[#15221b] hover:bg-[#f4f8f5] rounded-xl transition-colors text-right"
                        >
                          {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#6b7c72]" />}
                          <span>{copySuccess ? (isAr ? 'تم النسخ!' : 'Kopiert!') : (isAr ? 'نسخ النص كاملاً' : 'Text kopieren')}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleExportLrc}
                        disabled={lines.length === 0}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[#15221b] hover:bg-[#f4f8f5] rounded-xl transition-colors text-right disabled:opacity-40"
                      >
                        <Download className="w-4 h-4 text-[#6b7c72]" />
                        <span>{isAr ? 'تصدير ملف .lrc' : 'LRC exportieren'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[#15221b] hover:bg-[#f4f8f5] rounded-xl transition-colors text-right"
                      >
                        <Upload className="w-4 h-4 text-[#6b7c72]" />
                        <span>{isAr ? 'استيراد ملف .lrc' : 'LRC importieren'}</span>
                      </button>

                      {lines.length > 0 && (
                        <div className="pt-1 border-t border-[#eef4f0]">
                          <button
                            type="button"
                            onClick={handleClearAll}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-right"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                            <span>{isAr ? 'حذف جميع الكلمات' : 'Lyrics löschen'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                  )}
                </div>

                {/* Close Button (X) */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  className="w-8 h-8 rounded-xl bg-[#f4f8f5] hover:bg-[#edf4ef] text-[#596b60] hover:text-[#15221b] flex items-center justify-center transition-all border border-[#dbe4dc] active:scale-95 shadow-2xs"
                  title={isAr ? 'إغلاق' : 'Schließen'}
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".lrc,.txt"
            onChange={handleImportLrcFile}
            className="hidden"
          />

          {/* ================= 2. COLLAPSIBLE OFFSET ADJUSTMENT ================= */}
          <AnimatePresence>
            {isOffsetOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#f4f8f5] px-4 sm:px-5 py-2.5 border-b border-[#e2ebe3] flex flex-wrap items-center justify-between gap-2 text-xs overflow-hidden flex-shrink-0"
              >
                <div className="flex items-center gap-1.5 text-[#215641] font-bold">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isAr ? 'وزن التوقيت لجميع الأسطر:' : 'Timing anpassen:'}</span>
                </div>
                <div className="flex items-center gap-1" dir="ltr">
                  {[-1.0, -0.5, -0.2, 0.2, 0.5, 1.0].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleApplyOffset(sec)}
                      className="h-6.5 px-2 rounded-lg bg-white border border-[#dbe4dc] text-[#15221b] font-mono font-bold hover:bg-[#edf4ef] active:scale-95 shadow-2xs transition-all text-xs"
                    >
                      {sec > 0 ? `+${sec}s` : `${sec}s`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsOffsetOpen(false)}
                    className="h-6.5 px-2 rounded-lg text-[#6b7c72] hover:text-[#15221b] font-bold text-xs"
                  >
                    {isAr ? 'إغلاق' : 'OK'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= 3. CONTENT (PEEK / KARAOKE / EDITOR) ================= */}
          <div className="flex-1 relative overflow-hidden flex flex-col bg-[#fafcfa]">
            {/* A. PEEK MODE: MINI CONCISE VIEW (With larger, clearer typography) */}
            {sheetHeight === 'peek' && (
              <div
                className="flex-1 px-5 py-4 flex flex-col justify-center items-center text-center cursor-pointer select-none bg-gradient-to-b from-white to-[#f7faf8] group"
                onClick={() => setSheetHeight('standard')}
              >
                {lines.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-[#6b7c72]">
                      {isAr ? 'لا توجد كلمات محفوظة' : 'Keine Lyrics vorhanden'}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSheetHeight('standard');
                        handleTranscribe();
                      }}
                      className="text-xs sm:text-sm font-bold text-[#215641] hover:underline flex items-center gap-1.5 mx-auto bg-[#edf4ef] px-3.5 py-1.5 rounded-xl border border-[#cbe0d2]"
                    >
                      <Sparkles className="w-4 h-4 text-[#215641]" />
                      <span>{isAr ? 'توليد الكلمات الآن بالذكاء الاصطناعي' : 'Jetzt transkribieren'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-w-xl w-full">
                    {/* Active highlighted line in large readable font */}
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-[#15221b] font-display line-clamp-2 px-3 transition-all leading-snug">
                      {activeIndex >= 0 && lines[activeIndex]
                        ? lines[activeIndex].text
                        : isAr
                        ? '🎵 جاري الاستماع للمقطع...'
                        : '🎵 Wiedergabe...'}
                    </div>

                    {/* Next line preview */}
                    {activeIndex + 1 < lines.length && (
                      <div className="text-xs sm:text-sm font-medium text-[#7a8f82] line-clamp-1 opacity-85">
                        {lines[activeIndex + 1].text}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* B. STANDARD / FULL MODE: FULL KARAOKE VIEW (With prominent font size) */}
            {sheetHeight !== 'peek' && viewMode === 'karaoke' && (
              <div
                ref={lyricsScrollRef}
                className="flex-1 px-4 sm:px-8 py-6 overflow-y-auto space-y-4 scroll-smooth relative"
              >
                {/* Processing State */}
                {isProcessing && (
                  <div className="my-8 flex flex-col items-center justify-center gap-3.5 text-center p-6 bg-white rounded-3xl border border-[#cbe0d2] shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center border border-[#dbe4dc] shadow-xs">
                      <Sparkles className="w-6 h-6 animate-spin text-[#215641]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-[#15221b] font-display">
                        {isAr ? 'جاري الاستماع وتفريغ الكلمات...' : 'KI transkribiert Audio...'}
                      </h4>
                      <p className="text-xs text-[#6b7c72]">{processStatus}</p>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isProcessing && lines.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-3.5 py-10 text-center my-auto">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-[#dbe4dc] text-[#215641] flex items-center justify-center shadow-xs">
                      <Sparkles className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <h4 className="text-base font-bold text-[#15221b] font-display">
                        {isAr ? 'لا توجد كلمات لهذا المقطع بعد' : 'Keine Lyrics vorhanden'}
                      </h4>
                      <p className="text-xs text-[#6b7c72] leading-relaxed">
                        {isAr
                          ? 'تفريغ وتوقيت الكلمات يتم لمرة واحدة بالذكاء الاصطناعي ويُحفظ دائماً على جهازك.'
                          : 'Wird einmalig per KI transkribiert und dauerhaft gespeichert.'}
                      </p>
                    </div>

                    <div className="flex flex-col w-full max-w-xs gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleTranscribe}
                        className="w-full h-11 rounded-2xl bg-[#215641] hover:bg-[#1a4735] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>{isAr ? 'توليد الكلمات بالذكاء الاصطناعي' : 'Mit KI transkribieren'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewMode('editor')}
                        className="w-full h-10 rounded-2xl bg-white hover:bg-[#f4f8f5] text-[#215641] font-bold text-xs flex items-center justify-center gap-2 transition-all border border-[#dbe4dc] active:scale-98 shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إدخال أو تعديل يدوي' : 'Manuell eingeben'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Lyrics Presentation - Larger text, clear line-heights */}
                {!isProcessing &&
                  lines.length > 0 &&
                  lines.map((line, idx) => {
                    const isActive = idx === activeIndex;
                    const isPast = idx < activeIndex;

                    return (
                      <div
                        key={line.id || idx}
                        ref={isActive ? activeLineRef : null}
                        onClick={() => handleSeekLine(line.time)}
                        className={`group px-4 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 border select-none ${
                          isActive
                            ? 'bg-[#edf4ef] border-[#bad3c3] text-[#15221b] scale-[1.01] shadow-xs'
                            : isPast
                            ? 'bg-transparent border-transparent text-[#8b9e93] hover:text-[#15221b] hover:bg-white'
                            : 'bg-transparent border-transparent text-[#47574e] hover:text-[#15221b] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                              isActive ? 'bg-[#215641] scale-150 ring-4 ring-[#215641]/15' : 'bg-transparent'
                            }`}
                          />
                          <p
                            className={`font-display leading-relaxed transition-all break-words ${
                              isActive
                                ? 'text-base sm:text-lg md:text-xl font-bold text-[#15221b]'
                                : 'text-sm sm:text-base font-medium'
                            }`}
                          >
                            {line.text}
                          </p>
                        </div>

                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl flex-shrink-0 border transition-all ${
                            isActive
                              ? 'text-[#215641] bg-white border-[#bad3c3] shadow-2xs'
                              : 'text-[#94a39a] bg-white/60 border-[#e2ebe3]'
                          }`}
                        >
                          {formatTime(line.time)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* C. EDIT MODE: LINE EDITOR */}
            {sheetHeight !== 'peek' && viewMode === 'editor' && (
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-white">
                <div className="flex items-center justify-between gap-2.5 pb-1">
                  <button
                    type="button"
                    onClick={handleAddLineNow}
                    className="h-9 px-4 rounded-xl bg-[#215641] hover:bg-[#1a4735] text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{isAr ? 'إضافة سطر بالتوقيت الحالي' : 'Zeile hinzufügen'}</span>
                  </button>

                  <div className="text-xs font-bold text-[#6b7c72]">
                    {lines.length} {isAr ? 'سطر' : 'Zeilen'}
                  </div>
                </div>

                {lines.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#75877d] space-y-1">
                    <p className="font-bold text-[#15221b]">{isAr ? 'لا توجد أسطر بعد' : 'Keine Zeilen'}</p>
                    <p>{isAr ? 'اضغط «إضافة سطر» للبدء' : 'Klicke oben auf "Zeile hinzufügen"'}</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {lines.map((line, idx) => (
                      <div
                        key={line.id || idx}
                        className="p-3 bg-[#fafcfa] border border-[#e2ebe3] rounded-2xl space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#edf4ef] text-[#215641] flex items-center justify-center text-xs font-mono font-bold">
                              #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1 bg-white border border-[#dbe4dc] rounded-xl px-2 py-0.5 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-[#75877d]" />
                              <input
                                type="number"
                                step="0.1"
                                value={line.time}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const copy = [...lines];
                                  copy[idx].time = val;
                                  setLines(copy);
                                }}
                                onBlur={() => handleSaveLine(idx, line.text, line.time)}
                                className="w-14 text-xs font-mono text-center text-[#15221b] font-bold focus:outline-none bg-transparent"
                              />
                              <span className="text-[11px] text-[#75877d] font-mono">s</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveLine(idx, line.text, activePlayTime)}
                              className="h-7 px-2.5 rounded-lg bg-[#edf4ef] hover:bg-[#dceade] border border-[#cbe0d2] text-xs font-bold text-[#215641] transition-all active:scale-95"
                              title={isAr ? 'ضبط للتوقيت الحالي للمشغل' : 'Jetzt'}
                            >
                              {isAr ? 'ضبط للآن' : 'Jetzt'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteLine(idx)}
                              className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-200/60 flex items-center justify-center transition-all active:scale-95"
                              title={isAr ? 'حذف' : 'Löschen'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={line.text}
                          onChange={(e) => {
                            const copy = [...lines];
                            copy[idx].text = e.target.value;
                            setLines(copy);
                          }}
                          onBlur={() => handleSaveLine(idx, line.text, line.time)}
                          className="w-full bg-white border border-[#dbe4dc] rounded-xl px-3 py-2 text-sm text-[#15221b] font-medium focus:outline-none focus:border-[#215641] focus:ring-2 focus:ring-[#215641]/10"
                          placeholder={isAr ? 'نص السطر...' : 'Text...'}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= 4. INTEGRATED COMPACT PLAYER BAR ================= */}
          <div className="px-4 sm:px-5 py-2.5 bg-white border-t border-[#eef4f0] flex flex-col gap-1.5 flex-shrink-0 shadow-lg">
            {/* Timeline Bar */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-[#6b7c72] w-9 text-right">
                {formatTime(activePlayTime)}
              </span>
              <div
                className="flex-1 h-1.5 bg-[#edf2ee] rounded-full overflow-hidden cursor-pointer relative group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  const targetTime = percent * (activeDuration || 1);
                  handleSeekLine(targetTime);
                }}
              >
                <div
                  className="h-full bg-[#215641] transition-all duration-100 rounded-full"
                  style={{
                    width: `${activeDuration ? (activePlayTime / activeDuration) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-[#6b7c72] w-9">
                {formatTime(activeDuration)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Volume2 className="w-3.5 h-3.5 text-[#215641] flex-shrink-0" />
                <span className="text-xs font-bold text-[#15221b] truncate">{activeTrack.name}</span>
              </div>

              {/* Player Controls (Prev, Play, Next) */}
              <div className="flex items-center gap-1.5" dir="ltr">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    handlePrev();
                  }}
                  className="w-8 h-8 rounded-xl bg-[#f4f8f5] hover:bg-[#edf4ef] text-[#596b60] hover:text-[#15221b] flex items-center justify-center transition-all border border-[#dbe4dc] active:scale-95 shadow-2xs"
                  title={isAr ? 'السابق' : 'Zurück'}
                >
                  <SkipBack className="w-3.5 h-3.5 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    if (!isCurrentPlaying) {
                      playTrackById(activeTrack.id);
                    } else {
                      togglePlay();
                    }
                  }}
                  className="w-9 h-9 rounded-2xl bg-[#215641] hover:bg-[#1a4735] text-white flex items-center justify-center font-bold transition-all active:scale-95 shadow-md flex-shrink-0"
                >
                  {isCurrentPlaying && isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    handleNext();
                  }}
                  className="w-8 h-8 rounded-xl bg-[#f4f8f5] hover:bg-[#edf4ef] text-[#596b60] hover:text-[#15221b] flex items-center justify-center transition-all border border-[#dbe4dc] active:scale-95 shadow-2xs"
                  title={isAr ? 'التالي' : 'Weiter'}
                >
                  <SkipForward className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Clear All Lyrics Confirmation Modal */}
        <ConfirmModal
          isOpen={showClearConfirm}
          title={isAr ? 'حذف جميع الكلمات' : 'Alle Lyrics löschen'}
          description={
            isAr
              ? `هل أنت متأكد من رغبتك في حذف كافة الكلمات المحفوظة لمقطع "${activeTrack.name}" نهائياً؟`
              : `Möchtest du wirklich alle synchronisierten Songtexte für "${activeTrack.name}" löschen?`
          }
          confirmText={isAr ? 'نعم، احذف الكلمات' : 'Ja, löschen'}
          cancelText={isAr ? 'إلغاء' : 'Abbrechen'}
          type="danger"
          currentLang={currentLang}
          onConfirm={handleConfirmClearAllLyrics}
          onCancel={() => setShowClearConfirm(false)}
        />
      </div>
    </AnimatePresence>
  );
};
