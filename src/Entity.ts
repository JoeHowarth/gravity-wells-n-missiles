import { Vector2D } from './Vector2D';

export abstract class Entity {
    position: Vector2D;
    velocity: Vector2D;
    radius: number;
    mass: number;
    isDestroyed: boolean = false;

    constructor(position: Vector2D, velocity: Vector2D, radius: number, mass: number) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.mass = mass;
    }

    update(deltaTime: number): void {
        if (!this.isDestroyed) {
            const oldPos = this.position.clone();
            this.position = this.position.add(this.velocity.multiply(deltaTime / 1000));
            
        }
    }

    checkCollision(other: Entity): boolean {
        if (this.isDestroyed || other.isDestroyed) return false;
        const distance = this.position.distance(other.position);
        return distance < (this.radius + other.radius);
    }

    destroy(): void {
        this.isDestroyed = true;
    }

    abstract draw(ctx: CanvasRenderingContext2D): void;
}