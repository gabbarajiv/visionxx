import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioService } from '../../services/audio.service';
import { GreetingService } from '../../services/greeting.service';
import { DatabaseService } from '../../services/database.service';

@Component({
    selector: 'app-audio-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './audio-settings.component.html',
    styleUrl: './audio-settings.component.css'
})
export class AudioSettingsComponent implements OnInit {
    volume = 0.8;
    greetingEnabled = true;
    availableVoices: SpeechSynthesisVoice[] = [];
    selectedVoiceIndex = 0;

    constructor(
        private audioService: AudioService,
        private greetingService: GreetingService,
        private dbService: DatabaseService
    ) { }

    ngOnInit(): void {
        const settings = this.dbService.getSettings();
        this.volume = settings.greetingVolume;
        this.greetingEnabled = settings.enableGreeting;
        this.availableVoices = this.audioService.getAvailableVoices();
    }

    updateVolume(value: number): void {
        this.volume = value;
        this.audioService.setVolume(value);
        const settings = this.dbService.getSettings();
        settings.greetingVolume = value;
        this.dbService.updateSettings(settings);
    }

    toggleGreeting(): void {
        this.greetingEnabled = !this.greetingEnabled;
        const settings = this.dbService.getSettings();
        settings.enableGreeting = this.greetingEnabled;
        this.dbService.updateSettings(settings);
    }

    testGreeting(): void {
        this.greetingService.greet();
    }

    stopAudio(): void {
        this.audioService.stop();
    }
}
