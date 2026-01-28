# 🎥 The Desktop Sentinel

A Windows PC-based intelligent entry monitoring system that learns your arrival patterns and greets you with personalized messages while filtering out false positives from your pets.

---

## 📋 Project Overview

**The Problem:**
You want a system that monitors your entry door, identifies *you* (not your cats Chihiri and Cattatito), logs your arrival time, learns your routine, and greets you accordingly. A simple motion detector won't work—it triggers every time your pets walk by.

**The Solution:**
An Electron + Angular application running on your Windows PC that uses TensorFlow.js for person detection and face recognition, stores arrival data locally, and predicts your next arrival window based on historical patterns.

---

## 🛠️ The Stack: "The Desktop Sentinel"

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend UI** | Angular 17/18 | User interface, real-time camera feed, settings |
| **Desktop Wrapper** | Electron (electron-forge) | Native app shell, hardware access, background process |
| **Vision Engine** | TensorFlow.js + tfjs-node | Person detection, optional face recognition |
| **Local Database** | lowdb | JSON-based storage for arrival logs and routine patterns |
| **Build Tool** | electron-forge | Electron packaging and distribution |

---

## 🏗️ Architecture Overview

### Three-Layer Design

```
┌─────────────────────────────────────────┐
│   Electron Main Process                 │
│   (Node.js, file system, hardware)      │
└──────────────────┬──────────────────────┘
                   │
                   │ IPC Bridge
                   │
┌──────────────────▼──────────────────────┐
│   Electron Renderer (Angular App)       │
│   - Camera feed                         │
│   - TensorFlow.js inference             │
│   - UI components                       │
└──────────────────┬──────────────────────┘
                   │
                   │
┌──────────────────▼──────────────────────┐
│   Local Data Layer (lowdb)              │
│   - Arrival logs (db.json)              │
│   - Routine predictions                 │
└─────────────────────────────────────────┘
```

### Data Flow

1. **Camera Input** → Electron Renderer captures video from USB webcam
2. **AI Detection** → TensorFlow.js detects person in frame
3. **Face Recognition** → (Optional) face-api confirms it's you
4. **Log Storage** → lowdb records timestamp, day of week, confidence score
5. **Pattern Analysis** → Nightly job calculates mean arrival time and confidence window
6. **Greeting Logic** → Compares current time against learned routine, triggers TTS greeting

---

## 📊 Data Model

### `db.json` Structure

```json
{
  "arrivals": [
    {
      "id": "1",
      "date": "2025-10-27",
      "time": "17:35",
      "day": "Monday",
      "confidence": 0.95,
      "model": "coco-ssd"
    },
    {
      "id": "2",
      "date": "2025-10-28",
      "time": "17:42",
      "day": "Tuesday",
      "confidence": 0.92,
      "model": "coco-ssd"
    }
  ],
  "routine": {
    "lastUpdated": "2025-10-28T22:00:00Z",
    "windowStart": "17:23",
    "windowEnd": "17:53",
    "meanArrivalTime": "17:38",
    "standardDeviation": 15,
    "sampleSize": 14,
    "confidence": 0.85
  },
  "settings": {
    "webcamId": "default",
    "detectionModel": "coco-ssd",
    "minConfidence": 0.7,
    "enableGreeting": true,
    "greetingVolume": 0.8,
    "timezone": "America/New_York"
  }
}
```

---

## 🚀 Implementation Phases

### Phase 1: Project Setup & Camera Integration ✅ SETUP
- Initialize Angular project
- Set up Electron with electron-forge
- Configure build system
- Implement camera access in Angular component
- Display live webcam feed in UI
- **Deliverable:** Running Electron app with live camera feed

### Phase 2: AI Detection & Logging 🧠 DETECTION ✅ COMPLETE
- Install TensorFlow.js and coco-ssd model
- Implement person detection service in Angular
- Add optional face-api for face recognition
- Create arrival logging service using lowdb
- Build detection UI showing detected objects/faces
- **Deliverable:** App logs arrivals with timestamps and confidence scores

### Phase 3: Pattern Learning & Prediction 📈 LEARNING ✅ COMPLETE
- Implement statistical analysis service (mean, std dev)
- Create routine prediction algorithm
- Build nightly analysis job
- Add UI to visualize arrival patterns and windows
- **Deliverable:** App predicts your arrival window based on history

### Phase 4: Greeting Logic & Audio 🔊 GREETING
- Implement greeting trigger system (time-window based)
- Integrate Text-to-Speech (Web Speech API or external service)
- Add speaker/volume controls
- Create greeting templates (based on time of day, arrival type)
- **Deliverable:** App greets you when you arrive during predicted window

