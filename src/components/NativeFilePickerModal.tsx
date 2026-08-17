import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, 
  FileAudio, 
  FileVideo, 
  FolderPlus, 
  Folder, 
  Check, 
  X, 
  Sparkles, 
  HardDrive, 
  CheckCircle2, 
  Loader2,
  Info
} from 'lucide-react';
import { AudioFolder } from '../utils/audioDb';
import { triggerHaptic } from '../utils/haptics';
import { notifyModalChange } from '../utils/modalManager';

interface NativeFilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: FileList | File[]) => void;
  folders: AudioFolder[];
  currentLang: 'ar' | 'de';
  isProcessing?: boolean;
}

export const NativeFilePickerModal: React.FC<NativeFilePickerModalProps> = ({
  isOpen,
  onClose,
  onFilesSelected,
  folders,
  currentLang,
  isProcessing = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      triggerHaptic('medium');
      onFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Sheet / Dialog */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#dbe4dc] overflow-hidden z-10 flex flex-col max-h-[90vh]"
          dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2ebe3] bg-[#fafcfa]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#eef4f0] text-[#215641] flex items-center justify-center shadow-xs">
                <UploadCloud className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-base text-[#15221b] flex items-center gap-2">
                  <span>{currentLang === 'ar' ? 'إضافة ملفات صوتية وفيديو' : 'Audio & Video Import'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#215641] text-[10px] font-bold">
                    Offline
                  </span>
                </h3>
                <p className="text-xs text-[#75877d] mt-0.5">
                  {currentLang === 'ar'
                    ? 'اختر المقاطع لتخزينها محلياً في ذاكرة التطبيق'
                    : 'Wähle Dateien für lokalen App-Speicher'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#75877d] hover:text-[#15221b] hover:bg-[#eef4f0] transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.mp4,.mov,.mkv,.webm,.avi,.m4v,.3gp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  triggerHaptic('medium');
                  onFilesSelected(e.target.files);
                }
              }}
            />

            {/* Custom Interactive Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                triggerHaptic('light');
                fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 select-none ${
                isDragOver
                  ? 'border-[#215641] bg-[#eef4f0] scale-[0.99]'
                  : 'border-[#dbe4dc] hover:border-[#215641] bg-[#fafcfa] hover:bg-[#f1f6f3]'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1b3d2f] to-[#255c45] text-white flex items-center justify-center shadow-md">
                <HardDrive className="w-7 h-7 stroke-[2]" />
              </div>

              <div>
                <span className="font-display font-bold text-sm sm:text-base text-[#15221b] block">
                  {currentLang === 'ar'
                    ? 'انقر لتصفح ملفات جهازك أو اسحبها هنا'
                    : 'Tippe zum Durchsuchen oder Datei hier ablegen'}
                </span>
                <span className="text-xs text-[#75877d] mt-1 block">
                  {currentLang === 'ar'
                    ? 'يدعم MP3, M4A, WAV, MP4, MKV والفيديوهات مع استخراج الصوت فورياً'
                    : 'Unterstützt MP3, M4A, WAV, MP4, MKV mit automatischer Audio-Extraktion'}
                </span>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#215641] text-white text-xs font-bold shadow-xs active:scale-95 transition-transform mt-1">
                <UploadCloud className="w-4 h-4" />
                <span>{currentLang === 'ar' ? 'فتح مدير ملفات الهاتف' : 'Dateimanager öffnen'}</span>
              </div>
            </div>

            {/* Feature Highlights Banner */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-[#eef4f0]/70 border border-[#dbe4dc] flex items-start gap-2.5">
                <FileAudio className="w-4 h-4 text-[#215641] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#15221b]">
                    {currentLang === 'ar' ? 'تخزين دائم' : 'Offline Safe'}
                  </h4>
                  <p className="text-[11px] text-[#75877d] mt-0.5">
                    {currentLang === 'ar' ? 'الملفات محفوظة محلياً داخل التطبيق' : 'Dateien bleiben lokal gesichert'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#eef4f0]/70 border border-[#dbe4dc] flex items-start gap-2.5">
                <FolderPlus className="w-4 h-4 text-[#215641] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#15221b]">
                    {currentLang === 'ar' ? 'تنظيم بمجلدات' : 'Ordner-Struktur'}
                  </h4>
                  <p className="text-[11px] text-[#75877d] mt-0.5">
                    {currentLang === 'ar' ? 'فرز المقاطع حسب أيام التمارين' : 'Sortierung nach Trainingstagen'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
