import { Injectable } from '@angular/core';
import { Detection, DetectionFrame } from './detection.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DetectionStats {
    totalDetections: number;
    detectionsByClass: Map<string, number>;
    detectionsByConfidence: {
        high: number;      // > 0.85
        medium: number;    // 0.7 - 0.85
        low: number;       // < 0.7
    };
    animalsDetected: string[];  // List of detected animal types
    personsDetected: number;
    furnitureDetected: string[];
    otherObjectsDetected: string[];
    averageConfidence: number;
    frameNumber: number;
    timestamp: number;
}

@Injectable({
    providedIn: 'root'
})
export class DetectionStatsService {
    private statsSubject = new BehaviorSubject<DetectionStats | null>(null);
    public stats$: Observable<DetectionStats | null> = this.statsSubject.asObservable();

    private detectionHistory: DetectionStats[] = [];
    private maxHistoryLength = 100;

    // Define object categories
    private readonly ANIMALS = ['cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'bird'];
    private readonly FURNITURE = ['chair', 'sofa', 'bed', 'table', 'diningtable', 'couch'];
    private readonly KITCHENWARE = ['bottle', 'cup', 'bowl', 'fork', 'knife', 'spoon', 'plate'];

    constructor() { }

    /**
     * Analyze a detection frame and generate detailed statistics
     */
    analyzeFrame(frame: DetectionFrame): DetectionStats {
        const stats = this.createStats(frame);
        this.statsSubject.next(stats);

        // Keep history for trend analysis
        this.detectionHistory.push(stats);
        if (this.detectionHistory.length > this.maxHistoryLength) {
            this.detectionHistory.shift();
        }

        return stats;
    }

    /**
     * Create detailed statistics from a detection frame
     */
    private createStats(frame: DetectionFrame): DetectionStats {
        const detectionsByClass = new Map<string, number>();
        const animalsDetected = new Set<string>();
        const furnitureDetected = new Set<string>();
        const otherObjectsDetected = new Set<string>();
        let personsDetected = 0;
        let highConfidence = 0;
        let mediumConfidence = 0;
        let lowConfidence = 0;
        let totalConfidence = 0;

        frame.detections.forEach(detection => {
            // Count by class
            detectionsByClass.set(
                detection.class,
                (detectionsByClass.get(detection.class) || 0) + 1
            );

            // Categorize detections
            if (detection.class === 'person') {
                personsDetected++;
            } else if (this.ANIMALS.includes(detection.class)) {
                animalsDetected.add(detection.class);
            } else if (this.FURNITURE.includes(detection.class)) {
                furnitureDetected.add(detection.class);
            } else if (this.KITCHENWARE.includes(detection.class)) {
                otherObjectsDetected.add(detection.class);
            } else {
                otherObjectsDetected.add(detection.class);
            }

            // Categorize by confidence
            if (detection.score > 0.85) {
                highConfidence++;
            } else if (detection.score >= 0.7) {
                mediumConfidence++;
            } else {
                lowConfidence++;
            }

            totalConfidence += detection.score;
        });

        return {
            totalDetections: frame.detections.length,
            detectionsByClass,
            detectionsByConfidence: {
                high: highConfidence,
                medium: mediumConfidence,
                low: lowConfidence
            },
            animalsDetected: Array.from(animalsDetected),
            personsDetected,
            furnitureDetected: Array.from(furnitureDetected),
            otherObjectsDetected: Array.from(otherObjectsDetected),
            averageConfidence: frame.detections.length > 0 ? totalConfidence / frame.detections.length : 0,
            frameNumber: frame.frameCount,
            timestamp: frame.timestamp
        };
    }

    /**
     * Get current statistics
     */
    getCurrentStats(): DetectionStats | null {
        return this.statsSubject.value;
    }

    /**
     * Get detection history for trend analysis
     */
    getHistory(): DetectionStats[] {
        return [...this.detectionHistory];
    }

    /**
     * Get most frequently detected animal in recent history
     */
    getMostFrequentAnimal(): string | null {
        const animalCounts = new Map<string, number>();

        this.detectionHistory.forEach(stats => {
            stats.animalsDetected.forEach(animal => {
                animalCounts.set(animal, (animalCounts.get(animal) || 0) + 1);
            });
        });

        if (animalCounts.size === 0) return null;

        return Array.from(animalCounts.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }

    /**
     * Get summary of all detected objects
     */
    getSummary(): string {
        const stats = this.statsSubject.value;
        if (!stats) return 'No detections yet';

        const parts: string[] = [];

        if (stats.personsDetected > 0) {
            parts.push(`${stats.personsDetected} person${stats.personsDetected > 1 ? 's' : ''}`);
        }

        if (stats.animalsDetected.length > 0) {
            parts.push(`${stats.animalsDetected.join(', ')}`);
        }

        if (stats.furnitureDetected.length > 0) {
            parts.push(`Furniture: ${stats.furnitureDetected.join(', ')}`);
        }

        if (stats.otherObjectsDetected.length > 0) {
            const others = stats.otherObjectsDetected.filter(
                o => !this.ANIMALS.includes(o) && !this.FURNITURE.includes(o)
            );
            if (others.length > 0) {
                parts.push(`Objects: ${others.join(', ')}`);
            }
        }

        return parts.length > 0 ? parts.join(' | ') : 'No detections';
    }

    /**
     * Clear history
     */
    clearHistory(): void {
        this.detectionHistory = [];
    }
}
