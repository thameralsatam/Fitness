import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Clock,
  Check,
  Plus,
  Trash2,
  Download,
  Upload,
  Copy,
  AlertCircle,
  FileText,
  Sliders,
  Mic,
  MicOff,
  MoreVertical,
  Volume2,
  Sparkles,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { AudioTrack } from '../utils/audioDb';
import { LyricLine, Language } from '../types';
import { exportToLrcFormat, parseLrcFormat } from '../utils/transcribeService';
import { localSpeechEngine } from '../utils/localSpeechRecognizer';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';
import { useAudio } from '../context/AudioContext';

interface LyricsModalProps {
  track: AudioTrack;
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  track,
  isOpen,
  onClose,
  currentLang,
}) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    handleSeek,
    handleSkip,
    playTrackById,
    updateTrackLyrics,
  } = useAudio();

  const isAr = currentLang === 'ar';
  const [activeTab, setActiveTab] = useState<'karaoke' | 'editor' | 'raw_lrc'>('karaoke');
  const [isLiveListening, setIsLiveListening] = useState<boolean>(false);
  const [speechStatusMsg, setSpeechStatusMsg] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isOffsetOpen, setIsOffsetOpen] = useState<boolean>(false);

  // Local editable lines state
  const [editableLyrics, setEditableLyrics] = useState<LyricLine[]>(track.lyrics || []);
  const [rawLrcText, setRawLrcText] = useState<string>('');

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lrcFileInputRef = useRef<HTMLInputElement | null>(null);

  const isCurrentPlayingTrack = currentTrack?.id === track.id;

  // Track modal open/close in global modal manager
  useEffect(() => {
    if (isOpen) {
      notifyModalChange(true);
      document.body.style.overflow = 'hidden';
      return () => {
        notifyModalChange(false);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Sync state when track or track.lyrics changes
  useEffect(() => {
    if (track) {
      setEditableLyrics(track.lyrics || []);
      setRawLrcText(exportToLrcFormat(track.lyrics || [], track.name));
    }
  }, [track, track.lyrics]);

  // Clean up speech listener on unmount
  useEffect(() => {
    return () => {
      localSpeechEngine.stop();
    };
  }, []);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Find active lyric line index based on current time
  const currentLyrics = track.lyrics || [];
  const activeLineIndex = (() => {
    if (!isCurrentPlayingTrack || currentLyrics.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < currentLyrics.length; i++) {
      if (currentTime >= currentLyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  })();

  // Smooth auto-scroll to keep active line centered
  useEffect(() => {
    if (autoScroll && activeTab === 'karaoke' && activeLineRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = activeLineRef.current;
      const targetScroll =
        element.offsetTop - container.offsetTop - container.clientHeight / 2 + element.clientHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [activeLineIndex, autoScroll, activeTab]);

  // Toggle Live Local Speech Recognition
  const handleToggleLocalListening = () => {
    if (isLiveListening) {
      localSpeechEngine.stop();
      setIsLiveListening(false);
      setSpeechStatusMsg(null);
      triggerHaptic('light');
    } else {
      if (!localSpeechEngine.isSupported()) {
        setSpeechStatusMsg(
          isAr
            ? 'التعرف الصوتي المباشر غير مدعوم على متصفحك الحالي، يمكنك استيراد ملف .lrc'
            : 'Spracherkennung wird auf diesem Browser nicht unterstützt'
        );
        return;
      }

      setSpeechStatusMsg(null);
      localSpeechEngine.setLanguage(currentLang);
      triggerHaptic('medium');

      if (!isCurrentPlayingTrack) {
        playTrackById(track.id);
      } else if (!isPlaying) {
        togglePlay();
      }

      localSpeechEngine.start(
        currentTime,
        async (newLine) => {
          setEditableLyrics((prev) => {
            const updated = [...prev, newLine].sort((a, b) => a.time - b.time);
            updateTrackLyrics(track.id, updated);
            setRawLrcText(exportToLrcFormat(updated, track.name));
            return updated;
          });
          triggerHaptic('light');
        },
        (status, msg) => {
          if (status === 'listening') {
            setIsLiveListening(true);
            setSpeechStatusMsg(
              isAr
                ? 'جاري الاستماع وتسجيل الكلمات بالتوقيت...'
                : 'Live-Erkennung aktiv...'
            );
          } else if (status === 'error') {
            setIsLiveListening(false);
            setSpeechStatusMsg(msg || (isAr ? 'حدث خطأ بالمايكروفون' : 'Fehler'));
          } else {
            setIsLiveListening(false);
          }
        }
      );
    }
  };

  // Adjust all timestamps with offset (+/- seconds)
  const handleApplyOffset = async (offsetSeconds: number) => {
    const adjusted = currentLyrics.map((l) => ({
      ...l,
      time: Math.max(0, parseFloat((l.time + offsetSeconds).toFixed(2))),
    }));
    await updateTrackLyrics(track.id, adjusted);
    setEditableLyrics(adjusted);
    setRawLrcText(exportToLrcFormat(adjusted, track.name));
    triggerHaptic('light');
  };

  // Save manual line changes
  const handleSaveLine = async (index: number, newText: string, newTime: number) => {
    const updated = [...editableLyrics];
    updated[index] = {
      ...updated[index],
      text: newText.trim(),
      time: Math.max(0, newTime),
    };
    updated.sort((a, b) => a.time - b.time);
    await updateTrackLyrics(track.id, updated);
    setEditableLyrics(updated);
    setRawLrcText(exportToLrcFormat(updated, track.name));
    triggerHaptic('light');
  };

  // Add line at current playback time
  const handleAddLineAtCurrentTime = async () => {
    const newLineTime = isCurrentPlayingTrack ? parseFloat(currentTime.toFixed(2)) : 0;
    const newLine: LyricLine = {
      id: `line_${Date.now()}`,
      time: newLineTime,
      text: isAr ? 'سطر جديد...' : 'Neue Zeile...',
    };
    const updated = [...editableLyrics, newLine].sort((a, b) => a.time - b.time);
    await updateTrackLyrics(track.id, updated);
    setEditableLyrics(updated);
    setRawLrcText(exportToLrcFormat(updated, track.name));
    triggerHaptic('medium');
  };

  // Delete single line
  const handleDeleteLine = async (index: number) => {
    const updated = editableLyrics.filter((_, i) => i !== index);
    await updateTrackLyrics(track.id, updated);
    setEditableLyrics(updated);
    setRawLrcText(exportToLrcFormat(updated, track.name));
    triggerHaptic('medium');
  };

  // Clear all lyrics
  const handleClearAllLyrics = async () => {
    if (window.confirm(isAr ? 'هل أنت متأكد من مسح جميع كلمات هذا المقطع؟' : 'Alle Zeilen löschen?')) {
      await updateTrackLyrics(track.id, []);
      setEditableLyrics([]);
      setRawLrcText('');
      setIsMenuOpen(false);
      triggerHaptic('medium');
    }
  };

  // Save LRC text from raw editor
  const handleSaveRawLrc = async () => {
    try {
      const parsed = parseLrcFormat(rawLrcText);
      await updateTrackLyrics(track.id, parsed);
      setEditableLyrics(parsed);
      setActiveTab('karaoke');
      triggerHaptic('heavy');
    } catch (e) {
      console.error('Failed to parse LRC:', e);
    }
  };

  // Import LRC file
  const handleImportLrcFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawLrcText(content);
        const parsed = parseLrcFormat(content);
        if (parsed.length > 0) {
          await updateTrackLyrics(track.id, parsed);
          setEditableLyrics(parsed);
          setActiveTab('karaoke');
          triggerHaptic('heavy');
        }
      }
    };
    reader.readAsText(file);
  };

  // Export LRC file download
  const handleExportLrcDownload = () => {
    const content = exportToLrcFormat(currentLyrics, track.name);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.name}.lrc`;
    a.click();
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
    triggerHaptic('light');
  };

  // Copy lyrics to clipboard
  const handleCopyLyrics = () => {
    const plainText = currentLyrics.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(plainText).then(() => {
      setCopySuccess(true);
      triggerHaptic('light');
      setTimeout(() => {
        setCopySuccess(false);
        setIsMenuOpen(false);
      }, 1500);
    });
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
        />

        {/* Dialog Modal Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-[#e2ebe3] z-10 overflow-hidden max-h-[90vh] flex flex-col text-[#15221b]"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3.5 border-b border-[#eef4f0] flex-shrink-0 bg-white">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center border border-[#dbe4dc] shadow-2xs flex-shrink-0">
                <FileText className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-extrabold text-base sm:text-lg text-[#15221b] truncate leading-tight">
                  {track.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-[#75877d] font-medium">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#215641]" />
                  <span>{isAr ? 'الكلمات المتزامنة' : 'Synchrone Lyrics'}</span>
                  {currentLyrics.length > 0 && (
                    <span className="text-[#94a39a]">({currentLyrics.length} {isAr ? 'سطر' : 'Zeilen'})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {currentLyrics.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-9 h-9 rounded-2xl bg-[#f4f8f5] hover:bg-[#edf4ef] text-[#596b60] hover:text-[#15221b] flex items-center justify-center transition-all border border-[#e2ebe3] active:scale-95"
                    title={isAr ? 'خيارات إضافية' : 'Optionen'}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute top-11 ltr:right-0 rtl:left-0 z-30 w-48 bg-white rounded-2xl shadow-xl border border-[#e2ebe3] p-1.5 space-y-1 animate-fade-in text-xs font-bold">
                      <button
                        type="button"
                        onClick={handleCopyLyrics}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[#15221b] hover:bg-[#f4f8f5] rounded-xl transition-colors text-right"
                      >
                        {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#596b60]" />}
                        <span>{copySuccess ? (isAr ? 'تم النسخ!' : 'Kopiert!') : (isAr ? 'نسخ النص بالكامل' : 'Text kopieren')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportLrcDownload}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[#15221b] hover:bg-[#f4f8f5] rounded-xl transition-colors text-right"
                      >
                        <Download className="w-4 h-4 text-[#596b60]" />
                        <span>{isAr ? 'تصدير ملف .lrc' : 'LRC exportieren'}</span>
                      </button>

                      <div className="my-1 border-t border-[#eef4f0]" />

                      <button
                        type="button"
                        onClick={handleClearAllLyrics}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-right"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <span>{isAr ? 'حذف جميع الكلمات' : 'Lyrics löschen'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="w-9 h-9 rounded-2xl bg-[#f4f8f5] hover:bg-[#edf4ef] text-[#596b60] hover:text-[#15221b] flex items-center justify-center transition-all border border-[#e2ebe3] active:scale-95"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>

          {/* Clean Segmented Navigation Tabs */}
          <div className="px-5 py-2.5 border-b border-[#eef4f0] bg-[#fafcfa] flex items-center justify-between gap-2.5 flex-shrink-0">
            <div className="flex items-center gap-1 bg-[#edf2ee] p-1 rounded-2xl border border-[#dfe7e1] flex-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('karaoke');
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-98 ${
                  activeTab === 'karaoke'
                    ? 'bg-[#215641] text-white shadow-2xs'
                    : 'text-[#607267] hover:text-[#15221b]'
                }`}
              >
                {isAr ? 'العرض المتزامن' : 'Karaoke'}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('editor');
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-98 ${
                  activeTab === 'editor'
                    ? 'bg-[#215641] text-white shadow-2xs'
                    : 'text-[#607267] hover:text-[#15221b]'
                }`}
              >
                {isAr ? 'محرر الأسطر' : 'Editor'}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveTab('raw_lrc');
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-98 ${
                  activeTab === 'raw_lrc'
                    ? 'bg-[#215641] text-white shadow-2xs'
                    : 'text-[#607267] hover:text-[#15221b]'
                }`}
              >
                {isAr ? 'صيغة LRC' : 'LRC Text'}
              </button>
            </div>

            {/* Quick Offset Toggle */}
            {currentLyrics.length > 0 && activeTab === 'karaoke' && (
              <button
                type="button"
                onClick={() => setIsOffsetOpen(!isOffsetOpen)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 ${
                  isOffsetOpen
                    ? 'bg-[#215641] text-white border-[#215641] shadow-2xs'
                    : 'bg-white text-[#596b60] border-[#dbe4dc] hover:bg-[#f4f8f5]'
                }`}
                title={isAr ? 'وزن التوقيت' : 'Offset'}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'وزن التوقيت' : 'Offset'}</span>
              </button>
            )}
          </div>

          {/* Primary Quick Actions Bar (Clean & Spaced) */}
          <div className="px-5 py-2.5 bg-white border-b border-[#eef4f0] flex items-center justify-between gap-3 flex-shrink-0 text-xs">
            <input
              ref={lrcFileInputRef}
              type="file"
              accept=".lrc,.txt"
              onChange={handleImportLrcFile}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => lrcFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-[#edf4ef] hover:bg-[#e4efe7] text-[#215641] border border-[#cbe0d2] transition-all active:scale-95 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>{isAr ? 'استيراد ملف .lrc' : 'LRC importieren'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleLocalListening}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold border transition-all active:scale-95 ${
                  isLiveListening
                    ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                    : 'bg-white text-[#596b60] border-[#dbe4dc] hover:bg-[#f4f8f5]'
                }`}
              >
                {isLiveListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#215641]" />}
                <span>
                  {isLiveListening
                    ? isAr
                      ? 'إيقاف المايك'
                      : 'Stop'
                    : isAr
                    ? 'استماع بالمايك'
                    : 'Live-Diktat'}
                </span>
              </button>
            </div>

            {currentLyrics.length > 0 && activeTab === 'karaoke' && (
              <button
                type="button"
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all active:scale-95 ${
                  autoScroll
                    ? 'bg-[#edf4ef] text-[#215641] border-[#cbe0d2]'
                    : 'bg-white text-[#94a39a] border-[#e2ebe3]'
                }`}
              >
                {isAr ? 'متابعة تلقائية' : 'Auto-Scroll'}
              </button>
            )}
          </div>

          {/* Speech Banner */}
          {speechStatusMsg && (
            <div
              className={`mx-5 mt-2.5 p-3 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
                isLiveListening
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              {isLiveListening ? (
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              )}
              <span className="flex-1 leading-normal">{speechStatusMsg}</span>
            </div>
          )}

          {/* Sync Offset Quick Panel */}
          <AnimatePresence>
            {isOffsetOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#f4f8f5] px-5 py-2.5 border-b border-[#e2ebe3] flex items-center justify-between gap-3 text-xs overflow-hidden"
              >
                <span className="text-[#596b60] font-bold">
                  {isAr ? 'وزن توقيت الكلمات بالكامل:' : 'Timing verschieben:'}
                </span>
                <div className="flex items-center gap-1.5" dir="ltr">
                  <button
                    type="button"
                    onClick={() => handleApplyOffset(-0.5)}
                    className="px-2.5 py-1 rounded-xl bg-white border border-[#dbe4dc] text-[#15221b] font-mono font-bold hover:bg-[#edf4ef] active:scale-95 transition-all shadow-2xs"
                  >
                    -0.5s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyOffset(-0.2)}
                    className="px-2 py-1 rounded-xl bg-white border border-[#dbe4dc] text-[#15221b] font-mono font-bold hover:bg-[#edf4ef] active:scale-95 transition-all shadow-2xs"
                  >
                    -0.2s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyOffset(0.2)}
                    className="px-2 py-1 rounded-xl bg-white border border-[#dbe4dc] text-[#15221b] font-mono font-bold hover:bg-[#edf4ef] active:scale-95 transition-all shadow-2xs"
                  >
                    +0.2s
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyOffset(0.5)}
                    className="px-2.5 py-1 rounded-xl bg-white border border-[#dbe4dc] text-[#15221b] font-mono font-bold hover:bg-[#edf4ef] active:scale-95 transition-all shadow-2xs"
                  >
                    +0.5s
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================= TAB 1: LUXURY CARD-LESS LYRICS STREAM ================= */}
          {activeTab === 'karaoke' && (
            <div
              ref={scrollContainerRef}
              className="flex-1 px-5 py-6 overflow-y-auto min-h-[300px] max-h-[52vh] scroll-smooth"
            >
              {currentLyrics.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3.5 py-14 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-[#edf4ef] border border-[#dbe4dc] text-[#215641] flex items-center justify-center shadow-2xs">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h4 className="text-base font-extrabold text-[#15221b]">
                      {isAr ? 'لا توجد كلمات محفوظة بعد' : 'Noch keine Lyrics'}
                    </h4>
                    <p className="text-xs text-[#75877d] leading-relaxed">
                      {isAr
                        ? 'استورد ملف .lrc جاهز للمقطع، أو الصق الكلمات لتتزامن مباشرة وبدون إنترنت.'
                        : 'Importiere eine .lrc Datei oder füge den Text manuell ein.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => lrcFileInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-2xl bg-[#215641] hover:bg-[#1b4635] text-white font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isAr ? 'استيراد ملف .lrc' : 'LRC importieren'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('raw_lrc')}
                      className="px-4 py-2.5 rounded-2xl bg-[#f4f8f5] hover:bg-[#edf4ef] text-[#215641] font-bold text-xs flex items-center gap-1.5 transition-all border border-[#dbe4dc] active:scale-95"
                    >
                      <span>{isAr ? 'لصق النص' : 'Text einfügen'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4 max-w-lg mx-auto">
                  {currentLyrics.map((line, idx) => {
                    const isActive = idx === activeLineIndex;
                    const isPast = idx < activeLineIndex;

                    return (
                      <div
                        key={line.id || idx}
                        ref={isActive ? activeLineRef : null}
                        onClick={() => {
                          if (!isCurrentPlayingTrack) {
                            playTrackById(track.id);
                          }
                          handleSeek(line.time);
                          triggerHaptic('light');
                        }}
                        className={`group px-4 py-3 rounded-2xl transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-[#edf4ef]/90 text-[#15221b] scale-[1.02] shadow-xs'
                            : isPast
                            ? 'text-[#8b9e93] hover:text-[#15221b] hover:bg-[#fafcfa]'
                            : 'text-[#47574e] hover:text-[#15221b] hover:bg-[#fafcfa]'
                        }`}
                      >
                        {/* Lyric Text with High Typography Craft */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          {/* Active Pulsing Indicator Line */}
                          <div
                            className={`w-1.5 self-stretch rounded-full transition-all duration-300 ${
                              isActive
                                ? 'bg-[#215641]'
                                : 'bg-transparent group-hover:bg-[#dbe4dc]'
                            }`}
                          />

                          <div
                            className={`text-base sm:text-[17px] leading-relaxed transition-all duration-200 ${
                              isActive
                                ? 'text-[#215641] font-extrabold font-display'
                                : 'font-medium font-display'
                            }`}
                          >
                            {line.text}
                          </div>
                        </div>

                        {/* Subtle Time Tag */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`text-[11px] font-mono font-bold transition-all px-2 py-0.5 rounded-lg ${
                              isActive
                                ? 'text-[#215641] bg-[#dbe8df]'
                                : 'text-[#a3b3a9] opacity-70 group-hover:opacity-100'
                            }`}
                          >
                            {formatTime(line.time)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: LINE-BY-LINE EDITOR ================= */}
          {activeTab === 'editor' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-3 min-h-[300px] max-h-[52vh]">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#eef4f0]">
                <span className="text-xs text-[#75877d] font-bold">
                  {isAr ? 'تعديل نصوص وتوقيت كل سطر' : 'Zeilen bearbeiten'}
                </span>
                <button
                  type="button"
                  onClick={handleAddLineAtCurrentTime}
                  className="px-3.5 py-1.5 rounded-xl bg-[#215641] hover:bg-[#1b4635] text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isAr ? 'إضافة سطر بالتوقيت الحالي' : 'Zeile hinzufügen'}</span>
                </button>
              </div>

              {editableLyrics.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#75877d] italic">
                  {isAr ? 'لا توجد أسطر بعد. انقر زر الإضافة بالأعلى!' : 'Keine Zeilen vorhanden.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {editableLyrics.map((line, idx) => {
                    return (
                      <div
                        key={line.id || idx}
                        className="p-3 bg-[#fafcfa] border border-[#e2ebe3] rounded-2xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-extrabold text-[#215641]">#{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#75877d]" />
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={line.time}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const updated = [...editableLyrics];
                                  updated[idx].time = val;
                                  setEditableLyrics(updated);
                                }}
                                onBlur={() => handleSaveLine(idx, line.text, line.time)}
                                className="w-16 bg-white border border-[#dbe4dc] rounded-lg px-2 py-0.5 text-xs font-mono text-center text-[#15221b] font-bold"
                              />
                              <span className="text-[11px] text-[#75877d]">s</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (isCurrentPlayingTrack) {
                                  const updated = [...editableLyrics];
                                  updated[idx].time = parseFloat(currentTime.toFixed(2));
                                  setEditableLyrics(updated);
                                  handleSaveLine(idx, line.text, updated[idx].time);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#edf4ef] hover:bg-[#e4efe7] text-[11px] font-bold text-[#215641] transition-all"
                              title={isAr ? 'تعيين التوقيت الحالي للصوت' : 'Jetzt'}
                            >
                              {isAr ? 'ضبط للتوقيت الآن' : 'Jetzt'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteLine(idx)}
                              className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all"
                              title={isAr ? 'حذف' : 'Löschen'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={line.text}
                          onChange={(e) => {
                            const updated = [...editableLyrics];
                            updated[idx].text = e.target.value;
                            setEditableLyrics(updated);
                          }}
                          onBlur={() => handleSaveLine(idx, line.text, line.time)}
                          className="w-full bg-white border border-[#dbe4dc] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#15221b] font-medium focus:outline-none focus:border-[#215641]"
                          placeholder={isAr ? 'نص السطر...' : 'Text...'}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: RAW LRC IMPORT / EXPORT ================= */}
          {activeTab === 'raw_lrc' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-3 min-h-[300px] max-h-[52vh]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#75877d] font-bold">
                  {isAr ? 'نص LRC القياسي مع التوقيت بالثواني' : 'LRC-Format'}
                </span>

                <button
                  type="button"
                  onClick={() => lrcFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#edf4ef] hover:bg-[#e4efe7] text-[#215641] font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-[#cbe0d2]"
                >
                  <Upload className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>{isAr ? 'استيراد ملف' : 'Datei'}</span>
                </button>
              </div>

              <textarea
                value={rawLrcText}
                onChange={(e) => setRawLrcText(e.target.value)}
                rows={9}
                className="w-full bg-[#f8faf8] border border-[#dbe4dc] rounded-2xl p-3.5 text-xs font-mono text-[#15221b] focus:outline-none focus:border-[#215641] leading-relaxed"
                placeholder="[00:04.20] السطر الأول هنا&#10;[00:08.50] السطر الثاني هنا"
                dir="ltr"
              />

              <button
                type="button"
                onClick={handleSaveRawLrc}
                className="w-full py-2.5 rounded-2xl bg-[#215641] hover:bg-[#1b4635] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{isAr ? 'حفظ وتطبيق الكلمات' : 'Speichern & Anwenden'}</span>
              </button>
            </div>
          )}

          {/* Bottom Audio Player Controls Bar */}
          <div className="px-5 py-3.5 bg-[#fafcfa] border-t border-[#eef4f0] flex items-center justify-between gap-3 flex-shrink-0">
            {/* Play/Pause & Time */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (!isCurrentPlayingTrack) {
                    playTrackById(track.id);
                  } else {
                    togglePlay();
                  }
                  triggerHaptic('light');
                }}
                className="w-10 h-10 rounded-2xl bg-[#215641] text-white flex items-center justify-center font-bold transition-all active:scale-95 shadow-sm shadow-[#215641]/20 flex-shrink-0"
              >
                {isCurrentPlayingTrack && isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <div className="min-w-0">
                <div className="text-xs font-mono font-extrabold text-[#15221b] truncate">
                  {isCurrentPlayingTrack ? formatTime(currentTime) : '0:00'} / {formatTime(track.duration || duration)}
                </div>
                <div className="text-[11px] text-[#75877d] truncate font-medium flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-[#215641]" />
                  <span>
                    {isCurrentPlayingTrack && isPlaying
                      ? isAr
                        ? 'قيد التشغيل'
                        : 'Wird abgespielt'
                      : isAr
                      ? 'انقر للاستماع والمطابقة'
                      : 'Klicken zum Abspielen'}
                  </span>
                </div>
              </div>
            </div>

            {/* Skip Seek +/- 5s */}
            <div className="flex items-center gap-1.5" dir="ltr">
              <button
                type="button"
                onClick={() => handleSkip(-5)}
                disabled={!isCurrentPlayingTrack}
                className="w-8 h-8 rounded-xl bg-white border border-[#dbe4dc] text-[#596b60] hover:text-[#15221b] hover:bg-[#edf4ef] flex items-center justify-center transition-all disabled:opacity-40 active:scale-95 shadow-2xs"
                title="-5s"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>

              <button
                type="button"
                onClick={() => handleSkip(5)}
                disabled={!isCurrentPlayingTrack}
                className="w-8 h-8 rounded-xl bg-white border border-[#dbe4dc] text-[#596b60] hover:text-[#15221b] hover:bg-[#edf4ef] flex items-center justify-center transition-all disabled:opacity-40 active:scale-95 shadow-2xs"
                title="+5s"
              >
                <RotateCw className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
