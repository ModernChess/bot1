// =========================================================================
// RED TEAM PATHFINDING BOT CONTROLLER (red_bot.js)
// Upgraded with Non-Stalemated Base Defense Filtering
// =========================================================================

function buildSuperpowerCache(allUnits) {
    let cache = {
        blue: typeof getSuperunitsForTeam === 'function' ? getSuperunitsForTeam('blue', allUnits) : [],
        red: typeof getSuperunitsForTeam === 'function' ? getSuperunitsForTeam('red', allUnits) : []
    };
    
    let unitPowerMap = new Map();
    ['blue', 'red'].forEach(team => {
        cache[team].forEach(su => {
            su.units.forEach(u => {
                unitPowerMap.set(u, su.power);
            });
        });
    });
    
    return { cache, unitPowerMap };
}

function getCachedEffectivePower(unit, unitPowerMap) {
    if (unitPowerMap && unitPowerMap.has(unit)) {
        return unitPowerMap.get(unit);
    }
    return typeof getUnitPower === 'function' ? getUnitPower(unit) : 1;
}

function isTank(u) {
    if (!u) return false;
    let name = (u.name || u.type || '').toLowerCase();
    return name.includes('tank') || u.unitType === 'tank';
}

function isInfantry(u) {
    if (!u) return false;
    let name = (u.name || u.type || '').toLowerCase();
    return name.includes('infantry') || name.includes('soldier') || u.unitType === 'infantry';
}

function getAvoidanceDistance(myUnit, enemyUnit) {
    let myIsInf = isInfantry(myUnit);
    let myIsTnk = isTank(myUnit);
    let enIsInf = isInfantry(enemyUnit);
    let enIsTnk = isTank(enemyUnit);

    if (myIsInf && enIsTnk) return 5; 
    if (myIsTnk && enIsTnk) return 3; 
    if (myIsInf && enIsInf) return 2; 
    
    return 0;
}

function getPositionHazardLevel(posCoord, unit, unitPowerMap, enemyUnits) {
    let myEffectivePower = getCachedEffectivePower(unit, unitPowerMap);
    let maxViolationDepth = 0;

    enemyUnits.forEach(enemy => {
        let typeAvoidDist = getAvoidanceDistance(unit, enemy);
        let enemyEffectivePower = getCachedEffectivePower(enemy, unitPowerMap);
        let powerAvoidDist = (enemyEffectivePower > myEffectivePower) ? 6 : 0;
        
        let threshold = Math.max(typeAvoidDist, powerAvoidDist);
        if (threshold === 0) return;

        let chebyshevDist = Math.max(Math.abs(posCoord.c - enemy.gridX), Math.abs(posCoord.r - enemy.gridY));
        if (chebyshevDist <= threshold) {
            let severity = threshold - chebyshevDist + 1;
            if (severity > maxViolationDepth) {
                maxViolationDepth = severity;
            }
        }
    });

    return maxViolationDepth;
}

function findPathToTarget(unit, targetC, targetR, unitPowerMap, enemyUnits, allowHazardFallback = false) {
    let start = { c: unit.gridX, r: unit.gridY };
    let goal = { c: targetC, r: targetR };
    
    let openSet = [{ c: start.c, r: start.r, g: 0, h: heuristic(start, goal), parent: null }];
    let closedSet = new Set();
    
    function heuristic(a, b) {
        return Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r));
    }

    while (openSet.length > 0) {
        openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
        let current = openSet.shift();
        
        let key = `${current.c},${current.r}`;
        if (current.c === goal.c && current.r === goal.r) {
            let path = [];
            let curr = current;
            while (curr.parent) {
                path.unshift({ c: curr.c, r: curr.r });
                curr = curr.parent;
            }

            if (!allowHazardFallback && enemyUnits && path.length > 0) {
                for (let step of path) {
                    let stepHazard = getPositionHazardLevel(step, unit, unitPowerMap, enemyUnits);
                    if (stepHazard > 0) {
                        return null; 
                    }
                }
            }

            return path;
        }
        
        closedSet.add(key);
        
        let neighbors = getNeighbors(current, unit);
        for (let n of neighbors) {
            let nKey = `${n.c},${n.r}`;
            if (closedSet.has(nKey)) continue;
            
            let hazardSeverity = enemyUnits ? getPositionHazardLevel(n, unit, unitPowerMap, enemyUnits) : 0;
            if (!allowHazardFallback && hazardSeverity > 0) {
                continue; 
            }

            let tentativeG = current.g + (hazardSeverity > 0 ? hazardSeverity * 5 : 1);
            let existing = openSet.find(item => item.c === n.c && item.r === n.r);
            
            if (!existing) {
                openSet.push({ c: n.c, r: n.r, g: tentativeG, h: heuristic(n, goal), parent: current });
            } else if (tentativeG < existing.g) {
                existing.g = tentativeG;
                existing.parent = current;
            }
        }
    }
    
    return null;
}

