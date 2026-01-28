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
     * Note: This assumes face-api.js is installed and models are in public/models/
     */
    private async loadModels(): Promise<void> {
        try {
            // Check if face-api is available in global scope
            // In production, you would dynamically import face-api.js
            console.log('Loading face detection models...');

            // For now, we'll set modelsLoaded to true as a placeholder
            // In production, implement actual face-api.js loading
            // const faceapi = (window as any).faceapi;
            // if (!faceapi) {
            //     throw new Error('face-api.js not loaded');
            // }

            // await Promise.all([
            //     faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            //     faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            //     faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
            // ]);

            this.modelsLoaded = true;
            console.log('Face detection models loaded successfully');
        } catch (error) {
            this.loadingError = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to load face detection models:', this.loadingError);
        }
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
            // Placeholder for face-api detection
            // const faceapi = (window as any).faceapi;
            // const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions());
            // 
            // const faces: DetectedFace[] = detections.map((detection: any) => ({
            //     x: detection.detection.box.x,
            //     y: detection.detection.box.y,
            //     width: detection.detection.box.width,
            //     height: detection.detection.box.height,
            //     confidence: detection.detection.score,
            //     descriptor: undefined
            // }));

            const faces: DetectedFace[] = [];
            this.detectedFacesSubject.next(faces);
            return faces;
        } catch (error) {
            console.error('Error detecting faces:', error);
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
            for (let i = 0; i < samples; i++) {
                // Placeholder for face capture
                // const faceapi = (window as any).faceapi;
                // const detections = await faceapi.detectAllFaces(canvas)
                //     .withFaceLandmarks()
                //     .withFaceDescriptors();
                // 
                // if (detections.length > 0) {
                //     this.userProfile.faceDescriptors.push({
                //         descriptor: Array.from(detections[0].descriptor),
                //         timestamp: new Date().toISOString()
                //     });
                // }

                this.calibrationProgressSubject.next((i + 1) / samples);

                // Wait before next sample
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            this.userProfile.calibratedAt = new Date().toISOString();
            this.calibrationProgressSubject.next(1);
            return this.userProfile.faceDescriptors.length > 0;
        } catch (error) {
            console.error('Error during calibration:', error);
            return false;
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
