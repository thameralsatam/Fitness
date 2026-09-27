import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Repeat,
  Maximize,
  Minimize,
  Gauge,
  Loader2,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
  currentLang?: 'de' | 'ar';
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  src,
  poster,
  autoPlay = true,
  loop = true,
  className = '',
  currentLang = 'ar',
}) => {
  const isAr = currentLang === 'ar';
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(loop);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [seekOverlay, setSeekOverlay] = useState<{ text: string; direction: 'left' | 'right' } | null>(null);

  useEffect(() => {
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (autoPlay) {
        const p = videoRef.current.play();
        if (p !== undefined) {
          p.then(() => setIsPlaying(true)).catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            }
          });
        }
      }
    }
  }, [src, autoPlay]);

  // Format seconds to mm:ss
  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec) || timeInSec < 0) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const resetHideTimer = useCallback(() => {
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    setShowControls(true);
    if (isPlaying) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3200);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideControlsTimerRef.current) {
        window.clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [isPlaying, resetHideTimer]);

  const togglePlay = () => {
    triggerHaptic('light');
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
    resetHideTimer();
  };

  const toggleMute = () => {
    triggerHaptic('light');
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleLoop = () => {
    triggerHaptic('selection');
    const video = videoRef.current;
    if (!video) return;
    const newLoop = !isLooping;
    video.loop = newLoop;
    setIsLooping(newLoop);
  };

  const handleSpeedChange = () => {
    triggerHaptic('selection');
    const video = videoRef.current;
    if (!video) return;
    const speeds = [1, 0.75, 0.5, 1.25];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    video.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
    resetHideTimer();
  };

  const skipSeconds = (seconds: number) => {
    triggerHaptic('medium');
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), duration);
    setCurrentTime(video.currentTime);

    setSeekOverlay({
      text: seconds > 0 ? `+${seconds}s` : `${seconds}s`,
      direction: seconds > 0 ? 'right' : 'left',
    });
    setTimeout(() => setSeekOverlay(null), 600);
    resetHideTimer();
  };

  const toggleFullscreen = () => {
    triggerHaptic('medium');
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      className={`relative w-full h-full flex items-center justify-center bg-black select-none overflow-hidden group ${className}`}
    >
      {/* Native Video Element (Stripped of browser chrome) */}
      <video
        ref={videoRef}
        key={src}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={isLooping}
        muted={isMuted}
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            if (autoPlay) {
              const p = videoRef.current.play();
              if (p !== undefined) {
                p.then(() => setIsPlaying(true)).catch(() => {
                  if (videoRef.current) {
                    videoRef.current.muted = true;
                    setIsMuted(true);
                    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                  }
                });
              }
            }
          }
        }}
        onError={() => {
          setIsBuffering(false);
          setIsPlaying(false);
          setHasError(true);
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onClick={togglePlay}
        className="max-h-[60vh] sm:max-h-[65vh] w-auto max-w-full rounded-2xl shadow-xl object-contain cursor-pointer"
      />

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center z-30 space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">
              {isAr ? 'تعذر تشغيل الفيديو' : 'Video konnte nicht geladen werden'}
            </p>
            <p className="text-xs text-zinc-400 max-w-xs">
              {isAr ? 'اضغط لإعادة محاولة تحميل وتشغيل الفيديو' : 'Tippen, um das Laden des Videos erneut zu versuchen'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setHasError(false);
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            {isAr ? 'إعادة المحاولة' : 'Erneut versuchen'}
          </button>
        </div>
      )}

      {/* Buffering Spinner */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/30 backdrop-blur-2xs z-20">
          <div className="w-12 h-12 rounded-2xl bg-black/60 flex items-center justify-center text-emerald-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </div>
      )}

      {/* Double Tap / Skip Indicator Toast */}
      {seekOverlay && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${
            seekOverlay.direction === 'right' ? 'right-12' : 'left-12'
          } px-4 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 text-white font-mono font-bold text-sm flex items-center gap-1.5 animate-in fade-in zoom-in-90 duration-150 pointer-events-none z-30`}
        >
          {seekOverlay.direction === 'right' ? (
            <RotateCw className="w-4 h-4 text-emerald-400" />
          ) : (
            <RotateCcw className="w-4 h-4 text-emerald-400" />
          )}
          <span>{seekOverlay.text}</span>
        </div>
      )}

      {/* Large Center Play/Pause Overlay Indicator on Pause */}
      {!isPlaying && !isBuffering && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-700/85 hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xl backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95 z-20 cursor-pointer"
          aria-label={isAr ? 'تشغيل الفيديو' : 'Abspielen'}
        >
          <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-white translate-x-0.5" />
        </button>
      )}

      {/* Modern In-App Bottom Video Control Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 z-20 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrub / Progress Bar */}
        <div className="space-y-1.5 mb-2">
          <div className="relative w-full h-2 flex items-center cursor-pointer group/bar">
            {/* Background Track */}
            <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Native range input overlay for seamless seeking */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="Seek time"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300 font-semibold px-0.5">
            <span>{formatTime(currentTime)}</span>
            <div className="flex items-center gap-2">
              {playbackRate !== 1 && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-[10px]">
                  {playbackRate}x {isAr ? 'سرعة' : 'Tempo'}
                </span>
              )}
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Control Buttons Strip */}
        <div className="flex items-center justify-between gap-1 text-white">
          {/* Left Controls: Play/Pause, Rewind, FastForward */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-emerald-600 hover:text-white text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title={isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skipSeconds(-5)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title={isAr ? 'تراجع 5 ثواني' : '5s zurück'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => skipSeconds(5)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title={isAr ? 'تقدم 5 ثواني' : '5s vor'}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Controls: Speed, Loop, Mute, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Speed Slow-Mo Toggle for Technique Analysis */}
            <button
              type="button"
              onClick={handleSpeedChange}
              className={`px-2 py-1 rounded-xl text-xs font-mono font-bold transition-all active:scale-90 flex items-center gap-1 cursor-pointer ${
                playbackRate !== 1
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-zinc-300'
              }`}
              title={isAr ? 'تغيير سرعة العرض (دراسة التكنيك)' : 'Geschwindigkeit'}
            >
              <Gauge className="w-3 h-3" />
              <span>{playbackRate}x</span>
            </button>

            {/* Loop Toggle */}
            <button
              type="button"
              onClick={toggleLoop}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                isLooping
                  ? 'bg-emerald-600/80 text-white'
                  : 'bg-white/5 hover:bg-white/15 text-zinc-400'
              }`}
              title={isLooping ? (isAr ? 'التكرار التلقائي مفعل' : 'Loop an') : (isAr ? 'تفعيل التكرار' : 'Loop aus')}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            {/* Mute Toggle */}
            <button
              type="button"
              onClick={toggleMute}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title={isMuted ? (isAr ? 'إلغاء كتم الصوت' : 'Ton an') : (isAr ? 'كتم الصوت' : 'Stumm')}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-amber-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
              title={isFullscreen ? (isAr ? 'تصغير' : 'Verkleinern') : (isAr ? 'ملء الشاشة' : 'Vollbild')}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
