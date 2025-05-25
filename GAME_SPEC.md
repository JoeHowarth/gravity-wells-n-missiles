# Gravity Wells & Missiles - Game Specification

## Overview
A 2D top-down tactical artillery game where two players fire projectiles through an asteroid field with strong gravity wells, attempting to destroy each other's ships.

## Core Mechanics

### Game Field
- **Size**: 1200x800 pixels viewport
- **Layout**: Ships positioned on opposite sides (left/right edges)
- **Asteroids**: 15-20 randomly positioned asteroids of varying sizes
- **Visibility**: Entire field visible when zoomed out

### Physics
- **Gravity**: Each asteroid has gravity proportional to its size (1/r² falloff)
- **Collisions**: 
  - Asteroid-asteroid: Elastic bounce
  - Projectile/ship-asteroid: Destroys non-asteroid
  - Projectile-ship: Destroys ship (game over)
  - Projectile-projectile: Both destroyed

### Projectiles
1. **Bullet**: No propulsion, affected by gravity immediately
2. **Missile**: Forward propulsion for 2 seconds, then affected by gravity
- **Ammo**: 10 bullets, 5 missiles per player

### Controls
- **Aiming**: Mouse position sets angle
- **Power**: Hold mouse button to charge shot power (visual indicator)
- **Firing**: Release mouse button
- **Trajectory Preview**: Shows predicted path while aiming
- **Projectile Selection**: Right-click to toggle bullet/missile

### Gameplay
- **Turn System**: Real-time (both players can fire simultaneously)
- **Victory**: First hit wins
- **Ships**: Stationary, cannot move

## Technical Implementation

### Tech Stack
- **Language**: TypeScript
- **Build Tool**: Vite
- **Rendering**: HTML5 Canvas (direct API for simplicity)
- **Physics**: Custom implementation for precise gravity control
- **Architecture**: Simple class-based structure

### Core Classes
- `Game`: Main game loop and state management
- `Ship`: Player ship entity
- `Asteroid`: Gravity well objects
- `Projectile`: Base class for bullets/missiles
- `Physics`: Gravity calculations and collision detection
- `Renderer`: Canvas drawing operations

## UI Elements
- Ammo counter (bottom corners)
- Current weapon indicator
- Power charge bar (follows mouse)
- Victory/defeat overlay
- New game button

## Simplifications for Demo
- No main menu (game starts immediately)
- Fixed random seed for consistent testing
- No sound effects
- No particle effects
- Basic geometric shapes (circles and triangles)