import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  UploadCloud,
  Trash2,
  ChevronUp,
  ChevronDown,
  Headphones,
  HardDrive,
  ListMusic,
  Loader2,
  Pencil,
  X,
  Check,
  AlertTriangle,
  Gauge,
  Folder,
  FolderPlus,
  FolderOpen,
  Database,
  Plus,
  MoreVertical,
  Info,
  Clock,
  FileAudio,
  Sparkles,
  FileText,
} from 'lucide-react';
import {
  AudioTrack,
  AudioFolder,
  getAllTracks,
  deleteTrack,
  clearAllTracks,
  updateTracksOrder,
  saveTrack,
  updateTrackDetails,
  getAudioFolders,
  saveAudioFolder,
  deleteAudioFolder,
  updateAudioFolderName,
  unassignFolderFromTracks,
  deleteTracksInFolder,
} from '../utils/audioDb';
import {
  processMediaToAudio,
  isSupportedMediaFile,
  isVideoFile,
} from '../utils/audioExtractor';
import { Language } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { NativeFilePickerModal } from './NativeFilePickerModal';
import { ConfirmModal } from './ConfirmModal';
import { notifyModalChange } from '../utils/modalManager';
import { useAudio } from '../context/AudioContext';

interface AudioPlayerSectionProps {
  currentLang: Language;
}

interface ProcessingStatus {
  total: number;
  current: number;
  fileName: string;
  statusText: string;
  percent: number;
}

interface PendingUploadItem {
  file: File;
  defaultName: string;
  customName: string;
  isVideo: boolean;
  folderId: string;
}

interface EditTrackModalData {
  id: string;
  name: string;
  folderId: string;
}

