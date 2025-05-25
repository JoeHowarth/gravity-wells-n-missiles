import { Vector2D } from './Vector2D';
import { Physics } from './Physics';
import { Asteroid } from './Asteroid';
import { Ship } from './Ship';

/**
 * Represents the timing context for a missile's thrust capabilities
 */
export interface MissileTiming {
    readonly totalThrustTime: number;
    readonly timeAlive: number;
    readonly thrustForce: number;
    
    getRemainingThrustTime(): number;
    isWithinThrustWindow(): boolean;
}

/**
 * Standard missile timing - thrust available immediately
 */
export class StandardMissileTiming implements MissileTiming {
    constructor(
        public readonly totalThrustTime: number,
        public readonly timeAlive: number,
        public readonly thrustForce: number
    ) {}
    
    getRemainingThrustTime(): number {
        return Math.max(0, this.totalThrustTime - this.timeAlive);
    }
    
    isWithinThrustWindow(): boolean {
        return this.timeAlive < this.totalThrustTime;
    }
}

/**
 * Delayed missile timing - thrust available after delay period
 */
export class DelayedMissileTiming implements MissileTiming {
    constructor(
        public readonly totalThrustTime: number,
        public readonly timeAlive: number,
        public readonly thrustForce: number,
        public readonly delayTime: number
    ) {}
    
    getRemainingThrustTime(): number {
        if (this.timeAlive <= this.delayTime) {
            return 0; // No thrust during delay
        }
        const adjustedTimeAlive = this.timeAlive - this.delayTime;
        return Math.max(0, this.totalThrustTime - adjustedTimeAlive);
    }
    
    isWithinThrustWindow(): boolean {
        return this.timeAlive > this.delayTime && this.timeAlive <= this.delayTime + this.totalThrustTime;
    }
}

/**
 * Burst missile timing - two separate thrust phases
 */
export class BurstMissileTiming implements MissileTiming {
    private readonly phase1Start = 0;
    private readonly phase1End = 1000; // 1 second
    private readonly phase2Start = 3000; // 3 seconds
    private readonly phase2End = 4000; // 4 seconds (1 second duration)
    
    constructor(
        public readonly totalThrustTime: number, // Total combined thrust time (2 seconds)
        public readonly timeAlive: number,
        public readonly thrustForce: number
    ) {}
    
    getRemainingThrustTime(): number {
        if (this.timeAlive < this.phase1End) {
            // In phase 1
            return (this.phase1End - this.timeAlive) + 1000; // Phase 1 remaining + phase 2 full
        } else if (this.timeAlive >= this.phase2Start && this.timeAlive < this.phase2End) {
            // In phase 2
            return this.phase2End - this.timeAlive;
        }
        return 0; // No thrust between phases or after phase 2
    }
    
    isWithinThrustWindow(): boolean {
        return (this.timeAlive >= this.phase1Start && this.timeAlive < this.phase1End) ||
               (this.timeAlive >= this.phase2Start && this.timeAlive < this.phase2End);
    }
}

/**
 * Context for homing calculations
 */
export interface HomingContext {
    readonly currentPosition: Vector2D;
    readonly currentVelocity: Vector2D;
    readonly target: Ship;
    readonly physics: Physics;
    readonly asteroids: Asteroid[];
    readonly timing: MissileTiming;
}

/**
 * Result of homing calculation
 */
export interface HomingResult {
    readonly thrustDirection: Vector2D | null;
    readonly plannedPhases: Array<{ direction: Vector2D | null; duration: number }>;
    readonly debugInfo: HomingDebugInfo;
}

/**
 * Debug information for visualization
 */
export interface HomingDebugInfo {
    readonly sampledDirections: Vector2D[];
    readonly bestDirection: Vector2D | null;
    readonly plannedPhases: Array<{ direction: Vector2D | null; duration: number }>;
    readonly homingActive: boolean;
    readonly phaseCount: number;
    readonly evaluationCount: number;
}

/**
 * Abstract base class for homing calculators
 */
export abstract class HomingCalculator {
    protected readonly maxTurnAngle = Math.PI / 3; // 60 degrees
    
    /**
     * Calculate optimal thrust direction for the missile
     */
    abstract calculateOptimalThrust(context: HomingContext): HomingResult;
    
    /**
     * Helper to create a "no thrust" result
     */
    protected createNoThrustResult(): HomingResult {
        return {
            thrustDirection: null,
            plannedPhases: [],
            debugInfo: {
                sampledDirections: [],
                bestDirection: null,
                plannedPhases: [],
                homingActive: false,
                phaseCount: 0,
                evaluationCount: 0
            }
        };
    }
    
    /**
     * Helper to get current direction angle
     */
    protected getCurrentAngle(velocity: Vector2D): number {
        return Math.atan2(velocity.y, velocity.x);
    }
    
    /**
     * Helper to evaluate baseline (no thrust) trajectory
     */
    protected evaluateBaseline(context: HomingContext): { minDistance: number; timeToClosest: number } {
        return context.physics.evaluateTrajectory(
            context.currentPosition,
            context.currentVelocity,
            null,
            0,
            0,
            context.target.position,
            context.asteroids
        );
    }
}