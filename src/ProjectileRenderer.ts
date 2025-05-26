import { Projectile } from './Projectile';
import { Vector2D } from './Vector2D';

export class ProjectileRenderer {
    static drawThrust(
        ctx: CanvasRenderingContext2D, 
        projectile: Projectile,
        thrustDirection: Vector2D,
        color: string = '#FF6B00'
    ): void {
        ctx.save();
        
        // Calculate thrust flame position (opposite of thrust direction)
        const flameDirection = thrustDirection.multiply(-1);
        const flameStart = projectile.position.add(flameDirection.multiply(projectile.radius));
        
        // Create gradient for flame effect
        const gradient = ctx.createRadialGradient(
            flameStart.x, flameStart.y, 0,
            flameStart.x + flameDirection.x * 20, 
            flameStart.y + flameDirection.y * 20, 
            15
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(0.7, 'rgba(255, 107, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        // Draw flame
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            flameStart.x + flameDirection.x * 10, 
            flameStart.y + flameDirection.y * 10, 
            15, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Add some particle effects
        for (let i = 0; i < 3; i++) {
            const particleOffset = new Vector2D(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            const particlePos = flameStart.add(flameDirection.multiply(5 + Math.random() * 15)).add(particleOffset);
            
            ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${0.3 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.arc(particlePos.x, particlePos.y, 2 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    static drawTrail(
        ctx: CanvasRenderingContext2D,
        trail: Vector2D[],
        color: string,
        maxTrailLength: number = 30
    ): void {
        if (trail.length < 2) return;
        
        ctx.save();
        
        const startIndex = Math.max(0, trail.length - maxTrailLength);
        
        for (let i = startIndex + 1; i < trail.length; i++) {
            const alpha = (i - startIndex) / (trail.length - startIndex);
            ctx.strokeStyle = color.replace('rgb', 'rgba').replace(')', `, ${alpha * 0.5})`);
            ctx.lineWidth = alpha * 3;
            
            ctx.beginPath();
            ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
            ctx.lineTo(trail[i].x, trail[i].y);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    static drawProjectile(
        ctx: CanvasRenderingContext2D,
        projectile: Projectile,
        color: string
    ): void {
        ctx.save();
        
        // Draw glow effect
        const gradient = ctx.createRadialGradient(
            projectile.position.x, projectile.position.y, 0,
            projectile.position.x, projectile.position.y, projectile.radius * 3
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color.replace('rgb', 'rgba').replace(')', ', 0.3)'));
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(projectile.position.x, projectile.position.y, projectile.radius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw main projectile
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(projectile.position.x, projectile.position.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add bright center
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(projectile.position.x, projectile.position.y, projectile.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}