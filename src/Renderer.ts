import { Entity } from './Entity';
import { Vector2D } from './Vector2D';
import { Asteroid } from './Asteroid';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
    }

    clear(): void {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const size = Math.random() * 2;
            this.ctx.fillRect(x, y, size, size);
        }
    }

    drawEntity(entity: Entity): void {
        entity.draw(this.ctx);
    }

    drawTrajectory(trajectory: Vector2D[], color: string = 'rgba(255, 255, 255, 0.6)'): void {
        if (trajectory.length < 2) return;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]);
        this.ctx.beginPath();

        for (let i = 0; i < trajectory.length; i++) {
            const point = trajectory[i];
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
            
            // Draw dots at intervals for better visibility
            if (i % 10 === 0) {
                this.ctx.fillStyle = color;
                this.ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
            }
        }

        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawPowerBar(position: Vector2D, power: number, maxPower: number): void {
        const barWidth = 100;
        const barHeight = 10;
        const fillWidth = (power / maxPower) * barWidth;

        this.ctx.strokeStyle = 'white';
        this.ctx.fillStyle = this.getPowerColor(power / maxPower);
        
        this.ctx.strokeRect(
            position.x - barWidth / 2, 
            position.y - 30, 
            barWidth, 
            barHeight
        );
        
        this.ctx.fillRect(
            position.x - barWidth / 2, 
            position.y - 30, 
            fillWidth, 
            barHeight
        );
    }

    private getPowerColor(ratio: number): string {
        if (ratio < 0.33) return '#4CAF50';
        if (ratio < 0.66) return '#FFA500';
        return '#F44336';
    }

    drawWeaponIndicator(position: Vector2D, weapon: string, player: number): void {
        this.ctx.fillStyle = player === 1 ? '#4CAF50' : '#2196F3';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        
        let weaponName = weapon.toUpperCase();
        if (weapon === 'delayed') {
            weaponName = 'DELAYED MISSILE';
        } else if (weapon === 'burst') {
            weaponName = 'BURST MISSILE';
        }
        
        // Draw background
        const textWidth = this.ctx.measureText(weaponName).width;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(position.x - textWidth/2 - 5, position.y + 30, textWidth + 10, 20);
        
        // Draw text
        this.ctx.fillStyle = player === 1 ? '#4CAF50' : '#2196F3';
        this.ctx.fillText(weaponName, position.x, position.y + 44);
    }

    
    drawGravityField(asteroids: Asteroid[], G: number): void {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        
        // Draw a gradient for each asteroid
        for (const asteroid of asteroids) {
            if (asteroid.isDestroyed) continue;
            
            // Calculate influence radius based on mass
            const influenceRadius = Math.sqrt(asteroid.mass * G) * 0.15;
            
            // Create radial gradient
            const gradient = this.ctx.createRadialGradient(
                asteroid.position.x, asteroid.position.y, asteroid.radius,
                asteroid.position.x, asteroid.position.y, influenceRadius
            );
            
            // More subtle gradient with better falloff
            gradient.addColorStop(0, 'rgba(100, 50, 200, 0.3)');
            gradient.addColorStop(0.3, 'rgba(80, 30, 150, 0.15)');
            gradient.addColorStop(0.6, 'rgba(60, 20, 120, 0.08)');
            gradient.addColorStop(1, 'rgba(40, 10, 80, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(asteroid.position.x, asteroid.position.y, influenceRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
}