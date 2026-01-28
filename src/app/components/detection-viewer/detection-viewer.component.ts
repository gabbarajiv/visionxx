import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CameraService } from '../../services/camera.service';
import { DetectionService, Detection, DetectionFrame } from '../../services/detection.service';
import { ArrivalLogService } from '../../services/arrival-log.service';
import { RoutineAnalysisService } from '../../services/routine-analysis.service';
import { Observable, Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-detection-viewer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './detection-viewer.component.html',
    styleUrls: ['./detection-viewer.component.css']
})
export class DetectionViewerComponent implements OnInit, OnDestroy {
    @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;

    detectionFrame$: Observable<DetectionFrame>;
    modelLoaded$: Observable<boolean>;
    modelError$: Observable<string | null>;

    currentFrame: DetectionFrame | null = null;
    isRunning = false;
    detectionStats: any = null;
    private cameraState: any = null;

    private destroy$ = new Subject<void>();
    private detectionInterval: any = null;

    constructor(
        private detectionService: DetectionService,
        private cameraService: CameraService,
        private arrivalLogService: ArrivalLogService,
        private routineAnalysisService: RoutineAnalysisService
    ) {
        this.detectionFrame$ = this.detectionService.detectionFrame$;
        this.modelLoaded$ = this.detectionService.modelLoaded$;
        this.modelError$ = this.detectionService.modelError$;
    }

    async ngOnInit(): Promise<void> {
        // Subscribe to camera state to get video element
        this.cameraService.cameraState$
            .pipe(takeUntil(this.destroy$))
            .subscribe(state => {
                this.cameraState = state;
            });

        // Subscribe to detection frames
        this.detectionFrame$
            .pipe(takeUntil(this.destroy$))
            .subscribe(frame => {
                this.currentFrame = frame;
                this.updateStats();
                this.drawDetections();
            });

        // Load the model
        try {
            await this.detectionService.initializeModel();
        } catch (error) {
            console.error('Failed to initialize detection model:', error);
        }
    }

    ngOnDestroy(): void {
        this.stopDetection();
        this.detectionService.disposeModel();
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Start continuous detection
     */
    async startDetection(): Promise<void> {
        if (!this.cameraState?.videoElement || this.isRunning) {
            console.warn('Camera not ready or detection already running');
            return;
        }

        if (!this.detectionService.isModelLoaded()) {
            console.error('Model not loaded');
            return;
        }

        this.isRunning = true;

        // Run detection at ~15 FPS (every 66ms)
        this.detectionInterval = setInterval(async () => {
            try {
                const frame = await this.detectionService.detectFromVideoElement(
                    this.cameraState.videoElement,
                    0.7
                );

                // Check for person and log arrival
                const personDetection = this.detectionService.getHighestConfidence(
                    frame,
                    'person'
                );

                if (
                    personDetection &&
                    !this.arrivalLogService.wasRecentlyDetected(60)
                ) {
                    // Log arrival every 60 seconds minimum
                    this.arrivalLogService.logArrival(personDetection.score);
                    console.log('Person detected and logged!', personDetection);

                    // Trigger routine analysis after logging arrival
                    this.routineAnalysisService.analyzeRoutine();
                }
            } catch (error) {
                console.error('Detection error:', error);
            }
        }, 66);
    }

    /**
     * Stop continuous detection
     */
    stopDetection(): void {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        this.isRunning = false;
    }

    /**
     * Draw bounding boxes on canvas
     */
    private drawDetections(): void {
        if (!this.canvasElement || !this.currentFrame || !this.cameraState?.videoElement) {
            return;
        }

        const canvas = this.canvasElement.nativeElement;
        const ctx = canvas.getContext('2d');
        const videoElement = this.cameraState.videoElement;

        if (!ctx) return;

        // Set canvas size to match video
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw detections
        this.currentFrame.detections.forEach(detection => {
            this.drawBoundingBox(ctx, detection, canvas.width, canvas.height);
        });
    }

    /**
     * Draw single bounding box
     */
    private drawBoundingBox(
        ctx: CanvasRenderingContext2D,
        detection: Detection,
        canvasWidth: number,
        canvasHeight: number
    ): void {
        const [x, y, width, height] = detection.bbox;

        // Set color based on class
        const color = detection.class === 'person' ? '#00FF00' : '#FF00FF';
        const thickness = 3;

        // Draw rectangle
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.strokeRect(x, y, width, height);

        // Draw label
        const label = `${detection.class} ${(detection.score * 100).toFixed(1)}%`;
        ctx.fillStyle = color;
        ctx.font = '14px Arial';
        ctx.fillText(label, x + 5, y - 5);
    }

    /**
     * Update statistics from latest detections
     */
    private updateStats(): void {
        if (!this.currentFrame) return;

        const personDetections = this.detectionService.filterByClass(
            this.currentFrame,
            'person'
        );

        this.detectionStats = {
            totalDetections: this.currentFrame.detections.length,
            personDetections: personDetections.length,
            highestConfidence: personDetections.length > 0
                ? Math.max(...personDetections.map(d => d.score))
                : 0,
            frameNumber: this.currentFrame.frameCount
        };
    }

    /**
     * Get formatted stats for display
     */
    get stats(): any {
        return this.detectionStats || {
            totalDetections: 0,
            personDetections: 0,
            highestConfidence: 0,
            frameNumber: 0
        };
    }
}
