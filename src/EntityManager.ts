import { Entity } from './Entity';
import { Ship } from './Ship';
import { Asteroid } from './Asteroid';
import { Projectile } from './Projectile';

export class EntityManager {
    private ships: Ship[] = [];
    private asteroids: Asteroid[] = [];
    private projectiles: Projectile[] = [];

    constructor() {}

    addShip(ship: Ship): void {
        this.ships.push(ship);
    }

    addAsteroid(asteroid: Asteroid): void {
        this.asteroids.push(asteroid);
    }

    addProjectile(projectile: Projectile): void {
        this.projectiles.push(projectile);
    }

    removeShip(ship: Ship): void {
        const index = this.ships.indexOf(ship);
        if (index > -1) {
            this.ships.splice(index, 1);
        }
    }

    removeAsteroid(asteroid: Asteroid): void {
        const index = this.asteroids.indexOf(asteroid);
        if (index > -1) {
            this.asteroids.splice(index, 1);
        }
    }

    getShips(): Ship[] {
        return this.ships;
    }

    getAsteroids(): Asteroid[] {
        return this.asteroids;
    }

    getProjectiles(): Projectile[] {
        return this.projectiles;
    }

    getAllEntities(): Entity[] {
        return [...this.ships, ...this.asteroids, ...this.projectiles];
    }

    updateAll(deltaTime: number): void {
        for (const ship of this.ships) {
            ship.update(deltaTime);
        }

        for (const asteroid of this.asteroids) {
            asteroid.update(deltaTime);
        }

        for (const projectile of this.projectiles) {
            projectile.update(deltaTime);
        }

        this.cleanupDestroyedEntities();
    }

    private cleanupDestroyedEntities(): void {
        this.projectiles = this.projectiles.filter(p => !p.isDestroyed);
        this.asteroids = this.asteroids.filter(a => !a.isDestroyed);
        this.ships = this.ships.filter(s => !s.isDestroyed);
    }

    reset(): void {
        this.ships = [];
        this.asteroids = [];
        this.projectiles = [];
    }

    getEntityCount(): number {
        return this.ships.length + this.asteroids.length + this.projectiles.length;
    }
}