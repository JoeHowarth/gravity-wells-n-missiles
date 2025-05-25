import { Entity } from './Entity';
import { Vector2D } from './Vector2D';
import { Ship } from './Ship';
import { Physics } from './Physics';
import { Asteroid } from './Asteroid';
import { AudioManager } from './AudioManager';
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
    audioManager: AudioManager | null = null;
    private thrustSoundPlaying: boolean = false;
    
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
    
    setAudioManager(audioManager: AudioManager): void {
        this.audioManager = audioManager;
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
                
                // Play thrust sound
                if (this.audioManager && !this.thrustSoundPlaying) {
                    this.audioManager.playSound('thrust');
                    this.thrustSoundPlaying = true;
                }
            }
        } else {
            this.thrustSoundPlaying = false;
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
            // Get thrust direction for visual effect
            const thrustDir = this.calculateOptimalThrustDirection();
            
            if (thrustDir) {
                ctx.restore(); // Restore to get out of missile rotation
                ctx.save();
                ctx.translate(this.position.x, this.position.y);
                
                // Calculate thrust angle (opposite of thrust direction for exhaust)
                const exhaustAngle = Math.atan2(-thrustDir.y, -thrustDir.x);
                ctx.rotate(exhaustAngle);
                
                // Draw exhaust flame with gradient
                const gradient = ctx.createLinearGradient(0, 0, 30, 0);
                gradient.addColorStop(0, 'rgba(255, 255, 100, 0.8)');
                gradient.addColorStop(0.3, 'rgba(255, 165, 0, 0.6)');
                gradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                
                // Animated flame effect
                const flicker = Math.sin(this.timeAlive * 0.02) * 0.2 + 1;
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(0, -this.radius * 0.5);
                ctx.lineTo(20 * flicker, -this.radius * 0.8);
                ctx.lineTo(25 * flicker, 0);
                ctx.lineTo(20 * flicker, this.radius * 0.8);
                ctx.lineTo(0, this.radius * 0.5);
                ctx.closePath();
                ctx.fill();
                
                // Add inner bright core
                ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
                ctx.beginPath();
                ctx.moveTo(0, -this.radius * 0.3);
                ctx.lineTo(10 * flicker, -this.radius * 0.4);
                ctx.lineTo(12 * flicker, 0);
                ctx.lineTo(10 * flicker, this.radius * 0.4);
                ctx.lineTo(0, this.radius * 0.3);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
                ctx.save();
                ctx.translate(this.position.x, this.position.y);
                ctx.rotate(this.velocity.angle());
            } else {
                // Fallback to simple thrust if no direction available
                ctx.fillStyle = '#FFA500';
                ctx.beginPath();
                ctx.moveTo(-this.radius, -this.radius * 0.3);
                ctx.lineTo(-this.radius * 2, 0);
                ctx.lineTo(-this.radius, this.radius * 0.3);
                ctx.closePath();
                ctx.fill();
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
    }
}