import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Arrival } from '../models/arrival.model';


@Injectable({
    providedIn: 'root'
})
export class ArrivalLogService {
    constructor(private dbService: DatabaseService) { }

    /**
     * Log a person arrival to the database
     */
    logArrival(confidence: number, faceMatchConfidence?: number): Arrival {
        const now = new Date();

        // Format time and date
        const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const time = now.toTimeString().slice(0, 5); // HH:mm
        const day = this.getDayOfWeek(now);

        const arrival: Arrival = {
            id: this.generateId(),
            date,
            time,
            day,
            confidence,
            model: 'coco-ssd',
            faceMatchConfidence,
            timestamp: now.toISOString()
        };

        // Add to database
        this.dbService.addArrival(arrival);

        console.log('Arrival logged:', arrival);
        return arrival;
    }

    /**
     * Get all logged arrivals
     */
    getAllArrivals(): Arrival[] {
        return this.dbService.getArrivals();
    }

    /**
     * Get arrivals from last N days
     */
    getRecentArrivals(days: number): Arrival[] {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const startDateStr = startDate.toISOString().split('T')[0];

        const arrivals = this.dbService.getArrivals();
        return arrivals.filter(a => a.date >= startDateStr);
    }

    /**
     * Get arrivals for a specific day of week
     */
    getArrivalsByDayOfWeek(dayName: string): Arrival[] {
        return this.dbService.getArrivals().filter(a => a.day === dayName);
    }

    /**
     * Get arrival statistics
     */
    getStatistics() {
        const arrivals = this.dbService.getArrivals();

        if (arrivals.length === 0) {
            return {
                totalArrivals: 0,
                averageConfidence: 0,
                lastArrival: null,
                arrivalsByDay: {}
            };
        }

        // Group arrivals by day of week
        const arrivalsByDay: { [key: string]: Arrival[] } = {};
        arrivals.forEach(a => {
            if (!arrivalsByDay[a.day]) {
                arrivalsByDay[a.day] = [];
            }
            arrivalsByDay[a.day].push(a);
        });

        // Calculate average confidence
        const avgConfidence =
            arrivals.reduce((sum, a) => sum + a.confidence, 0) / arrivals.length;

        return {
            totalArrivals: arrivals.length,
            averageConfidence: avgConfidence,
            lastArrival: arrivals[arrivals.length - 1],
            arrivalsByDay: Object.fromEntries(
                Object.entries(arrivalsByDay).map(([day, arr]) => [
                    day,
                    {
                        count: arr.length,
                        avgTime: this.calculateAverageTime(arr),
                        avgConfidence: arr.reduce((s, a) => s + a.confidence, 0) / arr.length
                    }
                ])
            )
        };
    }

    /**
     * Check if a recent arrival was detected (to avoid duplicates)
     */
    wasRecentlyDetected(withinSeconds: number = 300): boolean {
        const arrivals = this.dbService.getArrivals();
        if (arrivals.length === 0) return false;

        const lastArrival = arrivals[arrivals.length - 1];
        const timeSinceLastArrival =
            (Date.now() - new Date(lastArrival.timestamp).getTime()) / 1000;

        return timeSinceLastArrival < withinSeconds;
    }

    /**
     * Clear arrival logs (for testing)
     */
    clearAllArrivals(): void {
        this.dbService.clearDatabase();
    }

    // === Private Helpers ===

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    private getDayOfWeek(date: Date): string {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    }

    private calculateAverageTime(arrivals: Arrival[]): string {
        if (arrivals.length === 0) return '--:--';

        // Convert times to minutes
        const minutes = arrivals.map(a => {
            const [h, m] = a.time.split(':').map(Number);
            return h * 60 + m;
        });

        // Calculate average
        const avgMinutes = Math.round(
            minutes.reduce((a, b) => a + b, 0) / minutes.length
        );

        // Convert back to HH:mm
        const hours = Math.floor(avgMinutes / 60);
        const mins = avgMinutes % 60;

        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
}
