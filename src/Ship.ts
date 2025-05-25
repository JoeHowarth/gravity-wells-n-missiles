import { Entity } from './Entity';
import { Vector2D } from './Vector2D';

export class Ship extends Entity {
    player: number;
    bullets: number = 10;
    missiles: number = 5;
    delayedMissiles: number = 3;
    burstMissiles: number = 2;
    color: string;
    aimAngle: number = 0;
    aimPower: number = 0;
    maxPower: number = 500;
    currentWeapon: 'bullet' | 'missile' | 'delayed' | 'burst' = 'bullet';

    constructor(position: Vector2D, player: number) {
        super(position, new Vector2D(0, 0), 15, 100);
        this.player = player;
        this.color = player === 1 ? '#4CAF50' : '#2196F3';
        // Initialize aim angle to point toward center
        this.aimAngle = player === 1 ? 0 : Math.PI;
    }

    setAim(angle: number, power: number): void {
        this.aimAngle = angle;
        this.aimPower = Math.min(power, this.maxPower);
    }

    canFire(): boolean {
        if (this.currentWeapon === 'bullet') {
            return this.bullets > 0;
        } else if (this.currentWeapon === 'missile') {
            return this.missiles > 0;
        } else if (this.currentWeapon === 'delayed') {
            return this.delayedMissiles > 0;
        } else {
            return this.burstMissiles > 0;
        }
    }

    consumeAmmo(): void {
        if (this.currentWeapon === 'bullet') {
            this.bullets--;
        } else if (this.currentWeapon === 'missile') {
            this.missiles--;
        } else if (this.currentWeapon === 'delayed') {
            this.delayedMissiles--;
        } else {
            this.burstMissiles--;
        }
    }

    setWeapon(weapon: 'bullet' | 'missile' | 'delayed' | 'burst'): void {
        this.currentWeapon = weapon;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.isDestroyed) return;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.aimAngle);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, -this.radius * 0.7);
        ctx.lineTo(-this.radius * 0.5, 0);
        ctx.lineTo(-this.radius, this.radius * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(this.radius + 30, 0);
        ctx.stroke();

        ctx.restore();
    }
}