const KEY = 'gym_completed';

export const getTodayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function loadCompletedToday(): Set<number> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (parsed && !Array.isArray(parsed) && parsed.date === getTodayKey() && Array.isArray(parsed.ids)) {
      return new Set<number>(parsed.ids);
    }
  } catch { /* ignore */ }
  return new Set();
}

export function saveCompletedToday(ids: Set<number>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ date: getTodayKey(), ids: Array.from(ids) }));
  } catch { /* ignore */ }
}

export function clearCompletedToday(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
