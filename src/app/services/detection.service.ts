import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Detection {
    class: string; // e.g., 'person'
    score: number; // confidence 0-1
    bbox: [number, number, number, number]; // [x, y, width, height]
    timestamp: number; // milliseconds
}

export interface DetectionFrame {
    detections: Detection[];
    timestamp: number;
    frameCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class DetectionService {
    private model: any = null;
    private modelLoaded = new BehaviorSubject<boolean>(false);
    private modelError = new BehaviorSubject<string | null>(null);
    private frameCount = 0;

    public modelLoaded$ = this.modelLoaded.asObservable();
    public modelError$ = this.modelError.asObservable();

    private detectionFrame = new BehaviorSubject<DetectionFrame>({
        detections: [],
        timestamp: 0,
        frameCount: 0
    });

    public detectionFrame$ = this.detectionFrame.asObservable();

    constructor() { }

    /**
     * Initialize TensorFlow.js and load COCO-SSD model
     */
    async initializeModel(): Promise<void> {
        try {
            this.modelError.next(null);

            // Dynamically import to avoid loading if not needed
            const tf = await import('@tensorflow/tfjs');
            const cocoSsd = await import('@tensorflow-models/coco-ssd');

            // Load the model
            console.log('Loading COCO-SSD model...');
            this.model = await cocoSsd.load();

            console.log('COCO-SSD model loaded successfully');
            this.modelLoaded.next(true);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error('Failed to load model:', errorMsg);
            this.modelError.next(errorMsg);
            throw error;
        }
    }

    /**
     * Run detection on a video element
     */
    async detectFromVideoElement(
        videoElement: HTMLVideoElement,
        minConfidence: number = 0.7
    ): Promise<DetectionFrame> {
        if (!this.model) {
            throw new Error('Model not loaded. Call initializeModel() first.');
        }

        // Validate video element is ready and has valid dimensions
        if (!videoElement) {
            throw new Error('Video element is null or undefined');
        }

        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            throw new Error('Video element has invalid dimensions (width or height is 0)');
        }

        if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
            throw new Error('Video element is not ready - invalid readyState');
        }

        try {
            // Run COCO-SSD detection
            const predictions = await this.model.detect(videoElement);

            // Filter predictions and format results
            const detections: Detection[] = predictions
                .filter((pred: any) => pred.score >= minConfidence)
                .map((pred: any) => ({
                    class: pred.class,
                    score: pred.score,
                    bbox: pred.bbox as [number, number, number, number],
                    timestamp: Date.now()
                }));

            this.frameCount++;
            const frame: DetectionFrame = {
                detections,
                timestamp: Date.now(),
                frameCount: this.frameCount
            };

            this.detectionFrame.next(frame);
            return frame;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            // Only log non-validation errors or first occurrence
            if (!errorMsg.includes('Video element is not ready') || this.frameCount % 100 === 0) {
                console.error('Detection error:', errorMsg);
            }
            this.modelError.next(errorMsg);
            throw error;
        }
    }

    /**
     * Get available detection classes from COCO-SSD model
     */
    getAvailableClasses(): string[] {
        return [
            'person', 'bicycle', 'car', 'motorbike', 'aeroplane', 'bus', 'train', 'truck',
            'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
            'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe',
            'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis',
            'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard',
            'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife',
            'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot',
            'hot dog', 'pizza', 'donut', 'cake', 'chair', 'sofa', 'pottedplant', 'bed',
            'diningtable', 'toilet', 'tvmonitor', 'laptop', 'mouse', 'remote', 'keyboard',
            'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase',
            'scissors', 'teddy bear', 'hair drier', 'toothbrush'
        ];
    }

    /**
     * Get human-readable label with confidence
     */
    formatDetectionLabel(detection: Detection): string {
        return `${detection.class} (${(detection.score * 100).toFixed(0)}%)`;
    }

    /**
     * Filter detections by class
     */
    filterByClass(frame: DetectionFrame, className: string): Detection[] {
        return frame.detections.filter(d => d.class === className);
    }

    /**
     * Get highest confidence detection of a class
     */
    getHighestConfidence(frame: DetectionFrame, className: string): Detection | null {
        const filtered = this.filterByClass(frame, className);
        if (filtered.length === 0) return null;

        return filtered.reduce((prev, current) =>
            current.score > prev.score ? current : prev
        );
    }

    /**
     * Check if any person detected
     */
    hasPersonDetection(frame: DetectionFrame, minConfidence: number = 0.7): boolean {
        return frame.detections.some(
            d => d.class === 'person' && d.score >= minConfidence
        );
    }

    /**
     * Get model status
     */
    isModelLoaded(): boolean {
        return this.modelLoaded.value;
    }

    /**
     * Dispose model
     */
    disposeModel(): void {
        if (this.model) {
            this.model.dispose();
            this.model = null;
            this.modelLoaded.next(false);
            this.frameCount = 0;
        }
    }
}
