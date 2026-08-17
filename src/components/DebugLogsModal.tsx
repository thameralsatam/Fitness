import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Copy, Download, Search, AlertCircle, Info, Bug, ShieldAlert } from 'lucide-react';
import { Language } from '../types';
import { appLogger, LogEntry, LogLevel } from '../utils/logger';
import { notifyModalChange } from '../utils/modalManager';

interface DebugLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: Language;
}

export const DebugLogsModal: React.FC<DebugLogsModalProps> = ({
  isOpen,
  onClose,
  currentLang,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const isAr = currentLang === 'ar';

  // Load and subscribe to logs
  useEffect(() => {
    if (isOpen) {
      notifyModalChange(true);
      document.body.style.overflow = 'hidden';
      setLogs(appLogger.getLogs());

      // Subscribe to real-time additions
      const unsubscribe = appLogger.subscribe(() => {
        setLogs(appLogger.getLogs());
      });

      return () => {
        unsubscribe();
        notifyModalChange(false);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new logs arrive (if user hasn't scrolled up, or by default)
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, filterLevel, searchTerm]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleClear = () => {
    appLogger.clear();
    setLogs([]);
  };

  const handleCopy = () => {
    const text = logs
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] [${log.level}] [${log.category || 'System'}] ${log.message}${
            log.details ? `\nDetails: ${log.details}` : ''
          }`
      )
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      alert(isAr ? 'تم نسخ السجل بالكامل!' : 'Log entries copied to clipboard!');
    }).catch(() => {
      alert(isAr ? 'فشل نسخ السجل' : 'Failed to copy logs');
    });
  };

  const handleExport = () => {
    const text = logs
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] [${log.level}] [${log.category || 'System'}] ${log.message}${
            log.details ? `\nDetails: ${log.details}` : ''
          }`
      )
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workout_debug_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesSearch =
      searchTerm.trim() === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.category && log.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-600 bg-red-50 border-red-100';
      case 'WARN':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'INFO':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'DEBUG':
        return 'text-sky-600 bg-sky-50 border-sky-100';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'ERROR':
        return <ShieldAlert className="w-3.5 h-3.5" />;
      case 'WARN':
        return <AlertCircle className="w-3.5 h-3.5" />;
      case 'INFO':
        return <Info className="w-3.5 h-3.5" />;
      case 'DEBUG':
        return <Bug className="w-3.5 h-3.5" />;
      default:
        return <Info className="w-3.5 h-3.5" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
          {/* Bottom Sheet Modal Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-full max-w-2xl mx-auto h-[85vh] bg-white rounded-t-[32px] border-t border-[#dbe4dc] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Grabber indicator */}
            <div className="w-full flex justify-center py-2.5">
              <div className="w-12 h-1.5 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="px-5 pb-4 border-b border-[#eef4f0] flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-lg text-[#15221b]">
                  {isAr ? 'سجل التشخيص الفني' : 'Debug Logs Console'}
                </h3>
                <p className="text-xs text-[#75877d]">
                  {isAr
                    ? 'تفاصيل تشغيل التطبيق والصوت والعمليات الفنية'
                    : 'Real-time client & native audio diagnostic logs'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#75877d] hover:text-[#15221b] hover:bg-[#f1f6f3] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar: Search, Filters & Actions */}
            <div className="p-4 bg-[#f8faf8] border-b border-[#eef4f0] space-y-3">
              {/* Action Buttons row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Levels filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFilterLevel(lvl)}
                      className={`h-7 px-3 rounded-full text-xs font-bold transition-all ${
                        filterLevel === lvl
                          ? 'bg-[#215641] text-white'
                          : 'bg-white border border-[#dbe4dc] text-[#4f6156] hover:bg-[#eef4f0]'
                      }`}
                    >
                      {lvl === 'ALL' ? (isAr ? 'الكل' : 'All') : lvl}
                    </button>
                  ))}
                </div>

                {/* Operations buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="h-8 px-2.5 rounded-xl border border-[#dbe4dc] bg-white hover:bg-[#eef4f0] text-[#4f6156] hover:text-[#15221b] flex items-center gap-1.5 text-xs font-semibold transition-all"
                    title={isAr ? 'نسخ السجل' : 'Copy Logs'}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isAr ? 'نسخ السجل' : 'Copy'}</span>
                  </button>

                  {/* Export Button */}
                  <button
                    type="button"
                    onClick={handleExport}
                    className="h-8 px-2.5 rounded-xl border border-[#dbe4dc] bg-white hover:bg-[#eef4f0] text-[#4f6156] hover:text-[#15221b] flex items-center gap-1.5 text-xs font-semibold transition-all"
                    title={isAr ? 'تصدير وحفظ' : 'Export File'}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isAr ? 'تصدير' : 'Export'}</span>
                  </button>

                  {/* Clear Button */}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-8 px-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 flex items-center gap-1.5 text-xs font-semibold transition-all"
                    title={isAr ? 'مسح السجل' : 'Clear Database'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isAr ? 'مسح السجل' : 'Clear'}</span>
                  </button>
                </div>
              </div>

              {/* Search bar row */}
              <div className="relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-[#75877d]`} />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث في السجل (كلمة، حدث، رمز خطأ)...' : 'Search logs by message, source or details...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full h-10 ${
                    isAr ? 'pr-9 pl-4' : 'pl-9 pr-4'
                  } bg-white border border-[#dbe4dc] rounded-xl text-xs text-[#15221b] placeholder-[#75877d] focus:outline-none focus:border-[#215641] transition-all`}
                />
              </div>
            </div>

            {/* Logs List Container */}
            <div
              ref={logContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f6f8f6] select-text"
            >
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#75877d] space-y-2">
                  <Bug className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                  <p className="text-xs font-medium">
                    {isAr ? 'لا توجد سجلات مطابقة للبحث حالياً' : 'No logs captured yet matching this filter.'}
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <div
                      key={log.id}
                      className="bg-white rounded-xl border border-[#eef4f0] p-2.5 text-[11px] sm:text-xs leading-relaxed space-y-1 transition-all"
                    >
                      {/* Top Row: Meta info */}
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Log level pill */}
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase flex items-center gap-1 ${getLevelColor(
                              log.level
                            )}`}
                          >
                            {getLevelIcon(log.level)}
                            <span>{log.level}</span>
                          </span>

                          {/* Log category/source */}
                          <span className="px-1.5 py-0.5 rounded bg-[#eef4f0] text-[#215641] text-[9px] font-extrabold tracking-tight">
                            {log.category || 'System'}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <span className="text-[9px] text-[#75877d] font-mono">
                          {log.timestamp.toLocaleTimeString()} ({log.timestamp.getMilliseconds()}ms)
                        </span>
                      </div>

                      {/* Middle: Message */}
                      <p className="text-[#15221b] font-mono font-medium break-all whitespace-pre-wrap">
                        {log.message}
                      </p>

                      {/* Details (JSON or stack trace) - Expandable */}
                      {log.details && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="text-[9px] text-[#215641] font-bold hover:underline"
                          >
                            {isExpanded
                              ? (isAr ? 'إخفاء التفاصيل' : 'Hide Details')
                              : (isAr ? 'عرض التفاصيل والـ Payload' : 'Show Payload / Details')}
                          </button>

                          {isExpanded && (
                            <pre className="mt-1.5 p-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-gray-700 font-mono overflow-x-auto whitespace-pre-wrap leading-normal select-text max-h-60">
                              {log.details}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with status count */}
            <div className="px-5 py-3 border-t border-[#eef4f0] bg-white flex items-center justify-between text-[10px] text-[#75877d]">
              <span>
                {isAr
                  ? `عرض ${filteredLogs.length} من أصل ${logs.length} سجل`
                  : `Showing ${filteredLogs.length} of ${logs.length} entries`}
              </span>
              <span className="font-mono">Capacitor v6.0 + Android Media3</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
