import { Ship } from './Ship';
import { Asteroid } from './Asteroid';
import { Projectile, Bullet, Missile, DelayedMissile } from './Projectile';
import { Physics } from './Physics';
import { Renderer } from './Renderer';
import { Vector2D } from './Vector2D';
import { Entity } from './Entity';
import { AudioManager } from './AudioManager';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private renderer: Renderer;
    private physics: Physics;
    private audioManager: AudioManager;
    
    private ships: Ship[] = [];
    private asteroids: Asteroid[] = [];
    private projectiles: Projectile[] = [];
    private entities: Entity[] = [];
    
    private lastTime: number = 0;
    private isRunning: boolean = false;
    private gameOver: boolean = false;
    private winner: number = 0;
    
    private mousePos: Vector2D = new Vector2D(0, 0);
    private isAiming: boolean = false;
    private aimingPlayer: number = 0;
    private currentPower: number = 100;
    
    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.renderer = new Renderer(ctx, canvas.width, canvas.height);
        this.physics = new Physics();
        this.audioManager = new AudioManager();
        this.physics.setAudioManager(this.audioManager);
        
        this.setupEventListeners();
        this.setupKeyboardListeners();
        this.setupAudioControls();
        this.reset();
    }
    
    private setupEventListeners(): void {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = new Vector2D(
                e.clientX - rect.left,
                e.clientY - rect.top
            );
            
            if (!this.gameOver) {
                this.updateShipAim();
            }
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameOver) return;
            
            const player = this.mousePos.x < this.canvas.width / 2 ? 1 : 2;
            const ship = this.ships[player - 1];
            
            if (ship && !ship.isDestroyed && ship.canFire()) {
                this.isAiming = true;
                this.aimingPlayer = player;
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            if (this.isAiming && !this.gameOver) {
                this.fire(this.aimingPlayer);
                this.isAiming = false;
            }
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    private setupAudioControls(): void {
        const muteBtn = document.getElementById('mute-btn') as HTMLButtonElement;
        const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
        
        muteBtn.addEventListener('click', () => {
            this.audioManager.toggleMute();
            muteBtn.textContent = this.audioManager.isMusicMuted() ? '🔇 Unmute' : '🔊 Mute';
        });
        
        volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt((e.target as HTMLInputElement).value) / 100;
            this.audioManager.setVolume(volume);
        });
    }
    
    private setupKeyboardListeners(): void {
        window.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            
            const player = this.mousePos.x < this.canvas.width / 2 ? 1 : 2;
            const ship = this.ships[player - 1];
            
            switch (e.key.toLowerCase()) {
                case 'w':
                    this.currentPower = Math.min(this.currentPower + 20, 500);
                    this.audioManager.playSound('powerup');
                    break;
                case 'a':
                    this.currentPower = Math.max(this.currentPower - 20, 0);
                    this.audioManager.playSound('powerdown');
                    break;
                case '1':
                    if (ship && !ship.isDestroyed) {
                        ship.setWeapon('bullet');
                    }
                    break;
                case '2':
                    if (ship && !ship.isDestroyed) {
                        ship.setWeapon('missile');
                    }
                    break;
                case '3':
                    if (ship && !ship.isDestroyed) {
                        ship.setWeapon('delayed');
                    }
                    break;
            }
        });
    }
    
    private updateShipAim(): void {
        const player = this.mousePos.x < this.canvas.width / 2 ? 1 : 2;
        const ship = this.ships[player - 1];
        
        if (ship && !ship.isDestroyed) {
            const angle = Math.atan2(
                this.mousePos.y - ship.position.y,
                this.mousePos.x - ship.position.x
            );
            ship.setAim(angle, this.currentPower);
        }
    }
    
    private fire(player: number): void {
        const ship = this.ships[player - 1];
        if (!ship || ship.isDestroyed || !ship.canFire()) return;
        
        console.log(`Ship ${player} actual position:`, ship.position);
        
        const speed = Math.max(this.currentPower, 50);
        const velocity = Vector2D.fromAngle(ship.aimAngle, speed);
        const spawnDistance = ship.radius + 20;
        const spawnOffset = Vector2D.fromAngle(ship.aimAngle, spawnDistance);
        const startPos = new Vector2D(
            ship.position.x + spawnOffset.x,
            ship.position.y + spawnOffset.y
        );
        
        console.log('Spawn calculation:', {
            shipPos: { x: ship.position.x, y: ship.position.y },
            aimAngle: ship.aimAngle,
            spawnDistance: spawnDistance,
            spawnOffset: { x: spawnOffset.x, y: spawnOffset.y },
            calculation: `${ship.position.x} + ${spawnOffset.x} = ${startPos.x}`,
            resultPos: { x: startPos.x, y: startPos.y }
        });
        
        let projectile: Projectile;
        if (ship.currentWeapon === 'bullet') {
            projectile = new Bullet(startPos, velocity, player);
            this.audioManager.playSound('fire');
        } else if (ship.currentWeapon === 'missile') {
            projectile = new Missile(startPos, velocity, player);
            // Set the enemy ship as target and physics context
            const targetShip = this.ships[player === 1 ? 1 : 0];
            if (targetShip && !targetShip.isDestroyed) {
                (projectile as Missile).setTarget(targetShip);
            }
            (projectile as Missile).setPhysicsContext(this.physics, this.asteroids);
            (projectile as Missile).setAudioManager(this.audioManager);
            this.audioManager.playSound('missile');
        } else {
            projectile = new DelayedMissile(startPos, velocity, player);
            this.audioManager.playSound('missile');
            // Set the enemy ship as target and physics context
            const targetShip = this.ships[player === 1 ? 1 : 0];
            if (targetShip && !targetShip.isDestroyed) {
                (projectile as DelayedMissile).setTarget(targetShip);
            }
            (projectile as DelayedMissile).setPhysicsContext(this.physics, this.asteroids);
            (projectile as DelayedMissile).setAudioManager(this.audioManager);
        }
        
        this.projectiles.push(projectile);
        this.entities.push(projectile);
        ship.consumeAmmo();
        this.updateAmmoDisplay();
        
        console.log(`Fired ${ship.currentWeapon} from player ${player}:`, {
            shipPosition: ship.position,
            projectilePosition: projectile.position,
            velocity: projectile.velocity,
            speed: speed,
            aimAngle: ship.aimAngle,
            totalEntities: this.entities.length,
            totalProjectiles: this.projectiles.length
        });
    }
    
    private updateAmmoDisplay(): void {
        document.getElementById('p1-bullets')!.textContent = this.ships[0].bullets.toString();
        document.getElementById('p1-missiles')!.textContent = this.ships[0].missiles.toString();
        document.getElementById('p1-delayed')!.textContent = this.ships[0].delayedMissiles.toString();
        document.getElementById('p2-bullets')!.textContent = this.ships[1].bullets.toString();
        document.getElementById('p2-missiles')!.textContent = this.ships[1].missiles.toString();
        document.getElementById('p2-delayed')!.textContent = this.ships[1].delayedMissiles.toString();
    }
    
    reset(): void {
        this.ships = [];
        this.asteroids = [];
        this.projectiles = [];
        this.entities = [];
        this.gameOver = false;
        this.winner = 0;
        
        // Start background music
        this.audioManager.startMusic();
        
        const ship1 = new Ship(new Vector2D(50, this.canvas.height / 2), 1);
        const ship2 = new Ship(new Vector2D(this.canvas.width - 50, this.canvas.height / 2), 2);
        this.ships.push(ship1, ship2);
        this.entities.push(ship1, ship2);
        
        const minSpacing = 10; // Reduced spacing to fit more asteroids
        const maxAttempts = 50;
        
        for (let i = 0; i < 40; i++) { // Increased from 30
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
                for (const existing of this.asteroids) {
                    if (position.distance(existing.position) < radius + existing.radius + minSpacing) {
                        valid = false;
                        break;
                    }
                }
                
                if (valid) {
                    const asteroid = new Asteroid(position, radius);
                    this.asteroids.push(asteroid);
                    this.entities.push(asteroid);
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
            this.updateShipAim();
        }
        
        this.physics.applyGravity(this.entities, this.asteroids, deltaTime);
        
        for (const entity of this.entities) {
            entity.update(deltaTime);
            this.physics.checkBounds(entity, this.canvas.width, this.canvas.height);
        }
        
        this.physics.handleCollisions(this.entities);
        
        const beforeProjectiles = this.projectiles.length;
        this.projectiles = this.projectiles.filter(p => !p.isDestroyed);
        this.entities = this.entities.filter(e => !e.isDestroyed);
        
        if (beforeProjectiles !== this.projectiles.length) {
            console.log(`Projectiles removed: ${beforeProjectiles} -> ${this.projectiles.length}`);
        }
        
        for (let i = 0; i < this.ships.length; i++) {
            if (this.ships[i].isDestroyed) {
                this.endGame(i === 0 ? 2 : 1);
            }
        }
    }
    
    private render(): void {
        this.renderer.clear();
        
        // Draw gravity field first (background layer)
        this.renderer.drawGravityField(this.asteroids, 6000);
        
        let projectileCount = 0;
        for (const entity of this.entities) {
            this.renderer.drawEntity(entity);
            if (entity instanceof Projectile) {
                projectileCount++;
            }
        }
        
        // Draw missile debug legend
        this.renderer.drawMissileDebugLegend();
        
        if (projectileCount > 0) {
            console.log(`Rendering ${projectileCount} projectiles`);
        }
        
        if (this.isAiming) {
            const ship = this.ships[this.aimingPlayer - 1];
            if (ship && !ship.isDestroyed) {
                this.renderer.drawPowerBar(ship.position, this.currentPower, ship.maxPower);
                
                const targetShip = this.ships[this.aimingPlayer === 1 ? 1 : 0];
                const trajectory = this.physics.predictTrajectory(
                    ship.position.add(Vector2D.fromAngle(ship.aimAngle, ship.radius + 20)),
                    Vector2D.fromAngle(ship.aimAngle, this.currentPower),
                    this.asteroids,
                    20,
                    500,
                    ship.currentWeapon,
                    targetShip
                );
                this.renderer.drawTrajectory(trajectory);
            }
        }
        
        for (const ship of this.ships) {
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
        
        const overlay = document.getElementById('victory-overlay')!;
        const message = document.getElementById('victory-message')!;
        
        message.textContent = `Player ${winner} Wins!`;
        overlay.style.display = 'block';
    }
}