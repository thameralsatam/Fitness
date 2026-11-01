# Cleanup & Fix Instructions for Gemini — Project "Trainingsplan" (repo: Fitness)

You are applying a fixed list of edits. This is NOT a creative task.

## Global rules (read first)
1. Do ONLY what is listed. No refactoring, renaming, reformatting, "improvements", or extra files unless a task says so.
2. Do NOT touch `public/icon-512.png`, `vite.config.ts`, `server.ts`, `.env.example`, `metadata.json`.
3. Execute tasks in the order given. After EACH task run `npm run lint` (= `tsc --noEmit`). If a task introduces NEW errors, undo that task and report it. Do not continue silently.
4. Every deletion marked **[VERIFY]** requires the given `grep` first. If the grep shows a reference outside the listed allowed places, SKIP that deletion and report it.
5. Keep all UI strings exactly as given (Arabic/German).
6. At the end print: (a) list of changed/created/deleted files, (b) tasks skipped and why, (c) output of `npm run lint` and `npx vite build`.

## Task 0 — Baseline
- Run `npm install`, then `npm run lint` and `npx vite build`.
- Save the lint output as the "before" list. Do not fix pre-existing errors except those named in the tasks below.

---
# PART A — Safe cleanup (dead code, unused imports)

## A1. package.json
- Remove `"@types/jszip"` from dependencies/devDependencies (jszip ships its own types).
- Remove `"autoprefixer"` (Tailwind 4 via `@tailwindcss/vite` does not need it). **[VERIFY]** `ls postcss.config.*` returns nothing.
- `vite` is listed twice. Keep it in `dependencies` and remove it from `devDependencies`.
- Run `npm install` to refresh `package-lock.json`.

## A2. .github/workflows/build-apk.yml
- In the step that builds the web app, replace `npm run build` with `npx vite build`. (The current command also bundles `server.ts` into `dist`, which is not needed for the APK.)
- Change nothing else in this file.

## A3. index.html
- Delete these `<meta>` tags if present: `full-screen`, `browsermode`, `x5-fullscreen`, `360-fullscreen`.
- Change `<link rel="apple-touch-icon" href="/favicon.svg" ...>` so that `href="/apple-touch-icon.png"` (file exists in `public/`). Keep other attributes.

## A4. capacitor.config.ts
- Delete the line `allowMixedContent: true,` inside `android`.

## A5. Unused imports (remove ONLY the listed names, keep the rest of each import)
- `src/components/ActiveWorkoutModal.tsx`: from lucide-react remove `RotateCcw`, `ChevronRight`, `ChevronLeft`, `Layers`.
- `src/components/AddExerciseModal.tsx`: remove `Sparkles`.
- `src/components/ExerciseMediaUploader.tsx`: remove `Plus`.
- `src/components/MediaViewerModal.tsx`: remove `Maximize2`.
- `src/components/DayScheduleModal.tsx`: remove `RefreshCw`.
- `src/components/AudioPlayerSection.tsx`:
  - react import: remove `useMemo`.
  - lucide-react: remove `Sparkles`, `FileText`, `AlertTriangle`.
  - `../utils/audioDb` import: remove `getAllTracks`, `getAudioFolders`.
  - In the `useAudio()` destructuring remove `playTrackAtIndex`.
  - Delete the unused variable `const addedTracks: AudioTrack[] = [];` and the line `addedTracks.push(newTrack);`.
- `src/App.tsx`: remove `getScheduleSubtitle` from the `./utils/scheduleManager` import.
- After each file, if lint reports another name in that import as unused, remove it too, and list it in your report.

## A6. Dead props chain (App → PlanView → WorkoutWidgets)
These props are passed but never used.
- `src/App.tsx`:
  - Delete the state `openPanels` / `setOpenPanels` and the function `handleTogglePanel`.
  - Delete every call `setOpenPanels(...)`.
  - In the `<PlanView ... />` JSX delete the props: `openPanels`, `onTogglePanel`, `onResetToday`, `onNavigateTab`, `totalSessions`, `onRemoveExercise`.
