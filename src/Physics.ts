import { Entity } from './Entity';
import { Asteroid } from './Asteroid';
import { Projectile } from './Projectile';
import { Ship } from './Ship';
import { Vector2D } from './Vector2D';
import { AudioManager } from './AudioManager';

export class Physics {
    private G: number = 6000;
    private audioManager: AudioManager | null = null;
    
    setAudioManager(audioManager: AudioManager): void {
        this.audioManager = audioManager;
    }

    applyGravity(entities: Entity[], asteroids: Asteroid[], deltaTime: number): void {
        for (const entity of entities) {
            if (entity.isDestroyed) continue;
            
            if (entity instanceof Projectile) {
                for (const asteroid of asteroids) {
                    if (asteroid.isDestroyed) continue;
                    
                    const distance = entity.position.distance(asteroid.position);
                    if (distance > asteroid.radius + 5) {
                        const force = (this.G * asteroid.mass) / (distance * distance);
                        const direction = asteroid.position.subtract(entity.position).normalize();
                        const acceleration = direction.multiply(force * deltaTime / 1000);
                        entity.velocity = entity.velocity.add(acceleration);
                    }
                }
            }
        }
    }

    handleCollisions(entities: Entity[]): void {
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const entityA = entities[i];
                const entityB = entities[j];

                if (entityA.checkCollision(entityB)) {
                    this.resolveCollision(entityA, entityB);
                }
            }
        }
    }

    private resolveCollision(entityA: Entity, entityB: Entity): void {
        if (entityA instanceof Asteroid && entityB instanceof Asteroid) {
            this.elasticCollision(entityA, entityB);
        } else if (entityA instanceof Projectile || entityB instanceof Projectile) {
            const projectile = entityA instanceof Projectile ? entityA : entityB;
            const other = entityA instanceof Projectile ? entityB : entityA;
            
            if (other instanceof Ship && (projectile as Projectile).owner === other.player) {
                // Don't destroy projectiles that hit their own ship
                return;
            }
            
            
            // Play appropriate sound effect
            if (this.audioManager) {
                if (other instanceof Ship) {
                    this.audioManager.playSound('explosion');
                } else if (other instanceof Asteroid) {
                    this.audioManager.playSound('collision');
                }
            }
            
            if (entityA instanceof Projectile) entityA.destroy();
            if (entityB instanceof Projectile) entityB.destroy();
            
            if (!(entityA instanceof Asteroid) && !(entityA instanceof Projectile)) {
                entityA.destroy();
            }
            if (!(entityB instanceof Asteroid) && !(entityB instanceof Projectile)) {
                entityB.destroy();
            }
        } else {
            if (!(entityA instanceof Asteroid)) entityA.destroy();
            if (!(entityB instanceof Asteroid)) entityB.destroy();
        }
    }

    private elasticCollision(asteroidA: Asteroid, asteroidB: Asteroid): void {
        const normal = asteroidB.position.subtract(asteroidA.position).normalize();
        
        const relativeVelocity = asteroidA.velocity.subtract(asteroidB.velocity);
        const velocityAlongNormal = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;
        
        if (velocityAlongNormal > 0) return;
        
        const restitution = 0.8;
        const impulse = 2 * velocityAlongNormal / (1/asteroidA.mass + 1/asteroidB.mass);
        
        const impulseVector = normal.multiply(impulse * restitution);
        
        asteroidA.velocity = asteroidA.velocity.subtract(impulseVector.divide(asteroidA.mass));
        asteroidB.velocity = asteroidB.velocity.add(impulseVector.divide(asteroidB.mass));
        
        const overlap = asteroidA.radius + asteroidB.radius - asteroidA.position.distance(asteroidB.position);
        if (overlap > 0) {
            const separation = normal.multiply(overlap / 2);
            asteroidA.position = asteroidA.position.subtract(separation);
            asteroidB.position = asteroidB.position.add(separation);
        }
    }

    checkBounds(entity: Entity, width: number, height: number): void {
        if (entity instanceof Projectile) {
            if (entity.position.x < -50 || entity.position.x > width + 50 ||
                entity.position.y < -50 || entity.position.y > height + 50) {
                entity.destroy();
            }
        } else if (entity instanceof Asteroid) {
            if (entity.position.x < entity.radius) {
                entity.position.x = entity.radius;
                entity.velocity.x = Math.abs(entity.velocity.x);
            }
            if (entity.position.x > width - entity.radius) {
                entity.position.x = width - entity.radius;
                entity.velocity.x = -Math.abs(entity.velocity.x);
            }
            if (entity.position.y < entity.radius) {
                entity.position.y = entity.radius;
                entity.velocity.y = Math.abs(entity.velocity.y);
            }
            if (entity.position.y > height - entity.radius) {
                entity.position.y = height - entity.radius;
                entity.velocity.y = -Math.abs(entity.velocity.y);
            }
        }
    }

    predictTrajectory(
        startPos: Vector2D, 
        startVel: Vector2D, 
        asteroids: Asteroid[], 
        timeStep: number = 20, 
        maxSteps: number = 500,
        weaponType: 'bullet' | 'missile' | 'delayed' | 'burst' = 'bullet',
        targetShip?: Ship,
        canvasWidth: number = 1200,
        canvasHeight: number = 800
    ): Vector2D[] {
        const trajectory: Vector2D[] = [];
        let pos = startPos.clone();
        let vel = startVel.clone();
        let timeAlive = 0;
        const missileThrust = 100; // Reduced from 200 to match missile nerf
        const missileThrustTime = 2000;

        for (let i = 0; i < maxSteps; i++) {
            trajectory.push(pos.clone());

            // Apply gravity from asteroids
            for (const asteroid of asteroids) {
                const distance = pos.distance(asteroid.position);
                
                // Check for collision
                if (distance < asteroid.radius) {
                    trajectory.push(pos.clone());
                    return trajectory;
                }
                
                if (distance > asteroid.radius + 5) {
                    const force = (this.G * asteroid.mass) / (distance * distance);
                    const direction = asteroid.position.subtract(pos).normalize();
                    const acceleration = direction.multiply(force * timeStep / 1000);
                    vel = vel.add(acceleration);
                }
            }

            // Apply missile thrust if applicable
            const delayTime = 2000; // 2 seconds delay for delayed missiles
            const isDelayedMissileActive = weaponType === 'delayed' && timeAlive > delayTime && timeAlive < delayTime + missileThrustTime;
            const isRegularMissileActive = weaponType === 'missile' && timeAlive < missileThrustTime;
            const isBurstMissileActive = weaponType === 'burst' && 
                ((timeAlive >= 0 && timeAlive < 1000) || // Phase 1: 0-1 second
                 (timeAlive >= 3000 && timeAlive < 4000)); // Phase 2: 3-4 seconds
            
            if (isRegularMissileActive || isDelayedMissileActive || isBurstMissileActive) {
                let thrustDirection = vel.normalize();
                
                // Apply homing if we have a target
                if (targetShip && !targetShip.isDestroyed) {
                    const toTarget = targetShip.position.subtract(pos).normalize();
                    const homingStrength = 0.3;
                    // Blend current direction with target direction
                    thrustDirection = thrustDirection.multiply(1 - homingStrength).add(
                        toTarget.multiply(homingStrength)
                    ).normalize();
                }
                
                const thrust = thrustDirection.multiply(missileThrust * timeStep / 1000);
                vel = vel.add(thrust);
            }

            pos = pos.add(vel.multiply(timeStep / 1000));
            timeAlive += timeStep;

            // Check if out of bounds
            if (pos.x < -50 || pos.x > canvasWidth + 50 || pos.y < -50 || pos.y > canvasHeight + 50) {
                trajectory.push(pos.clone());
                break;
            }
        }

        return trajectory;
    }
    
    // Evaluate how close a trajectory gets to a target
    evaluateTrajectory(
        startPos: Vector2D,
        startVel: Vector2D,
        thrustDirection: Vector2D | null,
        thrustMagnitude: number,
        thrustDuration: number,
        target: Vector2D,
        asteroids: Asteroid[],
        timeStep: number = 20,
        maxTime: number = 3000 // Look 3 seconds ahead
    ): { minDistance: number; timeToClosest: number } {
        let pos = startPos.clone();
        let vel = startVel.clone();
        let minDistance = Infinity;
        let timeToClosest = 0;
        let time = 0;
        let minAsteroidClearance = Infinity;
        
        while (time < maxTime) {
            // Apply gravity
            for (const asteroid of asteroids) {
                const distance = pos.distance(asteroid.position);
                
                if (distance < asteroid.radius + 3) { // Add small buffer for projectile radius
                    // Hit asteroid - return with penalty
                    return { minDistance: Infinity, timeToClosest: time };
                }
                
                // Track minimum clearance from asteroids
                const clearance = distance - asteroid.radius;
                if (clearance < minAsteroidClearance) {
                    minAsteroidClearance = clearance;
                }
                
                if (distance > asteroid.radius + 5) {
                    const force = (this.G * asteroid.mass) / (distance * distance);
                    const direction = asteroid.position.subtract(pos).normalize();
                    const acceleration = direction.multiply(force * timeStep / 1000);
                    vel = vel.add(acceleration);
                }
            }
            
            // Apply thrust if within thrust duration
            if (thrustDirection && time < thrustDuration) {
                const thrust = thrustDirection.multiply(thrustMagnitude * timeStep / 1000);
                vel = vel.add(thrust);
            }
            
            // Update position
            pos = pos.add(vel.multiply(timeStep / 1000));
            time += timeStep;
            
            // Check distance to target
            const distToTarget = pos.distance(target);
            if (distToTarget < minDistance) {
                minDistance = distToTarget;
                timeToClosest = time;
            }
            
            // Early exit if we're getting too far away
            if (distToTarget > minDistance * 2 && time > timeToClosest + 500) {
                break;
            }
        }
        
        // Apply penalty if trajectory gets too close to asteroids
        if (minAsteroidClearance < 10 && minDistance < Infinity) {
            // Scale penalty based on how close we got
            const penalty = (10 - minAsteroidClearance) * 10;
            minDistance += penalty;
        }
        
        return { minDistance, timeToClosest };
    }
    
    // Evaluate trajectory with multiple thrust phases
    evaluateMultiPhaseTrajectory(
        startPos: Vector2D,
        startVel: Vector2D,
        thrustPhases: Array<{ direction: Vector2D | null; duration: number }>,
        thrustMagnitude: number,
        target: Vector2D,
        asteroids: Asteroid[],
        timeStep: number = 20,
        maxTime: number = 3000
    ): { minDistance: number; timeToClosest: number } {
        let pos = startPos.clone();
        let vel = startVel.clone();
        let minDistance = Infinity;
        let timeToClosest = 0;
        let time = 0;
        let minAsteroidClearance = Infinity;
        let currentPhase = 0;
        let phaseTime = 0;
        
        while (time < maxTime && currentPhase < thrustPhases.length) {
            // Apply gravity
            for (const asteroid of asteroids) {
                const distance = pos.distance(asteroid.position);
                
                if (distance < asteroid.radius + 3) {
                    return { minDistance: Infinity, timeToClosest: time };
                }
                
                const clearance = distance - asteroid.radius;
                if (clearance < minAsteroidClearance) {
                    minAsteroidClearance = clearance;
                }
                
                if (distance > asteroid.radius + 5) {
                    const force = (this.G * asteroid.mass) / (distance * distance);
                    const direction = asteroid.position.subtract(pos).normalize();
                    const acceleration = direction.multiply(force * timeStep / 1000);
                    vel = vel.add(acceleration);
                }
            }
            
            // Apply thrust from current phase
            const phase = thrustPhases[currentPhase];
            if (phase.direction && phaseTime < phase.duration) {
                const thrust = phase.direction.multiply(thrustMagnitude * timeStep / 1000);
                vel = vel.add(thrust);
            }
            
            // Update position
            pos = pos.add(vel.multiply(timeStep / 1000));
            time += timeStep;
            phaseTime += timeStep;
            
            // Check if we need to move to next phase
            if (phaseTime >= phase.duration) {
                currentPhase++;
                phaseTime = 0;
            }
            
            // Check distance to target
            const distToTarget = pos.distance(target);
            if (distToTarget < minDistance) {
                minDistance = distToTarget;
                timeToClosest = time;
            }
            
            // Early exit if we're getting too far away
            if (distToTarget > minDistance * 2 && time > timeToClosest + 500) {
                break;
            }
        }
        
        // Continue simulating after thrust phases end
        while (time < maxTime) {
            // Apply gravity
            for (const asteroid of asteroids) {
                const distance = pos.distance(asteroid.position);
                
                if (distance < asteroid.radius + 3) {
                    return { minDistance: Infinity, timeToClosest: time };
                }
                
                const clearance = distance - asteroid.radius;
                if (clearance < minAsteroidClearance) {
                    minAsteroidClearance = clearance;
                }
                
                if (distance > asteroid.radius + 5) {
                    const force = (this.G * asteroid.mass) / (distance * distance);
                    const direction = asteroid.position.subtract(pos).normalize();
                    const acceleration = direction.multiply(force * timeStep / 1000);
                    vel = vel.add(acceleration);
                }
            }
            
            pos = pos.add(vel.multiply(timeStep / 1000));
            time += timeStep;
            
            const distToTarget = pos.distance(target);
            if (distToTarget < minDistance) {
                minDistance = distToTarget;
                timeToClosest = time;
            }
            
            if (distToTarget > minDistance * 2 && time > timeToClosest + 500) {
                break;
            }
        }
        
        // Apply penalty for close asteroid passes
        if (minAsteroidClearance < 10 && minDistance < Infinity) {
            const penalty = (10 - minAsteroidClearance) * 10;
            minDistance += penalty;
        }
        
        return { minDistance, timeToClosest };
    }
}