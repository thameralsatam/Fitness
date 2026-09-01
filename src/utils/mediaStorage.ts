import { ExerciseMediaItem } from '../types';

const DB_NAME = 'GymWorkoutExerciseMediaDB_v1';
const STORE_NAME = 'exercise_media';
const DB_VERSION = 1;

interface StoredMediaRecord {
  id: string;
  exerciseId: number;
  type: 'image' | 'video';
  name: string;
  blob: Blob;
  size: number;
  createdAt: number;
}

// In-memory cache of created object URLs to prevent duplicate memory allocation
const objectUrlCache = new Map<string, string>();

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message || 'Unknown error'}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('exerciseId', 'exerciseId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

function getOrCreateObjectUrl(id: string, blob: Blob): string {
  if (objectUrlCache.has(id)) {
    return objectUrlCache.get(id)!;
  }
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(id, url);
  return url;
}

export async function saveExerciseMediaFile(
  exerciseId: number,
  file: File
): Promise<ExerciseMediaItem> {
  const db = await openMediaDB();
  const id = `media_${exerciseId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi)$/i.test(file.name);
  const type: 'image' | 'video' = isVideo ? 'video' : 'image';

  const record: StoredMediaRecord = {
    id,
    exerciseId,
    type,
    name: file.name || (type === 'video' ? 'Video Demonstration' : 'Exercise Photo'),
    blob: file,
    size: file.size,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => {
      const url = getOrCreateObjectUrl(id, file);
      resolve({
        id,
        type,
        url,
        name: record.name,
        size: record.size,
        createdAt: record.createdAt,
      });
    };

    request.onerror = () => {
      reject(new Error(`Failed to save media: ${request.error?.message || 'Unknown error'}`));
    };
  });
}

export async function getExerciseMediaList(exerciseId: number): Promise<ExerciseMediaItem[]> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('exerciseId');
      const request = index.getAll(exerciseId);

      request.onsuccess = () => {
        const records: StoredMediaRecord[] = request.result || [];
        const items: ExerciseMediaItem[] = records
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((rec) => ({
            id: rec.id,
            type: rec.type,
            url: getOrCreateObjectUrl(rec.id, rec.blob),
            name: rec.name,
            size: rec.size,
            createdAt: rec.createdAt,
          }));
        resolve(items);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

export async function getAllExerciseMediaMap(): Promise<Record<number, ExerciseMediaItem[]>> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: StoredMediaRecord[] = request.result || [];
        const map: Record<number, ExerciseMediaItem[]> = {};

        records.forEach((rec) => {
          if (!map[rec.exerciseId]) {
            map[rec.exerciseId] = [];
          }
          map[rec.exerciseId].push({
            id: rec.id,
            type: rec.type,
            url: getOrCreateObjectUrl(rec.id, rec.blob),
            name: rec.name,
            size: rec.size,
            createdAt: rec.createdAt,
          });
        });

        // Sort items by createdAt
        Object.keys(map).forEach((key) => {
          map[Number(key)].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        });

        resolve(map);
      };

      request.onerror = () => {
        resolve({});
      };
    });
  } catch {
    return {};
  }
}

export async function deleteExerciseMediaItem(mediaId: string): Promise<void> {
  try {
    if (objectUrlCache.has(mediaId)) {
      const url = objectUrlCache.get(mediaId)!;
      URL.revokeObjectURL(url);
      objectUrlCache.delete(mediaId);
    }

    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(mediaId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // fallback
  }
}

export async function clearAllMediaForExercise(exerciseId: number): Promise<void> {
  try {
    const list = await getExerciseMediaList(exerciseId);
    await Promise.all(list.map((item) => deleteExerciseMediaItem(item.id)));
  } catch {
    // fallback
  }
}

export interface SerializedMediaItem {
  id: string;
  type: 'image' | 'video';
  name: string;
  dataUrl: string;
  size?: number;
  createdAt?: number;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export interface RawMediaRecord {
  id: string;
  exerciseId: number;
  type: 'image' | 'video';
  name: string;
  blob: Blob;
  size: number;
  createdAt: number;
}

export async function getAllExerciseMediaRecordsMap(): Promise<Record<number, RawMediaRecord[]>> {
  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: StoredMediaRecord[] = request.result || [];
        const map: Record<number, RawMediaRecord[]> = {};

        for (const rec of records) {
          if (!map[rec.exerciseId]) {
            map[rec.exerciseId] = [];
          }
          map[rec.exerciseId].push({
            id: rec.id,
            exerciseId: rec.exerciseId,
            type: rec.type,
            name: rec.name,
            blob: rec.blob,
            size: rec.size,
            createdAt: rec.createdAt,
          });
        }
        resolve(map);
      };

      request.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

export async function saveRawMediaRecord(item: {
  id?: string;
  exerciseId: number;
  type: 'image' | 'video';
  name: string;
  blob: Blob;
  createdAt?: number;
}): Promise<ExerciseMediaItem> {
  const db = await openMediaDB();
  const id = item.id || `media_${item.exerciseId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const record: StoredMediaRecord = {
    id,
    exerciseId: item.exerciseId,
    type: item.type,
    name: item.name,
    blob: item.blob,
    size: item.blob.size,
    createdAt: item.createdAt || Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => {
      const url = getOrCreateObjectUrl(id, item.blob);
      resolve({
        id,
        type: item.type,
        url,
        name: record.name,
        size: record.size,
        createdAt: record.createdAt,
      });
    };

    request.onerror = () => {
      reject(new Error(`Failed to save raw media: ${request.error?.message || 'Unknown error'}`));
    };
  });
}

/**
 * Retrieves stored exercise media from IndexedDB as Base64 Data URLs with options and size guards
 */
export async function getAllExerciseMediaBase64Map(options?: {
  includeVideos?: boolean;
  maxVideoSizeBytes?: number;
}): Promise<Record<number, SerializedMediaItem[]>> {
  const includeVideos = options?.includeVideos ?? true;
  const maxVideoSizeBytes = options?.maxVideoSizeBytes ?? 20 * 1024 * 1024; // 20MB inline safeguard

  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = async () => {
        const records: StoredMediaRecord[] = request.result || [];
        const map: Record<number, SerializedMediaItem[]> = {};

        for (const rec of records) {
          try {
            if (rec.type === 'video') {
              if (!includeVideos) continue;
              if (rec.blob.size > maxVideoSizeBytes) {
                console.warn(`Skipping large inline video ${rec.name} (${rec.blob.size} bytes) to prevent crash`);
                continue;
              }
            }

            const dataUrl = await blobToDataUrl(rec.blob);
            if (!map[rec.exerciseId]) {
              map[rec.exerciseId] = [];
            }
            map[rec.exerciseId].push({
              id: rec.id,
              type: rec.type,
              name: rec.name,
              dataUrl,
              size: rec.size,
              createdAt: rec.createdAt,
            });
          } catch {
            // ignore failed blob read
          }
        }
        resolve(map);
      };

      request.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

/**
 * Saves a list of Base64 media items into IndexedDB for a given exercise ID
 */
export async function importBase64MediaItems(
  exerciseId: number,
  items: SerializedMediaItem[]
): Promise<ExerciseMediaItem[]> {
  const savedMediaItems: ExerciseMediaItem[] = [];
  for (const item of items) {
    try {
      if (!item.dataUrl) continue;
      const blob = dataUrlToBlob(item.dataUrl);
      const file = new File([blob], item.name || (item.type === 'video' ? 'video.mp4' : 'photo.jpg'), {
        type: blob.type,
      });
      const saved = await saveExerciseMediaFile(exerciseId, file);
      savedMediaItems.push(saved);
    } catch {
      // skip invalid item
    }
  }
  return savedMediaItems;
}

