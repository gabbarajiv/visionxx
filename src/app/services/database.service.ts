import { Injectable } from '@angular/core';
import { Arrival } from '../models/arrival.model';
import { Routine } from '../models/routine.model';
import { AppSettings } from '../models/settings.model';

/**
 * Greeting log entry
 */
export interface GreetingLogEntry {
    message: string;
    timestamp: string;
    timeOfDay: string;
}

/**
 * User face profile
 */
export interface UserFaceProfile {
    faceDescriptors: Array<{
        descriptor: number[];
        timestamp: string;
    }>;
    calibratedAt: string | null;
}

/**
 * Database structure stored in db.json
 */
export interface Database {
    arrivals: Arrival[];
    routine: Routine | null;
    settings: AppSettings;
    greetings: GreetingLogEntry[];
    userProfile: UserFaceProfile | null;
}

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {
    private db: Database = {
        arrivals: [],
        routine: null,
        settings: {
            webcamId: 'default',
            detectionModel: 'coco-ssd',
            minConfidence: 0.7,
            enableGreeting: true,
            greetingVolume: 0.8,
            timezone: 'America/New_York'
        },
        greetings: [],
        userProfile: null
    };

    private readonly DB_FILE = 'data/db.json';

    constructor() {
        this.loadDatabase();
    }

    /**
     * Load database from file (in Electron context)
     */
    private loadDatabase(): void {
        // In browser context, we'll initialize with defaults
        // In Electron context, we'll load from file via IPC
        console.log('Database initialized with defaults');
    }

    /**
     * Get full database
     */
    getDatabase(): Database {
        return this.db;
    }

    /**
     * Add arrival record
     */
    addArrival(arrival: Arrival): void {
        this.db.arrivals.push(arrival);
        this.persistDatabase();
    }

    /**
     * Get all arrivals
     */
    getArrivals(): Arrival[] {
        return [...this.db.arrivals];
    }

    /**
     * Get arrivals within date range
     */
    getArrivalsByDateRange(startDate: string, endDate: string): Arrival[] {
        return this.db.arrivals.filter(a =>
            a.date >= startDate && a.date <= endDate
        );
    }

    /**
     * Get last N arrivals
     */
    getRecentArrivals(count: number): Arrival[] {
        return this.db.arrivals.slice(-count);
    }

    /**
     * Update routine analysis
     */
    updateRoutine(routine: Routine): void {
        this.db.routine = routine;
        this.persistDatabase();
    }

    /**
     * Get routine analysis
     */
    getRoutine(): Routine | null {
        return this.db.routine;
    }

    /**
     * Update settings
     */
    updateSettings(settings: Partial<AppSettings>): void {
        this.db.settings = {
            ...this.db.settings,
            ...settings
        };
        this.persistDatabase();
    }

    /**
     * Get settings
     */
    getSettings(): AppSettings {
        return { ...this.db.settings };
    }

    /**
     * Persist database to file (will be called via IPC in Electron)
     */
    private persistDatabase(): void {
        // In Electron context, this will be handled via IPC
        // In browser context, we'll use localStorage as fallback
        try {
            localStorage.setItem('sentry-bot-db', JSON.stringify(this.db));
        } catch (error) {
            console.error('Failed to persist database:', error);
        }
    }

    /**
     * Clear all data
     */
    clearDatabase(): void {
        this.db = {
            arrivals: [],
            routine: null,
            settings: this.db.settings,
            greetings: [],
            userProfile: null
        };
        this.persistDatabase();
    }

    /**
     * Get greetings log
     */
    getGreetings(): GreetingLogEntry[] {
        return [...(this.db.greetings || [])];
    }

    /**
     * Set greetings log
     */
    setGreetings(greetings: GreetingLogEntry[]): void {
        this.db.greetings = greetings;
        this.persistDatabase();
    }

    /**
     * Get user face profile
     */
    getUserFaceProfile(): UserFaceProfile | null {
        return this.db.userProfile;
    }

    /**
     * Set user face profile
     */
    setUserFaceProfile(profile: UserFaceProfile): void {
        this.db.userProfile = profile;
        this.persistDatabase();
    }
}