function getNeighbors(node, unit) {
    let neighbors = [];
    let directions = [
        {dx: 0, dy: -1}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0},
        {dx: -1, dy: -1}, {dx: 1, dy: -1}, {dx: -1, dy: 1}, {dx: 1, dy: 1}
    ];
    
    directions.forEach(dir => {
        let nc = node.c + dir.dx;
        let nr = node.r + dir.dy;
        if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
            let terrain = getTerrain(nc, nr);
            let isWater = isWaterTerrain(terrain);
            let validTerrain = false;
            
            if (unit.type === 'land' && !isWater) validTerrain = true;
            if (unit.type === 'water' && isWater) validTerrain = true;
            
            if (validTerrain) {
                let blocked = units.some(u => u.gridX === nc && u.gridY === nr);
                if (!blocked) {
                    neighbors.push({ c: nc, r: nr });
                }
            }
        }
    });
    return neighbors;
}

function getAdjacentAttackTile(unit, targetUnit, unitPowerMap, enemyUnits) {
    let targetNeighbors = [
        {c: targetUnit.gridX, r: targetUnit.gridY - 1},
        {c: targetUnit.gridX, r: targetUnit.gridY + 1},
        {c: targetUnit.gridX - 1, r: targetUnit.gridY},
        {c: targetUnit.gridX + 1, r: targetUnit.gridY},
        {c: targetUnit.gridX - 1, r: targetUnit.gridY - 1},
        {c: targetUnit.gridX + 1, r: targetUnit.gridY - 1},
        {c: targetUnit.gridX - 1, r: targetUnit.gridY + 1},
        {c: targetUnit.gridX + 1, r: targetUnit.gridY + 1}
    ];

    let validAdj = targetNeighbors.filter(pos => {
        if (pos.c < 0 || pos.c >= cols || pos.r < 0 || pos.r >= rows) return false;
        let terrain = getTerrain(pos.c, pos.r);
        let isWater = isWaterTerrain(terrain);
        if (unit.type === 'land' && isWater) return false;
        if (unit.type === 'water' && !isWater) return false;
        if (units.some(u => u.gridX === pos.c && u.gridY === pos.r && u !== targetUnit)) return false;
        return true;
    });

    if (validAdj.length === 0) return null;

    let bestTile = null;
    let shortestPathLength = Infinity;

    validAdj.forEach(adj => {
        let path = findPathToTarget(unit, adj.c, adj.r, unitPowerMap, enemyUnits, true);
        if (path && path.length < shortestPathLength) {
            shortestPathLength = path.length;
            bestTile = adj;
        }
    });

    return bestTile;
}

