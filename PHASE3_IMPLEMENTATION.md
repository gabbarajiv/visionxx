# Phase 3 Implementation Summary: Pattern Learning & Prediction

## Overview
Phase 3 adds intelligent routine analysis to the Sentry Bot. The system now learns your arrival patterns and predicts your typical arrival window with statistical confidence.

## Components Implemented

### 1. **RoutineAnalysisService** (`src/app/services/routine-analysis.service.ts`)
Core service for analyzing arrival patterns and predictions.

**Key Features:**
- **Statistical Analysis**: Calculates mean arrival time and standard deviation
- **Routine Prediction**: Determines arrival window (mean ± std dev)
- **Confidence Scoring**: Measures reliability of predictions based on sample size and deviation
- **Day-of-Week Analysis**: Separates patterns by specific days (Monday, Tuesday, etc.)
- **Nightly Analysis Job**: Automatically runs at 2 AM daily to update predictions
- **Next Arrival Prediction**: Calculates when you're expected to arrive

**Key Methods:**
```typescript
analyzeRoutine()              // Analyze all arrivals and update predictions
getRoutine()                  // Get current routine data
isInPredictedWindow()         // Check if current time is within expected window
getNextPredictedArrival()    // Calculate hours until next expected arrival
analyzeRoutineByDay(day)     // Get routine for specific day of week
```

**Mathematical Approach:**
- **Mean**: Average of all arrival times converted to minutes
- **Standard Deviation**: Measure of variability in arrival times
- **Confidence**: `1.0 - (stdDev / 120)` clamped between 0.3 and 1.0
- **Window**: `[mean - stdDev, mean + stdDev]` in minutes

### 2. **Enhanced ArrivalLogViewerComponent**
Updated component to display routine analysis UI with three tabs:
- **Recent Arrivals**: Display of logged detections (unchanged)
- **Statistics**: Daily breakdown by day of week (unchanged)
- **Routine Analysis** (NEW): Pattern visualization and predictions

**New UI Elements:**
- **Routine Summary Card**: Shows mean arrival time, window, std dev, and confidence
- **Next Arrival Prediction**: Displays predicted arrival time and status
- **Day-by-Day Routine**: Grid showing patterns for each day of the week
- **Analysis Controls**: Buttons to manually trigger analysis or clear data

### 3. **Updated DetectionViewerComponent**
Automatically triggers routine analysis whenever a person is detected and logged.

## Data Flow

```
User Arrives
    ↓
Camera detects person
    ↓
Detection logged to database
    ↓
RoutineAnalysisService.analyzeRoutine() triggered
    ↓
Statistical analysis calculates:
  - Mean arrival time
  - Standard deviation
  - Confidence score
  - Arrival window
    ↓
Routine data stored in database
    ↓
UI updates with new predictions
```

## Nightly Analysis Job

The service automatically schedules analysis to run at **2 AM daily**:
1. Calculates from all stored arrivals
2. Updates database with new routine predictions
3. Reschedules for next day at 2 AM

This ensures predictions refresh regularly with accumulated data.

## Usage Examples

### Display Routine Predictions
```typescript
const routine = this.routineAnalysisService.getRoutine();
console.log(`Expected arrival: ${routine.meanArrivalTime}`);
console.log(`Typical window: ${routine.windowStart}-${routine.windowEnd}`);
console.log(`Confidence: ${routine.confidence * 100}%`);
```

### Check If In Predicted Window
```typescript
if (this.routineAnalysisService.isInPredictedWindow()) {
    console.log('You\'re arriving on schedule!');
}
```

### Get Next Predicted Arrival
```typescript
const prediction = this.routineAnalysisService.getNextPredictedArrival();
console.log(`Expected in ${prediction.hoursAway} hours`);
```

## Requirements for Analysis

- **Minimum Data**: 3 arrival records required to begin analysis
- **Minimum Day-of-Week Data**: 2 arrivals on same day for day-specific patterns
- **Confidence Calculation**: Based on sample size and consistency

## UI Features

### Routine Analysis Tab
- **Overall Pattern**: Mean time, window, deviation, and confidence
- **Next Arrival**: Time and distance from now
- **Current Status**: Visual indicator if you're currently in predicted window
- **Day-of-Week Breakdown**: Individual patterns for each day
- **Manual Analysis**: Button to trigger analysis immediately
- **Clear Function**: Reset all analysis data

### Visual Indicators
- ✓ Green indicator when within predicted window
- Color-coded confidence scores
- Font-based styling for hierarchy

## Testing

Unit tests included in `routine-analysis.service.spec.ts`:
- Service creation
- Null handling with insufficient data
- Mean calculation accuracy
- Standard deviation computation
- Day-of-week analysis
- Window prediction
- Confidence scoring

Run tests with:
```bash
npm test
```

## Configuration

**Nightly Analysis Time**: 2 AM (hardcoded in `startNightlyAnalysis()`)
- Can be modified by changing the hour in the method

**Minimum Confidence Threshold**: 0.3
**Maximum Confidence Value**: 1.0
**Deviation Factor**: 120 minutes (used in confidence calculation)

## Next Steps (Phase 4)

Phase 4 will implement greeting logic:
- Trigger greetings when arrival is detected within predicted window
- Text-to-Speech for personalized messages
- Volume controls
- Greeting templates based on time of day

## File Structure
```
src/app/
├── services/
│   ├── routine-analysis.service.ts        (NEW)
│   ├── routine-analysis.service.spec.ts   (NEW)
│   └── [existing services]
├── components/
│   └── arrival-log-viewer/
│       ├── arrival-log-viewer.component.ts (UPDATED)
│       ├── arrival-log-viewer.component.html (UPDATED)
│       ├── arrival-log-viewer.component.css (UPDATED)
│       └── [other components]
└── models/
    ├── routine.model.ts (USED)
    └── arrival.model.ts (USED)
```

## Status
✅ **COMPLETE** - Phase 3 fully implemented and tested
- Routine analysis service with statistics
- Nightly analysis job
- UI visualization with all features
- Integration with detection system
- Unit tests included
