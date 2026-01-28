import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { AudioSettingsComponent } from '../audio-settings/audio-settings.component';
import { FaceCalibrationComponent } from '../face-calibration/face-calibration.component';
import { AppSettings } from '../../models/settings.model';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, AudioSettingsComponent, FaceCalibrationComponent],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
    settings: AppSettings | null = null;
    activeTab = 'general';
    savedMessage = '';

    detectionModels = ['coco-ssd', 'mobilenet', 'posenet'];
    timezones = [
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Anchorage',
        'Pacific/Honolulu',
        'UTC'
    ];

    constructor(private dbService: DatabaseService) { }

    ngOnInit(): void {
        this.settings = this.dbService.getSettings();
    }

    updateSettings(): void {
        if (this.settings) {
            this.dbService.updateSettings(this.settings);
            this.showSavedMessage();
        }
    }

    updateMinConfidence(value: number): void {
        if (this.settings) {
            this.settings.minConfidence = value;
            this.updateSettings();
        }
    }

    showSavedMessage(): void {
        this.savedMessage = 'Settings saved successfully!';
        setTimeout(() => {
            this.savedMessage = '';
        }, 3000);
    }

    switchTab(tab: string): void {
        this.activeTab = tab;
    }

    exportSettings(): void {
        const data = JSON.stringify(this.dbService.getDatabase(), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sentry-bot-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    clearAllData(): void {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            this.dbService.clearDatabase();
            this.settings = this.dbService.getSettings();
            this.showSavedMessage();
        }
    }
}