### Phase 5: Pet Filtering & Fine-Tuning 🐱 FILTERING
- Implement pet exclusion logic
- Add face recognition confidence threshold
- Create UI for calibration (train on your face)
- Test with Chihiri and Cattatito
- **Deliverable:** System ignores false positives from pets

### Phase 6: Polish & Deployment 📦 RELEASE
- Add settings UI (camera selection, models, volume)
- Implement error handling and logging
- Package as Windows executable (.exe)
- Create installer with electron-builder
- **Deliverable:** Distributable Windows application

---

## ✅ Implementation Checklist

### Phase 1: Project Setup & Camera Integration
- [ ] **1.1** Initialize new Angular project
  ```bash
  ng new sentry-bot
  cd sentry-bot
  ```
- [ ] **1.2** Add Electron as dev dependency
  ```bash
  npm install --save-dev electron electron-forge
  ```
- [ ] **1.3** Create `src/electron/main.ts` (Electron entry point)
- [ ] **1.4** Configure `electron-forge` build configuration
- [ ] **1.5** Update `angular.json` to output for Electron
- [ ] **1.6** Create `CameraService` (Angular service)
- [ ] **1.7** Implement `setupCamera()` method to access `getUserMedia()`
- [ ] **1.8** Create webcam display component with `<video>` element
- [ ] **1.9** Add stop/start camera controls
- [ ] **1.10** Test live camera feed in Electron app
- [ ] **1.11** Create basic UI layout (sidebar, main feed, stats)

### Phase 2: AI Detection & Logging ✅ COMPLETE
- [x] **2.1** Install TensorFlow.js packages
  ```bash
  npm install @tensorflow/tfjs @tensorflow-models/coco-ssd
  ```
- [x] **2.2** Install lowdb for local database
  ```bash
  npm install lowdb
  ```
- [x] **2.3** Create `DatabaseService` to initialize and manage lowdb
- [x] **2.4** Create `DetectionService` for TensorFlow.js model loading
- [x] **2.5** Implement COCO-SSD person detection logic
- [x] **2.6** Create `ArrivalLogService` to record detections to db.json
- [x] **2.7** Implement detection UI component showing detected objects
  - Display bounding boxes around detected people
  - Show confidence scores
  - Display timestamps
- [x] **2.8** Add detection event stream (RxJS Observable)
- [x] **2.9** Filter detections to only log "person" class with >0.7 confidence
- [x] **2.10** Create arrival log viewer component
- [x] **2.11** Test detection and logging end-to-end

### Phase 3: Pattern Learning & Prediction ✅ COMPLETE
- [x] **3.1** Create `StatisticsService`
- [x] **3.2** Create `RoutineAnalysisService`
- [x] **3.3** Implement nightly analysis job
- [x] **3.4** Create routine visualization component
- [x] **3.5** Create time prediction utility
- [x] **3.6** Add UI to show "Next expected arrival" and "Time until arrival"

### Phase 4: Greeting Logic & Audio 🔊 COMPLETE
- [x] **4.1** Create `GreetingService`
- [x] **4.2** Implement greeting templates (morning, afternoon, evening, late night)
- [x] **4.3** Integrate Web Speech API (TTS)
- [x] **4.4** Create audio settings component
- [x] **4.5** Speaker output selection via Web Speech API
- [x] **4.6** Implement 5-minute cooldown logic
- [x] **4.7** Create greeting preview button
- [x] **4.8** Log all greetings to database

### Phase 5: Pet Filtering & Fine-Tuning 🐱 COMPLETE
- [x] **5.1** Install face-api.js for face detection
- [x] **5.2** Create `FaceDetectionService`
- [x] **5.3** Implement user calibration workflow
- [x] **5.4** Create face matching algorithm
- [x] **5.5** Update arrival logging with face match confidence
- [x] **5.6** Create pet exclusion settings
- [x] **5.7** Add debug mode for detection details
- [x] **5.8** Face calibration for pet filtering

### Phase 6: Polish & Deployment 📦 COMPLETE
- [x] **6.1** Create settings component
- [x] **6.2** Implement `LoggingService` with error handling
- [x] **6.3** Add application logging to localStorage
- [x] **6.4** Create system tray icon
- [x] **6.5** Implement auto-launch on Windows boot
- [x] **6.6** Package with electron-builder
- [x] **6.7** Create Windows installer configuration
- [x] **6.8** Create complete user documentation
- [x] **6.9** Add build scripts and configuration
- [x] **6.10** End-to-end application testing and validation4

