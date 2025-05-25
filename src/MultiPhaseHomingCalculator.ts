import { Vector2D } from './Vector2D';
import { 
    HomingCalculator, 
    HomingContext, 
    HomingResult, 
    HomingDebugInfo 
} from './HomingSystem';

/**
 * Multi-phase homing calculator that plans thrust sequences
 * 
 * Algorithm:
 * 1. Determine optimal number of phases based on remaining thrust time
 * 2. For each phase combination, evaluate the complete trajectory
 * 3. Select the phase sequence that gets closest to target
 * 4. Return the first phase direction for immediate execution
 * 
 * Features bidirectional thrust capability:
 * - Can thrust forward, sideways, or backward relative to current velocity
 * - Enables slowing down, sharp turns, and gravity-assisted maneuvers
 */
export class MultiPhaseHomingCalculator extends HomingCalculator {
    private readonly phase1Samples = 12;  // Increased for better coverage
    private readonly phase2Samples = 6;   // Increased for finer control
    private readonly phase3Samples = 4;
    private readonly refinementArc = Math.PI / 4; // 45 degrees for broader search
    private readonly fullThrustRange = Math.PI * 1.5; // 270 degrees - includes reverse thrust
    
    calculateOptimalThrust(context: HomingContext): HomingResult {
        const { timing, target, physics, currentPosition, currentVelocity, asteroids } = context;
        
        // Early exit conditions
        if (!timing.isWithinThrustWindow() || target.isDestroyed) {
            return this.createNoThrustResult();
        }
        
        const remainingThrustTime = timing.getRemainingThrustTime();
        if (remainingThrustTime <= 0) {
            return this.createNoThrustResult();
        }
        
        // Determine optimal phase count
        const phaseCount = this.determinePhaseCount(remainingThrustTime);
        
        // Single phase fallback
        if (phaseCount === 1) {
            return this.calculateSinglePhase(context);
        }
        
        // Multi-phase planning
        return this.calculateMultiPhase(context, phaseCount);
    }
    
    private determinePhaseCount(remainingThrustTime: number): number {
        if (remainingThrustTime >= 600) return 3;
        if (remainingThrustTime >= 300) return 2;
        return 1;
    }
    
    private calculateSinglePhase(context: HomingContext): HomingResult {
        const { timing, target, physics, currentPosition, currentVelocity, asteroids } = context;
        const remainingThrustTime = timing.getRemainingThrustTime();
        
        const baseline = this.evaluateBaseline(context);
        let bestDirection = currentVelocity.normalize();
        let bestDistance = baseline.minDistance;
        
        const sampledDirections: Vector2D[] = [];
        const currentAngle = this.getCurrentAngle(currentVelocity);
        let evaluationCount = 0;
        
        // Bidirectional sampling - includes forward, side, and reverse thrust
        for (let i = 0; i < 16; i++) {
            const angleOffset = (i / 15 - 0.5) * this.fullThrustRange;
            const angle = currentAngle + angleOffset;
            const direction = new Vector2D(Math.cos(angle), Math.sin(angle));
            
            sampledDirections.push(direction);
            
            const result = physics.evaluateTrajectory(
                currentPosition,
                currentVelocity,
                direction,
                timing.thrustForce,
                remainingThrustTime,
                target.position,
                asteroids
            );
            evaluationCount++;
            
            if (result.minDistance < bestDistance) {
                bestDistance = result.minDistance;
                bestDirection = direction;
            }
        }
        
        // Refinement phase
        if (bestDistance < baseline.minDistance * 0.9) {
            const baseAngle = Math.atan2(bestDirection.y, bestDirection.x);
            
            for (let i = 0; i < 8; i++) {
                const angleOffset = (i / 7 - 0.5) * this.refinementArc;
                const angle = baseAngle + angleOffset;
                const direction = new Vector2D(Math.cos(angle), Math.sin(angle));
                
                const result = physics.evaluateTrajectory(
                    currentPosition,
                    currentVelocity,
                    direction,
                    timing.thrustForce,
                    remainingThrustTime,
                    target.position,
                    asteroids
                );
                evaluationCount++;
                
                if (result.minDistance < bestDistance) {
                    bestDistance = result.minDistance;
                    bestDirection = direction;
                }
            }
        }
        
        const thrustDirection = bestDistance < baseline.minDistance * 0.95 ? bestDirection : null;
        const plannedPhases = thrustDirection ? [{ direction: thrustDirection, duration: remainingThrustTime }] : [];
        
        return {
            thrustDirection,
            plannedPhases,
            debugInfo: {
                sampledDirections,
                bestDirection,
                plannedPhases,
                homingActive: thrustDirection !== null,
                phaseCount: 1,
                evaluationCount
            }
        };
    }
    
