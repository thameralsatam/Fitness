import { LyricLine } from '../types';

/**
 * Speech Recognition Interface for Web and WebView (Android Chrome/Capacitor WebView)
 */
interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class LocalSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback: ((line: LyricLine) => void) | null = null;
  private onStatusChangeCallback: ((status: 'idle' | 'listening' | 'error', message?: string) => void) | null = null;
  private currentLanguage: string = 'ar-SA';
  private startTime: number = 0;

  constructor() {
    const win = window as unknown as IWindowWithSpeech;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      try {
        this.recognition = new SpeechRecognitionAPI();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event: any) => {
          const resultsLength = event.results.length;
          const latestResult = event.results[resultsLength - 1];
          if (latestResult && latestResult.isFinal) {
            const transcript = latestResult[0].transcript.trim();
            if (transcript && this.onResultCallback) {
              const elapsedSeconds = parseFloat(((Date.now() - this.startTime) / 1000).toFixed(2));
              this.onResultCallback({
                id: `speech_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                time: elapsedSeconds,
                text: transcript,
              });
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('Local speech recognition event:', event.error);
          if (event.error === 'not-allowed') {
            this.onStatusChangeCallback?.('error', 'يرجى السماح بالوصول للمايكروفون للتعرف الصوتي المباشر');
          } else if (event.error !== 'no-speech') {
            this.onStatusChangeCallback?.('error', event.error);
          }
        };

        this.recognition.onend = () => {
          if (this.isListening) {
            // Auto restart if still marked as listening
            try {
              this.recognition.start();
            } catch (e) {
              this.isListening = false;
              this.onStatusChangeCallback?.('idle');
            }
          } else {
            this.onStatusChangeCallback?.('idle');
          }
        };
      } catch (e) {
        console.warn('Failed to init SpeechRecognition:', e);
      }
    }
  }

  public isSupported(): boolean {
    return Boolean(this.recognition);
  }

  public setLanguage(lang: 'ar' | 'de') {
    this.currentLanguage = lang === 'ar' ? 'ar-SA' : 'de-DE';
    if (this.recognition) {
      this.recognition.lang = this.currentLanguage;
    }
  }

  public start(
    playbackStartTime: number,
    onResult: (line: LyricLine) => void,
    onStatus: (status: 'idle' | 'listening' | 'error', message?: string) => void
  ) {
    if (!this.recognition) {
      onStatus('error', 'خاصية التعرف الصوتي غير مدعومة على هذا المتصفح');
      return;
    }

    try {
      this.onResultCallback = onResult;
      this.onStatusChangeCallback = onStatus;
      this.recognition.lang = this.currentLanguage;
      this.startTime = Date.now() - playbackStartTime * 1000;
      this.isListening = true;
      this.recognition.start();
      onStatus('listening');
    } catch (e: any) {
      // If already started
      if (e?.name === 'InvalidStateError') {
        this.isListening = true;
        onStatus('listening');
      } else {
        console.error('Speech recognition start error:', e);
        onStatus('error', 'تعذر بدء الاستماع الصوتي');
      }
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.onStatusChangeCallback?.('idle');
  }
}

export const localSpeechEngine = new LocalSpeechRecognizer();