- `src/components/PlanView.tsx`:
  - Delete the same six props from the props interface and from the destructuring.
  - Delete `const t = I18N[currentLang];` and the `I18N` import if nothing else uses them. **[VERIFY]** `grep -n "\bt\." src/components/PlanView.tsx` shows no use of `t`.
  - Remove `ViewTab` from the `../types` import if no longer used.
  - Replace the WorkoutWidgets block so it reads exactly:
    ```tsx
    {exercises.length > 0 && (
      <WorkoutWidgets
        currentLang={currentLang}
        completedCount={completedCount}
        totalExercises={exercises.length}
        onStartActiveWorkout={onStartActiveWorkout}
      />
    )}
    ```
    (This also removes the fake hard-coded streak `currentStreak={Math.max(1, completedCount > 0 ? 3 : 1)}`.)
- `src/components/WorkoutWidgets.tsx`: delete the props `currentStreak`, `totalSessions`, `onNavigateTab` from the interface/destructuring and remove the `ViewTab` import if unused.
- `src/App.tsx`, `<ProfileView />`: delete the props `totalSessions`, `completedExercisesCount`, `plan`.
- `src/components/ProfileView.tsx`: delete the same three props from the interface, and change the types import to `import { Language } from '../types';` (if `WorkoutPlan` is no longer used).

## A7. TypeScript errors in App.tsx (non-existent I18N keys)
In `handleRequestResetProgress` replace
- `t.modalResetTitle || t.confirmResetTitle` → `t.confirmResetTitle`
- `t.modalResetDesc || t.confirmResetDesc` → `t.confirmResetDesc`
- `t.confirmReset || t.confirmBtn` → `t.confirmBtn`
- `t.cancel || t.cancelBtn` → `t.cancelBtn`
(Those four keys exist in `I18N`; the left-hand ones do not.)

## A8. Dead functions — all **[VERIFY]**
For each name run `grep -rn "<name>" src`. Delete the function only if every match is its own definition (or `export` line).
- `src/data/workoutData.ts`: `getEx` (helper that is never called).
- `src/utils/scheduleManager.ts`: `swapExerciseOnDay`, `setTrainingDays`, `getScheduleSubtitle`, then `getActiveTrainingDays` (check this last one again after the other deletions).
- `src/utils/planShare.ts`: `exportPlanAsFile`, `exportPlanAsJsonString`, `parsePlanJson`. Keep `prepareExportablePlan`, `parseAndHydratePlanJson`, `exportPlanAsZipFile`, `exportPlanAsZipPackage`, `sharePlanNative`, `parseAndHydrateZipOrJsonFile`. Afterwards remove imports that became unused.
- `src/data/workoutData.ts`: `MUSCLE_DIST_DATA`, `getPlanMuscleDistribution`, `getPlanRepRangeSummary`, and in `src/types.ts` the interface `MuscleVolume` — delete all four only if the grep shows no use outside `workoutData.ts` / `types.ts`.

## A9. AudioContext cleanup (`src/context/AudioContext.tsx`)
- Delete every line that starts with `console.log('[DEBUG_AUDIO]` (all are single-line statements). Keep `console.error` lines.
- Delete the state `const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);` and both calls `setActiveAudioUrl(...)`. **[VERIFY]** `grep -rn "activeAudioUrl" src` shows only those.

