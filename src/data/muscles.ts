export const COMMON_MUSCLES = [
  { ar: 'عضلات الصدر', de: 'Brust' },
  { ar: 'عضلات الظهر', de: 'Rücken' },
  { ar: 'الأكتاف', de: 'Schultern' },
  { ar: 'الأرجل والأرداف', de: 'Beine & Gesäß' },
  { ar: 'البايسبس', de: 'Arme (Bizeps)' },
  { ar: 'الترايسبس', de: 'Arme (Trizeps)' },
  { ar: 'عضلات البطن', de: 'Bauch' },
  { ar: 'عضلات الساق (السمانة)', de: 'Waden' },
  { ar: 'ساعد', de: 'Unterarme' },
  { ar: 'أسفل الظهر', de: 'Unterer Rücken' },
  { ar: 'كامل الجسم', de: 'Ganzkörper' },
] as const;

const ALIASES: Record<string, { ar: string; de: string }> = {
  'صدر': { ar: 'عضلات الصدر', de: 'Brust' },
  'ظهر': { ar: 'عضلات الظهر', de: 'Rücken' },
  'أكتاف': { ar: 'الأكتاف', de: 'Schultern' },
  'أرجل': { ar: 'الأرجل والأرداف', de: 'Beine & Gesäß' },
  'بايسبس': { ar: 'البايسبس', de: 'Arme (Bizeps)' },
  'ترايسبس': { ar: 'الترايسبس', de: 'Arme (Trizeps)' },
  'بطن': { ar: 'عضلات البطن', de: 'Bauch' },
  'سمانة': { ar: 'عضلات الساق (السمانة)', de: 'Waden' },
  'Beine': { ar: 'الأرجل والأرداف', de: 'Beine & Gesäß' },
  'Bizeps': { ar: 'البايسبس', de: 'Arme (Bizeps)' },
  'Trizeps': { ar: 'الترايسبس', de: 'Arme (Trizeps)' },
};

export function resolveMuscle(
  input: string,
  isAr: boolean,
  fallback: { muscleAr: string; muscleDe: string }
): { muscleAr: string; muscleDe: string } {
  const v = input.trim();
  const preset = COMMON_MUSCLES.find((m) => m.ar === v || m.de === v);
  if (preset) return { muscleAr: preset.ar, muscleDe: preset.de };
  const alias = ALIASES[v];
  if (alias) return { muscleAr: alias.ar, muscleDe: alias.de };
  if (!v) return { muscleAr: fallback.muscleAr, muscleDe: fallback.muscleDe };
  return isAr
    ? { muscleAr: v, muscleDe: fallback.muscleDe }
    : { muscleAr: fallback.muscleAr, muscleDe: v };
}
