import { TestBed } from '@angular/core/testing';
import { RoutineAnalysisService } from './routine-analysis.service';
import { DatabaseService } from './database.service';
import { Arrival } from '../models/arrival.model';

describe('RoutineAnalysisService', () => {
    let service: RoutineAnalysisService;
    let dbService: DatabaseService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(RoutineAnalysisService);
        dbService = TestBed.inject(DatabaseService);

        // Clear database before each test
        dbService.getDatabase().arrivals = [];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return null if less than 3 arrivals', () => {
        const result = service.analyzeRoutine();
        expect(result).toBeNull();
    });

    it('should analyze routine with 3 or more arrivals', () => {
        // Add test arrivals
        const arrivals: Arrival[] = [
            {
                id: '1',
                date: '2025-01-27',
                time: '17:30',
                day: 'Monday',
                confidence: 0.95,
                model: 'coco-ssd',
                timestamp: '2025-01-27T17:30:00Z'
            },
            {
                id: '2',
                date: '2025-01-28',
                time: '17:35',
                day: 'Tuesday',
                confidence: 0.92,
                model: 'coco-ssd',
                timestamp: '2025-01-28T17:35:00Z'
            },
            {
                id: '3',
                date: '2025-01-29',
                time: '17:25',
                day: 'Wednesday',
                confidence: 0.88,
                model: 'coco-ssd',
                timestamp: '2025-01-29T17:25:00Z'
            }
        ];

        arrivals.forEach(arrival => dbService.addArrival(arrival));

        const routine = service.analyzeRoutine();

        expect(routine).not.toBeNull();
        expect(routine?.sampleSize).toBe(3);
        expect(routine?.meanArrivalTime).toBeDefined();
        expect(routine?.windowStart).toBeDefined();
        expect(routine?.windowEnd).toBeDefined();
        expect(routine?.standardDeviation).toBeGreaterThanOrEqual(0);
        expect(routine?.confidence).toBeGreaterThan(0);
        expect(routine?.confidence).toBeLessThanOrEqual(1);
    });

    it('should calculate correct mean arrival time', () => {
        // Times: 17:30 (1050 min), 17:40 (1060 min), 17:20 (1040 min) -> avg 1050 -> 17:30
        const arrivals: Arrival[] = [
            {
                id: '1',
                date: '2025-01-27',
                time: '17:30',
                day: 'Monday',
                confidence: 0.95,
                model: 'coco-ssd',
                timestamp: '2025-01-27T17:30:00Z'
            },
            {
                id: '2',
                date: '2025-01-28',
                time: '17:40',
                day: 'Tuesday',
                confidence: 0.92,
                model: 'coco-ssd',
                timestamp: '2025-01-28T17:40:00Z'
            },
            {
                id: '3',
                date: '2025-01-29',
                time: '17:20',
                day: 'Wednesday',
                confidence: 0.88,
                model: 'coco-ssd',
                timestamp: '2025-01-29T17:20:00Z'
            }
        ];

        arrivals.forEach(arrival => dbService.addArrival(arrival));
        const routine = service.analyzeRoutine();

        expect(routine?.meanArrivalTime).toBe('17:30');
    });

    it('should analyze routine by specific day', () => {
        const arrivals: Arrival[] = [
            {
                id: '1',
                date: '2025-01-27',
                time: '17:30',
                day: 'Monday',
                confidence: 0.95,
                model: 'coco-ssd',
                timestamp: '2025-01-27T17:30:00Z'
            },
            {
                id: '2',
                date: '2025-02-03',
                time: '17:35',
                day: 'Monday',
                confidence: 0.92,
                model: 'coco-ssd',
                timestamp: '2025-02-03T17:35:00Z'
            },
            {
                id: '3',
                date: '2025-01-28',
                time: '18:00',
                day: 'Tuesday',
                confidence: 0.88,
                model: 'coco-ssd',
                timestamp: '2025-01-28T18:00:00Z'
            }
        ];

        arrivals.forEach(arrival => dbService.addArrival(arrival));

        const mondayRoutine = service.analyzeRoutineByDay('Monday');
        expect(mondayRoutine).not.toBeNull();
        expect(mondayRoutine?.sampleSize).toBe(2);

        const tuesdayRoutine = service.analyzeRoutineByDay('Tuesday');
        expect(tuesdayRoutine).toBeNull(); // Only 1 arrival on Tuesday
    });

    it('should return null if next predicted arrival cannot be determined', () => {
        const result = service.getNextPredictedArrival();
        expect(result).toBeNull();
    });

    it('should determine if current time is in predicted window', () => {
        const arrivals: Arrival[] = [
            {
                id: '1',
                date: '2025-01-27',
                time: '17:30',
                day: 'Monday',
                confidence: 0.95,
                model: 'coco-ssd',
                timestamp: '2025-01-27T17:30:00Z'
            },
            {
                id: '2',
                date: '2025-01-28',
                time: '17:35',
                day: 'Tuesday',
                confidence: 0.92,
                model: 'coco-ssd',
                timestamp: '2025-01-28T17:35:00Z'
            },
            {
                id: '3',
                date: '2025-01-29',
                time: '17:25',
                day: 'Wednesday',
                confidence: 0.88,
                model: 'coco-ssd',
                timestamp: '2025-01-29T17:25:00Z'
            }
        ];

        arrivals.forEach(arrival => dbService.addArrival(arrival));
        service.analyzeRoutine();

        // Note: This depends on current time, so we just verify it returns a boolean
        const isInWindow = service.isInPredictedWindow();
        expect(typeof isInWindow).toBe('boolean');
    });
});
