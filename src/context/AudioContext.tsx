import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  AudioTrack,
  AudioFolder,
  getAllTracks,
  getAudioFolders,
} from '../utils/audioDb';

interface AudioContextType {
  tracks: AudioTrack[];
  folders: AudioFolder[];
  selectedFolderId: string;
  setSelectedFolderId: (id: string) => void;
  currentTrackIndex: number;
  currentTrack: AudioTrack | null;
  displayedTracks: AudioTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  playbackRate: number;
  playbackMode: 'all' | 'shuffle' | 'one' | 'off';
  isLoading: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  playTrackAtIndex: (index: number) => void;
  playTrackById: (id: string) => void;
  togglePlay: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleSkip: (seconds: number) => void;
  handleSeek: (time: number) => void;
  cycleSpeed: () => void;
  cyclePlaybackMode: () => void;
  toggleMute: () => void;
  stopAudio: () => void;
  setTracks: React.Dispatch<React.SetStateAction<AudioTrack[]>>;
  setFolders: React.Dispatch<React.SetStateAction<AudioFolder[]>>;
  refreshTracksAndFolders: () => Promise<void>;
  currentLang: 'ar' | 'de';
  setCurrentLang: (lang: 'ar' | 'de') => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode; lang: 'ar' | 'de' }> = ({
  children,
  lang,
}) => {
  const [currentLang, setCurrentLang] = useState<'ar' | 'de'>(lang);
  useEffect(() => {
    setCurrentLang(lang);
  }, [lang]);

  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [folders, setFolders] = useState<AudioFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [playbackMode, setPlaybackMode] = useState<'all' | 'shuffle' | 'one' | 'off'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronized refs to avoid stale closures in media handlers
  const tracksRef = useRef<AudioTrack[]>(tracks);
  tracksRef.current = tracks;
  const currentTrackIndexRef = useRef<number>(currentTrackIndex);
  currentTrackIndexRef.current = currentTrackIndex;
  const playbackModeRef = useRef<'all' | 'shuffle' | 'one' | 'off'>(playbackMode);
  playbackModeRef.current = playbackMode;

  // Filtered tracks based on selected folder
  const displayedTracks = useMemo(() => {
    if (selectedFolderId === 'all') return tracks;
    return tracks.filter((t) => (t.folderId || '') === selectedFolderId);
  }, [tracks, selectedFolderId]);

  const displayedTracksRef = useRef<AudioTrack[]>(displayedTracks);
  displayedTracksRef.current = displayedTracks;

  const refreshTracksAndFolders = async () => {
    try {
      const loadedFolders = getAudioFolders();
      setFolders(loadedFolders);
      const loadedTracks = await getAllTracks();
      setTracks(loadedTracks);
    } catch (err) {
      console.error('Failed to load tracks and folders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTracksAndFolders();
  }, []);

  const currentTrack =
    currentTrackIndex >= 0 && currentTrackIndex < tracks.length
      ? tracks[currentTrackIndex]
      : null;

  const currentTrackRef = useRef<AudioTrack | null>(currentTrack);
  currentTrackRef.current = currentTrack;

  // Track URL management
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentTrack) {
      const url = URL.createObjectURL(currentTrack.blob);
      setActiveAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.muted = isMuted;
        audioRef.current.loop = playbackMode === 'one';
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setActiveAudioUrl(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentTrackIndex, tracks]);

  // Configure Media Session API for mobile & browser background playback
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator && currentTrack) {
      const trackName = currentTrack.name;
      const albumName =
        currentLang === 'ar' ? 'المحفزات الصوتية للتمارين' : 'Trainingsplan Motivation Audio';
      const artistName = currentLang === 'ar' ? 'تمارين اليوم' : 'Full Body Workout';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: trackName,
        artist: artistName,
        album: albumName,
        artwork: [
          {
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24" fill="%23215641"><rect width="24" height="24" rx="6" fill="%23121c17"/><path d="m6.5 6.5 11 11M17.5 6.5l-11 11" stroke="%2334d399" stroke-width="2"/></svg>',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      });

      const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch {
          // Action not supported in browser
        }
      };

      setHandler('play', () => {
        if (audioRef.current) {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => {});
        }
      });

      setHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      });

      setHandler('previoustrack', () => {
        handlePrev();
      });

      setHandler('nexttrack', () => {
        handleNext();
      });

      // Crucial: Stop handler handles notification close ("زر اكس / إيقاف")
      setHandler('stop', () => {
        stopAudio();
      });

      setHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    }
  }, [currentTrack, currentLang]);

  // Sync MediaSession playback state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const playTrackAtIndex = (index: number) => {
    const list = tracksRef.current;
    if (index < 0 || index >= list.length) return;

    if (index === currentTrackIndexRef.current) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      setCurrentTrackIndex(index);
    }
  };

  const playTrackById = (id: string) => {
    const targetIdx = tracks.findIndex((t) => t.id === id);
    if (targetIdx !== -1) {
      playTrackAtIndex(targetIdx);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (currentTrackIndex === -1 && tracks.length > 0) {
      if (displayedTracks.length > 0) {
        playTrackById(displayedTracks[0].id);
      } else {
        playTrackAtIndex(0);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleNext = () => {
    const list =
      displayedTracksRef.current.length > 0
        ? displayedTracksRef.current
        : tracksRef.current;
    if (list.length === 0) return;

    const currentTrackId = tracksRef.current[currentTrackIndexRef.current]?.id;
    const currentInFilteredIdx = list.findIndex((t) => t.id === currentTrackId);
    const mode = playbackModeRef.current;

    if (mode === 'shuffle' && list.length > 1) {
      let nextRandom = Math.floor(Math.random() * list.length);
      while (nextRandom === currentInFilteredIdx && list.length > 1) {
        nextRandom = Math.floor(Math.random() * list.length);
      }
      playTrackById(list[nextRandom].id);
      return;
    }

    if (currentInFilteredIdx >= 0 && currentInFilteredIdx < list.length - 1) {
      playTrackById(list[currentInFilteredIdx + 1].id);
    } else {
      playTrackById(list[0].id);
    }
  };

  const handlePrev = () => {
    const list =
      displayedTracksRef.current.length > 0
        ? displayedTracksRef.current
        : tracksRef.current;
    if (list.length === 0) return;

    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const currentTrackId = tracksRef.current[currentTrackIndexRef.current]?.id;
    const currentInFilteredIdx = list.findIndex((t) => t.id === currentTrackId);

    if (currentInFilteredIdx > 0) {
      playTrackById(list[currentInFilteredIdx - 1].id);
    } else {
      playTrackById(list[list.length - 1].id);
    }
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(
      Math.max(0, audioRef.current.currentTime + seconds),
      duration || 0
    );
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const SPEED_OPTIONS = [1, 1.25, 1.5, 2, 0.75];
  const cycleSpeed = () => {
    const currentIdx = SPEED_OPTIONS.indexOf(playbackRate);
    const nextIdx = (currentIdx + 1) % SPEED_OPTIONS.length;
    const nextRate = SPEED_OPTIONS[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const cyclePlaybackMode = () => {
    setPlaybackMode((prev) => {
      const next =
        prev === 'all'
          ? 'shuffle'
          : prev === 'shuffle'
          ? 'one'
          : prev === 'one'
          ? 'off'
          : 'all';
      if (audioRef.current) {
        audioRef.current.loop = next === 'one';
      }
      return next;
    });
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const onEnded = () => {
    const mode = playbackModeRef.current;
    const list =
      displayedTracksRef.current.length > 0
        ? displayedTracksRef.current
        : tracksRef.current;

    if (list.length === 0) return;

    if (mode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
      return;
    }

    const currentTrackId = tracksRef.current[currentTrackIndexRef.current]?.id;
    const currentInFilteredIdx = list.findIndex((t) => t.id === currentTrackId);

    if (mode === 'shuffle' && list.length > 1) {
      let nextRandom = Math.floor(Math.random() * list.length);
      while (nextRandom === currentInFilteredIdx && list.length > 1) {
        nextRandom = Math.floor(Math.random() * list.length);
      }
      playTrackById(list[nextRandom].id);
      return;
    }

    if (currentInFilteredIdx >= 0 && currentInFilteredIdx < list.length - 1) {
      playTrackById(list[currentInFilteredIdx + 1].id);
    } else if (mode === 'all') {
      playTrackById(list[0].id);
    } else {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
  };

  return (
    <AudioContext.Provider
      value={{
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
        isLoading,
        audioRef,
        playTrackAtIndex,
        playTrackById,
        togglePlay,
        handleNext,
        handlePrev,
        handleSkip,
        handleSeek,
        cycleSpeed,
        cyclePlaybackMode,
        toggleMute,
        stopAudio,
        setTracks,
        setFolders,
        refreshTracksAndFolders,
        currentLang,
        setCurrentLang,
      }}
    >
      {/* Root Persistent HTML Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