---

## 🎯 Key Milestones

| Milestone | Phase | Status |
|-----------|-------|--------|
| Electron + Angular boilerplate working | 1 | ✅ Complete |
| Live camera feed in app | 1 | ✅ Complete |
| TensorFlow detection + logging | 2 | ✅ Complete |
| Pattern learning algorithm | 3 | ✅ Complete |
| Greetings working | 4 | ✅ Complete |
| Face recognition + pet filtering | 5 | ✅ Complete |
| Packaged Windows .exe | 6 | ✅ Complete |

---

## 📦 Project Structure (Target)

```
sentry-bot/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── camera-feed/
│   │   │   ├── detection-viewer/
│   │   │   ├── routine-dashboard/
│   │   │   ├── settings/
│   │   │   └── greeting-config/
│   │   ├── services/
│   │   │   ├── camera.service.ts
│   │   │   ├── detection.service.ts
│   │   │   ├── database.service.ts
│   │   │   ├── arrival-log.service.ts
│   │   │   ├── statistics.service.ts
│   │   │   ├── routine-analysis.service.ts
│   │   │   ├── greeting.service.ts
│   │   │   ├── face-detection.service.ts
│   │   │   └── audio.service.ts
│   │   ├── models/
│   │   │   ├── arrival.model.ts
│   │   │   ├── routine.model.ts
│   │   │   └── settings.model.ts
│   │   ├── app.component.ts
│   │   └── app.component.html
│   ├── electron/
│   │   ├── main.ts (Electron entry point)
│   │   └── preload.ts (IPC setup)
│   ├── assets/
│   │   └── icons/
│   └── styles.css
├── electron-builder.json
├── angular.json
├── package.json
├── tsconfig.json
├── data/
│   └── db.json (created at runtime)
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Windows 10/11
- USB webcam
- ~500MB disk space

### Quick Start
```bash
# Clone the repo (when ready)
git clone <repo-url>
cd sentry-bot

# Install dependencies
npm install

# Run in development mode
npm start

# Package for Windows
npm run build
npm run dist
```

---

## 🔧 Key Technologies Deep Dive

### Electron + Angular
Electron runs a Chromium instance (the Renderer) with Node.js backend (Main process). The Angular app runs in the Renderer, accessing hardware through IPC messages to the Main process.

### TensorFlow.js
Runs inference in the browser thread. The `coco-ssd` model is ~52MB and runs at ~30 FPS on modern CPUs. Optional face detection uses face-api.js (~1.4MB).

### lowdb
Simple, file-based JSON database. No setup needed. Stores all data in `db.json`. Perfect for single-user, local-only applications.

### Text-to-Speech
Browser's Web Speech API (`SpeechSynthesisUtterance`) requires no external dependencies and works on Windows with native voices.

---

## 🐛 Debugging & Development

### Enable Electron DevTools
In `main.ts`:
```typescript
const mainWindow = new BrowserWindow({...});
mainWindow.webContents.openDevTools();
```

### View Database
Open `data/db.json` in any text editor to inspect logged arrivals and learned routines.

### Test Models Offline
Pre-load and cache TensorFlow models on startup to avoid lag on first detection.

---

## ⚠️ Known Limitations & Future Ideas

### Current Phase (Phase 1-6)
- ❌ No multi-user support (single-user only)
- ❌ No cloud sync (local data only)
- ❌ No mobile companion app (yet)
- ⚠️ Face recognition requires calibration

### Future Enhancements (Post-Phase 6)
- [ ] OAuth2 integration for multi-user households
- [ ] Cloud backup of arrival logs (encrypted)
- [ ] Mobile app companion (view arrivals, receive notifications)
- [ ] Integrate with smart home (unlock door, turn on lights)
- [ ] Machine learning model personalization
- [ ] Raspberry Pi version (low-power alternative)
- [ ] Web dashboard for remote monitoring

---

## 📞 Support & Troubleshooting

### Common Issues

**"Camera permission denied"**
- Check Windows camera permissions (Settings → Privacy → Camera)
- Ensure app has camera permissions granted

**"TensorFlow model failed to load"**
- Check internet connection (models download on first run)
- Clear browser cache and try again

**"No detections firing"**
- Adjust minimum confidence threshold in settings
- Ensure good lighting on entry door
- Test with object detection debug mode

---

## 📄 License

This project is personal use only. Do not distribute without permission.

---

**Created:** January 27, 2026  
**Status:** ✅ ALL PHASES COMPLETE - Production Ready  
**Owner:** Rajiv

# visionxx

