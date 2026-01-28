import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CameraState {
    isActive: boolean;
    isError: boolean;
    errorMessage: string | null;
    videoElement: HTMLVideoElement | null;
}

@Injectable({
    providedIn: 'root'
})
export class CameraService {
    private cameraState = new BehaviorSubject<CameraState>({
        isActive: false,
        isError: false,
        errorMessage: null,
        videoElement: null
    });

    public cameraState$ = this.cameraState.asObservable();

    private stream: MediaStream | null = null;

    constructor() { }

    /**
     * Initialize camera and get video stream
     * @param videoElement HTML video element to attach stream to
     * @param width Desired video width
     * @param height Desired video height
     */
    async setupCamera(
        videoElement: HTMLVideoElement,
        width: number = 640,
        height: number = 480
    ): Promise<void> {
        try {
            this.updateState({ isError: false, errorMessage: null });

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: width },
                    height: { ideal: height }
                },
                audio: false
            });

            this.stream = stream;
            videoElement.srcObject = stream;

            // Wait for video to load
            await new Promise((resolve) => {
                videoElement.onloadedmetadata = () => resolve(null);
            });

            this.updateState({
                isActive: true,
                videoElement: videoElement
            });
        } catch (error) {
            const errorMessage = this.getErrorMessage(error);
            console.error('Camera error:', errorMessage);

            this.updateState({
                isError: true,
                errorMessage: errorMessage
            });

            throw new Error(errorMessage);
        }
    }

    /**
     * Stop camera stream
     */
    stopCamera(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.updateState({
            isActive: false,
            videoElement: null
        });
    }

    /**
     * Get current state
     */
    getCurrentState(): CameraState {
        return this.cameraState.value;
    }

    /**
     * Get list of available video devices
     */
    async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error enumerating devices:', error);
            return [];
        }
    }

    /**
     * Switch to a different camera device
     */
    async switchDevice(
        videoElement: HTMLVideoElement,
        deviceId: string
    ): Promise<void> {
        this.stopCamera();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
                audio: false
            });

            this.stream = stream;
            videoElement.srcObject = stream;

            this.updateState({
                isActive: true,
                videoElement: videoElement,
                isError: false,
                errorMessage: null
            });
        } catch (error) {
            const errorMessage = this.getErrorMessage(error);
            this.updateState({
                isError: true,
                errorMessage: errorMessage
            });
            throw new Error(errorMessage);
        }
    }

    /**
     * Capture current frame as image data
     */
    captureFrame(videoElement: HTMLVideoElement): ImageData | null {
        if (!videoElement || !this.cameraState.value.isActive) {
            return null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(videoElement, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * Get video dimensions
     */
    getVideoDimensions(videoElement: HTMLVideoElement): { width: number; height: number } {
        return {
            width: videoElement.videoWidth,
            height: videoElement.videoHeight
        };
    }

    /**
     * Private helper to update state
     */
    private updateState(partial: Partial<CameraState>): void {
        const current = this.cameraState.value;
        this.cameraState.next({ ...current, ...partial });
    }

    /**
     * Helper to get user-friendly error messages
     */
    private getErrorMessage(error: any): string {
        if (error instanceof DOMException) {
            switch (error.name) {
                case 'NotAllowedError':
                    return 'Camera permission denied. Please allow access to your camera in browser settings.';
                case 'NotFoundError':
                    return 'No camera device found. Please check if a camera is connected.';
                case 'NotReadableError':
                    return 'Camera is already in use. Please close other applications using the camera.';
                case 'SecurityError':
                    return 'Security error: Cannot access camera. HTTPS or localhost required.';
                default:
                    return `Camera error: ${error.message}`;
            }
        }
        return `Camera error: ${error?.message || 'Unknown error'}`;
    }
}
