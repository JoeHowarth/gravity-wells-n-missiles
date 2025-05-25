// Temporary file to hold the new multi-phase implementation

    calculateOptimalThrustDirection(): Vector2D | null {
        if (!this.targetShip || this.targetShip.isDestroyed || !this.physics) {
            return this.velocity.normalize();
        }
        
        const targetPos = this.targetShip.position;
        const remainingThrustTime = Math.max(0, this.thrustTime - this.timeAlive);
        
        if (remainingThrustTime <= 0) {
            return null;
        }
        
        // Clear debug info
        this.debugSampledDirections = [];
        this.debugBestDirection = null;
        this.debugPlannedPhases = [];
        
        // Determine number of phases
        let numPhases = 3;
        if (remainingThrustTime < 600) numPhases = 2;
        if (remainingThrustTime < 300) numPhases = 1;
        
        if (numPhases === 1) {
            return this.calculateSinglePhaseThrust(remainingThrustTime);
        }
        
        // Multi-phase planning
        const phaseDuration = remainingThrustTime / numPhases;
        let bestPhases: Array<{ direction: Vector2D | null; duration: number }> = [];
        let bestDistance = Infinity;
        
        // Evaluate baseline (no thrust)
        const baselineResult = this.physics.evaluateMultiPhaseTrajectory(
            this.position,
            this.velocity,
            [{ direction: null, duration: remainingThrustTime }],
            this.thrustForce,
            targetPos,
            this.asteroids
        );
        bestDistance = baselineResult.minDistance;
        
        // Multi-phase search
        const currentAngle = Math.atan2(this.velocity.y, this.velocity.x);
        const phase1Samples = 8;
        const maxTurnAngle = Math.PI / 3;
        
        for (let i = 0; i < phase1Samples; i++) {
            const phase1Offset = (i / (phase1Samples - 1) - 0.5) * 2 * maxTurnAngle;
            const phase1Angle = currentAngle + phase1Offset;
            const phase1Dir = new Vector2D(Math.cos(phase1Angle), Math.sin(phase1Angle));
            
            const phase2Samples = 4;
            const phase2Arc = Math.PI / 6;
            
            for (let j = 0; j < phase2Samples; j++) {
                const phase2Offset = (j / (phase2Samples - 1) - 0.5) * 2 * phase2Arc;
                const phase2Angle = phase1Angle + phase2Offset;
                const phase2Dir = new Vector2D(Math.cos(phase2Angle), Math.sin(phase2Angle));
                
                if (numPhases === 2) {
                    const phases = [
                        { direction: phase1Dir, duration: phaseDuration },
                        { direction: phase2Dir, duration: phaseDuration }
                    ];
                    
                    const result = this.physics.evaluateMultiPhaseTrajectory(
                        this.position,
                        this.velocity,
                        phases,
                        this.thrustForce,
                        targetPos,
                        this.asteroids
                    );
                    
                    if (result.minDistance < bestDistance) {
                        bestDistance = result.minDistance;
                        bestPhases = phases;
                    }
                } else {
                    const phase3Samples = 4;
                    const phase3Arc = Math.PI / 6;
                    
                    for (let k = 0; k < phase3Samples; k++) {
                        const phase3Offset = (k / (phase3Samples - 1) - 0.5) * 2 * phase3Arc;
                        const phase3Angle = phase2Angle + phase3Offset;
                        const phase3Dir = new Vector2D(Math.cos(phase3Angle), Math.sin(phase3Angle));
                        
                        const phases = [
                            { direction: phase1Dir, duration: phaseDuration },
                            { direction: phase2Dir, duration: phaseDuration },
                            { direction: phase3Dir, duration: phaseDuration }
                        ];
                        
                        const result = this.physics.evaluateMultiPhaseTrajectory(
                            this.position,
                            this.velocity,
                            phases,
                            this.thrustForce,
                            targetPos,
                            this.asteroids
                        );
                        
                        if (result.minDistance < bestDistance) {
                            bestDistance = result.minDistance;
                            bestPhases = phases;
                        }
                    }
                }
            }
        }
        
        // Store for debug
        this.debugPlannedPhases = bestPhases;
        this.plannedPhases = bestPhases;
        
        if (bestDistance >= baselineResult.minDistance * 0.95 || bestPhases.length === 0) {
            return null;
        }
        
        return bestPhases[0].direction;
    }
    
    calculateSinglePhaseThrust(remainingThrustTime: number): Vector2D | null {
        if (!this.physics || !this.targetShip) return null;
        
        const targetPos = this.targetShip.position;
        
        const baselineResult = this.physics.evaluateTrajectory(
            this.position,
            this.velocity,
            null,
            0,
            0,
            targetPos,
            this.asteroids
        );
        
        let bestDirection = this.velocity.normalize();
        let bestDistance = baselineResult.minDistance;
        
        const currentAngle = Math.atan2(this.velocity.y, this.velocity.x);
        const maxTurnAngle = Math.PI / 3;
        const numSamples = 12;
        
        for (let i = 0; i < numSamples; i++) {
            const angleOffset = (i / (numSamples - 1) - 0.5) * 2 * maxTurnAngle;
            const angle = currentAngle + angleOffset;
            const direction = new Vector2D(Math.cos(angle), Math.sin(angle));
            
            this.debugSampledDirections.push(direction);
            
            const result = this.physics.evaluateTrajectory(
                this.position,
                this.velocity,
                direction,
                this.thrustForce,
                remainingThrustTime,
                targetPos,
                this.asteroids
            );
            
            if (result.minDistance < bestDistance) {
                bestDistance = result.minDistance;
                bestDirection = direction;
            }
        }
        
        // Refinement
        if (bestDistance < baselineResult.minDistance * 0.9) {
            const baseAngle = Math.atan2(bestDirection.y, bestDirection.x);
            const refinementArc = Math.PI / 6;
            const refinementSamples = 8;
            
            for (let i = 0; i < refinementSamples; i++) {
                const angleOffset = (i / (refinementSamples - 1) - 0.5) * refinementArc;
                const angle = baseAngle + angleOffset;
                const direction = new Vector2D(Math.cos(angle), Math.sin(angle));
                
                const result = this.physics.evaluateTrajectory(
                    this.position,
                    this.velocity,
                    direction,
                    this.thrustForce,
                    remainingThrustTime,
                    targetPos,
                    this.asteroids
                );
                
                if (result.minDistance < bestDistance) {
                    bestDistance = result.minDistance;
                    bestDirection = direction;
                }
            }
        }
        
        this.debugBestDirection = bestDirection;
        
        return bestDistance < baselineResult.minDistance * 0.95 ? bestDirection : null;
    }