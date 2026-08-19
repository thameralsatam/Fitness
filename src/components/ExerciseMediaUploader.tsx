import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Film,
  Image as ImageIcon,
  Trash2,
  Play,
  Plus,
  Loader2,
} from 'lucide-react';
import { ExerciseMediaItem } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { ConfirmModal } from './ConfirmModal';

interface ExerciseMediaUploaderProps {
  mediaList: ExerciseMediaItem[];
  onUploadFiles: (files: File[]) => Promise<void>;
  onDeleteMedia: (mediaId: string) => void;
  onPreviewMedia?: (index: number) => void;
  currentLang?: 'de' | 'ar';
}

export const ExerciseMediaUploader: React.FC<ExerciseMediaUploaderProps> = ({
  mediaList,
  onUploadFiles,
  onDeleteMedia,
  onPreviewMedia,
  currentLang = 'ar',
}) => {
  const isAr = currentLang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExerciseMediaItem | null>(null);

  const handleFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    try {
      setIsUploading(true);
      triggerHaptic('medium');
      await onUploadFiles(filesArray);
      triggerHaptic('success');
    } catch {
      triggerHaptic('warning');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Drag & Drop / Click Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
          isDragOver
            ? 'border-[#215641] bg-[#edf5f0] scale-[0.99]'
            : 'border-[#d2e2d7] hover:border-[#215641] bg-[#fafcfa] hover:bg-[#edf5f0]/60'
        }`}
      >
        <div className="w-10 h-10 rounded-2xl bg-[#edf5f0] text-[#215641] flex items-center justify-center border border-[#d2e2d7] shadow-2xs">
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <UploadCloud className="w-5 h-5 stroke-[2.2]" />
          )}
        </div>

        <div className="space-y-0.5">
          <p className="text-xs sm:text-sm font-display font-bold text-[#15241c]">
            {isUploading
              ? isAr
                ? 'جاري حفظ الوسائط...'
                : 'Medien werden gespeichert...'
              : isAr
              ? 'اضغط أو اسحب صور وفيديوهات التمرين هنا'
              : 'Fotos oder Videos hier ablegen oder klicken'}
          </p>
          <p className="text-[11px] text-[#75877d]">
            {isAr
              ? 'يدعم صور (JPG, PNG, WebP) وفيديوهات شرح التكنيك (MP4, MOV, WebM)'
              : 'Unterstützt Bilder (JPG, PNG, WebP) & Videos (MP4, MOV, WebM)'}
          </p>
        </div>
      </div>

      {/* Attached Media Thumbnails Gallery */}
      {mediaList.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#4e6b5c] px-1">
            <span>
              {isAr ? 'الوسائط المرفقة مع هذا التمرين:' : 'Angehängte Medien:'}
            </span>
            <span className="text-[11px] text-[#75877d] font-normal">
              {mediaList.length} {isAr ? 'ملف' : 'Dateien'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {mediaList.map((item, idx) => (
              <div
                key={item.id}
                className="relative group rounded-2xl overflow-hidden border border-[#dce6df] bg-[#0e1712] aspect-video flex items-center justify-center shadow-2xs"
              >
                {/* Thumbnail view */}
                {item.type === 'video' ? (
                  <div
                    onClick={() => onPreviewMedia && onPreviewMedia(idx)}
                    className="w-full h-full flex flex-col items-center justify-center bg-[#13231a] text-[#73d29d] cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-[#73d29d]" />
                    </div>
                    <span className="text-[10px] font-bold text-white/90 mt-1 truncate px-2 max-w-full">
                      {item.name || 'Video'}
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={() => onPreviewMedia && onPreviewMedia(idx)}
                    className="w-full h-full cursor-pointer"
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                {/* Media Type Badge */}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-1">
                  {item.type === 'video' ? (
                    <>
                      <Film className="w-2.5 h-2.5" />
                      <span>{isAr ? 'فيديو' : 'Video'}</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-2.5 h-2.5" />
                      <span>{isAr ? 'صورة' : 'Foto'}</span>
                    </>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('warning');
                    setDeleteTarget(item);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                  title={isAr ? 'حذف هذا الملف' : 'Löschen'}
                  aria-label={isAr ? 'حذف هذا الملف' : 'Löschen'}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Attachment Deletion */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        type="delete"
        title={isAr ? 'حذف هذا المرفق؟' : 'Anhang löschen?'}
        description={
          isAr
            ? `هل أنت متأكد من رغبتك في حذف هذا الملف "${deleteTarget?.name || (deleteTarget?.type === 'video' ? 'الفيديو' : 'الصورة')}"؟ لن تتمكن من استرجاعه بعد الحذف.`
            : `Möchtest du die Datei "${deleteTarget?.name || (deleteTarget?.type === 'video' ? 'Video' : 'Foto')}" wirklich löschen?`
        }
        confirmText={isAr ? 'نعم، احذف المرفق' : 'Ja, löschen'}
        cancelText={isAr ? 'إلغاء' : 'Abbrechen'}
        currentLang={currentLang}
        onConfirm={() => {
          if (deleteTarget) {
            triggerHaptic('warning');
            onDeleteMedia(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