## A10. I18N unused keys (`src/data/workoutData.ts`) — mechanical
For every key in `I18N.de` and `I18N.ar`, run `grep -rn "\.<key>\b" src --include=*.ts --include=*.tsx` (exclude the definition file). Delete a key from BOTH languages only if it has zero uses. Candidates (the app only has the tabs plan/audio/timer/profile): `menuLang, menuCopy, menuAllAlts, menuReset, menuPrint, toastCopied, toastReset, altShow, altHide, altHeader, navTools, navStats, navGoals, toolsTitle, toolsDesc, plateCalc*, oneRm*, nutrition*, ambient*, stats*, goals*, goalInputPlaceholder, goalAddBtn, confirmDeleteGoal*`. Must keep any key still used (e.g. `navPlan`, `navAudio`, `navProfile`, `confirmResetTitle`, `confirmResetDesc`, `confirmBtn`, `cancelBtn`). Report the list of deleted keys.

---
# PART B — Real bug fixes

## B1. Language switch + factory reset in Settings (they are missing)
`ProfileView` receives `onSelectLang` but never uses it, so the language cannot be changed; `handleFactoryReset` in App is never called.

**src/components/ProfileView.tsx**
1. Props interface: make `onSelectLang: (lang: Language) => void;` required and add `onFactoryReset?: () => void;`. Add both to the destructuring.
2. Import `Globe` and `Trash2` from `lucide-react` (add to the existing import).
3. Inside the FIRST settings card (the one that contains the Typography/font button), insert as its first child:
```tsx
<div className="p-4 flex items-center justify-between gap-3 border-b border-[#f2f6f3]">
  <div className="flex items-center gap-3 min-w-0">
    <div className="w-9 h-9 rounded-2xl bg-[#edf4ef] text-[#215641] flex items-center justify-center flex-shrink-0">
      <Globe className="w-4 h-4" />
    </div>
    <div className="text-xs sm:text-sm font-bold text-[#15221b] truncate">
      {isDe ? 'Sprache' : 'اللغة'}
    </div>
  </div>
  <div className="flex p-1 bg-[#f1f6f3] rounded-xl flex-shrink-0">
    {(['ar', 'de'] as Language[]).map((l) => (
      <button
        key={l}
        type="button"
        onClick={() => { triggerHaptic('selection'); onSelectLang(l); }}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          currentLang === l ? 'bg-white text-[#15241c] shadow-2xs' : 'text-[#6e8276]'
        }`}
      >
        {l === 'ar' ? 'العربية' : 'Deutsch'}
      </button>
    ))}
  </div>
