import { LyricLine } from '../types';

/**
 * 100% Local Mechanical Audio Waveform Analyzer & Segmenter
 * Runs entirely inside the client browser using Web Audio API (OfflineAudioContext).
 * No server requests, no external APIs, zero cost, completely offline.
 */

export interface AudioPhraseSegment {
  time: number;
  duration: number;
  energy: number;
}

/**
 * Decodes an audio blob into an AudioBuffer using browser native Web Audio API
 */
export async function decodeAudioBlobLocally(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } finally {
    if (audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
  }
}

/**
 * Detects vocal/speech phrase start times based on RMS acoustic energy & silence pauses
 */
export async function detectAcousticPhrases(
  blob: Blob,
  targetCount?: number
): Promise<number[]> {
  const audioBuffer = await decodeAudioBlobLocally(blob);
  const channelData = audioBuffer.getChannelData(0); // Left/mono channel
  const sampleRate = audioBuffer.sampleRate;
  const totalDuration = audioBuffer.duration;

  // Window size: 50ms for fine phrase boundary detection
  const windowSize = Math.floor(sampleRate * 0.05);
  const totalWindows = Math.floor(channelData.length / windowSize);

  const energyProfile: number[] = new Float32Array(totalWindows) as any;
  let maxEnergy = 0;

  for (let i = 0; i < totalWindows; i++) {
    const startIdx = i * windowSize;
    let sumSquares = 0;
    for (let j = 0; j < windowSize; j++) {
      const sample = channelData[startIdx + j] || 0;
      sumSquares += sample * sample;
    }
    const rms = Math.sqrt(sumSquares / windowSize);
    energyProfile[i] = rms;
    if (rms > maxEnergy) maxEnergy = rms;
  }

  // Silence threshold relative to maximum energy (approx -30dB to -20dB)
  const silenceThreshold = Math.max(0.008, maxEnergy * 0.12);
  const minPhraseGapSeconds = 0.8; // Minimum gap between distinct phrases
  const minPhraseGapWindows = Math.floor((minPhraseGapSeconds * sampleRate) / windowSize);

  const detectedTimes: number[] = [0.0];
  let isSpeaking = false;
  let silenceCounter = 0;

  for (let i = 0; i < totalWindows; i++) {
    const energy = energyProfile[i];
    const currentTime = (i * windowSize) / sampleRate;

    if (energy > silenceThreshold) {
      if (!isSpeaking && silenceCounter >= minPhraseGapWindows) {
        if (currentTime > 0.3 && currentTime < totalDuration - 0.5) {
          detectedTimes.push(parseFloat(currentTime.toFixed(2)));
        }
      }
      isSpeaking = true;
      silenceCounter = 0;
    } else {
      silenceCounter++;
      if (silenceCounter > minPhraseGapWindows) {
        isSpeaking = false;
      }
    }
  }

  // If specific count is requested (e.g. number of text lines), interpolate or trim evenly
  if (targetCount && targetCount > 0) {
    if (detectedTimes.length >= targetCount) {
      // Pick evenly distributed subset
      const step = (detectedTimes.length - 1) / Math.max(1, targetCount - 1);
      const res: number[] = [];
      for (let k = 0; k < targetCount; k++) {
        const idx = Math.min(detectedTimes.length - 1, Math.round(k * step));
        res.push(detectedTimes[idx]);
      }
      return res;
    } else {
      // Extrapolate smoothly across the total track duration
      const res: number[] = [...detectedTimes];
      const needed = targetCount - res.length;
      const lastKnownTime = res[res.length - 1] || 0;
      const remainingTime = Math.max(2, totalDuration - lastKnownTime);
      const chunk = remainingTime / (needed + 1);
      for (let k = 1; k <= needed; k++) {
        res.push(parseFloat((lastKnownTime + k * chunk).toFixed(2)));
      }
      return res.sort((a, b) => a - b);
    }
  }

  return detectedTimes;
}

/**
 * Mechanically aligns plain text lines to detected acoustic audio phrase boundaries
 */
export async function mechanicallyAlignTextToAudio(
  plainText: string,
  audioBlob: Blob
): Promise<LyricLine[]> {
  const rawLines = plainText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) {
    return [];
  }

  // Detect acoustic boundaries for the exact number of lines
  const timestamps = await detectAcousticPhrases(audioBlob, rawLines.length);

  return rawLines.map((text, idx) => ({
    id: `mech_${Date.now()}_${idx}`,
    time: timestamps[idx] !== undefined ? timestamps[idx] : idx * 4.0,
    text,
  }));
}

/**
 * Mechanical Audio Phrase Generator (Generates timestamped placeholder phrases based on sound waves)
 */
export async function generateMechanicalPhrases(
  audioBlob: Blob,
  lang: 'ar' | 'de' = 'ar'
): Promise<LyricLine[]> {
  const timestamps = await detectAcousticPhrases(audioBlob);
  const isAr = lang === 'ar';

  return timestamps.map((time, idx) => ({
    id: `phrase_${Date.now()}_${idx}`,
    time,
    text: isAr ? `مقطع صوتي #${idx + 1}` : `Audioabschnitt #${idx + 1}`,
  }));
}