export const AudioPlayerSection: React.FC<AudioPlayerSectionProps> = ({ currentLang }) => {
  const {
    tracks,
    folders,
    selectedFolderId,
    setSelectedFolderId,
    currentTrackIndex,
    currentTrack,
    displayedTracks,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    playbackRate,
    playbackMode,
    playTrackAtIndex,
    playTrackById,
    togglePlay,
    handleNext,
    handlePrev,
    handleSkip,
    handleSeek: seekToTime,
    cycleSpeed,
    cyclePlaybackMode,
    toggleMute,
    stopAudio,
    setTracks,
    setFolders,
    refreshTracksAndFolders,
  } = useAudio();

  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);

  // Active 3-dots options modal for track and folder
  const [trackForOptionsMenu, setTrackForOptionsMenu] = useState<AudioTrack | null>(null);
  const [folderForOptionsMenu, setFolderForOptionsMenu] = useState<AudioFolder | null>(null);

  // Modals state
  const [detailsModalTrack, setDetailsModalTrack] = useState<AudioTrack | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUploadItem[] | null>(null);
  const [isNativePickerOpen, setIsNativePickerOpen] = useState<boolean>(false);
  const [editingTrack, setEditingTrack] = useState<EditTrackModalData | null>(null);
  const [deletingTrack, setDeletingTrack] = useState<{ id: string; name: string } | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [isAddExistingToFolderModalOpen, setIsAddExistingToFolderModalOpen] = useState<boolean>(false);
  const [selectedExistingTrackIds, setSelectedExistingTrackIds] = useState<string[]>([]);

  // Folder Modals state
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState<boolean>(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState<string>('');
  const [editingFolder, setEditingFolder] = useState<AudioFolder | null>(null);
  const [editFolderNameInput, setEditFolderNameInput] = useState<string>('');
  const [deletingFolder, setDeletingFolder] = useState<AudioFolder | null>(null);
  const [deleteFolderMode, setDeleteFolderMode] = useState<'keep_tracks' | 'delete_all'>('keep_tracks');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync active modals state to notify bottom nav hiding
  const isAnyAudioModalOpen = Boolean(
    detailsModalTrack ||
      pendingUploads ||
      editingTrack ||
      deletingTrack ||
      isClearAllModalOpen ||
      isAddExistingToFolderModalOpen ||
      isNewFolderModalOpen ||
      editingFolder ||
      deletingFolder ||
      folderForOptionsMenu ||
      trackForOptionsMenu
  );

  useEffect(() => {
    if (isAnyAudioModalOpen) {
      notifyModalChange(true);
    }
    return () => {
      if (isAnyAudioModalOpen) {
        notifyModalChange(false);
      }
    };
  }, [isAnyAudioModalOpen]);

  // Seek bar scrub
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekToTime(time);
  };

  // When files are selected from input or drag-and-drop
  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const items: PendingUploadItem[] = [];

    const defaultFolderId = selectedFolderId !== 'all' ? selectedFolderId : '';

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (isSupportedMediaFile(file)) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        items.push({
          file,
          defaultName: cleanName,
          customName: cleanName,
          isVideo: isVideoFile(file),
          folderId: defaultFolderId,
        });
      }
    }

    if (items.length === 0) return;
    setPendingUploads(items);
  };

  // Finalize Upload with confirmed names and folder
  const handleConfirmUpload = async () => {
    if (!pendingUploads || pendingUploads.length === 0) return;

    const itemsToProcess = [...pendingUploads];
    setPendingUploads(null);
    setIsProcessingFiles(true);

    const addedTracks: AudioTrack[] = [];
    const startingOrder = tracks.length;

    try {
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];
        const finalName = item.customName.trim() || item.defaultName;

        setProcessingStatus({
          total: itemsToProcess.length,
          current: i + 1,
          fileName: item.file.name,
          statusText: item.isVideo
            ? currentLang === 'ar'
              ? 'جاري استخراج وتحويل الصوت بجودة عالية...'
              : 'Extrahiere Audiospur...'
            : currentLang === 'ar'
            ? 'جاري فحص وتجهيز الملف الصوتي...'
            : 'Bereite Audiodatei vor...',
          percent: Math.round((i / itemsToProcess.length) * 100),
        });

        // Convert / Extract audio
        const processed = await processMediaToAudio(item.file, (_percent, stepText) => {
          setProcessingStatus((prev) => (prev ? { ...prev, statusText: stepText } : null));
        });

        const trackId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newTrack: AudioTrack = {
          id: trackId,
          name: finalName,
          size: processed.size,
          type: processed.blob.type || 'audio/wav',
          blob: processed.blob,
          duration: processed.duration,
          addedAt: Date.now(),
          order: startingOrder + i,
          extractedFromVideo: processed.extractedFromVideo,
          folderId: item.folderId || undefined,
        };

        // Save to IndexedDB
        await saveTrack(newTrack);
        addedTracks.push(newTrack);
      }

      await refreshTracksAndFolders();
    } catch (err) {
      console.error('Error saving audio/video files:', err);
    } finally {
      setIsProcessingFiles(false);
      setProcessingStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Folder creation
  const handleCreateFolder = () => {
    const trimmed = newFolderNameInput.trim();
    if (!trimmed) return;

    const newFolder: AudioFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmed,
      createdAt: Date.now(),
    };

    saveAudioFolder(newFolder);
    setFolders((prev) => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
    setNewFolderNameInput('');
    setIsNewFolderModalOpen(false);
  };

  // Folder rename
  const handleSaveEditFolder = () => {
    if (!editingFolder) return;
    const trimmed = editFolderNameInput.trim();
    if (!trimmed) return;

    updateAudioFolderName(editingFolder.id, trimmed);
    setFolders((prev) =>
      prev.map((f) => (f.id === editingFolder.id ? { ...f, name: trimmed } : f))
    );
    setEditingFolder(null);
    setEditFolderNameInput('');
  };

  // Folder delete
  const handleConfirmDeleteFolder = async () => {
    if (!deletingFolder) return;
    const folderId = deletingFolder.id;

    try {
      if (deleteFolderMode === 'delete_all') {
        await deleteTracksInFolder(folderId);
        setTracks((prev) => prev.filter((t) => t.folderId !== folderId));
      } else {
        await unassignFolderFromTracks(folderId);
        setTracks((prev) =>
          prev.map((t) => (t.folderId === folderId ? { ...t, folderId: undefined } : t))
        );
      }

      deleteAudioFolder(folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (selectedFolderId === folderId) {
        setSelectedFolderId('all');
      }
    } catch (err) {
      console.error('Failed to delete folder:', err);
    } finally {
      setDeletingFolder(null);
    }
  };

  // Add existing tracks to current selected folder
  const handleAssignExistingTracksToFolder = async () => {
    if (selectedFolderId === 'all' || selectedExistingTrackIds.length === 0) {
      setIsAddExistingToFolderModalOpen(false);
      return;
    }

    try {
      for (const trackId of selectedExistingTrackIds) {
        const track = tracks.find((t) => t.id === trackId);
        if (track) {
          await updateTrackDetails(trackId, {
            name: track.name,
            folderId: selectedFolderId,
          });
        }
      }

      setTracks((prev) =>
        prev.map((t) =>
          selectedExistingTrackIds.includes(t.id)
            ? { ...t, folderId: selectedFolderId }
            : t
        )
      );
    } catch (err) {
      console.error('Failed to add existing tracks to folder:', err);
    } finally {
      setSelectedExistingTrackIds([]);
      setIsAddExistingToFolderModalOpen(false);
    }
  };

  // Save Track Edit (Name & Folder)
  const handleSaveTrackEdit = async () => {
    if (!editingTrack) return;
    const newName = editingTrack.name.trim();
    if (!newName) return;

    try {
      await updateTrackDetails(editingTrack.id, {
        name: newName,
        folderId: editingTrack.folderId || undefined,
      });

      setTracks((prev) =>
        prev.map((t) =>
          t.id === editingTrack.id
            ? {
                ...t,
                name: newName,
                folderId: editingTrack.folderId || undefined,
              }
            : t
        )
      );
      setEditingTrack(null);
    } catch (err) {
      console.error('Failed to update track:', err);
    }
  };

  // Confirm and delete single track
  const handleConfirmDelete = async () => {
    if (!deletingTrack) return;
    const { id } = deletingTrack;

    try {
      if (currentTrack?.id === id) {
        stopAudio();
      }
      await deleteTrack(id);
      await refreshTracksAndFolders();
    } catch (err) {
      console.error('Failed to delete track:', err);
    } finally {
      setDeletingTrack(null);
    }
  };

  // Move Track Up/Down in current view
  const handleMoveTrack = async (trackId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    setTrackForOptionsMenu(null);
    const currentList = displayedTracks;
    const idx = currentList.findIndex((t) => t.id === trackId);
    if (idx === -1) return;

    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === currentList.length - 1)
    ) {
      return;
    }

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const itemA = currentList[idx];
    const itemB = currentList[targetIdx];

    // Swap in main tracks list
    const newTracks = [...tracks];
    const indexInMainA = newTracks.findIndex((t) => t.id === itemA.id);
    const indexInMainB = newTracks.findIndex((t) => t.id === itemB.id);

    if (indexInMainA !== -1 && indexInMainB !== -1) {
      const temp = newTracks[indexInMainA];
      newTracks[indexInMainA] = newTracks[indexInMainB];
      newTracks[indexInMainB] = temp;

      setTracks(newTracks);
      await updateTracksOrder(newTracks);
    }
  };

  // Clear All Tracks
  const handleConfirmClearAll = async () => {
    try {
      stopAudio();
      await clearAllTracks();
      await refreshTracksAndFolders();
    } catch (err) {
      console.error('Failed to clear all tracks:', err);
    } finally {
      setIsClearAllModalOpen(false);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <div className="space-y-4">
      {/* Main Player Display Card */}
      <div className="bg-[#15221b] text-white rounded-3xl p-4 sm:p-5 shadow-md border border-[#23382c] space-y-3.5 relative overflow-hidden">
        {/* Background Subtle Wave Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#215641]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Top Info Bar */}
        <div className="flex items-center justify-between gap-2.5 relative z-10 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#215641] text-[#7be3af] flex items-center justify-center flex-shrink-0 shadow-inner">
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-[13px] font-bold text-white truncate">
                {currentTrack
                  ? currentTrack.name
                  : currentLang === 'ar'
                  ? 'لا يوجد مقطع قيد التشغيل'
                  : 'Kein Audio ausgewählt'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#a3b8ac] flex items-center gap-1.5 mt-0.5">
                <HardDrive className="w-3 h-3 flex-shrink-0" />
                <span>
                  {currentTrack
                    ? currentTrack.duration
                      ? formatTime(currentTrack.duration)
                      : `${(currentTrack.size / (1024 * 1024)).toFixed(1)} MB`
                    : currentLang === 'ar'
                    ? 'مشغل الصوتيات المحلي'
                    : 'Lokaler Audioplayer'}
                </span>
                {tracks.length > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      {currentTrackIndex + 1}/{tracks.length}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar (Speed, Mute, Smart Playback Mode) */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Speed Pill Toggle */}
            <button
              type="button"
              onClick={cycleSpeed}
              className="h-7.5 px-3 rounded-2xl border bg-white/5 border-white/10 text-white/80 hover:text-white flex items-center justify-center gap-1 text-[11px] font-mono font-bold transition-all active:scale-95"
              title={
                currentLang === 'ar'
                  ? `سرعة التشغيل: ${playbackRate}x (انقر للتغيير)`
                  : `Geschwindigkeit: ${playbackRate}x (Klicken zum Wechseln)`
              }
            >
              <Gauge className="w-3 h-3 text-[#7be3af]" />
              <span>{playbackRate}x</span>
            </button>

            {/* Mute Button */}
            <button
              type="button"
              onClick={toggleMute}
              className={`h-7.5 px-2.5 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${
                isMuted
                  ? 'bg-red-950/60 border-red-500/50 text-red-400'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
              title={
                isMuted
                  ? currentLang === 'ar'
                    ? 'إلغاء الكتم'
                    : 'Stummschaltung aufheben'
                  : currentLang === 'ar'
                  ? 'كتم الصوت'
                  : 'Stummschalten'
              }
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Smart Unified Playback Mode Button (All -> One -> Shuffle -> Off) */}
            <button
              type="button"
              onClick={cyclePlaybackMode}
              className={`h-7.5 px-3 rounded-2xl border flex items-center justify-center gap-1 transition-all active:scale-95 text-[11px] font-bold ${
                playbackMode !== 'off'
                  ? 'bg-[#215641] border-[#7be3af]/40 text-[#7be3af]'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
              }`}
              title={
                playbackMode === 'all'
                  ? currentLang === 'ar'
                    ? 'الوضع: تكرار القائمة بالكامل (انقر لتكرار المقطع الحالي)'
                    : 'Modus: Alle wiederholen (Klicken für 1 Titel wiederholen)'
                  : playbackMode === 'one'
                  ? currentLang === 'ar'
                    ? 'الوضع: تكرار المقطع الحالي باستمرار (انقر للتشغيل العشوائي)'
                    : 'Modus: Aktuellen Titel wiederholen (Klicken für Zufall)'
                  : playbackMode === 'shuffle'
                  ? currentLang === 'ar'
                    ? 'الوضع: تشغيل عشوائي للقائمة (انقر لإيقاف التكرار)'
                    : 'Modus: Zufallswiedergabe (Klicken für Aus)'
                  : currentLang === 'ar'
                  ? 'الوضع: إيقاف التكرار - تشغيل متتابع ثم توقف (انقر لتكرار الكل)'
                  : 'Modus: Aus - Einmal abspielen (Klicken für Alle)'
              }
            >
              {playbackMode === 'all' && (
                <>
                  <Repeat className="w-3 h-3" />
                  <span className="text-[10px] font-medium hidden sm:inline">
                    {currentLang === 'ar' ? 'الكل' : 'Alle'}
                  </span>
                </>
              )}
              {playbackMode === 'shuffle' && (
                <>
                  <Shuffle className="w-3 h-3" />
                  <span className="text-[10px] font-medium hidden sm:inline">
                    {currentLang === 'ar' ? 'عشوائي' : 'Zufall'}
                  </span>
                </>
              )}
              {playbackMode === 'one' && (
                <>
                  <Repeat1 className="w-3 h-3" />
                  <span className="text-[10px] font-medium hidden sm:inline">
                    {currentLang === 'ar' ? 'المقطع' : '1 Titel'}
                  </span>
                </>
              )}
              {playbackMode === 'off' && (
                <>
                  <Repeat className="w-3 h-3 opacity-50" />
                  <span className="text-[10px] font-medium hidden sm:inline">
                    {currentLang === 'ar' ? 'إيقاف' : 'Aus'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar & Timers */}
        <div className="space-y-1 relative z-10">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            disabled={!currentTrack}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#7be3af] transition-all disabled:opacity-40"
          />
          <div className="flex items-center justify-between text-[11px] font-mono text-[#a3b8ac]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls Dock */}
        <div className="pt-2 pb-0.5 relative z-10 flex items-center justify-center border-t border-white/10">
          <div
            className="flex items-center justify-center gap-2 sm:gap-3"
            style={{ direction: 'rtl' }}
          >
            {/* 1. Right-most: Previous Track */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={tracks.length === 0}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
              title={currentLang === 'ar' ? 'المقطع السابق' : 'Vorheriger Track'}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* 2. Right of Center: Rewind 10s */}
            <button
              type="button"
              onClick={() => handleSkip(-10)}
              disabled={!currentTrack}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
              title={currentLang === 'ar' ? 'ترجيع ١٠ ثوانٍ' : '-10 Sekunden zurück'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* 3. Center: Play / Pause */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={tracks.length === 0}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#7be3af] hover:bg-[#68d19d] text-[#15221b] flex items-center justify-center transition-all active:scale-95 shadow-md shadow-[#7be3af]/20 disabled:opacity-30 mx-1"
              title={
                isPlaying
                  ? currentLang === 'ar'
                    ? 'إيقاف مؤقت'
                    : 'Pause'
                  : currentLang === 'ar'
                  ? 'تشغيل'
                  : 'Abspielen'
              }
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* 4. Left of Center: Forward 10s */}
            <button
              type="button"
              onClick={() => handleSkip(10)}
              disabled={!currentTrack}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
              title={currentLang === 'ar' ? 'تقديم ١٠ ثوانٍ' : '+10 Sekunden vor'}
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* 5. Left-most: Next Track */}
            <button
              type="button"
              onClick={handleNext}
              disabled={tracks.length === 0}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
              title={currentLang === 'ar' ? 'المقطع التالي' : 'Nächster Track'}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Smart Upload Dropzone / Media Picker */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isProcessingFiles) setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          if (!isProcessingFiles) {
            triggerHaptic('medium');
            handleFilesSelected(e.dataTransfer.files);
          }
        }}
        onClick={() => {
          if (!isProcessingFiles) {
            triggerHaptic('light');
            setIsNativePickerOpen(true);
          }
        }}
        className={`border-2 border-dashed rounded-3xl p-5 sm:p-6 text-center cursor-pointer transition-all relative overflow-hidden ${
          isProcessingFiles
            ? 'border-[#215641] bg-[#eef4f0] cursor-wait'
            : isDraggingOver
            ? 'border-[#215641] bg-[#eef4f0] scale-[0.99]'
            : 'border-[#dbe4dc] hover:border-[#bad3c3] bg-white hover:bg-[#fafcfa]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.mp4,.mov,.mkv,.webm,.avi,.m4v,.3gp"
          multiple
          disabled={isProcessingFiles}
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        {isProcessingFiles ? (
          <div className="flex flex-col items-center justify-center gap-3 py-2">
            <div className="w-12 h-12 rounded-2xl bg-[#215641] text-[#7be3af] flex items-center justify-center animate-spin">
              <Loader2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-[#15221b] flex items-center justify-center gap-2">
                <span>
                  {currentLang === 'ar'
                    ? `جاري تحويل ومعالجة الملف (${processingStatus?.current}/${processingStatus?.total})`
                    : `Konvertiere Mediendatei (${processingStatus?.current}/${processingStatus?.total})`}
                </span>
              </div>
              <div className="text-xs text-[#215641] font-medium">
                {processingStatus?.statusText}
              </div>
              <div className="text-[11px] text-[#75877d] truncate max-w-xs mx-auto">
                {processingStatus?.fileName}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#eef4f0] text-[#215641] flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-bold text-[#15221b]">
                {currentLang === 'ar'
                  ? 'انقر هنا لرفع ملفات الصوت أو الفيديو من جهازك'
                  : 'Klicken zum Hochladen von Audio- oder Video-Dateien'}
              </div>
              <div className="text-[11px] text-[#75877d]">
                {currentLang === 'ar'
                  ? 'يدعم التخزين بالمتصفح أو الربط الخفيف للملفات الكبيرة مع تصنيف المجلدات'
                  : 'Unterstützt Offline-Speicher oder verlinkte Quellen mit Ordnerverwaltung'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= FREE-FLOATING FOLDERS BAR (Outside the Playlist Container) ================= */}
      <div className="space-y-2 pt-1">
        {/* Free Floating Folder Tabs and Action Buttons in one aligned row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 px-0.5 no-scrollbar">
          {/* Tab 1: All Tracks (الكل) */}
          <button
            type="button"
            onClick={() => setSelectedFolderId('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all flex-shrink-0 active:scale-95 shadow-xs ${
              selectedFolderId === 'all'
                ? 'bg-[#215641] text-white ring-1 ring-[#215641]'
                : 'bg-white border border-[#dbe4dc] text-[#4f6156] hover:bg-[#eef4f0] hover:text-[#15221b]'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{currentLang === 'ar' ? 'الكل' : 'Alle'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedFolderId === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#eef4f0] text-[#215641]'
              }`}
            >
              {tracks.length}
            </span>
          </button>

          {/* Custom Folders */}
          {folders.map((folder) => {
            const count = tracks.filter((t) => t.folderId === folder.id).length;
            const isSelected = selectedFolderId === folder.id;

            return (
              <div
                key={folder.id}
                className={`relative flex items-center rounded-2xl transition-all flex-shrink-0 shadow-xs ${
                  isSelected
                    ? 'bg-[#215641] text-white ring-1 ring-[#215641]'
                    : 'bg-white border border-[#dbe4dc] text-[#4f6156] hover:bg-[#eef4f0] hover:text-[#15221b]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold active:scale-95 ${
                    isSelected ? 'pr-2' : ''
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{folder.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#eef4f0] text-[#215641]'
                    }`}
                  >
                    {count}
                  </span>
                </button>

                {/* 3-dots Menu Button for Folder (Opens clean Action Sheet / Modal) */}
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderForOptionsMenu(folder);
                      triggerHaptic('light');
                    }}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer mr-1 ml-0.5"
                    title={currentLang === 'ar' ? 'خيارات المجلد' : 'Ordner-Optionen'}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* New Folder Button (Icon Only '+') */}
          <button
            type="button"
            onClick={() => {
              setNewFolderNameInput('');
              setIsNewFolderModalOpen(true);
            }}
            className="w-8 h-8 rounded-2xl bg-[#edf4ef] hover:bg-[#e2ece5] text-[#215641] flex items-center justify-center flex-shrink-0 transition-all active:scale-95 border border-[#dbe4dc]/80 shadow-xs"
            title={currentLang === 'ar' ? 'إنشاء مجلد جديد' : 'Neuer Ordner'}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= PURE AUDIO TRACKS LIST (Clean, Flexible Natural Height, 3-Dots Menu) ================= */}
      <div className="bg-white rounded-3xl border border-[#dbe4dc] p-4 sm:p-5 space-y-3.5 shadow-xs">
        {/* Section Header: Pure "الصوتيات" with count and icon action buttons (+ and Trash) */}
        <div className="flex items-center justify-between gap-2 border-b border-[#edf4ef] pb-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-[#215641]" />
            <h4 className="font-display font-bold text-xs sm:text-sm text-[#15221b]">
              {currentLang === 'ar' ? 'الصوتيات' : 'Audiodateien'}
            </h4>
            <span className="text-[11px] font-bold bg-[#edf4ef] text-[#215641] px-2 py-0.5 rounded-full">
              {displayedTracks.length} / {tracks.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Add Audio Button (Icon Only '+') - Shown only inside specific folders to add from existing tracks */}
            {selectedFolderId !== 'all' && (
              <button
                type="button"
                onClick={() => setIsAddExistingToFolderModalOpen(true)}
                className="w-8 h-8 rounded-xl bg-[#edf4ef] hover:bg-[#e2ece5] text-[#215641] flex items-center justify-center transition-all active:scale-95"
                title={
                  activeFolder
                    ? currentLang === 'ar'
                      ? `إضافة صوت لمجلد "${activeFolder.name}" من المقاطع الموجودة`
                      : `Vorhandene Audios zu ${activeFolder.name} hinzufügen`
                    : currentLang === 'ar'
                    ? 'إضافة صوت للمجلد'
                    : 'Audio hinzufügen'
                }
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {/* Clear All Button (Icon Only) */}
            {tracks.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(true)}
                className="w-8 h-8 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center transition-colors active:scale-95"
                title={currentLang === 'ar' ? 'مسح جميع الصوتيات' : 'Alle löschen'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tracks List: Clean, Dynamic Height (no rigid inner scrollbar cutoff) */}
        {displayedTracks.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#75877d] italic space-y-1">
            <p>
              {selectedFolderId !== 'all'
                ? currentLang === 'ar'
                  ? 'لا توجد مقاطع صوتية في هذا المجلد بعد. انقر على زر (+) أعلاه لإضافة مقاطع من الصوتيات الموجودة!'
                  : 'Keine Tracks in diesem Ordner vorhanden. Klicke auf (+), um vorhandene Tracks hinzuzufügen!'
                : currentLang === 'ar'
                ? 'لا توجد مقاطع بعد. ارفع مقاطع صوت أو فيديو من جهازك لتستمع إليها بدون إنترنت أثناء التمرين!'
                : 'Noch keine Dateien vorhanden. Lade Audio- oder Video-Dateien hoch!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedTracks.map((track, idx) => {
              const isSelected = track.id === tracks[currentTrackIndex]?.id;

              return (
                <div
                  key={track.id}
                  onClick={() => playTrackById(track.id)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#eef4f0] border-[#bad3c3] text-[#15221b] shadow-xs'
                      : 'bg-[#fafcfa] border-[#e2ece5] hover:border-[#bad3c3] text-[#4f6156]'
                  }`}
                >
                  {/* Left (or Right in RTL): Index Number + Name + Duration */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isSelected
                          ? 'bg-[#215641] text-white'
                          : 'bg-white border border-[#dbe4dc] text-[#75877d]'
                      }`}
                    >
                      {isSelected && isPlaying ? (
                        <span className="w-2 h-2 rounded-full bg-[#7be3af] animate-ping" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isSelected ? 'text-[#15221b]' : 'text-[#28392f]'
                        }`}
                      >
                        {track.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#75877d] mt-0.5 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#4f6156]" />
                          <span>{formatTime(track.duration)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Duration pill + 3-Dots Action Button */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`hidden sm:inline-block text-[11px] font-mono font-medium px-2 py-0.5 rounded-lg ${
                        isSelected ? 'bg-white/80 text-[#215641]' : 'bg-[#edf4ef] text-[#4f6156]'
                      }`}
                    >
                      {formatTime(track.duration)}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        setTrackForOptionsMenu(track);
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[#75877d] hover:text-[#15221b] hover:bg-white active:scale-95 transition-all cursor-pointer"
                      title={currentLang === 'ar' ? 'خيارات المقطع' : 'Optionen'}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= MODAL: Track Details ================= */}
      <AnimatePresence>
        {detailsModalTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setDetailsModalTrack(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#dbe4dc] space-y-4"
              onClick={(e) => e.stopPropagation()}
              dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#edf4ef] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#eef4f0] text-[#215641] flex items-center justify-center">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#15221b]">
                      {currentLang === 'ar' ? 'تفاصيل المقطع الصوتي' : 'Audio-Details'}
                    </h3>
                    <p className="text-[11px] text-[#75877d] truncate max-w-[200px]">
                      {detailsModalTrack.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsModalTrack(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#75877d] hover:text-[#15221b] hover:bg-[#f1f6f3]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Details List */}
              <div className="space-y-2.5 text-xs text-[#15221b]">
                {/* 1. File Size */}
                <div className="p-3 rounded-2xl bg-[#fafcfa] border border-[#dbe4dc] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#4f6156]">
                    <HardDrive className="w-4 h-4 text-[#215641]" />
                    <span className="font-bold">
                      {currentLang === 'ar' ? 'حجم الصوت:' : 'Dateigröße:'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#15221b]">
                    {(detailsModalTrack.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                {/* 2. Duration */}
                <div className="p-3 rounded-2xl bg-[#fafcfa] border border-[#dbe4dc] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#4f6156]">
                    <Clock className="w-4 h-4 text-[#215641]" />
                    <span className="font-bold">
                      {currentLang === 'ar' ? 'مدة التشغيل:' : 'Dauer:'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#15221b]">
                    {detailsModalTrack.duration
                      ? formatTime(detailsModalTrack.duration)
                      : currentLang === 'ar'
                      ? 'غير محدد'
                      : 'Unbekannt'}
                  </span>
                </div>

                {/* 3. Assigned Folder */}
                <div className="p-3 rounded-2xl bg-[#fafcfa] border border-[#dbe4dc] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#4f6156]">
                    <Folder className="w-4 h-4 text-[#215641]" />
                    <span className="font-bold">
                      {currentLang === 'ar' ? 'المجلد / القسم:' : 'Ordner:'}
                    </span>
                  </div>
                  <span className="font-bold text-[#215641]">
                    {folders.find((f) => f.id === detailsModalTrack.folderId)?.name ||
                      (currentLang === 'ar' ? 'عام (بدون مجلد)' : 'Ohne Ordner')}
                  </span>
                </div>

                {/* 4. Audio Type / Format */}
                <div className="p-3 rounded-2xl bg-[#fafcfa] border border-[#dbe4dc] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#4f6156]">
                    <FileAudio className="w-4 h-4 text-[#215641]" />
                    <span className="font-bold">
                      {currentLang === 'ar' ? 'صيغة الملف:' : 'Format:'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#75877d]">
                    {detailsModalTrack.type || 'audio/wav'}
                  </span>
                </div>
              </div>

              {/* Close Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setDetailsModalTrack(null)}
                  className="w-full h-11 rounded-2xl bg-[#215641] hover:bg-[#1b4635] text-white text-xs font-bold transition-all shadow-sm active:scale-98"
                >
                  {currentLang === 'ar' ? 'إغلاق' : 'Schließen'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: File Naming & Folder Assignment Before Upload ================= */}
      <AnimatePresence>
        {pendingUploads && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#dbe4dc] space-y-4 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
              dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#edf4ef] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#eef4f0] text-[#215641] flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#15221b]">
                      {currentLang === 'ar'
                        ? 'تحديد الاسم والمجلد للملفات'
                        : 'Name & Ordner festlegen'}
                    </h3>
                    <p className="text-[11px] text-[#75877d]">
                      {currentLang === 'ar'
                        ? 'قم بتسمية المقاطع واختيار المجلد المناسب قبل حفظها في المتصفح'
                        : 'Benenne die Tracks und wähle die Ordner'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingUploads(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#75877d] hover:text-[#15221b] hover:bg-[#f1f6f3]"
                  title={currentLang === 'ar' ? 'إلغاء الرفع' : 'Abbrechen'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 py-1">
                {pendingUploads.map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-[#fafcfa] border border-[#dbe4dc] space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs text-[#75877d]">
                      <span className="font-bold text-[#15221b]">
                        {currentLang === 'ar' ? `المقطع ${index + 1}` : `Datei ${index + 1}`}
                      </span>
                      <span className="truncate max-w-[180px] font-mono text-[11px]">
                        {item.file.name}
                      </span>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#4f6156]">
                        {currentLang === 'ar' ? 'اسم المقطع:' : 'Track-Name:'}
                      </label>
                      <input
                        type="text"
                        value={item.customName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPendingUploads((prev) =>
                            prev
                              ? prev.map((p, i) => (i === index ? { ...p, customName: val } : p))
                              : null
                          );
                        }}
                        placeholder={currentLang === 'ar' ? 'اسم المقطع...' : 'Name des Tracks...'}
                        className="w-full h-10 bg-white border border-[#dbe4dc] focus:border-[#215641] rounded-xl px-3 text-xs font-bold text-[#15221b] focus:outline-none"
                      />
                    </div>

                    {/* Folder Assignment Selector */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#4f6156] flex items-center gap-1">
                        <Folder className="w-3 h-3 text-[#215641]" />
                        <span>{currentLang === 'ar' ? 'المجلد / القسم:' : 'Ordner:'}</span>
                      </label>
                      <select
                        value={item.folderId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPendingUploads((prev) =>
                            prev
                              ? prev.map((p, i) => (i === index ? { ...p, folderId: val } : p))
                              : null
                          );
                        }}
                        className="w-full h-10 bg-white border border-[#dbe4dc] focus:border-[#215641] rounded-xl px-3 text-xs font-bold text-[#15221b] focus:outline-none cursor-pointer"
                      >
                        <option value="">
                          {currentLang === 'ar' ? 'بدون مجلد (عام)' : 'Ohne Ordner'}
                        </option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#edf4ef]">
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  className="flex-1 h-11 rounded-xl bg-[#215641] hover:bg-[#1b4635] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {currentLang === 'ar'
                      ? `حفظ وإضافة إلى المكتبة (${pendingUploads.length})`
                      : `Speichern & Hinzufügen (${pendingUploads.length})`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingUploads(null)}
                  className="px-4 h-11 rounded-xl bg-[#f1f6f3] hover:bg-[#e2ece5] text-[#4f6156] text-xs font-bold transition-all"
                >
                  {currentLang === 'ar' ? 'إلغاء' : 'Abbrechen'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: Edit Track (Name & Folder) ================= */}
      <AnimatePresence>
        {editingTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditingTrack(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#dbe4dc] space-y-4"
              onClick={(e) => e.stopPropagation()}
              dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#eef4f0] text-[#215641] flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#15221b]">
                    {currentLang === 'ar' ? 'تعديل بيانات المقطع' : 'Track bearbeiten'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#75877d] hover:text-[#15221b] hover:bg-[#f1f6f3]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#4f6156]">
                  {currentLang === 'ar' ? 'اسم المقطع الصوتي:' : 'Track-Titel:'}
                </label>
                <input
                  type="text"
                  value={editingTrack.name}
                  onChange={(e) =>
                    setEditingTrack((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  autoFocus
                  className="w-full h-11 bg-[#fafcfa] border border-[#dbe4dc] focus:border-[#215641] rounded-xl px-3.5 text-xs sm:text-sm font-bold text-[#15221b] focus:outline-none"
                />
              </div>

              {/* Folder Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#4f6156] flex items-center gap-1">
                  <Folder className="w-3.5 h-3.5 text-[#215641]" />
                  <span>{currentLang === 'ar' ? 'المجلد / التصنيف:' : 'Ordner zuweisen:'}</span>
                </label>
                <select
                  value={editingTrack.folderId}
                  onChange={(e) =>
                    setEditingTrack((prev) =>
                      prev ? { ...prev, folderId: e.target.value } : null
                    )
                  }
                  className="w-full h-11 bg-[#fafcfa] border border-[#dbe4dc] focus:border-[#215641] rounded-xl px-3 text-xs font-bold text-[#15221b] focus:outline-none cursor-pointer"
                >
                  <option value="">
                    {currentLang === 'ar' ? 'بدون مجلد (عام)' : 'Ohne Ordner'}
                  </option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#edf4ef]">
                <button
                  type="button"
                  onClick={handleSaveTrackEdit}
                  disabled={!editingTrack.name.trim()}
                  className="flex-1 h-11 rounded-xl bg-[#215641] hover:bg-[#1b4635] text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{currentLang === 'ar' ? 'حفظ التعديلات' : 'Speichern'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="px-4 h-11 rounded-xl bg-[#f1f6f3] hover:bg-[#e2ece5] text-[#4f6156] text-xs font-bold transition-all"
                >
                  {currentLang === 'ar' ? 'إلغاء' : 'Abbrechen'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: Create New Folder ================= */}
      <AnimatePresence>
        {isNewFolderModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsNewFolderModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#dbe4dc] space-y-4"
              onClick={(e) => e.stopPropagation()}
              dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#eef4f0] text-[#215641] flex items-center justify-center">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#15221b]">
                    {currentLang === 'ar' ? 'إنشاء مجلد صوتيات جديد' : 'Neuen Ordner erstellen'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#75877d] hover:text-[#15221b] hover:bg-[#f1f6f3]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#4f6156]">
                  {currentLang === 'ar' ? 'اسم المجلد:' : 'Ordnername:'}
                </label>
                <input
                  type="text"
                  value={newFolderNameInput}
                  onChange={(e) => setNewFolderNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                  }}
                  autoFocus
                  placeholder={
                    currentLang === 'ar' ? 'مثلاً: حماسية، بودكاست، تمارين...' : 'z. B. Workout...'
                  }
                  className="w-full h-11 bg-[#fafcfa] border border-[#dbe4dc] focus:border-[#215641] rounded-xl px-3.5 text-xs sm:text-sm font-bold text-[#15221b] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={!newFolderNameInput.trim()}
                  className="flex-1 h-11 rounded-xl bg-[#215641] hover:bg-[#1b4635] text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{currentLang === 'ar' ? 'إنشاء المجلد' : 'Erstellen'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewFolderModalOpen(false)}
                  className="px-4 h-11 rounded-xl bg-[#f1f6f3] hover:bg-[#e2ece5] text-[#4f6156] text-xs font-bold transition-all"
                >
                  {currentLang === 'ar' ? 'إلغاء' : 'Abbrechen'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: Rename Folder ================= */}
      <AnimatePresence>
        {editingFolder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditingFolder(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#dbe4dc] space-y-4"
              onClick={(e) => e.stopPropagation()}
              dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#eef4f0] text-[#215641] flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#15221b]">
                    {currentLang === 'ar' ? 'تعديل اسم المجلد' : 'Ordner umbenennen'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#75877d] hover:text-[#15221b] hover:bg-[#f1f6f3]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#4f6156]">
                  {currentLang === 'ar' ? 'اسم المجلد الجديد:' : 'Neuer Ordnername:'}
                </label>
                <input
                  type="text"
                  value={editFolderNameInput}
                  onChange={(e) => setEditFolderNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEditFolder();
                  }}
                  autoFocus
                  className="w-full h-11 bg-[#fafcfa] border border-[#dbe4dc] focus:border-[#215641] rounded-xl px-3.5 text-xs sm:text-sm font-bold text-[#15221b] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveEditFolder}
                  disabled={!editFolderNameInput.trim()}
                  className="flex-1 h-11 rounded-xl bg-[#215641] hover:bg-[#1b4635] text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{currentLang === 'ar' ? 'حفظ التعديل' : 'Speichern'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingFolder(null)}
                  className="px-4 h-11 rounded-xl bg-[#f1f6f3] hover:bg-[#e2ece5] text-[#4f6156] text-xs font-bold transition-all"
                >
                  {currentLang === 'ar' ? 'إلغاء' : 'Abbrechen'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: Delete Folder ================= */}
      <AnimatePresence>
        {deletingFolder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeletingFolder(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#dbe4dc] space-y-4"
              onClick={(e) => e.stopPropagation()}
              dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#15221b]">
                    {currentLang === 'ar' ? 'تأكيد حذف المجلد' : 'Ordner löschen'}
                  </h3>
                  <p className="text-xs text-[#4f6156] leading-relaxed">
                    {currentLang === 'ar'
                      ? `هل تريد حذف مجلد "${deletingFolder.name}"؟`
                      : `Möchtest du den Ordner "${deletingFolder.name}" wirklich löschen?`}
                  </p>
                </div>
              </div>

              {/* Deletion Mode Options */}
              <div className="space-y-2 pt-1">
                <div
                  onClick={() => setDeleteFolderMode('keep_tracks')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all text-xs ${
                    deleteFolderMode === 'keep_tracks'
                      ? 'bg-[#eef4f0] border-[#215641] text-[#15221b] font-bold'
                      : 'bg-white border-[#dbe4dc] text-[#4f6156]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        deleteFolderMode === 'keep_tracks'
                          ? 'border-[#215641] bg-[#215641]'
                          : 'border-[#95a59c]'
                      }`}
                    >
                      {deleteFolderMode === 'keep_tracks' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span>
                      {currentLang === 'ar'
                        ? 'حذف المجلد فقط ونقل الصوتيات إلى المقاطع العامة'
                        : 'Nur Ordner löschen (Tracks behalten)'}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setDeleteFolderMode('delete_all')}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all text-xs ${
                    deleteFolderMode === 'delete_all'
                      ? 'bg-red-50 border-red-500 text-red-700 font-bold'
                      : 'bg-white border-[#dbe4dc] text-[#4f6156]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        deleteFolderMode === 'delete_all'
                          ? 'border-red-500 bg-red-500'
                          : 'border-[#95a59c]'
                      }`}
                    >
                      {deleteFolderMode === 'delete_all' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span>
                      {currentLang === 'ar'
                        ? 'حذف المجلد وكافة المقاطع الصوتية التي بداخله'
                        : 'Ordner und alle enthaltenen Tracks löschen'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#edf4ef]">
                <button
                  type="button"
                  onClick={handleConfirmDeleteFolder}
                  className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{currentLang === 'ar' ? 'تأكيد الحذف' : 'Löschen'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingFolder(null)}
                  className="px-4 h-11 rounded-xl bg-[#f1f6f3] hover:bg-[#e2ece5] text-[#4f6156] text-xs font-bold transition-all"
                >
                  {currentLang === 'ar' ? 'إلغاء' : 'Abbrechen'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: Confirm Delete Track ================= */}
      <ConfirmModal
        isOpen={Boolean(deletingTrack)}
        type="delete"
        title={currentLang === 'ar' ? 'تأكيد حذف المقطع' : 'Track löschen'}
        description={
          currentLang === 'ar'
            ? `هل أنت متأكد من رغبتك بحذف "${deletingTrack?.name || ''}"؟`
            : `Möchtest du "${deletingTrack?.name || ''}" wirklich löschen?`
        }
        confirmText={currentLang === 'ar' ? 'نعم، احذف' : 'Ja, löschen'}
        cancelText={currentLang === 'ar' ? 'إلغاء' : 'Abbrechen'}
        currentLang={currentLang}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTrack(null)}
      />

      {/* ================= MODAL: Confirm Clear All ================= */}
      <ConfirmModal
        isOpen={isClearAllModalOpen}
        type="danger"
        title={currentLang === 'ar' ? 'مسح جميع المقاطع' : 'Alle Tracks löschen'}
        description={
          currentLang === 'ar'
            ? 'هل أنت متأكد من رغبتك بحذف كافة المقاطع الصوتية المحفوظة؟ لا يمكن التراجع عن هذا الإجراء.'
            : 'Möchtest du wirklich alle gespeicherten Tracks unwiderruflich löschen?'
        }
        confirmText={currentLang === 'ar' ? 'نعم، مسح الكل' : 'Ja, alle löschen'}
        cancelText={currentLang === 'ar' ? 'إلغاء' : 'Abbrechen'}
        currentLang={currentLang}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearAllModalOpen(false)}
      />
      {/* ================= MODAL: Add Existing Tracks to Current Folder ================= */}
      <AnimatePresence>
        {isAddExistingToFolderModalOpen && selectedFolderId !== 'all' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsAddExistingToFolderModalOpen(false);
              setSelectedExistingTrackIds([]);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#dbe4dc] space-y-4 max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
              dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#edf4ef] pb-3 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#eef4f0] text-[#215641] flex items-center justify-center">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-[#15221b]">
                      {currentLang === 'ar'
                        ? `إضافة صوتيات إلى: ${activeFolder?.name || ''}`
                        : `Audio zu ${activeFolder?.name || ''} hinzufügen`}
                    </h3>
                    <p className="text-[11px] text-[#75877d]">
                      {currentLang === 'ar'
                        ? 'اختر من المقاطع الصوتية الموجودة لديك لضمها إلى هذا المجلد'
                        : 'Wähle vorhandene Audio-Dateien für diesen Ordner aus'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddExistingToFolderModalOpen(false);
                    setSelectedExistingTrackIds([]);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#75877d] hover:text-[#15221b] hover:bg-[#f1f6f3]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Available Tracks List */}
              {(() => {
                const available = tracks.filter((t) => (t.folderId || '') !== selectedFolderId);

                if (available.length === 0) {
                  return (
                    <div className="py-10 text-center text-xs text-[#75877d] space-y-2 flex-1">
                      <FileAudio className="w-8 h-8 mx-auto text-[#95a59c] opacity-50" />
                      <p className="font-bold text-[#4f6156]">
                        {currentLang === 'ar'
                          ? 'جميع الصوتيات المتوفرة مضافة بالفعل في هذا المجلد!'
                          : 'Alle vorhandenen Tracks sind bereits in diesem Ordner!'}
                      </p>
                      <p className="text-[11px] text-[#75877d]">
                        {currentLang === 'ar'
                          ? 'يمكنك رفع مقاطع جديدة من زر الرفع في الأعلى.'
                          : 'Du kannst neue Tracks über den Upload-Bereich oben hochladen.'}
                      </p>
                    </div>
                  );
                }

                const allSelected =
                  available.length > 0 &&
                  available.every((t) => selectedExistingTrackIds.includes(t.id));

                const toggleSelectAll = () => {
                  if (allSelected) {
                    setSelectedExistingTrackIds([]);
                  } else {
                    setSelectedExistingTrackIds(available.map((t) => t.id));
                  }
                };

                const toggleTrackSelection = (id: string) => {
                  setSelectedExistingTrackIds((prev) =>
                    prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                  );
                };

                return (
                  <div className="space-y-3 flex-1 overflow-hidden flex flex-col min-h-0">
                    {/* Quick Selection Helper */}
                    <div className="flex items-center justify-between text-xs px-1 flex-shrink-0">
                      <span className="text-[#75877d] font-bold">
                        {currentLang === 'ar'
                          ? `المقاطع المتاحة (${available.length})`
                          : `Verfügbare Tracks (${available.length})`}
                      </span>
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-[11px] font-bold text-[#215641] hover:underline"
                      >
                        {allSelected
                          ? currentLang === 'ar'
                            ? 'إلغاء تحديد الكل'
                            : 'Auswahl aufheben'
                          : currentLang === 'ar'
                          ? 'تحديد الكل'
                          : 'Alle auswählen'}
                      </button>
                    </div>

                    {/* Scrollable list of tracks */}
                    <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 pl-0.5">
                      {available.map((t) => {
                        const isChecked = selectedExistingTrackIds.includes(t.id);
                        const originalFolder = folders.find((f) => f.id === t.folderId);

                        return (
                          <div
                            key={t.id}
                            onClick={() => toggleTrackSelection(t.id)}
                            className={`flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-[#eef4f0] border-[#215641] text-[#15221b]'
                                : 'bg-[#fafcfa] border-[#dbe4dc] text-[#4f6156] hover:bg-[#f1f6f3]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isChecked
                                    ? 'bg-[#215641] border-[#215641] text-white'
                                    : 'border-[#95a59c] bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5" />}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold truncate text-[#15221b]">
                                  {t.name}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-[#75877d] mt-0.5">
                                  <span>{formatTime(t.duration)}</span>
                                  {originalFolder && (
                                    <span>
                                      •{' '}
                                      {currentLang === 'ar'
                                        ? `مجلد: ${originalFolder.name}`
                                        : `Ordner: ${originalFolder.name}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Bottom Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#edf4ef] flex-shrink-0">
                <button
                  type="button"
                  onClick={handleAssignExistingTracksToFolder}
                  disabled={selectedExistingTrackIds.length === 0}
                  className="flex-1 h-11 rounded-xl bg-[#215641] hover:bg-[#1b4635] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {currentLang === 'ar'
                      ? `إضافة المقاطع المحددة (${selectedExistingTrackIds.length})`
                      : `Ausgewählte hinzufügen (${selectedExistingTrackIds.length})`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddExistingToFolderModalOpen(false);
                    setSelectedExistingTrackIds([]);
                  }}
                  className="px-4 h-11 rounded-xl bg-[#f1f6f3] hover:bg-[#e2ece5] text-[#4f6156] text-xs font-bold transition-all"
                >
                  {currentLang === 'ar' ? 'إلغاء' : 'Abbrechen'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: Track Actions Dialog (Overlay Layer / طبقة عائمة فوق المحتوى) ================= */}
      <AnimatePresence>
        {trackForOptionsMenu && (
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            onClick={() => setTrackForOptionsMenu(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-5 border border-[#dbe4dc] shadow-2xl space-y-3.5"
              dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#edf4ef]">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div className="w-8 h-8 rounded-xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0">
                    <FileAudio className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm text-[#15221b] truncate">
                      {trackForOptionsMenu.name}
                    </h3>
                    <p className="text-[11px] text-[#75877d]">
                      {formatTime(trackForOptionsMenu.duration)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackForOptionsMenu(null)}
                  className="w-7 h-7 rounded-full bg-[#f8faf8] hover:bg-[#edf4ef] text-[#75877d] flex items-center justify-center flex-shrink-0 transition-colors"
                  aria-label={currentLang === 'ar' ? 'إغلاق' : 'Schließen'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-1">
                {/* 1. Details */}
                <button
                  type="button"
                  onClick={() => {
                    const t = trackForOptionsMenu;
                    setTrackForOptionsMenu(null);
                    setDetailsModalTrack(t);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-xs font-bold text-[#15221b] bg-[#f8faf8] hover:bg-[#edf4ef] rounded-2xl transition-colors border border-[#e2ebe3] text-start"
                >
                  <Info className="w-4 h-4 text-[#215641] flex-shrink-0" />
                  <div>
                    <div>{currentLang === 'ar' ? 'تفاصيل المقطع' : 'Details'}</div>
                    <div className="text-[10px] font-normal text-[#75877d]">
                      {currentLang === 'ar' ? 'عرض الحجم والمسار والمدة' : 'Größe, Pfad und Dauer anzeigen'}
                    </div>
                  </div>
                </button>

                {/* 2. Move Up */}
                <button
                  type="button"
                  onClick={(e) => {
                    const t = trackForOptionsMenu;
                    setTrackForOptionsMenu(null);
                    handleMoveTrack(t.id, 'up', e);
                  }}
                  disabled={displayedTracks.findIndex((t) => t.id === trackForOptionsMenu.id) <= 0}
                  className="w-full flex items-center gap-3 p-3 text-xs font-bold text-[#15221b] bg-[#f8faf8] hover:bg-[#edf4ef] rounded-2xl transition-colors border border-[#e2ebe3] disabled:opacity-40 text-start"
                >
                  <ChevronUp className="w-4 h-4 text-[#4f6156] flex-shrink-0" />
                  <div>
                    <div>{currentLang === 'ar' ? 'تقديم للأعلى' : 'Nach oben verschieben'}</div>
                    <div className="text-[10px] font-normal text-[#75877d]">
                      {currentLang === 'ar' ? 'رفع ترتيب المقطع في القائمة' : 'Position in der Liste erhöhen'}
                    </div>
                  </div>
                </button>

                {/* 3. Move Down */}
                <button
                  type="button"
                  onClick={(e) => {
                    const t = trackForOptionsMenu;
                    setTrackForOptionsMenu(null);
                    handleMoveTrack(t.id, 'down', e);
                  }}
                  disabled={
                    displayedTracks.findIndex((t) => t.id === trackForOptionsMenu.id) === -1 ||
                    displayedTracks.findIndex((t) => t.id === trackForOptionsMenu.id) >= displayedTracks.length - 1
                  }
                  className="w-full flex items-center gap-3 p-3 text-xs font-bold text-[#15221b] bg-[#f8faf8] hover:bg-[#edf4ef] rounded-2xl transition-colors border border-[#e2ebe3] disabled:opacity-40 text-start"
                >
                  <ChevronDown className="w-4 h-4 text-[#4f6156] flex-shrink-0" />
                  <div>
                    <div>{currentLang === 'ar' ? 'تنزيل للأسفل' : 'Nach unten verschieben'}</div>
                    <div className="text-[10px] font-normal text-[#75877d]">
                      {currentLang === 'ar' ? 'خفض ترتيب المقطع في القائمة' : 'Position in der Liste verringern'}
                    </div>
                  </div>
                </button>

                {/* 4. Edit (Name & Folder) */}
                <button
                  type="button"
                  onClick={() => {
                    const t = trackForOptionsMenu;
                    if (isPlaying && currentTrack?.id === t.id) return;
                    setTrackForOptionsMenu(null);
                    setEditingTrack({
                      id: t.id,
                      name: t.name,
                      folderId: t.folderId || '',
                    });
                  }}
                  disabled={isPlaying && currentTrack?.id === trackForOptionsMenu.id}
                  className={`w-full flex items-center gap-3 p-3 text-xs font-bold rounded-2xl transition-colors border border-[#e2ebe3] text-start ${
                    isPlaying && currentTrack?.id === trackForOptionsMenu.id
                      ? 'text-[#75877d] opacity-50 bg-[#fafcfa]'
                      : 'text-[#15221b] bg-[#f8faf8] hover:bg-[#edf4ef]'
                  }`}
                >
                  <Pencil className="w-4 h-4 text-[#215641] flex-shrink-0" />
                  <div>
                    <div>{currentLang === 'ar' ? 'تعديل المقطع' : 'Bearbeiten'}</div>
                    <div className="text-[10px] font-normal text-[#75877d]">
                      {currentLang === 'ar' ? 'تعديل الاسم أو نقل المقطع لمجلد آخر' : 'Namen ändern oder Ordner zuweisen'}
                    </div>
                  </div>
                </button>

                {/* 5. Delete */}
                <button
                  type="button"
                  onClick={() => {
                    const t = trackForOptionsMenu;
                    setTrackForOptionsMenu(null);
                    setDeletingTrack({
                      id: t.id,
                      name: t.name,
                    });
                  }}
                  className="w-full flex items-center gap-3 p-3 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100/80 rounded-2xl transition-colors text-start"
                >
                  <Trash2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div>
                    <div>{currentLang === 'ar' ? 'حذف من القائمة' : 'Aus Liste löschen'}</div>
                    <div className="text-[10px] font-normal text-red-500/80">
                      {currentLang === 'ar' ? 'إزالة هذا المقطع من المكتبة' : 'Diesen Track dauerhaft entfernen'}
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: Folder Actions Dialog ================= */}
      <AnimatePresence>
        {folderForOptionsMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            onClick={() => setFolderForOptionsMenu(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-5 border border-[#dbe4dc] shadow-2xl space-y-3.5"
              dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#edf4ef]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#edf4ef] text-[#215641] flex items-center justify-center">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#15221b]">
                      {folderForOptionsMenu.name}
                    </h3>
                    <p className="text-[11px] text-[#75877d]">
                      {currentLang === 'ar' ? 'إدارة وخيارات المجلد' : 'Ordner verwalten'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFolderForOptionsMenu(null)}
                  className="w-7 h-7 rounded-full bg-[#f8faf8] hover:bg-[#edf4ef] text-[#75877d] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {/* 1. Add audio from existing library to this folder */}
                <button
                  type="button"
                  onClick={() => {
                    setFolderForOptionsMenu(null);
                    setIsAddExistingToFolderModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-xs font-bold text-[#215641] bg-[#edf4ef] hover:bg-[#e2ede5] rounded-2xl transition-all text-start"
                >
                  <Plus className="w-4 h-4 text-[#215641] flex-shrink-0" />
                  <div>
                    <div>{currentLang === 'ar' ? 'إضافة صوتيات للمجلد' : 'Tracks hinzufügen'}</div>
                    <div className="text-[10px] font-normal text-[#4f6156]">
                      {currentLang === 'ar' ? 'إضافة مقاطع من مكتبة الصوتيات الحالية' : 'Aus vorhandener Bibliothek zuweisen'}
                    </div>
                  </div>
                </button>

                {/* 2. Rename Folder */}
                <button
                  type="button"
                  onClick={() => {
                    const f = folderForOptionsMenu;
                    setFolderForOptionsMenu(null);
                    setEditingFolder(f);
                    setEditFolderNameInput(f.name);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-xs font-bold text-[#15221b] bg-[#f8faf8] hover:bg-[#edf4ef] rounded-2xl transition-all border border-[#e2ebe3] text-start"
                >
                  <Pencil className="w-4 h-4 text-[#4f6156] flex-shrink-0" />
                  <div>
                    <div>{currentLang === 'ar' ? 'تعديل اسم المجلد' : 'Ordner umbenennen'}</div>
                    <div className="text-[10px] font-normal text-[#75877d]">
                      {currentLang === 'ar' ? 'تغيير تسمية هذا المجلد' : 'Namen des Ordners bearbeiten'}
                    </div>
                  </div>
                </button>

                {/* 3. Delete Folder */}
                <button
                  type="button"
                  onClick={() => {
                    const f = folderForOptionsMenu;
                    setFolderForOptionsMenu(null);
                    setDeletingFolder(f);
                    setDeleteFolderMode('keep_tracks');
                  }}
                  className="w-full flex items-center gap-3 p-3 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100/80 rounded-2xl transition-all text-start"
                >
                  <Trash2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div>
                    <div>{currentLang === 'ar' ? 'حذف المجلد' : 'Ordner löschen'}</div>
                    <div className="text-[10px] font-normal text-red-500/80">
                      {currentLang === 'ar' ? 'حذف المجلد مع خيار الإبقاء على الصوتيات' : 'Ordner entfernen'}
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Native-styled Dedicated File Picker Modal */}
      <NativeFilePickerModal
        isOpen={isNativePickerOpen}
        onClose={() => setIsNativePickerOpen(false)}
        onFilesSelected={(files) => {
          setIsNativePickerOpen(false);
          handleFilesSelected(files);
        }}
        folders={folders}
        currentLang={currentLang}
        isProcessing={isProcessingFiles}
      />
    </div>
  );
};