function executeRedBotTurn() {
    if (typeof gameOver !== 'undefined' && gameOver) return;
    if (typeof currentTurn !== 'undefined' && currentTurn !== 'red') return;

    let redUnits = units.filter(u => getTeamFromUnit(u) === 'red');
    let blueUnits = units.filter(u => getTeamFromUnit(u) === 'blue');
    let { unitPowerMap } = buildSuperpowerCache(units);

    if (typeof currentCampaignLevel !== 'undefined' && currentCampaignLevel <= 5) {
        if ((currentCampaignLevel === 1 || currentCampaignLevel === 2) && blueUnits.length > 0) {
            let blueUnit = blueUnits[0];
            let redBase = { c: 11, r: 0 };
            if (typeof findPathToTarget === 'function') {
                window.activeRedBotPath = findPathToTarget(blueUnit, redBase.c, redBase.r, unitPowerMap, [], true) || [];
            }
        }

        if (currentCampaignLevel >= 4 && redUnits.length >= 2 && blueUnits.length > 0) {
            let staticRedUnit = redUnits[0];
            let activeRedUnit = redUnits[1];

            let isStalmated = typeof isUnitLockedInStalemate === 'function' ? isUnitLockedInStalemate(staticRedUnit, units) : false;
            if (isStalmated) {
                if (typeof findPathToTarget === 'function') {
                    window.activeRedBotPath = findPathToTarget(blueUnits[0], activeRedUnit.gridX, activeRedUnit.gridY, unitPowerMap, [], true) || [];
                }
            }
        }

        setTimeout(() => {
            currentTurn = 'blue';
        }, 500);
        return;
    }

    function getUnitMaxRange(u) {
        if (u.movementRange) return u.movementRange;
        if (u.maxRange) return u.maxRange;
        return isTank(u) ? 3 : 2; 
    }

    let movableUnits = redUnits.filter(u => {
        let moves = getLegalMoves(u);
        return moves && moves.length > 0 && !(typeof isUnitLockedInStalemate === 'function' && isUnitLockedInStalemate(u, units));
    });

    if (movableUnits.length === 0) {
        currentTurn = 'blue';
        return;
    }

    // =========================================================================
    // STEP 1: ABSOLUTE BASE DEFENSE EMERGENCY OVERRIDE (Greater than Stalemate)
    // =========================================================================
    let redBaseSquares = typeof getBaseSquares === 'function' ? getBaseSquares('red') : [{c: 11, r: 0}];
    let baseThreatDetected = false;
    let targetIntruder = null;

    for (let enemy of blueUnits) {
        for (let baseTile of redBaseSquares) {
            let distToBase = Math.max(Math.abs(enemy.gridX - baseTile.c), Math.abs(enemy.gridY - baseTile.r));
            if (distToBase <= 5) {
                baseThreatDetected = true;
                targetIntruder = enemy;
                break;
            }
        }
        if (baseThreatDetected) break;
    }

    if (baseThreatDetected && targetIntruder) {
        console.warn(`[red_bot] 🚨 ABSOLUTE EMERGENCY: Intruder ${targetIntruder.name} within 5 tiles of Red Base! Alerting non-stalemated units to slam into target.`);

        // FIXED: Explicitly filter out any stalemated units so they aren't chosen for emergency defense
        let emergencyDefenders = redUnits.filter(u => {
            let isStalemated = typeof isUnitLockedInStalemate === 'function' && isUnitLockedInStalemate(u, units);
            if (isStalemated) return false;
            let moves = getLegalMoves(u);
            return moves && moves.length > 0;
        });

        if (emergencyDefenders.length > 0) {
            emergencyDefenders.sort((a, b) => {
                let distA = Math.max(Math.abs(a.gridX - targetIntruder.gridX), Math.abs(a.gridY - targetIntruder.gridY));
                let distB = Math.max(Math.abs(b.gridX - targetIntruder.gridX), Math.abs(b.gridY - targetIntruder.gridY));
                return distA - distB;
            });

            let defendingUnit = emergencyDefenders[0];
            let attackTile = getAdjacentAttackTile(defendingUnit, targetIntruder, unitPowerMap, blueUnits);
            let targetMove = null;

            if (attackTile) {
                let path = findPathToTarget(defendingUnit, attackTile.c, attackTile.r, unitPowerMap, blueUnits, true);
                if (path && path.length > 0) {
                    let maxRange = getUnitMaxRange(defendingUnit);
                    let stepsToTake = Math.min(path.length, maxRange);
                    targetMove = path[stepsToTake - 1];
                }
            }

            if (!targetMove) {
                let directPath = findPathToTarget(defendingUnit, targetIntruder.gridX, targetIntruder.gridY, unitPowerMap, blueUnits, true);
                if (directPath && directPath.length > 0) {
                    let maxRange = getUnitMaxRange(defendingUnit);
                    let stepsToTake = Math.min(directPath.length, maxRange);
                    targetMove = directPath[stepsToTake - 1];
                }
            }

            if (targetMove && !units.some(u => u.gridX === targetMove.c && u.gridY === targetMove.r)) {
                if (typeof tryMoveUnit === 'function') {
                    tryMoveUnit(defendingUnit, targetMove.c, targetMove.r);
                    console.log(`[red_bot] 💥 EMERGENCY STRIKE: Non-stalemated unit ${defendingUnit.name} slammed toward base intruder at (${targetMove.c}, ${targetMove.r}).`);
                    if (typeof checkWinConditions === 'function') checkWinConditions(units);
                    setTimeout(() => { currentTurn = 'blue'; }, 800);
                    return;
                }
            }
        }
    }

    // =========================================================================
    // STEP 2: TRUE STALEMATE RESCUE PROTOCOL
    // =========================================================================
    let stalematedTeammates = redUnits.filter(u => {
        return typeof isUnitLockedInStalemate === 'function' && isUnitLockedInStalemate(u, units);
    });

    if (stalematedTeammates.length > 0) {
        let trappedUnit = stalematedTeammates[0];
        let availableRescuers = redUnits.filter(u => {
            if (u === trappedUnit) return false;
            if (typeof isUnitLockedInStalemate === 'function' && isUnitLockedInStalemate(u, units)) return false;
            let moves = getLegalMoves(u);
            return moves && moves.length > 0;
        });

        if (availableRescuers.length > 0) {
            availableRescuers.sort((a, b) => {
                let distA = Math.max(Math.abs(a.gridX - trappedUnit.gridX), Math.abs(a.gridY - trappedUnit.gridY));
                let distB = Math.max(Math.abs(b.gridX - trappedUnit.gridX), Math.abs(b.gridY - trappedUnit.gridY));
                return distA - distB;
            });

            let closestRescuer = availableRescuers[0];
            let candidateTiles = [
                {c: trappedUnit.gridX, r: trappedUnit.gridY - 1},
                {c: trappedUnit.gridX, r: trappedUnit.gridY + 1},
                {c: trappedUnit.gridX - 1, r: trappedUnit.gridY},
                {c: trappedUnit.gridX + 1, r: trappedUnit.gridY},
                {c: trappedUnit.gridX - 1, r: trappedUnit.gridY - 1},
                {c: trappedUnit.gridX + 1, r: trappedUnit.gridY - 1},
                {c: trappedUnit.gridX - 1, r: trappedUnit.gridY + 1},
                {c: trappedUnit.gridX + 1, r: trappedUnit.gridY + 1}
            ].filter(pos => {
                if (pos.c < 0 || pos.c >= cols || pos.r < 0 || pos.r >= rows) return false;
                let terrain = getTerrain(pos.c, pos.r);
                let isWater = isWaterTerrain(terrain);
                if (closestRescuer.type === 'land' && isWater) return false;
                if (closestRescuer.type === 'water' && !isWater) return false;
                return !units.some(u => u.gridX === pos.c && u.gridY === pos.r);
            });

            if (candidateTiles.length > 0) {
                candidateTiles.sort((a, b) => {
                    let dA = Math.max(Math.abs(a.c - closestRescuer.gridX), Math.abs(a.r - closestRescuer.gridY));
                    let dB = Math.max(Math.abs(b.c - closestRescuer.gridX), Math.abs(b.r - closestRescuer.gridY));
                    return dA - dB;
                });

                let bestTargetTile = candidateTiles[0];
                let rescuePath = findPathToTarget(closestRescuer, bestTargetTile.c, bestTargetTile.r, unitPowerMap, blueUnits, true);

                if (rescuePath && rescuePath.length > 0) {
                    let maxRange = getUnitMaxRange(closestRescuer);
                    let stepsToTake = Math.min(rescuePath.length, maxRange);
                    let destination = rescuePath[stepsToTake - 1];

                    if (!units.some(u => u.gridX === destination.c && u.gridY === destination.r)) {
                        if (typeof tryMoveUnit === 'function') {
                            tryMoveUnit(closestRescuer, destination.c, destination.r);
                            if (typeof checkWinConditions === 'function') checkWinConditions(units);
                            setTimeout(() => { currentTurn = 'blue'; }, 800);
                            return;
                        }
                    }
                }
            }
        }
    }

    // =========================================================================
    // STEP 3: OFFENSIVE BASE CAPTURE (Only executed if base is safe)
    // =========================================================================
    let blueBaseSquares = typeof getBaseSquares === 'function' ? getBaseSquares('blue') : [{c: 0, r: 11}];
    let openBaseTarget = blueBaseSquares.find(b => !units.some(u => u.gridX === b.c && u.gridY === b.r));

    if (openBaseTarget && movableUnits.length > 0) {
        movableUnits.sort((a, b) => {
            let distA = Math.max(Math.abs(a.gridX - openBaseTarget.c), Math.abs(a.gridY - openBaseTarget.r));
            let distB = Math.max(Math.abs(b.gridX - openBaseTarget.c), Math.abs(b.gridY - openBaseTarget.r));
            return distA - distB;
        });

        let leadUnit = movableUnits[0];
        let pathToCore = findPathToTarget(leadUnit, openBaseTarget.c, openBaseTarget.r, unitPowerMap, blueUnits, true);

        if (pathToCore && pathToCore.length > 0) {
            let maxRange = getUnitMaxRange(leadUnit);
            let stepsToTake = Math.min(pathToCore.length, maxRange);
            let finalDestination = pathToCore[stepsToTake - 1];

            if (!units.some(u => u.gridX === finalDestination.c && u.gridY === finalDestination.r)) {
                if (typeof tryMoveUnit === 'function') {
                    tryMoveUnit(leadUnit, finalDestination.c, finalDestination.r);
                    if (typeof checkWinConditions === 'function') checkWinConditions(units);
                    setTimeout(() => { currentTurn = 'blue'; }, 800);
                    return;
                }
            }
        }
    }

    // =========================================================================
    // STEP 4: ADVANCED ATTRACTION/REPULSION MATRIX
    // =========================================================================
    let advancedMoveMade = false;

    movableUnits.sort((a, b) => {
        let hazardA = getPositionHazardLevel({ c: a.gridX, r: a.gridY }, a, unitPowerMap, blueUnits);
        let hazardB = getPositionHazardLevel({ c: b.gridX, r: b.gridY }, b, unitPowerMap, blueUnits);
        return hazardB - hazardA;
    });

    for (let unit of movableUnits) {
        if (getPositionHazardLevel({ c: unit.gridX, r: unit.gridY }, unit, unitPowerMap, blueUnits) > 0) {
            continue;
        }

        let bestMove = typeof evaluateAdvancedBotMoves === 'function' 
            ? evaluateAdvancedBotMoves(unit, units, typeof goldCores !== 'undefined' ? goldCores : []) 
            : null;

        if (bestMove) {
            if (!units.some(u => u.gridX === bestMove.c && u.gridY === bestMove.r)) {
                if (typeof tryMoveUnit === 'function') {
                    tryMoveUnit(unit, bestMove.c, bestMove.r);
                    advancedMoveMade = true;
                    break;
                }
            }
        }
    }

    if (advancedMoveMade) {
        if (typeof checkWinConditions === 'function') checkWinConditions(units);
        setTimeout(() => { currentTurn = 'blue'; }, 800);
        return;
    }

    // // ==========================================================================
    // STEP 5: FALLBACK MOVE
    // =========================================================================
    let fallbackUnit = movableUnits[0];
    let moves = getLegalMoves(fallbackUnit);
    let unoccupiedMoves = moves ? moves.filter(m => !units.some(u => u.gridX === m.c && u.gridY === m.r)) : [];
    
    if (unoccupiedMoves.length > 0) {
        let randomMove = unoccupiedMoves[Math.floor(Math.random() * unoccupiedMoves.length)];
        if (typeof tryMoveUnit === 'function') {
            tryMoveUnit(fallbackUnit, randomMove.c, randomMove.r);
        }
    }

    setTimeout(() => {
        currentTurn = 'blue';
    }, 800);
}

setInterval(() => {
    if (typeof gameOver !== 'undefined' && !gameOver && typeof currentTurn !== 'undefined' && currentTurn === 'red') {
        setTimeout(executeRedBotTurn, 600);
    }
}, 1500);