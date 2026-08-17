// Central Logger for Debug Console
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  category?: string;
  details?: string;
}

type LogListener = (entry: LogEntry) => void;

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private listeners: Set<LogListener> = new Set();
  private isIntercepting = false;

  constructor() {
    this.init();
  }

  private init() {
    // Restore from localStorage safely if available (last 200 logs to prevent lag, or just keep in memory)
    try {
      const saved = localStorage.getItem('app_debug_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.logs = parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));
        }
      }
    } catch (e) {
      // Fallback
    }

    this.interceptConsole();
    this.info('System', 'DebugLogger initialized');
  }

  private persist() {
    try {
      // Limit persistence to last 200 logs to keep localStorage small
      const toSave = this.logs.slice(-200);
      localStorage.setItem('app_debug_logs', JSON.stringify(toSave));
    } catch (e) {
      // Ignore storage errors
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public addLog(level: LogLevel, category: string, message: string, details?: any) {
    let detailsStr = '';
    if (details !== undefined) {
      if (typeof details === 'string') {
        detailsStr = details;
      } else {
        try {
          detailsStr = JSON.stringify(details, null, 2);
        } catch (e) {
          detailsStr = String(details);
        }
      }
    }

    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      message,
      category,
      details: detailsStr || undefined,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.persist();

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (e) {
        // Prevent listener crashes
      }
    });
  }

  public debug(category: string, message: string, details?: any) {
    this.addLog('DEBUG', category, message, details);
  }

  public info(category: string, message: string, details?: any) {
    this.addLog('INFO', category, message, details);
  }

  public warn(category: string, message: string, details?: any) {
    this.addLog('WARN', category, message, details);
  }

  public error(category: string, message: string, details?: any) {
    this.addLog('ERROR', category, message, details);
  }

  public clear() {
    this.logs = [];
    try {
      localStorage.removeItem('app_debug_logs');
    } catch (e) {}
    this.info('System', 'Schnittstelle gelöscht / Log database cleared');
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private interceptConsole() {
    if (this.isIntercepting) return;
    this.isIntercepting = true;

    const originalConsoleLog = window.console.log;
    const originalConsoleWarn = window.console.warn;
    const originalConsoleError = window.console.error;

    // Hook console.log
    window.console.log = (...args: any[]) => {
      originalConsoleLog.apply(window.console, args);
      this.handleConsoleCall('INFO', args);
    };

    // Hook console.warn
    window.console.warn = (...args: any[]) => {
      originalConsoleWarn.apply(window.console, args);
      this.handleConsoleCall('WARN', args);
    };

    // Hook console.error
    window.console.error = (...args: any[]) => {
      originalConsoleError.apply(window.console, args);
      this.handleConsoleCall('ERROR', args);
    };

    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      this.addLog(
        'ERROR',
        'UncaughtException',
        event.message || 'JavaScript error occurred',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error ? event.error.stack : undefined,
        }
      );
    });

    // Handle uncaught promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.addLog(
        'ERROR',
        'UnhandledPromiseRejection',
        `Unhandled promise rejection: ${event.reason?.message || event.reason}`,
        event.reason?.stack || event.reason
      );
    });
  }

  private handleConsoleCall(level: LogLevel, args: any[]) {
    try {
      if (args.length === 0) return;

      const firstArg = args[0];
      let category = 'Console';
      let message = '';
      let detailsArgs = args.slice(1);

      // Check if first argument is a bracketed category, e.g., "[DEBUG_AUDIO]"
      if (typeof firstArg === 'string') {
        const match = firstArg.match(/^\[(.*?)\]/);
        if (match) {
          category = match[1];
          message = firstArg.substring(match[0].length).trim();
          if (!message && detailsArgs.length > 0) {
            const nextArg = detailsArgs[0];
            message = typeof nextArg === 'string' ? nextArg : JSON.stringify(nextArg);
            detailsArgs = detailsArgs.slice(1);
          }
        } else {
          message = firstArg;
        }
      } else {
        message = typeof firstArg === 'object' ? JSON.stringify(firstArg) : String(firstArg);
      }

      // Format remaining details
      let details: any = undefined;
      if (detailsArgs.length > 0) {
        details = detailsArgs.length === 1 ? detailsArgs[0] : detailsArgs;
      }

      // Avoid infinite logging recursion
      if (category === 'System' && message.includes('DebugLogger initialized')) {
        return;
      }

      this.addLog(level, category, message, details);
    } catch (e) {
      // Avoid crash on logging
    }
  }
}

export const appLogger = new DebugLogger();
