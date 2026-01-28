import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Face detection service using face-api.js
 * Note: face-api.js needs to be installed via npm
 */
export interface FaceDescriptor {
    descriptor: number[];
    timestamp: string;
}

export interface DetectedFace {
    x: number;
    y: number;
    width: number;
    height: number;
    descriptor?: number[];
    confidence: number;
}

@Injectable({
    providedIn: 'root'
})
export class FaceDetectionService {
    private modelsLoaded = false;
    private loadingError: string | null = null;

    private detectedFacesSubject = new BehaviorSubject<DetectedFace[]>([]);
    public detectedFaces$: Observable<DetectedFace[]> = this.detectedFacesSubject.asObservable();

    private calibrationProgressSubject = new BehaviorSubject<number>(0);
    public calibrationProgress$: Observable<number> = this.calibrationProgressSubject.asObservable();

    private userProfile: {
        faceDescriptors: FaceDescriptor[];
        calibratedAt: string | null;
    } = {
            faceDescriptors: [],
            calibratedAt: null
        };

    constructor() {
        this.loadModels();
    }

    /**
     * Load face-api models
     * Models are loaded from CDN to avoid bundling large model files
     */
    private async loadModels(): Promise<void> {
        try {
            console.log('Loading face detection models...');

            // Import face-api dynamically
            const faceapi = (window as any).faceapi;
            if (!faceapi) {
                // Try to load face-api from node_modules via script tag
                await this.loadFaceApiScript();
            }

            const faceapi2 = (window as any).faceapi;
            if (!faceapi2) {
                throw new Error('face-api.js library not available');
            }

            // Load models from CDN (more reliable than local files)
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.10/dist/models/';

            await Promise.all([
                faceapi2.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi2.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi2.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi2.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);

            this.modelsLoaded = true;
            console.log('Face detection models loaded successfully');
        } catch (error) {
            this.loadingError = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to load face detection models:', this.loadingError);
        }
    }

    /**
     * Load face-api.js script dynamically
     */
    private loadFaceApiScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if ((window as any).faceapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.10/dist/face-api.min.js';
            script.async = true;
            script.onload = () => {
                console.log('face-api.js script loaded');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load face-api.js script'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Detect faces in a canvas element
     */
    async detectFaces(canvas: HTMLCanvasElement): Promise<DetectedFace[]> {
        if (!this.modelsLoaded) {
            console.warn('Face detection models not loaded yet');
            return [];
        }

        try {
            const faceapi = (window as any).faceapi;
            if (!faceapi) {
                console.warn('face-api.js not available');
                return [];
            }

            // Validate canvas
            if (!canvas || canvas.width === 0 || canvas.height === 0) {
                console.warn('Invalid canvas dimensions');
                return [];
            }

            // Detect all faces with landmarks and descriptors
            const detections = await faceapi
                .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();

            const faces: DetectedFace[] = detections.map((detection: any) => ({
                x: detection.detection.box.x,
                y: detection.detection.box.y,
                width: detection.detection.box.width,
                height: detection.detection.box.height,
                confidence: detection.detection.score,
                descriptor: Array.from(detection.descriptor)
            }));

            this.detectedFacesSubject.next(faces);
            return faces;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (!errorMsg.includes('already has') && !errorMsg.includes('deprecated')) {
                console.error('Error detecting faces:', error);
            }
            return [];
        }
    }

    /**
     * Start calibration: capture face descriptors for user
     */
    async startCalibration(canvas: HTMLCanvasElement, samples: number = 5): Promise<boolean> {
        if (!this.modelsLoaded) {
            console.error('Face detection models not loaded');
            return false;
        }

        this.userProfile.faceDescriptors = [];

        try {
            const faceapi = (window as any).faceapi;
            if (!faceapi) {
                console.error('face-api.js not available');
                return false;
            }

            for (let i = 0; i < samples; i++) {
                try {
                    // Detect faces with descriptors
                    const detections = await faceapi
                        .detectAllFaces(canvas)
                        .withFaceLandmarks()
                        .withFaceDescriptors();

                    if (detections.length > 0) {
                        // Capture the first detected face
                        const descriptor = Array.from(detections[0].descriptor) as number[];
                        this.userProfile.faceDescriptors.push({
                            descriptor: descriptor,
                            timestamp: new Date().toISOString()
                        });
                        console.log(`Captured calibration sample ${i + 1}/${samples}`);
                    } else {
                        console.warn(`No face detected in sample ${i + 1}, retrying...`);
                        i--; // Retry this sample
                        if (i < 0) i = 0;
                    }
                } catch (error) {
                    console.warn(`Error capturing sample ${i + 1}:`, error);
                }

                this.calibrationProgressSubject.next((i + 1) / samples);

                // Wait before next sample
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            if (this.userProfile.faceDescriptors.length > 0) {
                this.userProfile.calibratedAt = new Date().toISOString();
                this.calibrationProgressSubject.next(1);
                console.log(`Calibration complete with ${this.userProfile.faceDescriptors.length} samples`);
                return true;
            } else {
                console.error('No face descriptors captured during calibration');
                return false;
            }
        } catch (error) {
            console.error('Error during calibration:', error);
            return false;
        }
    }

    /**
     * Detect and match faces in video element
     */
    async detectAndMatchFaces(videoElement: HTMLVideoElement): Promise<Array<{
        face: DetectedFace;
        matchConfidence: number;
    }>> {
        if (!this.modelsLoaded) {
            return [];
        }

        try {
            // Validate video element
            if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
                console.warn('Invalid video element for face detection');
                return [];
            }

            const faceapi = (window as any).faceapi;
            if (!faceapi) {
                return [];
            }

            // Detect all faces with descriptors
            const detections = await faceapi
                .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();

            if (detections.length === 0) {
                return [];
            }

            const results = detections.map((detection: any) => {
                const face: DetectedFace = {
                    x: detection.detection.box.x,
                    y: detection.detection.box.y,
                    width: detection.detection.box.width,
                    height: detection.detection.box.height,
                    confidence: detection.detection.score,
                    descriptor: Array.from(detection.descriptor)
                };

                // Match against user profile if calibrated
                const matchConfidence = face.descriptor ? this.matchFace(face.descriptor) : 0;

                return {
                    face,
                    matchConfidence
                };
            });

            return results;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (!errorMsg.includes('already has') && !errorMsg.includes('deprecated')) {
                console.error('Error in detectAndMatchFaces:', error);
            }
            return [];
        }
    }

    /**
     * Match a detected face against user profile
     */
    matchFace(detectedDescriptor: number[]): number {
        if (this.userProfile.faceDescriptors.length === 0) {
            return 0; // No user profile to match against
        }

        // Calculate average distance to user profile descriptors
        const distances = this.userProfile.faceDescriptors.map(profile =>
            this.euclideanDistance(detectedDescriptor, profile.descriptor)
        );

        const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;

        // Convert distance to confidence (lower distance = higher confidence)
        // Distance threshold of 0.6 is typical for face-api.js
        const confidence = Math.max(0, 1 - avgDistance / 0.6);
        return confidence;
    }

    /**
     * Calculate Euclidean distance between two descriptors
     */
    private euclideanDistance(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            return Infinity;
        }

        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            const diff = a[i] - b[i];
            sum += diff * diff;
        }

        return Math.sqrt(sum);
    }

    /**
     * Get user profile
     */
    getUserProfile() {
        return { ...this.userProfile };
    }

    /**
     * Load user profile from database
     */
    loadUserProfile(faceDescriptors: FaceDescriptor[], calibratedAt: string | null): void {
        this.userProfile = {
            faceDescriptors,
            calibratedAt
        };
    }

    /**
     * Check if user is calibrated
     */
    isCalibrated(): boolean {
        return this.userProfile.faceDescriptors.length > 0 && this.userProfile.calibratedAt !== null;
    }

    /**
     * Get loading status
     */
    isModelsLoaded(): boolean {
        return this.modelsLoaded;
    }

    /**
     * Get loading error if any
     */
    getLoadingError(): string | null {
        return this.loadingError;
    }
}
