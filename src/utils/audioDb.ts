export interface AudioFolder {
  id: string;
  name: string;
  createdAt: number;
}

import { LyricLine } from '../types';
import { NativeAudioPlayer, isNativeAudioAvailable } from './nativeAudioBridge';

export interface AudioTrack {
  id: string;
  name: string;
  size: number;
  type: string;
  blob: Blob;
  duration?: number;
  addedAt: number;
  order: number;
  extractedFromVideo?: boolean;
  folderId?: string;
  lyrics?: LyricLine[];
  hasExtractedLyrics?: boolean;
}

const DB_NAME = 'GymWorkoutAudioDB';
const STORE_NAME = 'tracks';
const FOLDERS_STORAGE_KEY = 'gym_workout_audio_folders_v1';

export function getAudioFolders(): AudioFolder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAudioFolder(folder: AudioFolder): void {
  const folders = getAudioFolders();
  const existing = folders.findIndex((f) => f.id === folder.id);
  if (existing >= 0) {
    folders[existing] = folder;
  } else {
    folders.push(folder);
  }
  localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
}

export function deleteAudioFolder(folderId: string): void {
  const folders = getAudioFolders().filter((f) => f.id !== folderId);
  localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
}

export function updateAudioFolderName(folderId: string, newName: string): void {
  const folders = getAudioFolders().map((f) =>
    f.id === folderId ? { ...f, name: newName.trim() || f.name } : f
  );
  localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    // Opening without a fixed version number opens the current database version without throwing VersionError
    const request = window.indexedDB.open(DB_NAME);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('order', 'order', { unique: false });
        store.createIndex('addedAt', 'addedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const nextVersion = db.version + 1;
        db.close();
        const upgradeReq = window.indexedDB.open(DB_NAME, nextVersion);
        upgradeReq.onupgradeneeded = (e) => {
          const upDb = (e.target as IDBOpenDBRequest).result;
          if (!upDb.objectStoreNames.contains(STORE_NAME)) {
            const store = upDb.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('order', 'order', { unique: false });
            store.createIndex('addedAt', 'addedAt', { unique: false });
          }
        };
        upgradeReq.onsuccess = () => resolve(upgradeReq.result);
        upgradeReq.onerror = () => reject(upgradeReq.error);
        return;
      }
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getAllTracks(): Promise<AudioTrack[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const tracks = (request.result as AudioTrack[]) || [];
        tracks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        resolve(tracks);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Failed to get tracks from IndexedDB:', err);
    return [];
  }
}

export async function saveTrack(track: AudioTrack): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(track);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function addMultipleTracks(files: File[], startingOrder: number): Promise<AudioTrack[]> {
  const db = await openDB();
  const newTracks: AudioTrack[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const trackId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const cleanName = file.name.replace(/\.[^/.]+$/, '');

    const track: AudioTrack = {
      id: trackId,
      name: cleanName,
      size: file.size,
      type: file.type || 'audio/mpeg',
      blob: file,
      addedAt: Date.now(),
      order: startingOrder + i,
    };
    newTracks.push(track);
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const track of newTracks) {
      store.put(track);
    }

    tx.oncomplete = () => {
      resolve(newTracks);
    };

    tx.onerror = () => {
      reject(tx.error);
    };
  });
}

export async function deleteTrack(id: string): Promise<void> {
  if (isNativeAudioAvailable()) {
    NativeAudioPlayer.deleteCachedTrack({ id }).catch(() => {});
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateTrackName(id: string, newName: string): Promise<void> {
  return updateTrackDetails(id, { name: newName.trim() });
}

export async function updateTrackDetails(id: string, updates: Partial<AudioTrack>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const track = getReq.result as AudioTrack | undefined;
      if (!track) {
        resolve();
        return;
      }
      const updated: AudioTrack = {
        ...track,
        ...updates,
      };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function saveTrackLyrics(id: string, lyrics: LyricLine[]): Promise<void> {
  return updateTrackDetails(id, {
    lyrics,
    hasExtractedLyrics: lyrics && lyrics.length > 0,
  });
}

export async function unassignFolderFromTracks(folderId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const all = (req.result as AudioTrack[]) || [];
      all.forEach((t) => {
        if (t.folderId === folderId) {
          store.put({ ...t, folderId: undefined });
        }
      });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteTracksInFolder(folderId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const all = (req.result as AudioTrack[]) || [];
      all.forEach((t) => {
        if (t.folderId === folderId) {
          if (isNativeAudioAvailable()) {
            NativeAudioPlayer.deleteCachedTrack({ id: t.id }).catch(() => {});
          }
          store.delete(t.id);
        }
      });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllTracks(): Promise<void> {
  if (isNativeAudioAvailable()) {
    NativeAudioPlayer.clearCache().catch(() => {});
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateTracksOrder(orderedTracks: AudioTrack[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    orderedTracks.forEach((track, index) => {
      const updatedTrack = { ...track, order: index };
      store.put(updatedTrack);
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
