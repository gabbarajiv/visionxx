import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CameraService } from '../../services/camera.service';
import { DetectionService, Detection, DetectionFrame } from '../../services/detection.service';
import { DetectionStatsService, DetectionStats } from '../../services/detection-stats.service';
import { FaceDetectionService, DetectedFace } from '../../services/face-detection.service';
import { ArrivalLogService } from '../../services/arrival-log.service';
import { RoutineAnalysisService } from '../../services/routine-analysis.service';
import { DatabaseService } from '../../services/database.service';
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
    detectedFaces: Array<{ face: DetectedFace; matchConfidence: number }> = [];
    isRunning = false;
    detectionStats: any = null;
    detectionStats$: Observable<DetectionStats | null>;
    isFaceCalibrated = false;
    faceModelsLoaded = false;
    private cameraState: any = null;

    private destroy$ = new Subject<void>();
    private detectionInterval: any = null;

    constructor(
        private detectionService: DetectionService,
        private detectionStatsService: DetectionStatsService,
        private faceDetectionService: FaceDetectionService,
        private cameraService: CameraService,
        private arrivalLogService: ArrivalLogService,
        private routineAnalysisService: RoutineAnalysisService,
        private dbService: DatabaseService
    ) {
        this.detectionFrame$ = this.detectionService.detectionFrame$;
        this.modelLoaded$ = this.detectionService.modelLoaded$;
        this.modelError$ = this.detectionService.modelError$;
        this.detectionStats$ = this.detectionStatsService.stats$;
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

        // Load the COCO-SSD model for object detection
        try {
            await this.detectionService.initializeModel();
        } catch (error) {
            console.error('Failed to initialize detection model:', error);
        }

        // Load face detection models
        try {
            console.log('Initializing face detection models...');
            // Face models will be loaded asynchronously by the service
            this.faceModelsLoaded = this.faceDetectionService.isModelsLoaded();

            // Check if user is calibrated
            const profile = this.dbService.getUserFaceProfile();
            this.isFaceCalibrated = profile !== null && profile.faceDescriptors.length > 0;

            if (profile !== null && this.isFaceCalibrated) {
                this.faceDetectionService.loadUserProfile(profile.faceDescriptors, profile.calibratedAt);
                console.log('Face profile loaded from database');
            }

            // Wait a bit for models to load in background
            setTimeout(() => {
                this.faceModelsLoaded = this.faceDetectionService.isModelsLoaded();
                if (this.faceModelsLoaded) {
                    console.log('Face detection models ready');
                }
            }, 2000);
        } catch (error) {
            console.error('Failed to initialize face detection:', error);
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
                // Validate video element is ready before detection
                if (!this.cameraState?.videoElement ||
                    this.cameraState.videoElement.videoWidth === 0 ||
                    this.cameraState.videoElement.videoHeight === 0 ||
                    this.cameraState.videoElement.readyState !== this.cameraState.videoElement.HAVE_ENOUGH_DATA) {
                    // Skip this frame silently - video not ready
                    return;
                }

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
                    let faceMatchConfidence = 0;

                    // Try to detect and match faces if calibrated and models are ready
                    if (this.isFaceCalibrated && this.faceModelsLoaded && this.cameraState?.videoElement) {
                        try {
                            const faceMatches = await this.faceDetectionService.detectAndMatchFaces(
                                this.cameraState.videoElement
                            );

                            if (faceMatches.length > 0) {
                                // Use the highest confidence match
                                faceMatchConfidence = Math.max(...faceMatches.map(m => m.matchConfidence));
                                console.log('Face match confidence:', faceMatchConfidence);
                            }
                        } catch (error) {
                            console.warn('Face detection error during arrival logging:', error);
                        }
                    }

                    this.arrivalLogService.logArrival(personDetection.score, faceMatchConfidence);
                    console.log('Person detected and logged!', personDetection, 'Face match:', faceMatchConfidence);

                    // Trigger routine analysis after logging arrival
                    this.routineAnalysisService.analyzeRoutine();
                }

                // Also detect faces for visualization even if person detection didn't trigger logging
                if (this.faceModelsLoaded && this.isFaceCalibrated && this.cameraState?.videoElement) {
                    try {
                        this.detectedFaces = await this.faceDetectionService.detectAndMatchFaces(
                            this.cameraState.videoElement
                        );
                    } catch (error) {
                        console.warn('Face visualization error:', error);
                    }
                }
            } catch (error) {
                // Only log non-validation errors
                const errorMsg = error instanceof Error ? error.message : String(error);
                if (!errorMsg.includes('Video element is not ready')) {
                    console.error('Detection error:', error);
                }
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
        if (!this.canvasElement || !this.cameraState?.videoElement) {
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

        // Draw object detection results
        if (this.currentFrame) {
            this.currentFrame.detections.forEach(detection => {
                this.drawBoundingBox(ctx, detection, canvas.width, canvas.height);
            });
        }

        // Draw face detection results with match confidence
        if (this.detectedFaces.length > 0) {
            this.detectedFaces.forEach(result => {
                this.drawFaceBoundingBox(ctx, result.face, result.matchConfidence);
            });
        }
    }

    /**
     * Draw single bounding box for object detection
     */
    private drawBoundingBox(
        ctx: CanvasRenderingContext2D,
        detection: Detection,
        canvasWidth: number,
        canvasHeight: number
    ): void {
        const [x, y, width, height] = detection.bbox;

        // Set color based on class
        let color = '#FF00FF'; // Default magenta

        // Use specific colors for different classes
        if (detection.class === 'person') {
            color = '#00FF00'; // Green for person
        } else if (['cat', 'dog', 'bird', 'horse', 'cow', 'sheep', 'elephant', 'bear', 'zebra', 'giraffe'].includes(detection.class)) {
            color = '#FF6600'; // Orange for animals
        } else if (['chair', 'sofa', 'bed', 'table', 'diningtable'].includes(detection.class)) {
            color = '#0099FF'; // Light blue for furniture
        } else if (['bottle', 'cup', 'bowl', 'fork', 'knife', 'spoon'].includes(detection.class)) {
            color = '#FFCC00'; // Yellow for objects/kitchenware
        }

        const thickness = 3;

        // Draw rectangle
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.strokeRect(x, y, width, height);

        // Draw label with more details
        const label = this.detectionService.formatDetectionLabel(detection);
        ctx.fillStyle = color;
        ctx.font = 'bold 14px Arial';
        ctx.fillText(label, x + 5, y - 5);

        // Draw a small info box for important detections
        if (detection.score > 0.85) {
            const bgHeight = 20;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, y - bgHeight - 5, 150, bgHeight);
            ctx.fillStyle = color;
            ctx.font = 'bold 12px Arial';
            ctx.fillText(`Confidence: ${(detection.score * 100).toFixed(1)}%`, x + 5, y - 10);
        }
    }

    /**
     * Draw face bounding box with match confidence
     */
    private drawFaceBoundingBox(
        ctx: CanvasRenderingContext2D,
        face: DetectedFace,
        matchConfidence: number
    ): void {
        // Use different colors based on match confidence
        let color = '#FF0000'; // Red - no match
        if (matchConfidence > 0.7) {
            color = '#00FF00'; // Green - high confidence match
        } else if (matchConfidence > 0.5) {
            color = '#FFFF00'; // Yellow - medium confidence match
        }

        const thickness = 2;

        // Draw rectangle
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.strokeRect(face.x, face.y, face.width, face.height);

        // Draw label with confidence
        const label = `Face ${(matchConfidence * 100).toFixed(1)}%`;
        ctx.fillStyle = color;
        ctx.font = 'bold 12px Arial';
        ctx.fillText(label, face.x + 5, face.y - 8);
    }

    /**
     * Update statistics from latest detections
     */
    private updateStats(): void {
        if (!this.currentFrame) return;

        const stats = this.detectionStatsService.analyzeFrame(this.currentFrame);
        this.detectionStats = stats;

        console.log('Detection Summary:', this.detectionStatsService.getSummary());
    }

    /**
     * Get formatted stats for display
     */
    get stats(): any {
        return this.detectionStats || {
            totalDetections: 0,
            personsDetected: 0,
            animalsDetected: [],
            furnitureDetected: [],
            highConfidence: 0,
            frameNumber: 0
        };
    }
}
