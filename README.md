# Trainingsplan · جدول التمارين

A personal, offline-first workout tracker: weekly training plans, an exercise library with Arabic and German names, demonstration media stored locally on the device, a guided workout mode with rest timer and haptics, and a folder-based audio player. Packaged as an Android app with Capacitor.

## Features

- Weekly schedule of training and rest days
- Exercise library with bilingual (Arabic/German) names
- Demo images and videos stored locally (IndexedDB)
- Step-by-step workout session with rest timer and vibration
- Custom audio player organized by folders
- Plan export and import

## Tech Stack

- React 19 + TypeScript + Vite + Tailwind CSS
- Local-only persistence (no backend, no accounts)
- Capacitor 8 for the Android build
- GitHub Actions workflow that builds a debug APK on every push

## Status

Personal project, under active development. Not published yet.

## Development

```bash
npm install
npm run dev
```

## Android build

The APK build runs automatically via `.github/workflows/build-apk.yml` on every push. The native audio playback service lives in `android/app/src/main/java/com/fitness/trainingapp/audio/`.
