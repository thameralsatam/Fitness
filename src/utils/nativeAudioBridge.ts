import { registerPlugin, Capacitor } from '@capacitor/core';

export interface NativeAudioTrackItem {
  id: string;
  name: string;
  artist?: string;
  album?: string;
  duration?: number;
  order?: number;
  mimeType?: string;
}

export interface NativeAudioPlayerInterface {
  isNativeSupported(): Promise<{ supported: boolean }>;
  cacheTrack(options: { id: string; data: string; mimeType?: string }): Promise<{ success: boolean; id: string }>;
  cacheTrackChunk(options: { id: string; chunk: string; isFirst: boolean; isLast: boolean }): Promise<{ success: boolean; id: string; size: number }>;
  hasCachedTrack(options: { id: string }): Promise<{ cached: boolean; id: string }>;
  deleteCachedTrack(options: { id: string }): Promise<{ success: boolean; id: string }>;
  clearCache(): Promise<{ success: boolean }>;
  setPlaylist(options: { tracks: NativeAudioTrackItem[]; startIndex?: number; startPosition?: number }): Promise<{ success: boolean }>;
  playTrack(options: { id: string; name: string; artist?: string; album?: string; startPosition?: number; mimeType?: string }): Promise<{ success: boolean; id: string }>;
  pause(): Promise<{ success: boolean }>;
  resume(): Promise<{ success: boolean }>;
  stop(): Promise<{ success: boolean }>;
  seekTo(options: { time: number }): Promise<{ success: boolean }>;
  skip(options: { seconds: number }): Promise<{ success: boolean }>;
  next(): Promise<{ success: boolean }>;
  previous(): Promise<{ success: boolean }>;
  setPlaybackSpeed(options: { speed: number }): Promise<{ success: boolean }>;
  setRepeatMode(options: { mode: 'all' | 'one' | 'shuffle' | 'off' }): Promise<{ success: boolean }>;
  setVolume(options: { volume: number }): Promise<{ success: boolean }>;
  getPlaybackState(): Promise<{
    isPlaying: boolean;
    currentPosition: number;
    duration: number;
    currentIndex: number;
    playbackSpeed: number;
  }>;
  addListener(
    eventName: 'onPlaybackStateChange',
    listenerFunc: (data: { isPlaying: boolean; playbackState: number; currentTrackId: string; currentTrackIndex: number }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'onProgress',
    listenerFunc: (data: { currentTime: number; duration: number; currentTrackId: string; currentTrackIndex: number }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'onTrackChanged',
    listenerFunc: (data: { currentTrackId: string; currentTrackIndex: number }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'onTrackEnded',
    listenerFunc: (data: { currentTrackId: string; currentTrackIndex: number }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'onError',
    listenerFunc: (data: { message: string }) => void
  ): Promise<{ remove: () => void }>;
}

export const NativeAudioPlayer = registerPlugin<NativeAudioPlayerInterface>('NativeAudioPlayer');

export const isNativeAudioAvailable = (): boolean => {
  try {
    return (
      Capacitor.isNativePlatform() &&
      Capacitor.getPlatform() === 'android' &&
      Capacitor.isPluginAvailable('NativeAudioPlayer')
    );
  } catch {
    return false;
  }
};

/**
 * Converts a Blob to Base64 string for caching into Android storage.
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      resolve(res);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}
