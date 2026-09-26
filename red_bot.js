// =========================================================================
// RED TEAM PATHFINDING BOT CONTROLLER (Live Threat Priority & Aggressive Hunt)
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
        let path = findPathToTarget(unit, adj.c, adj.r, unitPowerMap, enemyUnits, false);
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

    if (typeof SystemLog !== 'undefined' && SystemLog.info) {
        SystemLog.info("[red_bot] Evaluating live threats, aggressive hunts, and goals...");
    } else {
        console.log("[red_bot] Evaluating live threats, aggressive hunts, and goals...");
    }

    let redUnits = units.filter(u => getTeamFromUnit(u) === 'red');
    
    let movableUnits = redUnits.filter(u => {
        if (typeof isUnitLockedInStalemate === 'function' && isUnitLockedInStalemate(u, units)) {
            return false;
        }
        let moves = getLegalMoves(u);
        return moves && moves.length > 0;
    });

    if (movableUnits.length === 0) {
        console.log("[red_bot] No red units are movable or unlocked. Ending turn.");
        currentTurn = 'blue';
        return;
    }

    let blueUnits = units.filter(u => getTeamFromUnit(u) === 'blue');
    let { unitPowerMap } = buildSuperpowerCache(units);

    // =========================================================================
    // STEP 1: EMERGENCY ESCAPE (Handling Cornered & Stressed Units)
    // =========================================================================
    let unitEscapePlans = [];

    movableUnits.forEach(unit => {
        let currentHazard = getPositionHazardLevel({ c: unit.gridX, r: unit.gridY }, unit, unitPowerMap, blueUnits);
        
        if (currentHazard > 0) {
            let moves = getLegalMoves(unit);
            if (moves && moves.length > 0) {
                let unoccupiedMoves = moves.filter(m => !units.some(u => u.gridX === m.c && u.gridY === m.r));

                let bestEscapeMove = null;
                let lowestMoveHazard = Infinity;

                unoccupiedMoves.forEach(move => {
                    let moveHazard = getPositionHazardLevel(move, unit, unitPowerMap, blueUnits);
                    if (moveHazard < lowestMoveHazard) {
                        lowestMoveHazard = moveHazard;
                        bestEscapeMove = move;
                    }
                });

                if (bestEscapeMove) {
                    unitEscapePlans.push({
                        unit,
                        move: bestEscapeMove,
                        hazardReduction: currentHazard - lowestMoveHazard,
                        newHazard: lowestMoveHazard,
                        description: `EMERGENCY ESCAPE (Hazard: ${currentHazard} -> ${lowestMoveHazard})`
                    });
                }
            }
        }
    });

    if (unitEscapePlans.length > 0) {
        unitEscapePlans.sort((a, b) => b.hazardReduction - a.hazardReduction);
        let priorityEscape = unitEscapePlans[0];

        if (!units.some(u => u.gridX === priorityEscape.move.c && u.gridY === priorityEscape.move.r)) {
            if (typeof tryMoveUnit === 'function') {
                tryMoveUnit(priorityEscape.unit, priorityEscape.move.c, priorityEscape.move.r);
                console.warn(`[red_bot] STRESS ESCAPE: ${priorityEscape.unit.name} moved to (${priorityEscape.move.c}, ${priorityEscape.move.r})`);
            }
        }

        if (typeof checkWinConditions === 'function') {
            checkWinConditions(units);
        }

        setTimeout(() => {
            currentTurn = 'blue';
        }, 800);
        return;
    }

    // =========================================================================
    // STEP 2: STANDARD GOAL ASSIGNMENT (Aggressive Hunt & Cores, Tank Weighting)
    // =========================================================================
    let safeCores = [];
    if (typeof goldCores !== 'undefined' && goldCores.length > 0) {
        safeCores = goldCores.filter(core => {
            if (core.owner === 'red') return false;
            let squares = [{ c: core.c, r: core.r }];
            if (core.captureZones) squares = squares.concat(core.captureZones);
            
            let defended = squares.some(sq => {
                if (units.some(u => u.gridX === sq.c && u.gridY === sq.r)) return true;
                return blueUnits.some(u => {
                    let dist = Math.max(Math.abs(sq.c - u.gridX), Math.abs(sq.r - u.gridY));
                    return dist <= 2;
                });
            });
            
            return !defended;
        });
    }

    let possibleChoices = [];

    movableUnits.forEach(unit => {
        if (getPositionHazardLevel({ c: unit.gridX, r: unit.gridY }, unit, unitPowerMap, blueUnits) > 0) {
            return; 
        }

        let myEffectivePower = getCachedEffectivePower(unit, unitPowerMap);

        // 1. Aggressive Hunt: Hunt down weaker enemy units (e.g. Blue Infantry)
        blueUnits.forEach(enemy => {
            let enemyEffectivePower = getCachedEffectivePower(enemy, unitPowerMap);
            if (myEffectivePower > enemyEffectivePower) {
                let attackTile = getAdjacentAttackTile(unit, enemy, unitPowerMap, blueUnits);
                if (attackTile) {
                    let path = findPathToTarget(unit, attackTile.c, attackTile.r, unitPowerMap, blueUnits, false);
                    if (path && path.length > 0) {
                        let score = path.length;
                        if (isTank(unit)) score *= 0.8; 
                        possibleChoices.push({ 
                            unit, 
                            path, 
                            description: `Aggressive Hunt (${enemy.name})`, 
                            targetCoreId: null, 
                            score 
                        });
                    }
                }
            }
        });

        // 2. Persistent Gold Core
        if (unit.targetCoreId) {
            let existingCore = safeCores.find(c => c.id === unit.targetCoreId);
            if (existingCore) {
                let path = findPathToTarget(unit, existingCore.c, existingCore.r, unitPowerMap, blueUnits, false);
                if (path && path.length > 0) {
                    let score = path.length;
                    if (isTank(unit)) score *= 0.85; 
                    possibleChoices.push({ unit, path, description: "Persistent Gold Core", targetCoreId: existingCore.id, score });
                }
            } else {
                unit.targetCoreId = null;
            }
        }

        // 3. Closest Gold Core
        safeCores.forEach(core => {
            let path = findPathToTarget(unit, core.c, core.r, unitPowerMap, blueUnits, false);
            if (path && path.length > 0) {
                let score = path.length;
                if (isTank(unit)) score *= 0.85; 
                possibleChoices.push({ unit, path, description: "Closest Gold Core", targetCoreId: core.id, score });
            }
        });
    });

    if (possibleChoices.length > 0) {
        possibleChoices.sort((a, b) => a.score - b.score);
        let bestChoice = possibleChoices[0];

        let chosenUnit = bestChoice.unit;
        chosenUnit.targetCoreId = bestChoice.targetCoreId;

        let maxStep = chosenUnit.speed || chosenUnit.range || 2;
        let stepIndex = Math.min(maxStep - 1, bestChoice.path.length - 1);
        let nextStep = bestChoice.path[stepIndex];

        if (!units.some(u => u.gridX === nextStep.c && u.gridY === nextStep.r)) {
            if (typeof tryMoveUnit === 'function') {
                tryMoveUnit(chosenUnit, nextStep.c, nextStep.r);
                console.log(`[red_bot] ${chosenUnit.name} advanced towards ${bestChoice.description} at (${nextStep.c}, ${nextStep.r})`);
            }
        }

        if (typeof checkWinConditions === 'function') {
            checkWinConditions(units);
        }

        setTimeout(() => {
            currentTurn = 'blue';
        }, 800);
        return;
    }

    // =========================================================================
    // STEP 3: ULTIMATE FALLBACK
    // =========================================================================
    let fallbackUnit = movableUnits.find(u => getPositionHazardLevel({ c: u.gridX, r: u.gridY }, u, unitPowerMap, blueUnits) === 0);
    if (!fallbackUnit && movableUnits.length > 0) fallbackUnit = movableUnits[0];

    if (fallbackUnit) {
        let moves = getLegalMoves(fallbackUnit);
        let unoccupiedMoves = moves ? moves.filter(m => !units.some(u => u.gridX === m.c && u.gridY === m.r)) : [];
        
        if (unoccupiedMoves.length > 0) {
            let randomMove = unoccupiedMoves[Math.floor(Math.random() * unoccupiedMoves.length)];
            if (typeof tryMoveUnit === 'function') {
                tryMoveUnit(fallbackUnit, randomMove.c, randomMove.r);
                console.log(`[red_bot] CORNERED FALLBACK: ${fallbackUnit.name} shifted to unoccupied tile (${randomMove.c}, ${randomMove.r})`);
            }
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
