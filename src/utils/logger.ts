// Central lightweight logger without blocking I/O or console hijacking
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

class LightweightLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private listeners: Set<LogListener> = new Set();

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
          detailsStr = JSON.stringify(details);
        } catch {
          detailsStr = String(details);
        }
      }
    }

    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
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

    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch {
        // ignore
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
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const appLogger = new LightweightLogger();
