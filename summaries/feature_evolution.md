# Feature Evolution Timeline

## Control System Evolution

### Initial State
- Time-based charging system (hold to charge power)
- Basic trajectory preview
- Limited visual feedback

### Iteration 1: W/A Power Control
- Replaced time-based charging with W/A key power adjustment
- Instant power changes for more responsive gameplay
- Separated aiming (mouse) from power (keyboard) controls

### Iteration 2: Enhanced Trajectory
- Extended trajectory preview to screen edge or collision point
- Fixed prediction accuracy to match actual physics
- Added visual clarity improvements (reduced bullet size to 3px)

### Final State
- Precise power control with W/A keys
- Accurate full-length trajectory prediction
- Clear visual feedback with tooltips

## Weapon System Evolution

### Initial State
- Single bullet type
- Right-click toggle for weapon switching
- Basic projectile physics

### Iteration 1: Homing Missiles
- Added homing missiles with basic target tracking
- Simple thrust-toward-target algorithm
- Right-click toggle between bullets and missiles

### Iteration 2: Delayed Homing
- Created delayed homing missiles (2-second bullet phase)
- Added weapon type indicators
- Maintained right-click toggle system

### Iteration 3: Number Key Selection
- Replaced right-click toggle with number key selection (1/2/3)
- Clear weapon type indication
- More intuitive weapon switching

### Final State
- Three weapon types: Bullet (1), Homing Missile (2), Delayed Missile (3)
- Number key selection system
- Consistent homing behavior across missile types

## Homing Algorithm Evolution

### Phase 1: Basic Targeting
- Simple thrust-toward-target approach
- No obstacle avoidance
- Single-step decision making

### Phase 2: Single-Phase Planning
- Added basic trajectory evaluation
- Simple thrust direction sampling
- Limited to forward thrust only (120°)

### Phase 3: Multi-Phase Planning
- Implemented 3-phase lookahead algorithm
- 288 trajectory evaluations per planning cycle
- Collision avoidance through trajectory scoring

### Phase 4: Bidirectional Thrust
- Extended thrust range to 270°
- Enabled reverse thrust and slowing down
- Color-coded debug visualization

### Final State
- Sophisticated 3-phase planning with collision avoidance
- Bidirectional thrust capability (270° range)
- Shared algorithm across all missile types via strategy pattern

## Visual System Evolution

### Phase 1: Basic Rendering
- Simple sprite rendering
- Basic collision detection visualization
- No gravity field representation

### Phase 2: Gravity Visualization
- Added blocky grid-based gravity field display
- Basic color coding for gravity strength
- Visible grid artifacts

### Phase 3: Smooth Gradients
- Implemented smooth gradient circles
- Composite blending for multiple gravity sources
- Professional visual appearance

### Phase 4: Debug Overlays
- Added homing missile debug visualization
- Thrust direction indicators
- Optional debug information display

### Final State
- Smooth gradient gravity field visualization
- Comprehensive debug overlays with color coding
- Clean visual separation between gameplay and debug info

## Architecture Evolution

### Initial Architecture
- Monolithic classes with embedded logic
- Direct coupling between components
- Code duplication across similar features

### Refactoring 1: Entity System
- Introduced base Entity class
- Inheritance hierarchy for game objects
- Shared physics and lifecycle management

### Refactoring 2: Strategy Pattern
- Created HomingCalculator abstraction
- Separated timing logic from homing logic
- Eliminated code duplication between missile types

### Final Architecture
- Clean separation of concerns
- Strategy pattern for extensible algorithms
- Shared abstractions preventing code drift
- Easy to test and maintain components

## Key Design Principles Emerged

1. **Consistency**: All similar features should behave identically
2. **Separation**: Distinct concerns should be in separate classes/interfaces
3. **Extensibility**: New features should extend existing patterns
4. **Feedback**: Visual debugging is essential for complex algorithms
5. **Physics Fidelity**: All predictions must match actual behavior