import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';

@Injectable({
    providedIn: 'root'
})
export class AudioService {
    constructor(private dbService: DatabaseService) { }

    /**
     * Speak text using Web Speech API
     */
    speak(text: string): void {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech Synthesis API not available');
            return;
        }

        const settings = this.dbService.getSettings();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = settings.greetingVolume;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    /**
     * Stop speaking
     */
    stop(): void {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    /**
     * Get available voices
     */
    getAvailableVoices(): SpeechSynthesisVoice[] {
        if (!('speechSynthesis' in window)) {
            return [];
        }
        return window.speechSynthesis.getVoices();
    }

    /**
     * Set volume (0-1)
     */
    setVolume(volume: number): void {
        const settings = this.dbService.getSettings();
        settings.greetingVolume = Math.max(0, Math.min(1, volume));
        this.dbService.updateSettings(settings);
    }

    /**
     * Get current volume
     */
    getVolume(): number {
        return this.dbService.getSettings().greetingVolume;
    }
}
