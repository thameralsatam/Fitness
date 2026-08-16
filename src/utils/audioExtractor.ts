// Helper to extract audio track from video files or decode/standardize audio files locally in the browser.
// Uses Web Audio API (OfflineAudioContext) and AudioContext to convert audio channels into a clean, compact WAV/M4A/MP3 Blob.

export interface ProcessedAudioResult {
  blob: Blob;
  duration: number;
  extractedFromVideo: boolean;
  originalName: string;
  size: number;
}

/**
 * Encodes an AudioBuffer into standard 16-bit PCM WAV format Blob.
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const bufferArray = new ArrayBuffer(44 + length);
  const view = new DataView(bufferArray);

  /* Helper to write string to DataView */
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + length, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, length, true);

  // Interleave channels & write PCM samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed int
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Checks if a file is a video file based on MIME type or extension.
 */
export function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', '3gp', 'flv', 'wmv', 'ogv', 'ts'].includes(ext);
}

/**
 * Checks if a file is supported (audio or video).
 */
export function isSupportedMediaFile(file: File): boolean {
  if (file.type.startsWith('audio/') || file.type.startsWith('video/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const validExts = [
    'mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'opus', 'wma', 'aiff',
    'mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', '3gp', 'flv', 'wmv', 'ogv', 'ts'
  ];
  return validExts.includes(ext);
}

/**
 * Extracts audio from a video or decodes audio directly to a lightweight optimized WAV Blob.
 * If the file is already a standard audio file and small, it can also be kept as is or converted.
 */
export async function processMediaToAudio(
  file: File,
  onProgress?: (percent: number, stepText: string) => void
): Promise<ProcessedAudioResult> {
  const isVideo = isVideoFile(file);

  // If it's a regular audio file (e.g. mp3/m4a/wav/ogg), we can read metadata and store directly
  // or decode if needed. Storing direct audio files is faster and saves memory.
  if (!isVideo && file.type.startsWith('audio/')) {
    onProgress?.(50, 'قراءة الصوت...');
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;
      audio.onloadedmetadata = () => {
        const duration = audio.duration || 0;
        URL.revokeObjectURL(url);
        resolve({
          blob: file,
          duration,
          extractedFromVideo: false,
          originalName: file.name,
          size: file.size,
        });
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        // Fallback with duration 0
        resolve({
          blob: file,
          duration: 0,
          extractedFromVideo: false,
          originalName: file.name,
          size: file.size,
        });
      };
    });
  }

  // If it is a video (or unknown audio format that needs decoding), extract audio using Web Audio API
  onProgress?.(20, 'جاري استخراج الصوت من الفيديو...');

  try {
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(50, 'معالجة وتفكيك المسار الصوتي...');

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      // Fallback: If Web Audio not available, return file directly (browsers usually play audio from video elements too)
      return {
        blob: file,
        duration: 0,
        extractedFromVideo: isVideo,
        originalName: file.name,
        size: file.size,
      };
    }

    const audioCtx = new AudioContextClass();
    let audioBuffer: AudioBuffer;

    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch {
      // If decodeAudioData fails directly (some iOS Safari quirks with video arrayBuffers),
      // fallback to extracting via HTMLMediaElement + MediaStream / or directly using the video blob in audio tag
      audioCtx.close();
      return {
        blob: file,
        duration: 0,
        extractedFromVideo: isVideo,
        originalName: file.name,
        size: file.size,
      };
    }

    audioCtx.close();

    onProgress?.(80, 'تحويل إلى صيغة صوتية خفيفة (WAV)...');
    const wavBlob = audioBufferToWavBlob(audioBuffer);

    onProgress?.(100, 'تم الاستخراج بنجاح!');

    return {
      blob: wavBlob,
      duration: audioBuffer.duration,
      extractedFromVideo: true,
      originalName: file.name,
      size: wavBlob.size,
    };
  } catch (err) {
    console.warn('Could not decode audio with Web Audio API, using raw file:', err);
    return {
      blob: file,
      duration: 0,
      extractedFromVideo: isVideo,
      originalName: file.name,
      size: file.size,
    };
  }
}
