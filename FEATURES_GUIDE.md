# Sentry Bot - Complete Features Guide

## 🎯 Quick Navigation

### Dashboard
The main view showing:
- Live camera feed from your webcam
- Real-time person detection visualization
- Arrival history log
- Routine predictions
- Today's statistics

### Settings
Access via the "⚙️ Settings" button in the header.

---

## 📝 Feature Walkthrough

### 1. Audio & Greeting Configuration

**Location:** Settings → Audio Tab

#### What It Does
Configures how the system greets you when you arrive during your predicted window.

#### How to Use
1. Click "⚙️ Settings" button
2. Click "Audio" tab
3. **Volume Slider**: Adjust greeting volume (0-100%)
4. **Enable Greetings**: Toggle to turn greetings on/off
5. **Test Greeting**: Click to hear a sample greeting
6. **Stop Audio**: Stop any playing audio

#### Greeting Examples
- **Early Morning (5:00-8:00)**: "You're up early!"
- **Morning (8:00-12:00)**: "Good morning, Rajiv!"
- **Afternoon (12:00-17:00)**: "Hello, Rajiv!"
- **Evening (17:00-21:00)**: "Welcome back, Rajiv!"
- **Late Night (21:00-5:00)**: "Late night arrival detected!"

---

### 2. Face Recognition Calibration

**Location:** Settings → Face Recognition Tab

#### What It Does
Teaches the system to recognize your face so it can filter out false positives from pets.

#### How to Use
1. Click "⚙️ Settings" button
2. Click "Face Recognition" tab
3. **Position Your Face**: Look directly at the camera with good lighting
4. Click "Start Calibration" button
5. Hold still as the system captures 5 samples of your face
6. Wait for success message

#### Tips for Best Results
- Ensure good lighting on your face
- Look directly at camera
- Keep consistent distance (30-60cm from camera)
- Avoid shadows or backlighting
- System will show progress percentage

#### How It Works
- Captures 5 samples of your face
- Stores face patterns (embeddings) locally
- Uses face matching to differentiate you from pets
- Only triggers greeting if face matches with >80% confidence

#### Reset Calibration
If calibration isn't working well:
1. Go to Face Recognition tab
2. Click "Reset Calibration" button
3. Repeat calibration process with better lighting/position

---

### 3. General Settings

**Location:** Settings → General Tab

#### Detection Model
Choose which AI model to use for person detection:
- **coco-ssd** (default): Fast, accurate for people
- **mobilenet**: Lighter weight, good for older hardware
- **posenet**: Pose detection (experimental)

#### Minimum Confidence
Adjust detection sensitivity (50-99%):
- **Lower values**: More detections (may include false positives)
- **Higher values**: Fewer detections (more accurate but may miss some)
- **Default (70%)**: Best for most scenarios

#### Timezone
Select your timezone for accurate time-based features:
- Used for arrival time calculations
- Affects greeting time-of-day classification
- Used for routine pattern analysis

#### Webcam
Camera device ID (usually leave as "default"):
- Auto-detects your primary webcam
- Change if you have multiple cameras

---

### 4. Data Management

**Location:** Settings → Data Tab

#### Export Data
**What:** Download all your arrival logs and settings as JSON

**When to Use:**
- Backup before major updates
- Share data with support
- Migrate to another machine

**How:**
1. Go to Settings → Data tab
2. Click "📥 Export Data"
3. File saves as `sentry-bot-backup-YYYY-MM-DD.json`

#### Clear All Data
**What:** Permanently delete all arrivals, routines, and settings

**Warning:** This cannot be undone!

**When to Use:**
- Start fresh with new patterns
- Privacy/data cleanup
- Troubleshooting persistent issues

**How:**
1. Go to Settings → Data tab
2. Click "🗑️ Clear All Data"
3. Confirm in popup dialog
4. Settings reset to defaults (audio, detection, timezone retained)

---

## 🎤 Greeting System Details

### How Greetings Trigger

1. **Person Detected**: COCO-SSD detects a person in the camera feed
2. **Face Verified** (optional): Face-api matches detected face against your profile
3. **Within Window**: Current time is within your learned arrival window
4. **Cooldown Checked**: More than 5 minutes since last greeting
5. **Greeting Plays**: Custom message spoken via text-to-speech

### Learning Your Arrival Pattern

System learns your routine by:
1. Logging each arrival with timestamp
2. Analyzing last 14 days of arrivals
3. Calculating mean arrival time
4. Computing standard deviation
5. Creating confidence window (mean ± 1.5 × std dev)

