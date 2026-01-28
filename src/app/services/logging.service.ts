import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    data?: any;
}

@Injectable({
    providedIn: 'root'
})
export class LoggingService {
    private logs: LogEntry[] = [];
    private logsSubject = new BehaviorSubject<LogEntry[]>([]);
    public logs$: Observable<LogEntry[]> = this.logsSubject.asObservable();

    private readonly MAX_LOGS = 1000;
    private readonly LOG_STORAGE_KEY = 'sentry-bot-logs';

    constructor() {
        this.loadLogs();
        // Log app startup
        this.info('Application started', 'APP');
    }

    /**
     * Log a debug message
     */
    debug(message: string, context?: string, data?: any): void {
        this.log(LogLevel.DEBUG, message, context, data);
    }

    /**
     * Log an info message
     */
    info(message: string, context?: string, data?: any): void {
        this.log(LogLevel.INFO, message, context, data);
    }

    /**
     * Log a warning message
     */
    warn(message: string, context?: string, data?: any): void {
        this.log(LogLevel.WARN, message, context, data);
    }

    /**
     * Log an error message
     */
    error(message: string, context?: string, data?: any): void {
        this.log(LogLevel.ERROR, message, context, data);
        // Also log to console in development
        if (!this.isProduction()) {
            console.error(`[${context}] ${message}`, data);
        }
    }

    /**
     * Internal log function
     */
    private log(level: LogLevel, message: string, context?: string, data?: any): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: context || 'APP',
            data
        };

        this.logs.push(entry);

        // Keep log size manageable
        if (this.logs.length > this.MAX_LOGS) {
            this.logs = this.logs.slice(-this.MAX_LOGS);
        }

        this.logsSubject.next([...this.logs]);
        this.persistLogs();

        // Log to console
        this.logToConsole(entry);
    }

    /**
     * Log to browser console
     */
    private logToConsole(entry: LogEntry): void {
        const prefix = `[${entry.level}] [${entry.context}]`;
        const message = `${prefix} ${entry.message}`;

        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(message, entry.data || '');
                break;
            case LogLevel.INFO:
                console.log(message, entry.data || '');
                break;
            case LogLevel.WARN:
                console.warn(message, entry.data || '');
                break;
            case LogLevel.ERROR:
                console.error(message, entry.data || '');
                break;
        }
    }

    /**
     * Get all logs
     */
    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * Get logs filtered by level
     */
    getLogsByLevel(level: LogLevel): LogEntry[] {
        return this.logs.filter(l => l.level === level);
    }

    /**
     * Get logs filtered by context
     */
    getLogsByContext(context: string): LogEntry[] {
        return this.logs.filter(l => l.context === context);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
        this.logsSubject.next([]);
        localStorage.removeItem(this.LOG_STORAGE_KEY);
    }

    /**
     * Export logs as JSON
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Persist logs to localStorage
     */
    private persistLogs(): void {
        try {
            localStorage.setItem(this.LOG_STORAGE_KEY, JSON.stringify(this.logs));
        } catch (error) {
            console.warn('Failed to persist logs:', error);
        }
    }

    /**
     * Load logs from localStorage
     */
    private loadLogs(): void {
        try {
            const stored = localStorage.getItem(this.LOG_STORAGE_KEY);
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load logs:', error);
        }
    }

    /**
     * Check if running in production
     */
    private isProduction(): boolean {
        return !window.location.hostname.includes('localhost');
    }

    /**
     * Get application statistics
     */
    getStatistics() {
        return {
            totalLogs: this.logs.length,
            debugLogs: this.logs.filter(l => l.level === LogLevel.DEBUG).length,
            infoLogs: this.logs.filter(l => l.level === LogLevel.INFO).length,
            warnLogs: this.logs.filter(l => l.level === LogLevel.WARN).length,
            errorLogs: this.logs.filter(l => l.level === LogLevel.ERROR).length,
            oldestLog: this.logs.length > 0 ? this.logs[0].timestamp : null,
            newestLog: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null
        };
    }
}