    private calculateMultiPhase(context: HomingContext, phaseCount: number): HomingResult {
        const { timing, target, physics, currentPosition, currentVelocity, asteroids } = context;
        const remainingThrustTime = timing.getRemainingThrustTime();
        const phaseDuration = remainingThrustTime / phaseCount;
        
        const baseline = this.evaluateBaseline(context);
        let bestPhases: Array<{ direction: Vector2D | null; duration: number }> = [];
        let bestDistance = baseline.minDistance;
        
        const currentAngle = this.getCurrentAngle(currentVelocity);
        let evaluationCount = 0;
        
        // Phase 1 sampling - bidirectional coverage
        for (let i = 0; i < this.phase1Samples; i++) {
            const phase1Offset = (i / (this.phase1Samples - 1) - 0.5) * this.fullThrustRange;
            const phase1Angle = currentAngle + phase1Offset;
            const phase1Dir = new Vector2D(Math.cos(phase1Angle), Math.sin(phase1Angle));
            
            // Phase 2 sampling - refined around phase 1
            for (let j = 0; j < this.phase2Samples; j++) {
                const phase2Offset = (j / (this.phase2Samples - 1) - 0.5) * 2 * this.refinementArc;
                const phase2Angle = phase1Angle + phase2Offset;
                const phase2Dir = new Vector2D(Math.cos(phase2Angle), Math.sin(phase2Angle));
                
                if (phaseCount === 2) {
                    const phases = [
                        { direction: phase1Dir, duration: phaseDuration },
                        { direction: phase2Dir, duration: phaseDuration }
                    ];
                    
                    const result = physics.evaluateMultiPhaseTrajectory(
                        currentPosition,
                        currentVelocity,
                        phases,
                        timing.thrustForce,
                        target.position,
                        asteroids
                    );
                    evaluationCount++;
                    
                    if (result.minDistance < bestDistance) {
                        bestDistance = result.minDistance;
                        bestPhases = phases;
                    }
                } else {
                    // Phase 3 sampling
                    for (let k = 0; k < this.phase3Samples; k++) {
                        const phase3Offset = (k / (this.phase3Samples - 1) - 0.5) * 2 * this.refinementArc;
                        const phase3Angle = phase2Angle + phase3Offset;
                        const phase3Dir = new Vector2D(Math.cos(phase3Angle), Math.sin(phase3Angle));
                        
                        const phases = [
                            { direction: phase1Dir, duration: phaseDuration },
                            { direction: phase2Dir, duration: phaseDuration },
                            { direction: phase3Dir, duration: phaseDuration }
                        ];
                        
                        const result = physics.evaluateMultiPhaseTrajectory(
                            currentPosition,
                            currentVelocity,
                            phases,
                            timing.thrustForce,
                            target.position,
                            asteroids
                        );
                        evaluationCount++;
                        
                        if (result.minDistance < bestDistance) {
                            bestDistance = result.minDistance;
                            bestPhases = phases;
                        }
                    }
                }
            }
        }
        
        const hasImprovement = bestDistance < baseline.minDistance * 0.95 && bestPhases.length > 0;
        const thrustDirection = hasImprovement ? bestPhases[0].direction : null;
        
        return {
            thrustDirection,
            plannedPhases: bestPhases,
            debugInfo: {
                sampledDirections: [], // Not tracking individual directions in multi-phase
                bestDirection: thrustDirection,
                plannedPhases: bestPhases,
                homingActive: hasImprovement,
                phaseCount,
                evaluationCount
            }
        };
    }
}