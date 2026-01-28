import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CameraService, CameraState } from '../../services/camera.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-camera-feed',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './camera-feed.component.html',
    styleUrls: ['./camera-feed.component.css']
})
export class CameraFeedComponent implements OnInit, OnDestroy {
    @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

    cameraState$: Observable<CameraState>;
    currentState: CameraState | null = null;
    availableDevices: MediaDeviceInfo[] = [];
    selectedDeviceId: string = '';

    private destroy$ = new Subject<void>();

    constructor(private cameraService: CameraService) {
        this.cameraState$ = this.cameraService.cameraState$;
    }

    async ngOnInit(): Promise<void> {
        // Subscribe to camera state updates
        this.cameraState$
            .pipe(takeUntil(this.destroy$))
            .subscribe(state => {
                this.currentState = state;
            });

        // Load available devices
        await this.loadAvailableDevices();

        // Try to auto-start camera
        await this.startCamera();
    }

    ngOnDestroy(): void {
        this.cameraService.stopCamera();
        this.destroy$.next();
        this.destroy$.complete();
    }

    async startCamera(): Promise<void> {
        if (!this.videoElement) {
            return;
        }

        try {
            await this.cameraService.setupCamera(
                this.videoElement.nativeElement,
                640,
                480
            );
        } catch (error) {
            console.error('Failed to start camera:', error);
        }
    }

    stopCamera(): void {
        this.cameraService.stopCamera();
    }

    async loadAvailableDevices(): Promise<void> {
        try {
            this.availableDevices = await this.cameraService.getAvailableDevices();
            if (this.availableDevices.length > 0) {
                this.selectedDeviceId = this.availableDevices[0].deviceId;
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
        }
    }

    async switchCamera(deviceId: string): Promise<void> {
        if (!this.videoElement) {
            return;
        }

        try {
            await this.cameraService.switchDevice(
                this.videoElement.nativeElement,
                deviceId
            );
            this.selectedDeviceId = deviceId;
        } catch (error) {
            console.error('Failed to switch camera:', error);
        }
    }

    get isLoading(): boolean {
        return this.currentState?.isActive === false && !this.currentState?.isError;
    }

    get hasError(): boolean {
        return this.currentState?.isError || false;
    }

    get errorMessage(): string {
        return this.currentState?.errorMessage || '';
    }
}
