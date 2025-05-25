import { Entity } from './Entity';
import { Vector2D } from './Vector2D';
import { Ship } from './Ship';
import { Physics } from './Physics';
import { Asteroid } from './Asteroid';
import { 
    HomingCalculator, 
    HomingContext, 
    HomingResult,
    StandardMissileTiming, 
    DelayedMissileTiming, 
    MissileTiming 
} from './HomingSystem';
import { MultiPhaseHomingCalculator } from './MultiPhaseHomingCalculator';

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
    targetShip: Ship | null = null;
    physics: Physics | null = null;
    asteroids: Asteroid[] = [];
    
    // Homing system
    protected homingCalculator: HomingCalculator = new MultiPhaseHomingCalculator();
    protected lastHomingCalculation: number = 0;
    protected homingCalculationInterval: number = 100; // Recalculate every 100ms
    protected currentHomingResult: HomingResult | null = null;
    
    constructor(position: Vector2D, velocity: Vector2D, owner: number) {
        super(position, velocity, 2, 15, owner); 
        this.maxTrailLength = 30;
    }
    
    setTarget(ship: Ship): void {
        this.targetShip = ship;
    }
    
    setPhysicsContext(physics: Physics, asteroids: Asteroid[]): void {
        this.physics = physics;
        this.asteroids = asteroids;
    }
    
    /**
     * Create timing context for this missile type
     */
    protected createTiming(): MissileTiming {
        return new StandardMissileTiming(this.thrustTime, this.timeAlive, this.thrustForce);
    }
    
    /**
     * Get current optimal thrust direction using homing calculator
     */
    protected calculateOptimalThrustDirection(): Vector2D | null {
        if (!this.targetShip || !this.physics) {
            return null;
        }
        
        const timing = this.createTiming();
        if (!timing.isWithinThrustWindow()) {
            return null;
        }
        
        // Check if we need to recalculate
        if (this.timeAlive - this.lastHomingCalculation > this.homingCalculationInterval) {
            const context: HomingContext = {
                currentPosition: this.position,
                currentVelocity: this.velocity,
                target: this.targetShip,
                physics: this.physics,
                asteroids: this.asteroids,
                timing
            };
            
            this.currentHomingResult = this.homingCalculator.calculateOptimalThrust(context);
            this.lastHomingCalculation = this.timeAlive;
        }
        
        return this.currentHomingResult?.thrustDirection || null;
    }
    
    /**
     * Get debug information for visualization
     */
    getDebugInfo() {
        return this.currentHomingResult?.debugInfo || {
            sampledDirections: [],
            bestDirection: null,
            plannedPhases: [],
            homingActive: false,
            phaseCount: 0,
            evaluationCount: 0
        };
    }
    
    update(deltaTime: number): void {
        super.update(deltaTime);
        
        this.timeAlive += deltaTime;
        
        const timing = this.createTiming();
        if (timing.isWithinThrustWindow() && !this.isDestroyed) {
            const thrustDirection = this.calculateOptimalThrustDirection();
            
            if (thrustDirection) {
                const thrust = thrustDirection.multiply(this.thrustForce * deltaTime / 1000);
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
        const debugInfo = this.getDebugInfo();
        if (!debugInfo.homingActive) return;
        
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
        
        // Sampled directions with color coding for thrust type
        for (const dir of debugInfo.sampledDirections) {
            const sampleEnd = this.position.add(dir.multiply(20));
            
            // Color code based on thrust direction relative to velocity
            const velocityDot = dir.dot(this.velocity.normalize());
            let strokeStyle: string;
            
            if (velocityDot > 0.7) {
                strokeStyle = 'rgba(0, 255, 0, 0.4)'; // Forward thrust (green)
            } else if (velocityDot < -0.7) {
                strokeStyle = 'rgba(255, 0, 0, 0.4)'; // Reverse thrust (red)
            } else {
                strokeStyle = 'rgba(128, 128, 128, 0.3)'; // Side thrust (gray)
            }
            
            ctx.strokeStyle = strokeStyle;
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
        
        // Current thrust direction (yellow)
        if (debugInfo.bestDirection) {
            const thrustEnd = this.position.add(debugInfo.bestDirection.multiply(35));
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(thrustEnd.x, thrustEnd.y);
            ctx.stroke();
        }
        
        // Phase indicators for multi-phase planning
        if (debugInfo.phaseCount > 1 && debugInfo.plannedPhases.length > 0) {
            const phaseColors = ['rgba(255, 100, 100, 0.6)', 'rgba(100, 255, 100, 0.6)', 'rgba(100, 100, 255, 0.6)'];
            
            for (let i = 0; i < Math.min(debugInfo.plannedPhases.length, phaseColors.length); i++) {
                const phase = debugInfo.plannedPhases[i];
                if (phase.direction) {
                    const phaseEnd = this.position.add(phase.direction.multiply(25 + i * 5));
                    ctx.strokeStyle = phaseColors[i];
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(this.position.x, this.position.y);
                    ctx.lineTo(phaseEnd.x, phaseEnd.y);
                    ctx.stroke();
                }
            }
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
    
    /**
     * Create timing context for delayed missile
     */
    protected createTiming(): MissileTiming {
        return new DelayedMissileTiming(this.thrustTime, this.timeAlive, this.thrustForce, this.delayTime);
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