import { Ship } from './Ship';
import { Asteroid } from './Asteroid';
import { Projectile, Bullet, Missile, DelayedMissile, BurstMissile } from './Projectile';
import { Physics } from './Physics';
import { Renderer } from './Renderer';
import { Vector2D } from './Vector2D';
import { Entity } from './Entity';
import { AudioManager } from './AudioManager';
import { EntityManager } from './EntityManager';
import { InputManager } from './InputManager';
import { UIManager } from './UIManager';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private renderer: Renderer;
    private physics: Physics;
    private audioManager: AudioManager;
    private entityManager: EntityManager;
    private inputManager: InputManager;
    private uiManager: UIManager;
    
    private lastTime: number = 0;
    private isRunning: boolean = false;
    private gameOver: boolean = false;
    private winner: number = 0;
    
    private isAiming: boolean = false;
    private aimingPlayer: number = 0;
    private currentPower: number = 100;
    
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.renderer = new Renderer(ctx, canvas.width, canvas.height);
        this.physics = new Physics();
        this.audioManager = new AudioManager();
        this.entityManager = new EntityManager();
        this.inputManager = new InputManager(canvas);
        this.uiManager = new UIManager();
        
        this.physics.setAudioManager(this.audioManager);
        
        this.setupInputHandlers();
        this.setupUIHandlers();
        this.setupKeyboardListeners();
        this.setupResizeHandler();
        this.reset();
    }
    
    private setupInputHandlers(): void {
        this.inputManager.onMouseMove((position) => {
            if (this.isAiming) {
                this.updateShipAim();
            }
        });

        this.inputManager.onMouseDown((position) => {
            if (this.gameOver) return;
            
            const player = this.getClosestShipToPosition(position);
            const ship = this.entityManager.getShips()[player - 1];
            
            if (ship && !ship.isDestroyed && ship.canFire()) {
                this.isAiming = true;
                this.aimingPlayer = player;
                this.updateShipAim();
                
                // Show aiming hint on touch devices
                if (this.inputManager.isTouchDevice()) {
                    this.uiManager.showAimingHint(true);
                }
            }
        });

        this.inputManager.onMouseUp((position) => {
            if (this.isAiming && !this.gameOver) {
                this.fire(this.aimingPlayer);
                this.isAiming = false;
                this.uiManager.showAimingHint(false);
            }
        });

        // Keyboard controls for weapons
        this.inputManager.onKey('1', () => this.setWeaponForClosestShip('bullet'));
        this.inputManager.onKey('2', () => this.setWeaponForClosestShip('missile'));
        this.inputManager.onKey('3', () => this.setWeaponForClosestShip('delayed'));
        this.inputManager.onKey('4', () => this.setWeaponForClosestShip('burst'));
        
        // Power controls
        this.inputManager.onKey('w', () => {
            this.currentPower = Math.min(this.currentPower + 20, 500);
            this.audioManager.playSound('powerup');
        });
        
        this.inputManager.onKey('a', () => {
            this.currentPower = Math.max(this.currentPower - 20, 0);
            this.audioManager.playSound('powerdown');
        });
    }

    private setupUIHandlers(): void {
        this.uiManager.onStartClick(() => {
            this.start();
            this.uiManager.hideWelcomeScreen();
            this.uiManager.showGameOverlay();
        });

        this.uiManager.onPlayAgainClick(() => {
            this.reset();
            this.start();
        });

        this.uiManager.onVolumeChange((volume) => {
            this.audioManager.setVolume(volume);
        });
    }

    private setWeaponForClosestShip(weapon: 'bullet' | 'missile' | 'delayed' | 'burst'): void {
        if (this.gameOver) return;
        
        const player = this.getClosestShipToPosition(this.inputManager.getMousePosition());
        const ship = this.entityManager.getShips()[player - 1];
        
        if (ship && !ship.isDestroyed) {
            ship.setWeapon(weapon);
        }
    }

    private setupResizeHandler(): void {
        window.addEventListener('resize', () => {
            this.renderer = new Renderer(this.ctx, this.canvas.width, this.canvas.height);
            // Reposition ships if they're outside the new bounds
            const ships = this.entityManager.getShips();
            ships.forEach(ship => {
                ship.position.x = Math.min(ship.position.x, this.canvas.width - 50);
                ship.position.y = Math.min(ship.position.y, this.canvas.height - 50);
            });
        });
    }
    
    private setupKeyboardListeners(): void {
        // Additional keyboard shortcuts not handled by InputManager
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isAiming) {
                this.isAiming = false;
                this.uiManager.showAimingHint(false);
            }
        });
    }
    
    private getClosestShipToPosition(position: Vector2D): number {
        let closestPlayer = 1;
        let minDistance = Infinity;
        
        const ships = this.entityManager.getShips();
        for (let i = 0; i < ships.length; i++) {
            const ship = ships[i];
            if (ship && !ship.isDestroyed) {
                const distance = position.distance(ship.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPlayer = i + 1;
                }
            }
        }
        
        return closestPlayer;
    }
    
    private updateShipAim(): void {
        const mousePos = this.inputManager.getMousePosition();
        const player = this.getClosestShipToPosition(mousePos);
        const ships = this.entityManager.getShips();
        const ship = ships[player - 1];
        
        if (ship && !ship.isDestroyed) {
            const angle = Math.atan2(
                mousePos.y - ship.position.y,
                mousePos.x - ship.position.x
            );
            ship.setAim(angle, this.currentPower);
        }
    }
    
    private fire(player: number): void {
        const ships = this.entityManager.getShips();
        const ship = ships[player - 1];
        if (!ship || ship.isDestroyed || !ship.canFire()) return;
        
        
        const speed = Math.max(this.currentPower, 50);
        const velocity = Vector2D.fromAngle(ship.aimAngle, speed);
        const spawnDistance = ship.radius + 20;
        const spawnOffset = Vector2D.fromAngle(ship.aimAngle, spawnDistance);
        const startPos = new Vector2D(
            ship.position.x + spawnOffset.x,
            ship.position.y + spawnOffset.y
        );
        
        
        let projectile: Projectile;
        if (ship.currentWeapon === 'bullet') {
            projectile = new Bullet(startPos, velocity, player);
            this.audioManager.playSound('fire');
        } else if (ship.currentWeapon === 'missile') {
            projectile = new Missile(startPos, velocity, player);
            // Set the enemy ship as target and physics context
            const targetShip = ships[player === 1 ? 1 : 0];
            if (targetShip && !targetShip.isDestroyed) {
                (projectile as Missile).setTarget(targetShip);
            }
            (projectile as Missile).setPhysicsContext(this.physics, this.entityManager.getAsteroids());
            (projectile as Missile).setAudioManager(this.audioManager);
            this.audioManager.playSound('missile');
        } else if (ship.currentWeapon === 'delayed') {
            projectile = new DelayedMissile(startPos, velocity, player);
            this.audioManager.playSound('missile');
            // Set the enemy ship as target and physics context
            const targetShip = ships[player === 1 ? 1 : 0];
            if (targetShip && !targetShip.isDestroyed) {
                (projectile as DelayedMissile).setTarget(targetShip);
            }
            (projectile as DelayedMissile).setPhysicsContext(this.physics, this.entityManager.getAsteroids());
            (projectile as DelayedMissile).setAudioManager(this.audioManager);
        } else {
            projectile = new BurstMissile(startPos, velocity, player);
            this.audioManager.playSound('missile');
            // Set the enemy ship as target and physics context
            const targetShip = ships[player === 1 ? 1 : 0];
            if (targetShip && !targetShip.isDestroyed) {
                (projectile as BurstMissile).setTarget(targetShip);
            }
            (projectile as BurstMissile).setPhysicsContext(this.physics, this.entityManager.getAsteroids());
            (projectile as BurstMissile).setAudioManager(this.audioManager);
        }
        
        this.entityManager.addProjectile(projectile);
        ship.consumeAmmo();
        this.updateAmmoDisplay();
        
    }
    
    private updateAmmoDisplay(): void {
        const ships = this.entityManager.getShips();
        if (ships.length >= 2) {
            document.getElementById('p1-bullets')!.textContent = ships[0].bullets.toString();
            document.getElementById('p1-missiles')!.textContent = ships[0].missiles.toString();
            document.getElementById('p1-delayed')!.textContent = ships[0].delayedMissiles.toString();
            document.getElementById('p1-burst')!.textContent = ships[0].burstMissiles.toString();
            document.getElementById('p2-bullets')!.textContent = ships[1].bullets.toString();
            document.getElementById('p2-missiles')!.textContent = ships[1].missiles.toString();
            document.getElementById('p2-delayed')!.textContent = ships[1].delayedMissiles.toString();
            document.getElementById('p2-burst')!.textContent = ships[1].burstMissiles.toString();
        }
    }
    
    reset(): void {
        this.entityManager.reset();
        this.gameOver = false;
        this.winner = 0;
        
        // Hide the victory overlay
        const overlay = document.getElementById('victory-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Start background music
        this.audioManager.startMusic();
        
        const ship1 = new Ship(new Vector2D(50, this.canvas.height / 2), 1);
        const ship2 = new Ship(new Vector2D(this.canvas.width - 50, this.canvas.height / 2), 2);
        this.entityManager.addShip(ship1);
        this.entityManager.addShip(ship2);
        
        const minSpacing = 10; // Reduced spacing to fit more asteroids
        const maxAttempts = 50;
        
        // Scale asteroid count based on screen size
        const baseAsteroidCount = 30;
        const screenArea = (this.canvas.width * this.canvas.height) / (1200 * 800); // Ratio to original size
        const asteroidCount = Math.floor(baseAsteroidCount * Math.sqrt(screenArea));
        
        for (let i = 0; i < asteroidCount; i++) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < maxAttempts) {
                const x = 150 + Math.random() * (this.canvas.width - 300); // Expanded spawn area
                const y = 30 + Math.random() * (this.canvas.height - 60);
                // Mix of small, medium, and occasional large asteroids
                let radius: number;
                const sizeRoll = Math.random();
                if (sizeRoll < 0.6) {
                    radius = 10 + Math.random() * 20; // Small (60%)
                } else if (sizeRoll < 0.9) {
                    radius = 30 + Math.random() * 25; // Medium (30%)
                } else {
                    radius = 55 + Math.random() * 25; // Large (10%)
                }
                const position = new Vector2D(x, y);
                
                let valid = true;
                const existingAsteroids = this.entityManager.getAsteroids();
                for (const existing of existingAsteroids) {
                    if (position.distance(existing.position) < radius + existing.radius + minSpacing) {
                        valid = false;
                        break;
                    }
                }
                
                if (valid) {
                    const asteroid = new Asteroid(position, radius);
                    this.entityManager.addAsteroid(asteroid);
                    placed = true;
                }
                
                attempts++;
            }
        }
        
        this.updateAmmoDisplay();
    }
    
    start(): void {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stop(): void {
        this.isRunning = false;
    }
    
    private gameLoop(): void {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - this.lastTime, 16.67);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    private update(deltaTime: number): void {
        if (this.gameOver) return;
        
        if (this.isAiming) {
            // Update which player is aiming based on current mouse position
            this.aimingPlayer = this.getClosestShipToPosition(this.inputManager.getMousePosition());
            this.updateShipAim();
        }
        
        const allEntities = this.entityManager.getAllEntities();
        const asteroids = this.entityManager.getAsteroids();
        
        this.physics.applyGravity(allEntities, asteroids, deltaTime);
        
        for (const entity of allEntities) {
            entity.update(deltaTime);
            this.physics.checkBounds(entity, this.canvas.width, this.canvas.height);
        }
        
        this.physics.handleCollisions(allEntities);
        
        // Clean up destroyed entities
        this.entityManager.cleanupDestroyedEntities();
        
        // Check for game over
        const ships = this.entityManager.getShips();
        for (let i = 0; i < ships.length; i++) {
            if (ships[i].isDestroyed) {
                this.endGame(i === 0 ? 2 : 1);
            }
        }
    }
    
    private render(): void {
        this.renderer.clear();
        
        // Draw gravity field first (background layer)
        const asteroids = this.entityManager.getAsteroids();
        this.renderer.drawGravityField(asteroids, 6000);
        
        // Draw all entities
        const allEntities = this.entityManager.getAllEntities();
        for (const entity of allEntities) {
            this.renderer.drawEntity(entity);
        }
        
        // Draw aiming UI
        if (this.isAiming) {
            const ships = this.entityManager.getShips();
            const ship = ships[this.aimingPlayer - 1];
            if (ship && !ship.isDestroyed) {
                this.renderer.drawPowerBar(ship.position, this.currentPower, ship.maxPower);
                
                const targetShip = ships[this.aimingPlayer === 1 ? 1 : 0];
                const trajectory = this.physics.predictTrajectory(
                    ship.position.add(Vector2D.fromAngle(ship.aimAngle, ship.radius + 20)),
                    Vector2D.fromAngle(ship.aimAngle, this.currentPower),
                    asteroids,
                    20,
                    500,
                    ship.currentWeapon,
                    targetShip,
                    this.canvas.width,
                    this.canvas.height
                );
                this.renderer.drawTrajectory(trajectory);
            }
        }
        
        // Draw weapon indicators
        const ships = this.entityManager.getShips();
        for (const ship of ships) {
            if (!ship.isDestroyed) {
                this.renderer.drawWeaponIndicator(ship.position, ship.currentWeapon, ship.player);
            }
        }
    }
    
    private endGame(winner: number): void {
        this.gameOver = true;
        this.winner = winner;
        
        // Stop music when game ends
        this.audioManager.stopMusic();
        
        this.uiManager.showWinner(winner as 1 | 2);
    }
}