</div>
```
4. In the SECOND card (the one with "Reset today's progress"), directly after that button's closing `</button>`, insert:
```tsx
{onFactoryReset && (
  <button
    type="button"
    onClick={() => { triggerHaptic('warning'); onFactoryReset(); }}
    className="w-full p-4 flex items-center gap-3 text-start hover:bg-[#fdf9f9] active:bg-[#fae8e8] transition-colors cursor-pointer"
  >
    <div className="w-9 h-9 rounded-2xl bg-[#fdf2f2] text-[#c53030] flex items-center justify-center flex-shrink-0">
      <Trash2 className="w-4 h-4" />
    </div>
    <div>
      <div className="text-xs sm:text-sm font-bold text-[#c53030]">
        {isDe ? 'App zurücksetzen' : 'إعادة ضبط التطبيق بالكامل'}
      </div>
      <div className="text-[11px] text-[#a85858]">
        {isDe ? 'Alle lokalen Daten, Medien und Audios löschen' : 'حذف كل البيانات المحلية والوسائط والصوتيات'}
      </div>
    </div>
  </button>
)}
```
Make sure `triggerHaptic` and `isDe` already exist in the file (they do); if not, report.

**src/App.tsx**: in `<ProfileView />` add `onSelectLang={handleLanguageChange}` and `onFactoryReset={handleFactoryReset}`. In `handleFactoryReset` replace the word "للموقع" with "للتطبيق" and "الموقع" with "التطبيق" in its title/description texts.

## B2. `hardResetApp` must also wipe IndexedDB and native audio cache (`src/utils/libraryManager.ts`)
Replace the body of `hardResetApp` with:
```ts
export async function hardResetApp(): Promise<void> {
  try {
    const idb: any = indexedDB;
    const dbs: Array<{ name?: string }> = (await idb.databases?.()) ?? [];
    await Promise.all(
      dbs.map(
        (d) =>
          new Promise<void>((resolve) => {
            if (!d?.name) return resolve();
            const req = indexedDB.deleteDatabase(d.name);
            req.onsuccess = req.onerror = req.onblocked = () => resolve();
          })
      )
    );
  } catch { /* ignore */ }
  try {
    const { isNativeAudioAvailable, NativeAudioPlayer } = await import('./nativeAudioBridge');
    if (isNativeAudioAvailable()) {
      await NativeAudioPlayer.stop().catch(() => {});
      await (NativeAudioPlayer as any).clearCache?.().catch(() => {});
    }
  } catch { /* ignore */ }
  try { localStorage.clear(); sessionStorage.clear(); } catch { /* ignore */ }
  window.location.reload();
}
```
Keep the existing export name and signature usage (`hardResetApp()` call sites stay valid).

## B3. "Completed" ticks must reset every day
Create `src/utils/progressStorage.ts`:
```ts
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
```
In `src/App.tsx`:
- `import { loadCompletedToday, saveCompletedToday, clearCompletedToday } from './utils/progressStorage';`
- Initial state: `const [completedExercises, setCompletedExercises] = useState<Set<number>>(() => loadCompletedToday());`
- In `handleToggleExercise` and in `handleFinishActiveWorkout`: replace the whole `try { localStorage.setItem('gym_completed', ...) } catch {...}` block with `saveCompletedToday(next);` (the Set variable in both places is named `next`; if named otherwise, use that name).
- In `handleRequestResetProgress` (inside `onConfirm`) and in `handleClearAllExercisesFromPlan`: replace any `localStorage.removeItem('gym_completed')` block with `clearCompletedToday();`, and make sure `handleClearAllExercisesFromPlan` also calls it.
- Add this effect once in `App`:
```tsx
useEffect(() => {
  const onVisible = () => {
    if (document.visibilityState === 'visible') setCompletedExercises(loadCompletedToday());
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => document.removeEventListener('visibilitychange', onVisible);
}, []);
```

## B4. Muscle label bug (Edit modal overwrites both languages with the same text)
Create `src/data/muscles.ts`:
```ts
export const COMMON_MUSCLES = [
  { ar: 'صدر', de: 'Brust' },
  { ar: 'ظهر', de: 'Rücken' },
  { ar: 'أكتاف', de: 'Schultern' },
  { ar: 'بايسبس', de: 'Bizeps' },
  { ar: 'ترايسبس', de: 'Trizeps' },
  { ar: 'أرجل', de: 'Beine' },
  { ar: 'بطن', de: 'Bauch' },
  { ar: 'ساعد', de: 'Unterarme' },
  { ar: 'أسفل الظهر', de: 'Unterer Rücken' },
  { ar: 'كامل الجسم', de: 'Ganzkörper' },
] as const;

export function resolveMuscle(
  input: string,
  isAr: boolean,
  fallback: { muscleAr: string; muscleDe: string }
): { muscleAr: string; muscleDe: string } {
  const v = input.trim();
  const preset = COMMON_MUSCLES.find((m) => m.ar === v || m.de === v);
  if (preset) return { muscleAr: preset.ar, muscleDe: preset.de };
  if (!v) return { muscleAr: fallback.muscleAr, muscleDe: fallback.muscleDe };
  return isAr
    ? { muscleAr: v, muscleDe: fallback.muscleDe }
    : { muscleAr: fallback.muscleAr, muscleDe: v };
}
```
Before creating it, open the existing `COMMON_MUSCLES` constants inside `AddExerciseModal.tsx` and `ExerciseEditModal.tsx`; if their Arabic entries differ from the list above, use the union of both lists (Arabic exactly as in the files) and give each entry a correct German translation.

**src/components/ExerciseEditModal.tsx**
- Delete the local `COMMON_MUSCLES`; `import { COMMON_MUSCLES, resolveMuscle } from '../data/muscles';`
- The chips render `isAr ? m.ar : m.de` and on click call `setMuscle(isAr ? m.ar : m.de)`.
- In EVERY `onSaveExercise({...})` call replace the two lines `muscleAr: muscle.trim() || exercise.muscleAr,` and `muscleDe: muscle.trim() || exercise.muscleDe,` with `...resolveMuscle(muscle, isAr, { muscleAr: exercise.muscleAr, muscleDe: exercise.muscleDe }),`.
- Replace hard-coded Arabic placeholders `placeholder="اسم التمرين"` → `placeholder={isAr ? 'اسم التمرين' : 'Name der Übung'}` and `placeholder="العضلة المستهدفة"` → `placeholder={isAr ? 'العضلة المستهدفة' : 'Zielmuskel'}`.

**src/components/AddExerciseModal.tsx**
- Delete the local `COMMON_MUSCLES`; import from `../data/muscles`; render labels by language as above.
- Where the new exercise object is built, replace its `muscleAr`/`muscleDe` fields with `...resolveMuscle(muscle, isAr, { muscleAr: 'عام', muscleDe: 'Allgemein' }),`.

## B5. Orphaned media (IndexedDB) cleanup
1. `src/utils/mediaStorage.ts` — add at the end:
```ts
export async function pruneOrphanMedia(referencedExerciseIds: Set<number>): Promise<number> {
  try {
    const map = await getAllExerciseMediaRecordsMap();
    let removed = 0;
    for (const [idStr, records] of Object.entries(map)) {
      if (referencedExerciseIds.has(Number(idStr))) continue;
      for (const rec of records) {
        await deleteExerciseMediaItem(rec.id);
        removed++;
      }
    }
    return removed;
  } catch {
    return 0;
  }
}
```
2. `src/utils/scheduleManager.ts` — add (import `WorkoutPlan` if not imported):
```ts
export function collectPlanExerciseIds(plan: WorkoutPlan): Set<number> {
  const ids = new Set<number>();
  (plan.exercises || []).forEach((e) => ids.add(e.id));
  Object.values(plan.days || {}).forEach((d) => (d?.exercises || []).forEach((e) => ids.add(e.id)));
  return ids;
}
```
3. `src/App.tsx` — `import { pruneOrphanMedia } from './utils/mediaStorage';` and add `collectPlanExerciseIds` to the scheduleManager import. Call `pruneOrphanMedia(collectPlanExerciseIds(<the plan that was just saved>));` (fire-and-forget, no await) right after `saveActivePlan(...)` in: `handleRemoveExerciseFromPlan`, `handleClearAllExercisesFromPlan`, `handleUpdatePlan`. Also call it once at startup inside an effect with `[]` deps using the initial `activePlan`.
4. `<DayScheduleModal ... onUpdatePlan={...} />`: replace the inline `(updated) => { setActivePlan(updated); saveActivePlan(updated); }` with `onUpdatePlan={handleUpdatePlan}` (so pruning also runs there). Check `handleUpdatePlan` does `setActivePlan` + `saveActivePlan` + prune; if it does something else, report instead of changing.
5. `src/components/AddExerciseModal.tsx` — when the modal is closed without saving, delete media uploaded under its temporary id. Add `useRef` to the react import, then (after the existing hooks, BEFORE the `if (!isOpen) return null;` line):
```tsx
const submittedRef = useRef(false);
useEffect(() => {
  return () => {
    if (!submittedRef.current) {
      clearAllMediaForExercise(tempId);
    }
  };
}, []);
```
   Import `clearAllMediaForExercise` from `../utils/mediaStorage`. Set `submittedRef.current = true;` at the start of the submit handler, right before `onAddExercise(...)` is called.

## B6. Mini audio bar shows no track name (`src/components/ModernAudioMiniBar.tsx`)
`AudioTrack` has `name`, not `title`/`artist`. **[VERIFY]** open `src/utils/audioDb.ts` and confirm the `AudioTrack` interface has no `title`/`artist`.
- `currentTrack.title || (isAr ? 'ملف صوتي' : 'Audiodatei')` → `currentTrack.name || (isAr ? 'ملف صوتي' : 'Audiodatei')`
- `currentTrack.artist || (isAr ? 'مشغل الصوتيات' : 'Audioplayer')` → `(isAr ? 'مشغل الصوتيات' : 'Audioplayer')`

## B7. One body-scroll-lock for all modals (nested modals unlock the page too early)
- `src/utils/modalManager.ts`: at the end of `notifyModalChange` (after the counter update) add
  `document.body.style.overflow = activeModalsCount > 0 ? 'hidden' : '';`
- Run `grep -rn "document.body.style.overflow" src`. In every file found, delete those lines (both the `'hidden'` and the `'unset'` ones). Only do this in files that also call `notifyModalChange`. For a file that does NOT call `notifyModalChange` (list them in your report), leave it unchanged.
- `src/components/DayScheduleModal.tsx` never calls `notifyModalChange`. Add (before `if (!isOpen) return null;`):
```tsx
useEffect(() => {
  if (!isOpen) return;
  notifyModalChange(true);
  return () => notifyModalChange(false);
}, [isOpen]);
```
  with `useEffect` added to the react import and `import { notifyModalChange } from '../utils/modalManager';`.

## B8. Splash screen is forced to 5 seconds (`src/components/SplashScreen.tsx`)
- Change `}, 5000); // 5s calm smooth presentation` to `}, 1200);`.

