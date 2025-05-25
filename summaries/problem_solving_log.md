# Problem Solving Log

## Critical Issues Resolved

### 1. Trajectory Prediction Mismatch
**Problem**: Trajectory preview didn't match actual projectile path
**Root Cause**: Misaligned spawn positions between preview and actual projectiles
**Solution**: Synchronized spawn position calculations in both systems
**Impact**: Accurate aiming and player confidence in controls

### 2. Gravity Field Visualization
**Problem**: Blocky, grid-based gravity visualization looked poor
**Root Cause**: Discrete sampling approach with visible grid artifacts
**Solution**: Implemented smooth gradient circles with composite blending
**Impact**: Professional visual appearance, better gameplay feedback

### 3. Homing Algorithm Inconsistency
**Problem**: DelayedMissile used inferior single-phase homing algorithm
**Root Cause**: Code duplication without shared abstractions
**Solution**: Refactored to strategy pattern with shared HomingCalculator
**Impact**: Consistent behavior across all missile types, maintainable code

### 4. Limited Missile Maneuverability
**Problem**: Missiles could only thrust forward (120° range), couldn't slow down
**Root Cause**: Arbitrary thrust direction limitation
**Solution**: Extended to 270° bidirectional thrust capability
**Impact**: Missiles can now slow down, reverse, and navigate complex fields

### 5. False Collision Detection
**Problem**: Projectiles colliding when visually clear of asteroids
**Root Cause**: Oversized collision hitboxes relative to visual representation
**Solution**: Reduced projectile hitbox sizes to match visual appearance
**Impact**: More accurate and fair collision detection

## Architectural Decisions

### Strategy Pattern for Homing
**Decision**: Use strategy pattern instead of inheritance for homing algorithms
**Rationale**: Allows easy addition of new algorithms without modifying existing code
**Benefits**: Clean separation of concerns, testable components, extensible design

### Multi-Phase Planning
**Decision**: Implement 3-phase lookahead instead of greedy approach
**Rationale**: Anticipatory planning prevents local minima and dead ends
**Trade-offs**: Higher computational cost (288 vs 8 evaluations) for better navigation

### Timing Abstraction
**Decision**: Separate timing logic from homing calculation
**Rationale**: Delayed missiles need different timing but same navigation logic
**Benefits**: Code reuse, clear responsibilities, easy to add new timing patterns

### Bidirectional Thrust
**Decision**: Allow reverse thrust instead of forward-only limitation
**Rationale**: Real spacecraft can thrust in any direction
**Benefits**: More realistic physics, better gameplay, enhanced maneuverability

## Performance Optimizations

### Planning Frequency
**Decision**: 100ms planning intervals during thrust phases
**Rationale**: Balance between responsiveness and computational cost
**Alternative**: Could reduce to 50ms for higher precision at cost of performance

### Trajectory Sampling
**Decision**: 20ms time steps for trajectory evaluation
**Rationale**: Smooth enough for accurate prediction without excessive computation
**Validation**: Tested against various gravity field configurations

### Debug Visualization
**Decision**: Optional debug overlays that can be toggled
**Rationale**: Useful for development without impacting normal gameplay
**Implementation**: Conditional rendering based on debug flags

## Lessons Learned

1. **Early Abstraction**: Creating interfaces early prevents refactoring pain later
2. **Visual Feedback**: Good debug visualization is essential for complex algorithms
3. **Physics Consistency**: All systems must use identical physics calculations
4. **Performance Measurement**: Profile before optimizing, measure impact of changes
5. **Code Reuse**: Shared abstractions prevent divergent implementations