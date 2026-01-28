import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { RoutineAnalysisService } from './routine-analysis.service';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Greeting templates based on time of day
 */
export enum GreetingTimeOfDay {
    EARLY_MORNING = 'early-morning', // 5:00 - 8:00
    MORNING = 'morning', // 8:00 - 12:00
    AFTERNOON = 'afternoon', // 12:00 - 17:00
    EVENING = 'evening', // 17:00 - 21:00
    LATE_NIGHT = 'late-night' // 21:00 - 5:00
}

export interface GreetingEvent {
    message: string;
    timestamp: Date;
    timeOfDay: GreetingTimeOfDay;
}

@Injectable({
    providedIn: 'root'
})
export class GreetingService {
    private lastGreetingTime: Date | null = null;
    private readonly GREETING_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

    private greetingSubject = new BehaviorSubject<GreetingEvent | null>(null);
    public greeting$: Observable<GreetingEvent | null> = this.greetingSubject.asObservable();

    private greetingTemplates = {
        'early-morning': [
            'Good morning, Rajiv! You\'re up early!',
            'Early bird catches the worm! Good morning!',
            'Rise and shine!'
        ],
        'morning': [
            'Good morning, Rajiv!',
            'Morning, Rajiv!',
            'Hello there!'
        ],
        'afternoon': [
            'Hello, Rajiv!',
            'Welcome back, Rajiv!',
            'Good afternoon!'
        ],
        'evening': [
            'Welcome back, Rajiv!',
            'Good evening, Rajiv!',
            'How was your day?'
        ],
        'late-night': [
            'Late night arrival detected!',
            'You\'re up late!',
            'Welcome home!'
        ]
    };

    constructor(
        private dbService: DatabaseService,
        private routineService: RoutineAnalysisService
    ) { }

    /**
     * Check if current time is within routine window and trigger greeting if appropriate
     */
    checkAndGreet(): void {
        const routine = this.dbService.getRoutine();
        if (!routine || !this.isGreetingEnabled()) {
            return;
        }

        const now = new Date();
        const currentTime = this.timeToMinutes(now.toTimeString().slice(0, 5));
        const windowStart = this.timeToMinutes(routine.windowStart);
        const windowEnd = this.timeToMinutes(routine.windowEnd);

        // Check if within window
        if (currentTime >= windowStart && currentTime <= windowEnd) {
            // Check cooldown
            if (this.canGreetNow()) {
                this.greet();
            }
        }
    }

    /**
     * Trigger greeting immediately
     */
    greet(): void {
        const now = new Date();
        const timeOfDay = this.getTimeOfDay(now);
        const templates = this.greetingTemplates[timeOfDay] || this.greetingTemplates['afternoon'];
        const message = templates[Math.floor(Math.random() * templates.length)];

        const greetingEvent: GreetingEvent = {
            message,
            timestamp: now,
            timeOfDay
        };

        this.lastGreetingTime = now;
        this.greetingSubject.next(greetingEvent);

        // Log greeting to database
        this.logGreeting(greetingEvent);

        // Speak the greeting
        this.speakGreeting(message);
    }

    /**
     * Speak greeting using Web Speech API
     */
    speakGreeting(message: string): void {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech Synthesis API not available');
            return;
        }

        const settings = this.dbService.getSettings();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.volume = settings.greetingVolume;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        window.speechSynthesis.speak(utterance);
    }

    /**
     * Log greeting event to database
     */
    private logGreeting(event: GreetingEvent): void {
        const greetings = this.dbService.getGreetings() || [];
        greetings.push({
            message: event.message,
            timestamp: event.timestamp.toISOString(),
            timeOfDay: event.timeOfDay
        });
        this.dbService.setGreetings(greetings);
    }

    /**
     * Determine time of day for greeting templates
     */
    private getTimeOfDay(date: Date): GreetingTimeOfDay {
        const hour = date.getHours();

        if (hour >= 5 && hour < 8) {
            return GreetingTimeOfDay.EARLY_MORNING;
        } else if (hour >= 8 && hour < 12) {
            return GreetingTimeOfDay.MORNING;
        } else if (hour >= 12 && hour < 17) {
            return GreetingTimeOfDay.AFTERNOON;
        } else if (hour >= 17 && hour < 21) {
            return GreetingTimeOfDay.EVENING;
        } else {
            return GreetingTimeOfDay.LATE_NIGHT;
        }
    }

    /**
     * Check if enough time has passed since last greeting
     */
    private canGreetNow(): boolean {
        if (this.lastGreetingTime === null) {
            return true;
        }

        const timeSinceLastGreeting = Date.now() - this.lastGreetingTime.getTime();
        return timeSinceLastGreeting >= this.GREETING_COOLDOWN_MS;
    }

    /**
     * Check if greeting is enabled in settings
     */
    private isGreetingEnabled(): boolean {
        return this.dbService.getSettings().enableGreeting;
    }

    /**
     * Convert time string (HH:mm) to minutes since midnight
     */
    private timeToMinutes(timeStr: string): number {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Get available voices for speech synthesis
     */
    getAvailableVoices(): SpeechSynthesisVoice[] {
        if (!('speechSynthesis' in window)) {
            return [];
        }
        return window.speechSynthesis.getVoices();
    }

    /**
     * Test greeting with preview
     */
    previewGreeting(): void {
        this.greet();
    }
}
