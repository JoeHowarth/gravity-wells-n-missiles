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