import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArrivalLogService } from '../../services/arrival-log.service';
import { RoutineAnalysisService } from '../../services/routine-analysis.service';
import { Arrival } from '../../models/arrival.model';
import { Routine } from '../../models/routine.model';

@Component({
    selector: 'app-arrival-log-viewer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './arrival-log-viewer.component.html',
    styleUrls: ['./arrival-log-viewer.component.css']
})
export class ArrivalLogViewerComponent implements OnInit {
    arrivals: Arrival[] = [];
    statistics: any = null;
    routine: Routine | null = null;
    selectedTab: 'log' | 'stats' | 'routine' = 'log';
    routineByDay: { [key: string]: Routine | null } = {};
    nextPredictedArrival: { time: string; hoursAway: number } | null = null;

    constructor(
        private arrivalLogService: ArrivalLogService,
        private routineAnalysisService: RoutineAnalysisService
    ) { }

    ngOnInit(): void {
        this.loadArrivals();
        this.loadRoutineAnalysis();
    }

    loadArrivals(): void {
        this.arrivals = this.arrivalLogService.getAllArrivals();
        this.statistics = this.arrivalLogService.getStatistics();
    }

    loadRoutineAnalysis(): void {
        this.routine = this.routineAnalysisService.getRoutine();
        this.nextPredictedArrival = this.routineAnalysisService.getNextPredictedArrival();

        // Analyze routine by day of week
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.forEach(day => {
            this.routineByDay[day] = this.routineAnalysisService.analyzeRoutineByDay(day);
        });
    }

    analyzeRoutine(): void {
        this.routine = this.routineAnalysisService.triggerAnalysis();
        this.nextPredictedArrival = this.routineAnalysisService.getNextPredictedArrival();
        this.loadRoutineAnalysis();
    }

    clearLogs(): void {
        if (confirm('Are you sure you want to clear all arrival logs? This cannot be undone.')) {
            this.arrivalLogService.clearAllArrivals();
            this.loadArrivals();
            this.analyzeRoutine();
        }
    }

    clearAnalysis(): void {
        if (confirm('Clear routine analysis data?')) {
            this.routineAnalysisService.clearAnalysis();
            this.routine = null;
            this.nextPredictedArrival = null;
            this.routineByDay = {};
        }
    }

    getConfidenceColor(confidence: number): string {
        if (confidence >= 0.9) return '#00ff00';
        if (confidence >= 0.8) return '#77ff00';
        if (confidence >= 0.7) return '#ffaa00';
        return '#ff4444';
    }

    getConfidenceLabel(confidence: number): string {
        if (confidence >= 0.9) return 'High';
        if (confidence >= 0.8) return 'Good';
        if (confidence >= 0.7) return 'Fair';
        return 'Low';
    }

    isInWindow(): boolean {
        return this.routineAnalysisService.isInPredictedWindow();
    }

    formatTime(time: string): string {
        return time;
    }

    formatDate(date: string): string {
        try {
            return new Date(date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return date;
        }
    }

    get recentArrivals(): Arrival[] {
        return this.arrivals.slice().reverse().slice(0, 20);
    }
}
