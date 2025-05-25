import { Entity } from './Entity';
import { Vector2D } from './Vector2D';
import { Ship } from './Ship';
import { Physics } from './Physics';
import { Asteroid } from './Asteroid';

export abstract class Projectile extends Entity {
    owner: number;
    trail: Vector2D[] = [];
    maxTrailLength: number = 20;

    constructor(position: Vector2D, velocity: Vector2D, radius: number, mass: number, owner: number) {
        super(position, velocity, radius, mass);
        this.owner = owner;
    }

    update(deltaTime: number): void {
        if (!this.isDestroyed) {
            this.trail.push(this.position.clone());
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }
        super.update(deltaTime);
    }

    drawTrail(ctx: CanvasRenderingContext2D): void {
        if (this.trail.length < 2) return;

        ctx.strokeStyle = this.owner === 1 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(33, 150, 243, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
    }
}

export class Bullet extends Projectile {
    constructor(position: Vector2D, velocity: Vector2D, owner: number) {
        super(position, velocity, 2, 10, owner); // Reduced hitbox from 3 to 2
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.isDestroyed) return;

        this.drawTrail(ctx);

        ctx.fillStyle = this.owner === 1 ? '#4CAF50' : '#2196F3';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

export class Missile extends Projectile {
    thrustTime: number = 2000;
    timeAlive: number = 0;
    thrustForce: number = 100;  // Reduced from 200 (50% less thrust)
    homingStrength: number = 0.15;  // Reduced from 0.3 (less responsive turning)
    targetShip: Ship | null = null;
    physics: Physics | null = null;
    asteroids: Asteroid[] = [];
    
    // Homing algorithm state
    optimalThrustDirection: Vector2D | null = null;
    plannedPhases: Array<{ direction: Vector2D | null; duration: number }> = [];
    lastHomingCalculation: number = 0;
    homingCalculationInterval: number = 100; // Recalculate every 100ms
    
    // Debug info
    debugThrustDirection: Vector2D | null = null;
    debugTargetDirection: Vector2D | null = null;
    debugHomingActive: boolean = false;
    debugSampledDirections: Vector2D[] = [];
    debugBestDirection: Vector2D | null = null;
    debugPlannedPhases: Array<{ direction: Vector2D | null; duration: number }> = [];
    
    constructor(position: Vector2D, velocity: Vector2D, owner: number) {
        super(position, velocity, 3, 15, owner); // Reduced hitbox from 4 to 3
        this.maxTrailLength = 30;
    }
    
    setTarget(ship: Ship): void {
        this.targetShip = ship;
    }
    
    setPhysicsContext(physics: Physics, asteroids: Asteroid[]): void {
        this.physics = physics;
        this.asteroids = asteroids;
    }
    
