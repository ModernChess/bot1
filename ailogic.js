// =========================================================================
// ADVANCED AI TACTICAL LOGIC, ATTRACTION/REPULSION & PRIORITY MATRIX (ailogic.js)
// =========================================================================

function calculateUnitTargetPriority(unit, target, allUnits, goldCores) {
    if (!unit || !target) return 0;

    if (target.type === 'base' || target.isCore || target.kind === 'enemyBase') {
        let dist = Math.max(Math.abs(unit.gridX - target.c), Math.abs(unit.gridY - target.r));
        if (dist <= 2) {
            return 999999; 
        }
        return 50000; 
    }

    let score = 100; 

    if (target.kind === 'goldCore' && !target.captured) {
        score += 300; 
    }

    if (target.kind === 'enemyBase') {
        let distToBase = Math.max(Math.abs(unit.gridX - target.c), Math.abs(unit.gridY - target.r));
        score += Math.max(100, 5000 - (distToBase * 40));
    }

    if (target.kind === 'enemyUnit') {
        let myPower = typeof getCachedEffectivePower === 'function' ? getCachedEffectivePower(unit) : 1;
        let enemyPower = typeof getCachedEffectivePower === 'function' ? getCachedEffectivePower(target) : 1;

        if (myPower > enemyPower) {
            score += 250 + (enemyPower * 20);
            let nearestFriendDist = getNearestFriendlyDistance(target, allUnits);
            if (nearestFriendDist >= 4) {
                score += 150; 
            }
        } else {
            score -= 400 + (enemyPower * 50);
        }
    }

    if (target.kind === 'stalemateGroup' || (typeof isUnitLockedInStalemate === 'function' && isUnitLockedInStalemate(target, allUnits))) {
        score += 450;
    }

    return score;
}

function getNearestFriendlyDistance(unit, allUnits) {
    let team = typeof getTeamFromUnit === 'function' ? getTeamFromUnit(unit) : unit.team;
    let teammates = allUnits.filter(u => (typeof getTeamFromUnit === 'function' ? getTeamFromUnit(u) === team : u.team === team) && u !== unit);
    
    if (teammates.length === 0) return 99; 

    let minDist = Infinity;
    teammates.forEach(tm => {
        let dist = Math.max(Math.abs(unit.gridX - tm.gridX), Math.abs(unit.gridY - tm.gridY));
        if (dist < minDist) minDist = dist;
    });

    return minDist;
}

function evaluateAdvancedBotMoves(unit, allUnits, goldCores) {
    let legalMoves = typeof getLegalMoves === 'function' ? getLegalMoves(unit) : [];
    if (!legalMoves || legalMoves.length === 0) return null;

    let evaluatedMoves = [];
    let enemyUnits = allUnits.filter(u => (typeof getTeamFromUnit === 'function' ? getTeamFromUnit(u) !== (typeof getTeamFromUnit === 'function' ? getTeamFromUnit(unit) : unit.team) : u.team !== unit.team));

    legalMoves.forEach(move => {
        if (allUnits.some(u => u.gridX === move.c && u.gridY === move.r)) return;

        let hazard = typeof getPositionHazardLevel === 'function' ? getPositionHazardLevel(move, unit, null, enemyUnits) : 0;
        if (hazard > 3) return; 

        let priorityPoints = 100 - (hazard * 30);

        enemyUnits.forEach(enemy => {
            let distToEnemy = Math.max(Math.abs(move.c - enemy.gridX), Math.abs(move.r - enemy.gridY));
            let myPower = typeof getCachedEffectivePower === 'function' ? getCachedEffectivePower(unit) : 1;
            let enemyPower = typeof getCachedEffectivePower === 'function' ? getCachedEffectivePower(enemy) : 1;

            if (myPower > enemyPower && distToEnemy <= 3) {
                priorityPoints += (4 - distToEnemy) * 80; 
            } else if (myPower <= enemyPower && distToEnemy <= 4) {
                priorityPoints -= (5 - distToEnemy) * 100; 
            }
        });

        if (typeof goldCores !== 'undefined' && goldCores.coreList) {
            goldCores.coreList.forEach(core => {
                if (core.owner !== 'red') {
                    let distToCore = Math.max(Math.abs(move.c - core.c), Math.abs(move.r - core.r));
                    if (distToCore <= 3) {
                        priorityPoints += (4 - distToCore) * 50;
                    }
                }
            });
        }

        evaluatedMoves.push({
            move: move,
            priority: priorityPoints
        });
    });

    if (evaluatedMoves.length === 0) return null;

    evaluatedMoves.sort((a, b) => b.priority - a.priority);
    return evaluatedMoves[0].move;
}
