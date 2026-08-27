import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  AudioTrack,
  AudioFolder,
  getAllTracks,
  getAudioFolders,
  saveTrackLyrics,
} from '../utils/audioDb';
import { LyricLine } from '../types';
import {
  NativeAudioPlayer,
  isNativeAudioAvailable,
  blobToBase64,
  NativeAudioTrackItem,
} from '../utils/nativeAudioBridge';

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
  updateTrackLyrics: (id: string, lyrics: LyricLine[]) => Promise<void>;
  setTracks: React.Dispatch<React.SetStateAction<AudioTrack[]>>;
  setFolders: React.Dispatch<React.SetStateAction<AudioFolder[]>>;
  refreshTracksAndFolders: () => Promise<void>;
  currentLang: 'ar' | 'de';
  setCurrentLang: (lang: 'ar' | 'de') => void;
  isNative: boolean;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode; lang: 'ar' | 'de' }> = ({
  children,
  lang,
}) => {
  const isNative = isNativeAudioAvailable();
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

  const lastRequestedTrackIdRef = useRef<string | null>(null);

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

  // Native Android Media3 Listeners
  useEffect(() => {
    if (!isNative) return;

    let removeListeners: Array<() => void> = [];

    const setupListeners = async () => {
      try {
        const sub1 = await NativeAudioPlayer.addListener('onPlaybackStateChange', (data) => {
          setIsPlaying(data.isPlaying);
        });
        removeListeners.push(sub1.remove);

        const sub2 = await NativeAudioPlayer.addListener('onProgress', (data) => {
          setCurrentTime(data.currentTime);
          if (data.duration > 0) {
            setDuration(data.duration);
          }
        });
        removeListeners.push(sub2.remove);

        const sub3 = await NativeAudioPlayer.addListener('onTrackChanged', (data) => {
          if (data.currentTrackId) {
            const idx = tracksRef.current.findIndex((t) => t.id === data.currentTrackId);
            if (idx !== -1) {
              setCurrentTrackIndex(idx);
            }
          }
        });
        removeListeners.push(sub3.remove);

        const sub4 = await NativeAudioPlayer.addListener('onTrackEnded', (data) => {
          // Native player handles playlist loop / next item
          if (playbackModeRef.current === 'off' && tracksRef.current.length > 0) {
            const lastTrack = tracksRef.current[tracksRef.current.length - 1];
            if (lastTrack && lastTrack.id === data.currentTrackId) {
              setIsPlaying(false);
            }
          }
        });
        removeListeners.push(sub4.remove);

        const sub5 = await NativeAudioPlayer.addListener('onError', (data) => {
          console.error('Native Audio Player error:', data.message);
          setIsPlaying(false);
        });
        removeListeners.push(sub5.remove);
      } catch (e) {
        console.warn('Could not register native audio listeners:', e);
      }
    };

    setupListeners();

    return () => {
      removeListeners.forEach((remove) => {
        try {
          remove();
        } catch {
          // ignore
        }
      });
    };
  }, [isNative]);

  // Track URL management for Web Fallback
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    // If native, Web HTMLAudioElement is not used
    if (isNative) return;

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
  }, [currentTrackIndex, tracks, isNative]);

  // Configure Media Session API for Web browser fallback
  useEffect(() => {
    if (isNative) return;

    if (typeof window !== 'undefined' && 'mediaSession' in navigator && currentTrack) {
      const trackName = currentTrack.name;
      const albumName =
        currentLang === 'ar' ? 'المحفزات الصوتية للتمارين' : 'Workout Motivation Audio';
      const artistName = currentLang === 'ar' ? 'جلسة التمرين' : 'Workout Session';

      const iconUrl = typeof window !== 'undefined' ? `${window.location.origin}/icon-512.png` : '/icon-512.png';
      const appleIconUrl = typeof window !== 'undefined' ? `${window.location.origin}/apple-touch-icon.png` : '/apple-touch-icon.png';

      navigator.mediaSession.metadata = new MediaMetadata({
        title: trackName,
        artist: artistName,
        album: albumName,
        artwork: [
          {
            src: iconUrl,
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: appleIconUrl,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="115" fill="%2313271e"/><path d="m160 160 192 192M352 160l-192 192" stroke="%2334d399" stroke-width="36" stroke-linecap="round"/></svg>',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      });

      const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch {
          // Action not supported in this browser version
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

      setHandler('seekbackward', () => {
        handleSkip(-10);
      });

      setHandler('seekforward', () => {
        handleSkip(10);
      });

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
  }, [currentTrack, currentLang, isNative]);

  // Sync MediaSession playback state & position state for Web lockscreen scrubber
  useEffect(() => {
    if (isNative) return;

    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      
      if (duration > 0 && 'setPositionState' in navigator.mediaSession) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(0, duration),
            playbackRate: playbackRate || 1,
            position: Math.min(Math.max(0, currentTime), duration),
          });
        } catch {
          // Ignore unsupported position state bounds
        }
      }
    }
  }, [isPlaying, currentTime, duration, playbackRate, isNative]);

  // Helper to ensure track is cached into native storage
  const ensureNativeTrackCached = async (track: AudioTrack, isBackground = false) => {
    try {
      console.log('[DEBUG_AUDIO] Checking cache status for track:', track.id, 'Name:', track.name);
      const { cached } = await NativeAudioPlayer.hasCachedTrack({ id: track.id });
      console.log('[DEBUG_AUDIO] Cache status for track:', track.id, 'is cached:', cached);
      
      if (!cached) {
        if (!track.blob) {
          console.error('[DEBUG_AUDIO] Cannot cache track natively - track.blob is missing or null!', track.id);
          return false;
        }

        console.log('[DEBUG_AUDIO] cache start for track:', track.id, 'Blob size:', track.blob.size);
        
        // Chunk size: 1MB (1024 * 1024 bytes)
        const chunkSize = 1024 * 1024;
        const totalChunks = Math.ceil(track.blob.size / chunkSize);
        
        for (let i = 0; i < totalChunks; i++) {
          // If this is the active track (not background), abort if user selected a different track
          if (!isBackground && lastRequestedTrackIdRef.current !== track.id) {
            console.log('[DEBUG_AUDIO] Aborting chunked cache upload for track:', track.id, 'because another track was selected.');
            return false;
          }
          
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, track.blob.size);
          const chunkBlob = track.blob.slice(start, end);
          
          const base64Chunk = await blobToBase64(chunkBlob);
          
          const isFirst = i === 0;
          const isLast = i === totalChunks - 1;
          
          await NativeAudioPlayer.cacheTrackChunk({
            id: track.id,
            chunk: base64Chunk,
            isFirst,
            isLast
          });
          
          // Yield to the browser's event loop to prevent UI freezing
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        
        console.log('[DEBUG_AUDIO] cache finished for track:', track.id);
      }
      return true;
    } catch (e) {
      console.error('[DEBUG_AUDIO] Failed to cache track natively:', track.id, e);
      return false;
    }
  };

  const playTrackAtIndex = async (index: number) => {
    const list = tracksRef.current;
    if (index < 0 || index >= list.length) {
      console.error('[DEBUG_AUDIO] playTrackAtIndex index out of bounds:', index, 'list size:', list.length);
      return;
    }

    const track = list[index];
    if (!track) {
      console.error('[DEBUG_AUDIO] playTrackAtIndex track at index', index, 'is null/undefined');
      return;
    }

    const oldTrack = currentTrackIndexRef.current >= 0 ? list[currentTrackIndexRef.current] : null;

    console.log('[DEBUG_AUDIO] user selected track:', track.name, 'index:', index);
    console.log('[DEBUG_AUDIO] current track قبل التغيير:', oldTrack ? oldTrack.name : 'none');
    console.log('[DEBUG_AUDIO] requested track:', track.name);

    if (isNative) {
      try {
        lastRequestedTrackIdRef.current = track.id;

        // Stop current audio immediately to avoid overlapping playback
        console.log('[DEBUG_AUDIO] Stopping current player to prepare for new track');
        await NativeAudioPlayer.stop();

        // Update active track states immediately to keep UI highly responsive
        setCurrentTrackIndex(index);
        setIsPlaying(true);

        console.log('[DEBUG_AUDIO] cache start for track:', track.id);
        const cacheSuccess = await ensureNativeTrackCached(track, false);
        console.log('[DEBUG_AUDIO] cache finished for track:', track.id, 'success:', cacheSuccess);

        // Abort if user clicked another track during the caching process
        if (lastRequestedTrackIdRef.current !== track.id) {
          console.log('[DEBUG_AUDIO] Aborting playback of', track.name, 'because another track was selected since.');
          return;
        }

        if (!cacheSuccess) {
          throw new Error('Native cache operation failed');
        }

        const currentActiveList =
          displayedTracksRef.current.length > 0
            ? displayedTracksRef.current
            : tracksRef.current;

        console.log('[DEBUG_AUDIO] Playlist tracks count:', currentActiveList.length);

        const playlistData: NativeAudioTrackItem[] = currentActiveList.map((t) => ({
          id: t.id,
          name: t.name,
          artist: currentLang === 'ar' ? 'جلسة التمرين' : 'Workout Session',
          album: currentLang === 'ar' ? 'المحفزات الصوتية للتمارين' : 'Workout Motivation Audio',
          duration: t.duration || 0,
          order: t.order || 0,
          mimeType: t.type || t.blob?.type || 'audio/mpeg',
        }));

        const startIndexInPlaylist = currentActiveList.findIndex((t) => t.id === track.id);
        console.log('[DEBUG_AUDIO] startIndexInPlaylist:', startIndexInPlaylist);

        console.log('[DEBUG_AUDIO] setPlaylist start');
        const setPlaylistRes = await NativeAudioPlayer.setPlaylist({
          tracks: playlistData,
          startIndex: Math.max(0, startIndexInPlaylist),
          startPosition: 0,
        });
        console.log('[DEBUG_AUDIO] setPlaylist finished, result:', setPlaylistRes);

        await NativeAudioPlayer.setPlaybackSpeed({ speed: playbackRate });
        await NativeAudioPlayer.setRepeatMode({ mode: playbackMode });
        await NativeAudioPlayer.setVolume({ volume: isMuted ? 0 : 1 });

        console.log('[DEBUG_AUDIO] playback start');
        setIsPlaying(true);

        // Pre-cache only the next track in the playlist in background (non-blocking)
        const nextIdx = (startIndexInPlaylist + 1) % currentActiveList.length;
        const nextTrack = currentActiveList[nextIdx];
        if (nextTrack && nextTrack.id !== track.id) {
          console.log('[DEBUG_AUDIO] Pre-caching next track in background:', nextTrack.name);
          ensureNativeTrackCached(nextTrack, true);
        }
      } catch (err) {
        console.error('[DEBUG_AUDIO] playback error:', err);
        setIsPlaying(false);
      }
    } else {
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
    }
  };

  const playTrackById = (id: string) => {
    const targetIdx = tracks.findIndex((t) => t.id === id);
    if (targetIdx !== -1) {
      playTrackAtIndex(targetIdx);
    }
  };

  const togglePlay = async () => {
    if (currentTrackIndex === -1 && tracks.length > 0) {
      if (displayedTracks.length > 0) {
        playTrackById(displayedTracks[0].id);
      } else {
        playTrackAtIndex(0);
      }
      return;
    }

    if (isNative) {
      if (isPlaying) {
        try {
          await NativeAudioPlayer.pause();
          setIsPlaying(false);
        } catch (e) {
          console.error('Error pausing native player:', e);
        }
      } else {
        try {
          const state = await NativeAudioPlayer.getPlaybackState();
          if (state.currentIndex >= 0 && state.duration > 0) {
            await NativeAudioPlayer.resume();
            setIsPlaying(true);
          } else {
            const targetIdx = currentTrackIndexRef.current >= 0 ? currentTrackIndexRef.current : 0;
            await playTrackAtIndex(targetIdx);
          }
        } catch {
          const targetIdx = currentTrackIndexRef.current >= 0 ? currentTrackIndexRef.current : 0;
          await playTrackAtIndex(targetIdx);
        }
      }
      return;
    }

    if (!audioRef.current) return;

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
    if (isNative) {
      NativeAudioPlayer.next().catch(() => {});
      return;
    }

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
    if (isNative) {
      NativeAudioPlayer.previous().catch(() => {});
      return;
    }

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
    if (isNative) {
      NativeAudioPlayer.skip({ seconds }).catch(() => {});
      return;
    }

    if (!audioRef.current) return;
    const newTime = Math.min(
      Math.max(0, audioRef.current.currentTime + seconds),
      duration || 0
    );
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSeek = (time: number) => {
    if (isNative) {
      NativeAudioPlayer.seekTo({ time }).catch(() => {});
      setCurrentTime(time);
      return;
    }

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

    if (isNative) {
      NativeAudioPlayer.setPlaybackSpeed({ speed: nextRate }).catch(() => {});
    } else if (audioRef.current) {
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

      if (isNative) {
        NativeAudioPlayer.setRepeatMode({ mode: next }).catch(() => {});
      } else if (audioRef.current) {
        audioRef.current.loop = next === 'one';
      }
      return next;
    });
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isNative) {
      NativeAudioPlayer.setVolume({ volume: nextMuted ? 0 : 1 }).catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
  };

  const stopAudio = () => {
    if (isNative) {
      NativeAudioPlayer.stop().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentTrackIndex(-1);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const updateTrackLyrics = async (id: string, lyrics: LyricLine[]) => {
    try {
      await saveTrackLyrics(id, lyrics);
      setTracks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                lyrics,
                hasExtractedLyrics: lyrics && lyrics.length > 0,
              }
            : t
        )
      );
    } catch (e) {
      console.error('Failed to update track lyrics:', e);
    }
  };

  const onTimeUpdate = () => {
    if (!isNative && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (!isNative && audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const onEnded = () => {
    if (isNative) return;

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
        updateTrackLyrics,
        setTracks,
        setFolders,
        refreshTracksAndFolders,
        currentLang,
        setCurrentLang,
        isNative,
      }}
    >
      {/* Root Persistent HTML Audio Element - active only for Web fallback */}
      {!isNative && (
        <audio
          ref={audioRef}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setIsPlaying(false)}
        />
      )}
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