    calculateOptimalThrustDirection(): Vector2D | null {
        if (!this.targetShip || this.targetShip.isDestroyed || !this.physics) {
            return this.velocity.normalize(); // Default to current direction
        }
        
        const targetPos = this.targetShip.position;
        const remainingThrustTime = Math.max(0, this.thrustTime - this.timeAlive);
        
        // If we're out of thrust time, return null
        if (remainingThrustTime <= 0) {
            return null;
        }
        
        // Clear debug info
        this.debugSampledDirections = [];
        this.debugBestDirection = null;
        this.debugPlannedPhases = [];
        
        // Determine number of phases based on remaining time
        let numPhases = 3;
        if (remainingThrustTime < 600) numPhases = 2;
        if (remainingThrustTime < 300) numPhases = 1;
        
        // If only one phase, use original algorithm
        if (numPhases === 1) {
            return this.calculateSinglePhaseThrust(remainingThrustTime);
        }
        
        // Multi-phase planning
        const phaseDuration = remainingThrustTime / numPhases;
        let bestPhases: Array<{ direction: Vector2D | null; duration: number }> = [];
        let bestDistance = Infinity;
        
        // First, evaluate no thrust baseline
        const baselineResult = this.physics.evaluateMultiPhaseTrajectory(
            this.position,
            this.velocity,
            [{ direction: null, duration: remainingThrustTime }],
            this.thrustForce,
            targetPos,
            this.asteroids
        );
        bestDistance = baselineResult.minDistance;
        
        // Sample directions in a limited arc around current velocity
        const currentAngle = Math.atan2(this.velocity.y, this.velocity.x);
        const maxTurnAngle = Math.PI / 3; // Max 60 degrees turn from current direction
        const numSamples = 12;
        for (let i = 0; i < numSamples; i++) {
            const angleOffset = (i / (numSamples - 1) - 0.5) * 2 * maxTurnAngle;
            const angle = currentAngle + angleOffset;
            const direction = new Vector2D(Math.cos(angle), Math.sin(angle));
            
            // Store for debug visualization
            this.debugSampledDirections.push(direction);
            
            const result = this.physics.evaluateTrajectory(
                this.position,
                this.velocity,
                direction,
                this.thrustForce,
                remainingThrustTime,
                targetPos,
                this.asteroids
            );
            
            if (result.minDistance < bestDistance) {
                bestDistance = result.minDistance;
                bestDirection = direction;
            }
        }
        
        // Refine search around best direction
        if (bestDistance < baselineResult.minDistance * 0.9) { // Only refine if we found improvement
            const baseAngle = Math.atan2(bestDirection.y, bestDirection.x);
            const refinementArc = Math.PI / 6; // ±30 degrees (more limited)
            const refinementSamples = 8;
            
            for (let i = 0; i < refinementSamples; i++) {
                const angleOffset = (i / (refinementSamples - 1) - 0.5) * refinementArc;
                const angle = baseAngle + angleOffset;
                const direction = new Vector2D(Math.cos(angle), Math.sin(angle));
                
                const result = this.physics.evaluateTrajectory(
                    this.position,
                    this.velocity,
                    direction,
                    this.thrustForce,
                    remainingThrustTime,
                    targetPos,
                    this.asteroids
                );
                
                if (result.minDistance < bestDistance) {
                    bestDistance = result.minDistance;
                    bestDirection = direction;
                }
            }
        }
        
        this.debugBestDirection = bestDirection;
        
        // If no improvement, return null (don't thrust)
        return bestDistance < baselineResult.minDistance * 0.95 ? bestDirection : null;
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        
        this.timeAlive += deltaTime;
        
        // Reset debug info
        this.debugThrustDirection = null;
        this.debugTargetDirection = null;
        this.debugHomingActive = false;
        
        if (this.timeAlive < this.thrustTime && !this.isDestroyed) {
            // Check if we need to recalculate optimal thrust direction
            if (this.timeAlive - this.lastHomingCalculation > this.homingCalculationInterval) {
                this.optimalThrustDirection = this.calculateOptimalThrustDirection();
                this.lastHomingCalculation = this.timeAlive;
            }
            
            // Apply thrust if we have a direction
            if (this.optimalThrustDirection) {
                this.debugHomingActive = true;
                this.debugThrustDirection = this.optimalThrustDirection;
                
                const thrust = this.optimalThrustDirection.multiply(this.thrustForce * deltaTime / 1000);
                this.velocity = this.velocity.add(thrust);
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.isDestroyed) return;

        this.drawTrail(ctx);

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.velocity.angle());

        ctx.fillStyle = this.owner === 1 ? '#4CAF50' : '#2196F3';
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, -this.radius * 0.6);
        ctx.lineTo(-this.radius, this.radius * 0.6);
        ctx.closePath();
        ctx.fill();

        if (this.timeAlive < this.thrustTime) {
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.moveTo(-this.radius, -this.radius * 0.3);
            ctx.lineTo(-this.radius * 2, 0);
            ctx.lineTo(-this.radius, this.radius * 0.3);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
        
        // Draw debug info
        this.drawDebugInfo(ctx);
    }
    