## B9. Duplicate notification-permission prompt
`MainActivity.java` asks for POST_NOTIFICATIONS and `TimerContext.tsx` asks again via Capacitor.
- `android/app/src/main/java/com/fitness/trainingapp/MainActivity.java`: remove the call to `checkAndRequestNotificationPermission()` in `onCreate`, the method itself, the constant `NOTIFICATION_PERMISSION_CODE`, and imports that become unused (`Manifest`, `PackageManager`, `Build`, `ActivityCompat`). Do NOT change the AndroidManifest permissions.
- Keep the permission request in `src/context/TimerContext.tsx`.

## B10. Rest-timer notification reliability (`src/context/TimerContext.tsx`)
- In the `LocalNotifications.schedule(...)` call: add `allowWhileIdle: true` inside the `schedule: { ... }` object, and delete the line `actionTypeId: 'rest_timer_done',` (no such action type is registered).
- **[VERIFY]** `ls android/app/src/main/res/raw/beep.wav`. If the file does not exist, delete the `sound: 'beep.wav'` property.

## B11. Web-fallback audio restarts when the track list changes (`src/context/AudioContext.tsx`)
In the `useEffect` that creates the object URL for `currentTrack`, change the dependency array from `[currentTrackIndex, tracks, isNative]` to `[currentTrack?.id, isNative]`.

---
# PART C — DO NOT EXECUTE (waiting for the owner's decision)
- C1. Timer tab: `TimerView` is unreachable (no button in `MobileBottomNav`). Options: add a 4th nav item, or delete `TimerView.tsx` and the `'timer'` branch in App.
- C2. `EXERCISES_DATA` (103 machines) and the 6 library functions in `libraryManager.ts` are unused: delete, or build an "add from library" picker.
- C3. `ActiveWorkoutModal` keeps its own rest timer in parallel to `TimerContext` — merge into one source.
- C4. Split `AudioPlayerSection.tsx` (96 KB, 11 inline modals) into components.
- C5. Release build: signing, `minifyEnabled true`, AAB.
- C6. Audio storage: move from IndexedDB + base64 copy to Capacitor Filesystem + file URIs for the native player.
- C7. Statistics screen using the stored sessions counter.

When finished, reply with the report described in "Global rules" item 6.
