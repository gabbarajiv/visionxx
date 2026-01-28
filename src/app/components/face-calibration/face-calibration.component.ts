import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaceDetectionService } from '../../services/face-detection.service';
import { DatabaseService } from '../../services/database.service';

@Component({
    selector: 'app-face-calibration',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './face-calibration.component.html',
    styleUrl: './face-calibration.component.css'
})
export class FaceCalibrationComponent implements OnInit, OnDestroy {
    @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
    @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

    isCalibrated = false;
    isCalibrating = false;
    calibrationProgress = 0;
    errorMessage = '';
    successMessage = '';
    videoStream: MediaStream | null = null;

    constructor(
        private faceService: FaceDetectionService,
        private dbService: DatabaseService
    ) { }

    ngOnInit(): void {
        this.checkCalibration();
        this.setupVideo();
    }

    ngOnDestroy(): void {
        this.stopVideo();
    }

    checkCalibration(): void {
        const profile = this.dbService.getUserFaceProfile();
        this.isCalibrated = profile !== null && profile.faceDescriptors.length > 0;
    }

    setupVideo(): void {
        if (!navigator.mediaDevices?.getUserMedia) {
            this.errorMessage = 'Camera access not available';
            return;
        }

        navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
            .then(stream => {
                this.videoStream = stream;
                if (this.videoElement) {
                    this.videoElement.nativeElement.srcObject = stream;
                }
            })
            .catch(error => {
                this.errorMessage = `Camera error: ${error.message}`;
                console.error('Camera access error:', error);
            });
    }

    stopVideo(): void {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
    }

    async startCalibration(): Promise<void> {
        if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) {
            this.errorMessage = 'Camera or canvas not available';
            return;
        }

        this.isCalibrating = true;
        this.errorMessage = '';
        this.successMessage = '';
        this.calibrationProgress = 0;

        try {
            const canvas = this.canvasElement.nativeElement;
            const video = this.videoElement.nativeElement;

            // Draw video frame to canvas
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Canvas context not available');
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Start calibration
            const success = await this.faceService.startCalibration(canvas, 5);

            if (success) {
                const userProfile = this.faceService.getUserProfile();
                this.dbService.setUserFaceProfile({
                    faceDescriptors: userProfile.faceDescriptors,
                    calibratedAt: userProfile.calibratedAt
                });

                this.isCalibrated = true;
                this.successMessage = 'Face calibration completed successfully!';
            } else {
                this.errorMessage = 'Failed to calibrate face. Please try again with better lighting.';
            }
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : 'Calibration failed';
            console.error('Calibration error:', error);
        } finally {
            this.isCalibrating = false;
        }
    }

    resetCalibration(): void {
        this.dbService.setUserFaceProfile({
            faceDescriptors: [],
            calibratedAt: null
        });
        this.isCalibrated = false;
        this.successMessage = '';
        this.errorMessage = '';
    }

    captureFrame(): void {
        if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) {
            return;
        }

        const canvas = this.canvasElement.nativeElement;
        const video = this.videoElement.nativeElement;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
}