    drawDebugInfo(ctx: CanvasRenderingContext2D): void {
        if (!this.debugHomingActive) return;
        
        ctx.save();
        
        // Line to target
        if (this.targetShip && !this.targetShip.isDestroyed) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(this.targetShip.position.x, this.targetShip.position.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Sampled directions (small gray lines)
        for (const dir of this.debugSampledDirections) {
            const sampleEnd = this.position.add(dir.multiply(20));
            ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(sampleEnd.x, sampleEnd.y);
            ctx.stroke();
        }
        
        // Velocity vector (green)
        const velEnd = this.position.add(this.velocity.normalize().multiply(40));
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(velEnd.x, velEnd.y);
        ctx.stroke();
        
        // Best calculated direction (blue)
        if (this.debugBestDirection) {
            const bestEnd = this.position.add(this.debugBestDirection.multiply(30));
            ctx.strokeStyle = 'rgba(0, 128, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(bestEnd.x, bestEnd.y);
            ctx.stroke();
        }
        
        // Actual thrust direction (yellow)
        if (this.debugThrustDirection) {
            const thrustEnd = this.position.add(this.debugThrustDirection.multiply(35));
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(thrustEnd.x, thrustEnd.y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

export class DelayedMissile extends Missile {
    delayTime: number = 2000;
    
    constructor(position: Vector2D, velocity: Vector2D, owner: number) {
        super(position, velocity, owner);
        // Slightly different appearance
        this.radius = 4; // Reduced from 5
    }
    
    calculateOptimalThrustDirection(): Vector2D | null {
        // Only calculate thrust after delay period
        if (this.timeAlive <= this.delayTime) {
            return null;
        }
        
        if (!this.targetShip || this.targetShip.isDestroyed || !this.physics) {
            return this.velocity.normalize(); // Default to current direction
        }
        
        const targetPos = this.targetShip.position;
        const adjustedTimeAlive = this.timeAlive - this.delayTime;
        const remainingThrustTime = Math.max(0, this.thrustTime - adjustedTimeAlive);
        
        // If we're out of thrust time, return null
        if (remainingThrustTime <= 0) {
            return null;
        }
        
        // Clear debug info
        this.debugSampledDirections = [];
        this.debugBestDirection = null;
        
        // First, evaluate no thrust (baseline)
        const baselineResult = this.physics.evaluateTrajectory(
            this.position,
            this.velocity,
            null,
            0,
            0,
            targetPos,
            this.asteroids
        );
        
        let bestDirection = this.velocity.normalize();
        let bestDistance = baselineResult.minDistance;
        
        // Sample directions in a limited arc around current velocity
        const currentAngle = Math.atan2(this.velocity.y, this.velocity.x);
        const maxTurnAngle = Math.PI / 3; // Max 60 degrees turn from current direction
        const numSamples = 12;
        for (let i = 0; i < numSamples; i++) {
            const angleOffset = (i / (numSamples - 1) - 0.5) * 2 * maxTurnAngle;
            const angle = currentAngle + angleOffset;
            const direction = new Vector2D(Math.cos(angle), Math.sin(angle));
            
            // Store for debug visualization
            this.debugSampledDirections.push(direction);
            
            const result = this.physics.evaluateTrajectory(
                this.position,
                this.velocity,
                direction,
                this.thrustForce,
                remainingThrustTime,
                targetPos,
                this.asteroids
            );
            
            if (result.minDistance < bestDistance) {
                bestDistance = result.minDistance;
                bestDirection = direction;
            }
        }
        
        // Refine search around best direction
        if (bestDistance < baselineResult.minDistance * 0.9) { // Only refine if we found improvement
            const baseAngle = Math.atan2(bestDirection.y, bestDirection.x);
            const refinementArc = Math.PI / 6; // ±30 degrees (more limited)
            const refinementSamples = 8;
            
            for (let i = 0; i < refinementSamples; i++) {
                const angleOffset = (i / (refinementSamples - 1) - 0.5) * refinementArc;
                const angle = baseAngle + angleOffset;
                const direction = new Vector2D(Math.cos(angle), Math.sin(angle));
                
                const result = this.physics.evaluateTrajectory(
                    this.position,
                    this.velocity,
                    direction,
                    this.thrustForce,
                    remainingThrustTime,
                    targetPos,
                    this.asteroids
                );
                
                if (result.minDistance < bestDistance) {
                    bestDistance = result.minDistance;
                    bestDirection = direction;
                }
            }
        }
        
        this.debugBestDirection = bestDirection;
        
        // If no improvement, return null (don't thrust)
        return bestDistance < baselineResult.minDistance * 0.95 ? bestDirection : null;
    }

    update(deltaTime: number): void {
        // Update position and trail like normal projectile
        if (!this.isDestroyed) {
            this.trail.push(this.position.clone());
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }
        
        // Call Entity update, not Missile update to avoid immediate thrust
        Entity.prototype.update.call(this, deltaTime);
        
        this.timeAlive += deltaTime;
        
        // Reset debug info
        this.debugThrustDirection = null;
        this.debugTargetDirection = null;
        this.debugHomingActive = false;
        
        // Only apply thrust and homing after delay
        if (this.timeAlive > this.delayTime && this.timeAlive < this.delayTime + this.thrustTime && !this.isDestroyed) {
            // Check if we need to recalculate optimal thrust direction
            if (this.timeAlive - this.lastHomingCalculation > this.homingCalculationInterval) {
                this.optimalThrustDirection = this.calculateOptimalThrustDirection();
                this.lastHomingCalculation = this.timeAlive;
            }
            
            // Apply thrust if we have a direction
            if (this.optimalThrustDirection) {
                this.debugHomingActive = true;
                this.debugThrustDirection = this.optimalThrustDirection;
                
                const thrust = this.optimalThrustDirection.multiply(this.thrustForce * deltaTime / 1000);
                this.velocity = this.velocity.add(thrust);
            }
        }
    }
    
    draw(ctx: CanvasRenderingContext2D): void {
        if (this.isDestroyed) return;

        this.drawTrail(ctx);

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.velocity.angle());

        // Different color scheme for delayed missile
        ctx.fillStyle = this.owner === 1 ? '#FF6B6B' : '#4ECDC4';
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, -this.radius * 0.6);
        ctx.lineTo(-this.radius, this.radius * 0.6);
        ctx.closePath();
        ctx.fill();

        // Show thrust flame after delay
        if (this.timeAlive > this.delayTime && this.timeAlive < this.delayTime + this.thrustTime) {
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.moveTo(-this.radius, -this.radius * 0.3);
            ctx.lineTo(-this.radius * 2, 0);
            ctx.lineTo(-this.radius, this.radius * 0.3);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
        
        // Draw debug info (inherit from parent)
        this.drawDebugInfo(ctx);
    }
}