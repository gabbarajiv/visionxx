/**
 * Arrival Log Entry Model
 */
export interface Arrival {
    id: string;
    date: string; // ISO date format (YYYY-MM-DD)
    time: string; // HH:mm format
    day: string; // Monday, Tuesday, etc.
    confidence: number; // 0-1, detection confidence
    model: string; // Model used for detection (coco-ssd)
    faceMatchConfidence?: number; // Optional face recognition confidence
    timestamp: string; // ISO timestamp
}