**Minimum for Learning:** 7-10 arrivals over 2 weeks

### Greeting Time-of-Day Logic

The system adjusts greetings based on when you arrive:
- **Early:** "You're up early!" (rewards unexpected early arrivals)
- **Expected Time:** "Welcome back!" (normal arrival)
- **Late:** "Late night arrival detected!" (acknowledges late return)

---

## 🔍 Detection Visualization

On the Dashboard, you'll see:

### Camera Feed
- Live video from your webcam
- Red boxes around detected people
- Confidence scores (0-100%)
- Real-time updates

### Detection Info
- **Model Used**: COCO-SSD (current)
- **Detection Count**: Number of people detected
- **Confidence Level**: Average detection confidence
- **Face Match**: If calibrated, shows face match confidence

### Arrival Log
Scrollable list of logged arrivals:
- **Date & Time**: When you arrived
- **Day of Week**: Pattern analysis
- **Confidence**: Detection confidence (0-100%)
- **Face Match**: Face recognition confidence (if available)

---

## 📊 Routine Patterns

Visible on the Dashboard arrival log area:

### What the System Tracks
- **Mean Arrival Time**: Average arrival time
- **Window**: Range where you typically arrive (mean ± 1.5σ)
- **Sample Size**: Number of arrivals analyzed
- **Confidence**: Reliability of the pattern (0-100%)
- **Standard Deviation**: Consistency of your schedule

### Example
```
Mean Arrival: 17:38
Window: 17:23 - 17:53
Sample Size: 14 arrivals
Confidence: 85%
Std Dev: 15 minutes
```

This means:
- You typically arrive around 5:38 PM
- Usually within 30-minute window (5:23 - 5:53 PM)
- 85% confident in this pattern
- Your schedule varies by ±15 minutes

---

## 🛠️ Troubleshooting

### Greeting Not Triggering

**Check:**
1. ✅ Greeting enabled in Audio settings
2. ✅ Microphone/Speaker volume not muted
3. ✅ Current time within arrival window
4. ✅ Person detected with >70% confidence
5. ✅ Face match > 80% (if calibrated)
6. ✅ Not within 5-minute cooldown period

**Solution:**
1. Ensure good camera placement (view entry area)
2. Check lighting conditions
3. Verify arrival window calculated (need 7+ arrivals first)
4. Re-calibrate face if recognition failing

### Low Detection Rates

**Causes:**
- Poor lighting
- Camera too far from entry
- Confidence threshold too high
- Model not fully loaded

**Solutions:**
1. Improve lighting (add lamp near entry)
2. Position camera 1-2 meters from entry path
3. Lower minimum confidence in General settings
4. Wait 10 seconds for model to load on startup

### Face Calibration Not Working

**Causes:**
- Insufficient lighting
- Face too far from camera
- Shadows on face
- Camera pointing wrong direction

**Solutions:**
1. Ensure bright, even lighting (no backlighting)
2. Position face 30-60cm from camera
3. Avoid casting shadows on face
4. Reset calibration and try again
5. Use "Capture Frame" button to test camera angle

### System Crashing or Freezing

**Actions:**
1. Check application logs in Settings → Data
2. Export logs for debugging
3. Clear cache (Browser cache if web-based)
4. Restart application
5. Check available disk space
6. Verify GPU drivers updated (for TensorFlow)

---

## 💾 Data Location

Your data is stored locally in:
- **Arrivals Log**: `data/db.json`
- **Settings**: `data/db.json`
- **App Logs**: localStorage
- **Face Profile**: `data/db.json`

All data stays on your computer. Nothing is sent to cloud.

---

## 🔒 Privacy & Security

- ✅ All processing happens locally
- ✅ No internet required (offline capable)
- ✅ Face data never uploaded
- ✅ No tracking or telemetry
- ✅ No account needed
- ✅ Full data export/delete available

---

## 🚀 Keyboard Shortcuts

- **Alt+Ctrl+D**: Toggle DevTools (dev mode)
- **F11**: Fullscreen (browser)
- **Ctrl+,**: Open Settings (future)

---

## 📞 Support

For issues or questions:
1. Check Troubleshooting section above
2. Export and review logs in Settings → Data
3. Verify camera/lighting setup
4. Try clearing data and starting fresh

---

**Last Updated:** January 27, 2026
**Version:** 1.0.0
**Status:** Production Ready
