import React, { useRef, useEffect, useState } from 'react';

interface VideoThumbnailProps {
  src: string;
  poster?: string;
  alt?: string;
  className?: string;
  seekTime?: number;
}

// Global in-memory thumbnail cache to avoid re-extracting thumbnails for the same video src
const thumbnailCache = new Map<string, string>();

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  src,
  poster,
  alt = '',
  className = 'w-full h-full object-cover pointer-events-none',
  seekTime = 0.5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanSrc = src ? src.split('#')[0] : '';
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    poster || (cleanSrc ? thumbnailCache.get(cleanSrc) || null : null)
  );
  const [isInView, setIsInView] = useState<boolean>(false);

  useEffect(() => {
    if (thumbnailUrl || !cleanSrc) return;

    // Use IntersectionObserver so off-screen video thumbnails don't consume decoders
    if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { rootMargin: '200px' }
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    } else {
      setIsInView(true);
    }
  }, [cleanSrc, thumbnailUrl]);

  useEffect(() => {
    let isMounted = true;
    if (poster) {
      setThumbnailUrl(poster);
      return;
    }

    if (!cleanSrc || !isInView) return;

    // Check cache
    if (thumbnailCache.has(cleanSrc)) {
      setThumbnailUrl(thumbnailCache.get(cleanSrc)!);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let seekTimeout: ReturnType<typeof setTimeout> | null = null;

    const captureFrame = () => {
      if (!video || !isMounted) return;
      try {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            if (dataUrl && dataUrl.length > 100) {
              thumbnailCache.set(cleanSrc, dataUrl);
              if (isMounted) setThumbnailUrl(dataUrl);
            }
          }
        }
      } catch {
        // Fallback: browser painted frame on video element
      }
    };

    const handleSeeked = () => {
      captureFrame();
    };

    const handleLoadedMetadata = () => {
      if (!video) return;
      try {
        const targetTime = video.duration && video.duration > seekTime ? seekTime : 0.1;
        video.currentTime = targetTime;
      } catch {
        // Ignore seek restrictions
      }
    };

    const handleCanPlay = () => {
      // Backup attempt if seeked doesn't fire or metadata was instant
      seekTimeout = setTimeout(() => {
        captureFrame();
      }, 150);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('canplay', handleCanPlay);

    // Initial trigger if metadata already loaded
    if (video.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      isMounted = false;
      if (seekTimeout) clearTimeout(seekTimeout);
      if (video) {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('canplay', handleCanPlay);
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch {
          // ignore
        }
      }
    };
  }, [cleanSrc, poster, seekTime]);

  if (thumbnailUrl) {
    return (
      <img
        src={thumbnailUrl}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-emerald-950/20">
      {isInView ? (
        <video
          ref={videoRef}
          src={cleanSrc}
          poster={poster}
          className={className}
          preload="metadata"
          muted
          playsInline
          aria-label={alt}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#13271e]/30" />
      )}
    </div>
  );
};
