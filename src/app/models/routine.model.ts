/**
 * Routine Analysis Model
 */
export interface Routine {
    lastUpdated: string; // ISO timestamp
    windowStart: string; // HH:mm format
    windowEnd: string; // HH:mm format
    meanArrivalTime: string; // HH:mm format
    standardDeviation: number; // minutes
    sampleSize: number;
    confidence: number; // 0-1
}
