# 🚀 Quick Start Guide - Desktop Sentinel

Get the Sentry Bot running locally in minutes!

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** 9+ (included with Node.js)
- **Windows 10/11**
- **USB Webcam** (or integrated camera)

## Installation (5 minutes)

### 1. Install Dependencies
```bash
cd c:\Users\rajiv\sentry-bot
npm install
```

### 2. Build Electron Files
```bash
npx tsc --project tsconfig.electron.json
```

## Running Development Mode (2 terminals)

### Terminal 1: Start Angular Dev Server
```bash
npm run start:ng
```
- Waits for `http://localhost:4200` to be ready
- Auto-reloads on code changes
- Leave this running

### Terminal 2: Launch Electron App
```bash
npx electron .
```
- Opens the desktop app with DevTools
- Connects to Angular dev server
- Shows live camera feed and detection UI

## Quick Feature Test (3 minutes)

### 1. Allow Camera Access
- Click "Allow" when Windows prompts for camera permission
- Live video should appear in the app

### 2. Start Detection
- Wait for "✓ COCO-SSD Model Ready" (first run takes ~10-15 seconds to download model)
- Click **"Start Detection"** button
- Point camera at a person or object
- Watch bounding boxes appear in real-time

### 3. View Arrival Logs
- Click **"Recent Arrivals"** tab at bottom
- Any logged detections appear here with timestamps
- Click **"Statistics"** to see pattern analysis

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── camera-feed/           # Live camera display
│   │   ├── detection-viewer/      # AI detection visualization
│   │   └── arrival-log-viewer/    # Arrival history & stats
│   ├── services/
│   │   ├── camera.service.ts      # WebRTC camera access
│   │   ├── detection.service.ts   # TensorFlow.js + COCO-SSD
│   │   ├── database.service.ts    # Data persistence
│   │   └── arrival-log.service.ts # Arrival logging & stats
│   └── models/                     # TypeScript interfaces
├── electron/
│   ├── main.ts                     # Electron main process
│   └── preload.ts                  # IPC bridge (setup)
└── assets/
```

## Key Endpoints During Dev

| Component | URL | Purpose |
|-----------|-----|---------|
| Angular App | `http://localhost:4200` | Live UI dev server |
| Electron DevTools | Built-in | Debug renderer process |
| Node/Main Process | Logs in terminal | Debug main process |

## Common Issues & Fixes

### ❌ "Port 4200 already in use"
```bash
# Kill existing Node process
Get-Process node | Stop-Process -Force
```

### ❌ Camera shows black/no feed
1. Check Windows camera permissions: Settings → Privacy → Camera
2. Make sure camera isn't in use by another app (Teams, Zoom, etc.)
3. Try switching cameras using the dropdown

### ❌ "COCO-SSD Model failed to load"
- First run requires internet to download ~52MB model
- Model is cached in browser afterwards
- Check browser console (DevTools) for details

### ❌ Detections not appearing
1. Ensure good lighting on object/person
2. Lower confidence threshold in settings
3. Check browser console for errors

## Development Commands

```bash
# Watch and rebuild on changes
npm run watch

# Run unit tests
npm test

# Build for production
npm run build

# Package for Windows distribution (later phases)
npm run dist
```

## Next Steps

- 📖 Read full [README.md](README.md) for architecture details
- 🐛 Check browser DevTools (F12 in Electron) for logs
- 📝 Add features in `src/app/` (standalone components)
- 🔧 Modify detection settings in `services/detection.service.ts`

## Current Status

✅ Phase 2: AI Detection & Logging (COMPLETE)
- TensorFlow.js person detection
- Real-time arrival logging
- Statistics & pattern visualization

✅ Phase 3: Pattern Learning & Prediction (COMPLETE)
- Statistical analysis of arrival times
- Routine prediction with confidence scores
- Day-of-week specific patterns
- Nightly analysis job (runs at 2 AM)
- UI visualization in "Routine Analysis" tab

🚀 Next: Phase 4 will add arrival time predictions and greeting triggers

---

**Need help?** Check the troubleshooting section in README.md or look at browser DevTools console.
