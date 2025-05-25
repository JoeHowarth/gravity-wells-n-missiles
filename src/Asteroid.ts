import { Entity } from "./Entity";
import { Vector2D } from "./Vector2D";

export class Asteroid extends Entity {
  private shape: Array<{ x: number; y: number }> = [];

  constructor(position: Vector2D, radius: number) {
    const mass = radius * radius * 0.1;
    const velocity = new Vector2D(
      (Math.random() - 0.5) * 15.5,
      (Math.random() - 0.5) * 15.5
    );
    super(position, velocity, radius, mass);

    // Generate random asteroid shape once
    const points = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = this.radius + (Math.random() - 0.5) * this.radius * 0.3;
      this.shape.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    ctx.fillStyle = "#666";
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < this.shape.length; i++) {
      const point = this.shape[i];
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
