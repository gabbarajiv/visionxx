import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Arrival } from '../models/arrival.model';
import { Routine } from '../models/routine.model';

/**
 * Routine Analysis Service
 * Analyzes arrival patterns and predicts future arrival windows
 */
@Injectable({
    providedIn: 'root'
})
export class RoutineAnalysisService {
    private analysisInterval: any;

    constructor(private dbService: DatabaseService) {
        this.startNightlyAnalysis();
    }

    /**
     * Analyze all arrivals and update routine prediction
     */
    analyzeRoutine(): Routine | null {
        const arrivals = this.dbService.getArrivals();

        if (arrivals.length < 3) {
            console.log('Not enough arrival data for routine analysis (need at least 3)');
            return null;
        }

        // Convert arrival times to minutes since midnight
        const arrivalMinutes = arrivals.map(a => {
            const [h, m] = a.time.split(':').map(Number);
            return h * 60 + m;
        });

        // Calculate statistics
        const mean = this.calculateMean(arrivalMinutes);
        const standardDeviation = this.calculateStandardDeviation(arrivalMinutes, mean);

        // Calculate confidence based on sample size and deviation
        const confidence = Math.min(
            1.0,
            Math.max(0.3, 1.0 - (standardDeviation / 120)) // Adjust based on std dev
        );

        // Calculate window (mean ± 1 std dev)
        const windowStart = Math.max(0, mean - standardDeviation);
        const windowEnd = Math.min(24 * 60 - 1, mean + standardDeviation);

        const routine: Routine = {
            lastUpdated: new Date().toISOString(),
            windowStart: this.minutesToTimeString(windowStart),
            windowEnd: this.minutesToTimeString(windowEnd),
            meanArrivalTime: this.minutesToTimeString(mean),
            standardDeviation: Math.round(standardDeviation),
            sampleSize: arrivals.length,
            confidence: Math.round(confidence * 100) / 100
        };

        // Update database
        this.dbService.updateRoutine(routine);

        console.log('Routine analyzed:', routine);
        return routine;
    }

    /**
     * Get current routine prediction
     */
    getRoutine(): Routine | null {
        return this.dbService.getRoutine();
    }

    /**
     * Check if current time is within predicted window
     */
    isInPredictedWindow(): boolean {
        const routine = this.getRoutine();
        if (!routine) return false;

        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:mm

        return currentTime >= routine.windowStart && currentTime <= routine.windowEnd;
    }

    /**
     * Get next predicted arrival time
     */
    getNextPredictedArrival(): { time: string; hoursAway: number } | null {
        const routine = this.getRoutine();
        if (!routine) return null;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Parse mean arrival time
        const [meanH, meanM] = routine.meanArrivalTime.split(':').map(Number);
        const meanMinutes = meanH * 60 + meanM;

        let hoursAway = (meanMinutes - currentMinutes) / 60;

        // If already passed today, predict for tomorrow
        if (hoursAway < 0) {
            hoursAway += 24;
        }

        return {
            time: routine.meanArrivalTime,
            hoursAway: Math.round(hoursAway * 10) / 10
        };
    }

    /**
     * Analyze routine by day of week
     */
    analyzeRoutineByDay(dayName: string): Routine | null {
        const arrivals = this.dbService.getArrivals()
            .filter(a => a.day === dayName);

        if (arrivals.length < 2) {
            return null;
        }

        // Convert arrival times to minutes
        const arrivalMinutes = arrivals.map(a => {
            const [h, m] = a.time.split(':').map(Number);
            return h * 60 + m;
        });

        const mean = this.calculateMean(arrivalMinutes);
        const standardDeviation = this.calculateStandardDeviation(arrivalMinutes, mean);
        const confidence = Math.min(1.0, Math.max(0.3, 1.0 - (standardDeviation / 120)));

        const windowStart = Math.max(0, mean - standardDeviation);
        const windowEnd = Math.min(24 * 60 - 1, mean + standardDeviation);

        return {
            lastUpdated: new Date().toISOString(),
            windowStart: this.minutesToTimeString(windowStart),
            windowEnd: this.minutesToTimeString(windowEnd),
            meanArrivalTime: this.minutesToTimeString(mean),
            standardDeviation: Math.round(standardDeviation),
            sampleSize: arrivals.length,
            confidence: Math.round(confidence * 100) / 100
        };
    }

    /**
     * Start nightly analysis job (runs at 2 AM)
     */
    private startNightlyAnalysis(): void {
        const now = new Date();
        const next2AM = new Date();
        next2AM.setHours(2, 0, 0, 0);

        // If already past 2 AM today, schedule for tomorrow
        if (now.getTime() > next2AM.getTime()) {
            next2AM.setDate(next2AM.getDate() + 1);
        }

        const timeUntil2AM = next2AM.getTime() - now.getTime();

        // Set initial timeout
        this.analysisInterval = setTimeout(() => {
            this.analyzeRoutine();

            // Then set recurring daily interval
            this.analysisInterval = setInterval(() => {
                this.analyzeRoutine();
            }, 24 * 60 * 60 * 1000); // Every 24 hours
        }, timeUntil2AM);

        console.log(`Nightly analysis scheduled for ${next2AM.toLocaleTimeString()}`);
    }

    /**
     * Manually trigger analysis (for testing)
     */
    triggerAnalysis(): Routine | null {
        return this.analyzeRoutine();
    }

    /**
     * Clear analysis data
     */
    clearAnalysis(): void {
        const db = this.dbService.getDatabase();
        db.routine = null;
    }

    // === Private Helpers ===

    private calculateMean(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    private calculateStandardDeviation(values: number[], mean: number): number {
        if (values.length < 2) return 0;

        const variance = values.reduce((sum, val) => {
            return sum + Math.pow(val - mean, 2);
        }, 0) / values.length;

        return Math.sqrt(variance);
    }

    private minutesToTimeString(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);

        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    ngOnDestroy(): void {
        if (this.analysisInterval) {
            clearTimeout(this.analysisInterval);
        }
    }
}
