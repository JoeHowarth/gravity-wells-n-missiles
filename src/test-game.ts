import { Vector2D } from './Vector2D';
import { Ship } from './Ship';
import { Bullet, Missile } from './Projectile';
import { Asteroid } from './Asteroid';
import { Physics } from './Physics';

console.log('=== Testing Game Logic ===');

// Test 1: Ship creation and weapon firing
console.log('\n1. Testing Ship Creation and Firing:');
const ship1 = new Ship(new Vector2D(100, 400), 1);
console.log('Ship 1 created:', { 
    position: ship1.position, 
    bullets: ship1.bullets, 
    missiles: ship1.missiles,
    canFire: ship1.canFire()
});

// Test 2: Bullet creation
console.log('\n2. Testing Bullet Creation:');
const bulletVelocity = Vector2D.fromAngle(0, 100);
const bullet = new Bullet(new Vector2D(200, 400), bulletVelocity, 1);
console.log('Bullet created:', {
    position: bullet.position,
    velocity: bullet.velocity,
    radius: bullet.radius,
    owner: bullet.owner
});

// Test 3: Collision detection
console.log('\n3. Testing Collision Detection:');
const ship2 = new Ship(new Vector2D(300, 400), 2);
const bulletNearShip = new Bullet(new Vector2D(295, 400), new Vector2D(0, 0), 1);
console.log('Ship2 position:', ship2.position);
console.log('Bullet near ship2:', bulletNearShip.position);
console.log('Distance:', ship2.position.distance(bulletNearShip.position));
console.log('Collision detected:', ship2.checkCollision(bulletNearShip));
console.log('Required distance for collision:', ship2.radius + bulletNearShip.radius);

// Test 4: Physics gravity
console.log('\n4. Testing Physics:');
const physics = new Physics();
const asteroid = new Asteroid(new Vector2D(600, 400), 50);
const testBullet = new Bullet(new Vector2D(500, 400), new Vector2D(50, 0), 1);
const entities = [testBullet, asteroid];
const asteroids = [asteroid];

console.log('Before gravity - bullet velocity:', testBullet.velocity);
physics.applyGravity(entities, asteroids, 16.67);
console.log('After gravity - bullet velocity:', testBullet.velocity);

// Test 5: Projectile update
console.log('\n5. Testing Projectile Movement:');
const movingBullet = new Bullet(new Vector2D(100, 100), new Vector2D(100, 0), 1);
console.log('Initial position:', movingBullet.position);
movingBullet.update(16.67);
console.log('After update (16.67ms):', movingBullet.position);
console.log('Expected x:', 100 + (100 * 16.67 / 1000));

console.log('\n=== Tests Complete ===');