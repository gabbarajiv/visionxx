/**
 * Application Settings Model
 */
export interface AppSettings {
    webcamId: string;
    detectionModel: string; // coco-ssd, mobilenet, etc.
    minConfidence: number; // 0-1
    enableGreeting: boolean;
    greetingVolume: number; // 0-1
    timezone: string; // e.g., "America/New_York"
}
