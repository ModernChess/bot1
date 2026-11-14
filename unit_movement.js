// =========================================================================
// UNIT MOVEMENT, INTERACTION, AND RENDERING LOOP CONTROLLER
// =========================================================================

import { getCameraState, screenToWorldCoordinates, applyCameraTransform } from './viewport.js';
import { getGridCoordinatesFromClient } from './game-input.js';

let selectedUnit = null;     
let legalMoves = [];         
let pendingMoveDestination = null; // Two-step confirmation target tile
let rangeMode = false;
let rangeSquares = [];

// Track pointer position to distinguish between a tap/click and map dragging/panning
let pointerDownX = 0;
let pointerDownY = 0;
let hasDragged = false;

const SystemLog = {
    info: (msg, data = null) => console.log(`[INFO][unit_movement]: ${msg}`, data ?? ''),
    warn: (msg, data = null) => console.warn(`[WARN][unit_movement]: ${msg}`, data ?? ''),
    error: (msg, data = null) => console.error(`[ERROR][unit_movement]: ${msg}`, data ?? ''),
    success: (msg, data = null) => console.log(`[SUCCESS][unit_movement]: ${msg}`, data ?? '')
};

function validateCoordinates(c, r, maxCols = cols, maxRows = rows) {
    if (typeof c !== 'number' || typeof r !== 'number' || isNaN(c) || isNaN(r)) return false;
    if (c < 0 || c >= maxCols || r < 0 || r >= maxRows) return false;
    return true;
}

function getTeamFromUnit(unit) {
    return unit ? unit.team : null;
}

function getLargerCoord(c, r) {
    if (!validateCoordinates(c, r)) return { col: 'Al', row: '1l', colIdx: 0, rowIdx: 0 };

    const cols_9x9 = ['Al', 'Bl', 'Cl', 'Dl', 'El', 'Fl', 'Gl', 'Hl', 'Il'];
    const rows_9x9 = ['1l', '2l', '3l', '4l', '5l', '6l', '7l', '8l', '9l'];
    let lc = Math.floor(c / 2);
    let lr = Math.floor(r / 2);
    if (lc >= 9) lc = 8;
    if (lr >= 9) lr = 8;

    return { col: cols_9x9[lc], row: rows_9x9[lr], colIdx: lc, rowIdx: lr };
}

function getUnitCombatRange(unit) {
    if (!unit) return [];

    let maxDist = ((unit.name || '').includes('Ship')) ? 1 : ((unit.name || '').includes('Artillery') ? 3 : 0);
    if (maxDist === 0) return [];

    let currentLg = getLargerCoord(unit.gridX, unit.gridY);
    let results = [];
    let directions = [
        {dx: 0, dy: -1}, {dx: 0, dy: 1},  
        {dx: -1, dy: 0}, {dx: 1, dy: 0},  
        {dx: -1, dy: -1}, {dx: 1, dy: -1}, 
        {dx: -1, dy: 1}, {dx: 1, dy: 1}   
    ];

    directions.forEach(dir => {
        for (let step = 1; step <= maxDist; step++) {
            let nc = currentLg.colIdx + (dir.dx * step);
            let nr = currentLg.rowIdx + (dir.dy * step);
            if (nc >= 0 && nc < 9 && nr >= 0 && nr < 9) {
                results.push({
                    startC: nc * 2, startR: nr * 2,
                    endC: nc * 2 + 1, endR: nr * 2 + 1
                });
            }
        }
    });

    return results;
}

function getTileConnectionStatus(c, r, movingUnit) {
    if (!movingUnit) return 'neutral';

    let movingTeam = getTeamFromUnit(movingUnit);
    let directions = [
        {dx: 0, dy: -1}, {dx: 0, dy: 1},
        {dx: -1, dy: 0}, {dx: 1, dy: 0},
        {dx: -1, dy: -1}, {dx: 1, dy: -1},
        {dx: -1, dy: 1}, {dx: 1, dy: 1}
    ];

    let connectsWithEnemy = false;
    let connectsWithFriendly = false;

    directions.forEach(dir => {
        let nc = c + dir.dx;
        let nr = r + dir.dy;

        let adjacentUnit = units.find(u => u !== movingUnit && u.gridX === nc && u.gridY === nr && !u.invisible);
        if (adjacentUnit) {
            let adjTeam = getTeamFromUnit(adjacentUnit);
            if (adjTeam && adjTeam !== movingTeam) {
                connectsWithEnemy = true;
            } else if (adjTeam === movingTeam) {
                connectsWithFriendly = true;
            }
        }
    });

    if (connectsWithEnemy) return 'enemy';
    if (connectsWithFriendly) return 'friendly';
    return 'neutral';
}

function getLegalMoves(unit) {
    if (!unit) return [];

    let moves = [];
    let maxRange = unit.range;
    let cx = unit.gridX;
    let cy = unit.gridY;

    if (!validateCoordinates(cx, cy)) return [];

    let directions = [
        {dx: 0, dy: -1}, {dx: 0, dy: 1},  
        {dx: -1, dy: 0}, {dx: 1, dy: 0},  
        {dx: -1, dy: -1}, {dx: 1, dy: -1}, 
        {dx: -1, dy: 1}, {dx: 1, dy: 1}    
    ];

    directions.forEach(dir => {
        for (let step = 1; step <= maxRange; step++) {
            let nc = cx + (dir.dx * step);
            let nr = cy + (dir.dy * step);

            if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
                let isOccupied = units.some(u => u.gridX === nc && u.gridY === nr);
                if (isOccupied) break;

                let terrain = getTerrain(nc, nr);
                let isWater = isWaterTerrain(terrain);
                let validTerrain = false;

                if (unit.type === 'land' && !isWater) validTerrain = true;
                if (unit.type === 'water' && isWater) validTerrain = true;

                if (!validTerrain) break;
                
                let connStatus = getTileConnectionStatus(nc, nr, unit);
                moves.push({c: nc, r: nr, connection: connStatus});
            } else {
                break;
            }
        }
    });

    return moves;
}

function tryMoveUnit(unit, newC, newR) {
    if (typeof gameOver !== 'undefined' && gameOver) return false;
    if (!unit) return false;

    if (typeof isUnitLockedInStalemate === 'function' && isUnitLockedInStalemate(unit, units)) {
        SystemLog.warn(`Move ignored: Unit is locked in a stalemate.`);
        return false;
    }

    let oldC = unit.gridX;
    let oldR = unit.gridY;

    let dx = newC - oldC;
    let dy = newR - oldR;
    if (dx !== 0 || dy !== 0) {
        let angleRad = Math.atan2(dy, dx);
        let angleDeg = (angleRad * 180 / Math.PI) + 90;
        unit.facing = (angleDeg + 360) % 360;
    }

    let movingTeam = getTeamFromUnit(unit);
    let movingPower = typeof getUnitPower === 'function' ? getUnitPower(unit) : 0;

    if (typeof goldCores !== 'undefined') {
        goldCores.forEach(core => {
            let inCoreItself = (core.c === newC && core.r === newR);
            let inCaptureZone = core.captureZones && core.captureZones.some(z => z.c === newC && z.r === newR);

            if (inCoreItself || inCaptureZone) {
                let defendingTeam = core.owner;

                if (defendingTeam !== movingTeam) {
                    if (defendingTeam) {
                        let defenderSu = typeof getSuperunitsForTeam === 'function' 
                            ? getSuperunitsForTeam(defendingTeam, units).find(su => su.core === core || su.units.some(u => core.captureZones.some(z => z.c === u.gridX && z.r === u.gridY)))
                            : null;
                        let defenderPower = defenderSu ? defenderSu.power : 0;

                        if (movingPower > defenderPower) {
                            core.owner = movingTeam;
                            if (typeof flagAnimations !== 'undefined') {
                                flagAnimations[core.id] = performance.now();
                            }
                            if (movingTeam === 'blue') {
                                if (typeof window.rewardHumanCapture === 'function') {
                                    window.rewardHumanCapture();
                                }
                            }
                            SystemLog.success(`Gold core ${core.id} captured by ${movingTeam}!`);
                        }
                    } else {
                        core.owner = movingTeam;
                        if (typeof flagAnimations !== 'undefined') {
                            flagAnimations[core.id] = performance.now();
                        }
                        if (movingTeam === 'blue') {
                            if (typeof window.rewardHumanCapture === 'function') {
                                window.rewardHumanCapture();
                            }
                        }
                        SystemLog.success(`Neutral gold core ${core.id} claimed by ${movingTeam}!`);
                    }
                }
            }
        });
    }

    unit.gridX = newC;
    unit.gridY = newR;

    if (typeof window.triggerMoveSound === 'function') {
        window.triggerMoveSound(unit.name);
    }

    if (typeof resolveUnitInteractions === 'function') {
        resolveUnitInteractions(units);
    }

    return true;
}

canvas.addEventListener('pointerdown', (e) => {
    if (e.isPrimary === false) return; // Allow multi-touch pinch-zoom
    pointerDownX = e.clientX;
    pointerDownY = e.clientY;
    hasDragged = false;
});

canvas.addEventListener('pointermove', (e) => {
    let moveDist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
    if (moveDist > 8) {
        hasDragged = true; // User is panning/dragging the map
    }
});

canvas.addEventListener('pointerup', (e) => {
    // If user dragged/panned the map, do not treat it as a tap
    if (hasDragged) return;

    // Prevent selecting or moving any units if the game has ended / victory reached
    if (typeof gameOver !== 'undefined' && gameOver) {
        return;
    }

    // 1. Handle shop unit deployment click if pending
    if (typeof pendingDeploymentType !== 'undefined' && pendingDeploymentType) {
        const cam = getCameraState();
        let gridCoord = getGridCoordinatesFromClient(e.clientX, e.clientY, canvas, cam.x, cam.y, cam.zoom, cols, rows);
        
        if (gridCoord) {
            let c = gridCoord.col;
            let r = gridCoord.row;
            let isValidDeploy = false;

            if (pendingDeploymentType === 'infantry') {
                goldCores.forEach(gc => {
                    if (gc.owner === 'blue') {
                        if ((gc.c === c && gc.r === r) || (gc.captureZones && gc.captureZones.some(z => z.c === c && z.r === r))) {
                            isValidDeploy = true;
                        }
                    }
                });
            } else if (pendingDeploymentType === 'tank') {
                let baseSquares = typeof getBaseSquares === 'function' ? getBaseSquares('blue') : [];
                if (baseSquares.some(b => b.c === c && b.r === r)) {
                    isValidDeploy = true;
                }
            }

            // If valid and unoccupied, deploy unit and hide deployment banner. If invalid, wait quietly.
            if (isValidDeploy) {
                let isOccupied = units.some(u => u.gridX === c && u.gridY === r);
                if (!isOccupied) {
                    let newAsset = pendingDeploymentType === 'infantry' ? {
                        name: 'Infantry', type: 'land', range: 2, speed: 2, img: blueInfantryImg, loaded: () => blueInfantryLoaded
                    } : {
                        name: 'Tank', type: 'land', range: 3, speed: 3, img: blueTankImg, loaded: () => blueTankLoaded
                    };

                    units.push({
                        name: newAsset.name, type: newAsset.type, range: newAsset.range,
                        speed: newAsset.speed, gridX: c, gridY: r,
                        x: c * cellSize, y: r * cellSize, img: newAsset.img, loaded: newAsset.loaded, team: 'blue', facing: 0
                    });

                    SystemLog.success(`Successfully deployed bought ${pendingDeploymentType} at (${c}, ${r})!`);
                    pendingDeploymentType = null;
                    
                    if (typeof updateDeploymentPromptUI === 'function') {
                        updateDeploymentPromptUI('', false);
                    } else {
                        let deployModal = document.getElementById('deploymentPromptModal');
                        if (deployModal) deployModal.style.display = 'none';
                    }
                }
            }
            return; 
        }
    }

    if (typeof currentTurn !== 'undefined' && currentTurn === 'red') {
        SystemLog.warn('Input ignored: It is currently Red bot turn. Human control is locked.');
        return;
    }

    const cam = getCameraState();
    let gridCoord = getGridCoordinatesFromClient(e.clientX, e.clientY, canvas, cam.x, cam.y, cam.zoom, cols, rows);
    if (!gridCoord) return;

    let c = gridCoord.col;
    let r = gridCoord.row;
    let worldCoord = screenToWorldCoordinates(e.clientX, e.clientY, canvas);

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
        let clickedUnit = units.find(u => u.gridX === c && u.gridY === r && !u.invisible);

        if (selectedUnit && !rangeMode) {
            let matchedLegalMove = legalMoves.find(m => m.c === c && m.r === r);
            if (matchedLegalMove) {
                if (pendingMoveDestination && pendingMoveDestination.c === c && pendingMoveDestination.r === r) {
                    let success = tryMoveUnit(selectedUnit, c, r);
                    if (success) {
                        selectedUnit = null;
                        legalMoves = [];
                        pendingMoveDestination = null;

                        if (typeof currentTurn !== 'undefined') {
                            currentTurn = (currentTurn === 'blue') ? 'red' : 'blue';
                            SystemLog.success(`Move complete. Turn switched to: ${currentTurn}`);
                        }
                    }
                } else {
                    pendingMoveDestination = matchedLegalMove;
                }
                return;
            }
        }

        if (clickedUnit) {
            let unitTeam = getTeamFromUnit(clickedUnit);
            
            if (selectedUnit && rangeMode && (selectedUnit.name || '').includes('Artillery')) {
                let attackerTeam = getTeamFromUnit(selectedUnit);
                if (unitTeam !== attackerTeam) {
                    let combatRanges = getUnitCombatRange(selectedUnit);
                    let inRange = combatRanges.some(rangeBox => 
                        clickedUnit.gridX >= rangeBox.startC && clickedUnit.gridX <= rangeBox.endC &&
                        clickedUnit.gridY >= rangeBox.startR && clickedUnit.gridY <= rangeBox.endR
                    );

                    if (inRange) {
                        SystemLog.info('Artillery target acquired within range. Triggering card duel.');
                        if (typeof triggerArtilleryDuel === 'function') {
                            triggerArtilleryDuel(selectedUnit, clickedUnit);
                        }
                        selectedUnit = null;
                        rangeMode = false;
                        rangeSquares = [];
                        pendingMoveDestination = null;
                        return;
                    }
                }
            }

            if (typeof currentTurn !== 'undefined' && unitTeam !== currentTurn) {
                SystemLog.warn(`Ignored selection: It is team '${currentTurn}' turn, but clicked team '${unitTeam}' unit.`);
                return; 
            }

            selectedUnit = clickedUnit;
            legalMoves = getLegalMoves(clickedUnit);
            pendingMoveDestination = null;
            rangeMode = false; 

            if (typeof window.triggerSelectSound === 'function') {
                window.triggerSelectSound(clickedUnit.name);
            }
        } else {
            if (selectedUnit && ((selectedUnit.name || '').includes('Ship') || (selectedUnit.name || '').includes('Artillery'))) {
                let btnX = selectedUnit.renderX + cellSize + 12;
                let btnY = selectedUnit.renderY - 12;
                let btnSize = cellSize * 0.85;

                if (worldCoord.x >= btnX && worldCoord.x <= btnX + btnSize && worldCoord.y >= btnY && worldCoord.y <= btnY + btnSize) {
                    rangeMode = !rangeMode; 
                    rangeSquares = rangeMode ? getUnitCombatRange(selectedUnit) : [];
                    return;
                }
            }

            if (!rangeMode) {
                selectedUnit = null;
                legalMoves = [];
                pendingMoveDestination = null;
            }
        }
    }
});

function drawRotatedUnit(ctx, img, renderX, renderY, size, facingDegrees = 0) {
    ctx.save();
    let centerX = renderX + cellSize / 2;
    let centerY = renderY + cellSize / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate((facingDegrees * Math.PI) / 180);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    applyCameraTransform(ctx);

    if (mapLoaded) {
        ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (typeof drawTeamUIAndFlags === 'function') {
        drawTeamUIAndFlags();
    }

    if (typeof TutorialGuide !== 'undefined') {
        TutorialGuide.renderBattlefieldOverlays(ctx);
    }

    // Highlight valid deployment tiles during active shop purchase deployment mode
    if (typeof pendingDeploymentType !== 'undefined' && pendingDeploymentType) {
        ctx.save();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;

        if (pendingDeploymentType === 'infantry') {
            goldCores.forEach(gc => {
                if (gc.owner === 'blue') {
                    let tilesToCheck = [{c: gc.c, r: gc.r}, ...(gc.captureZones || [])];
                    tilesToCheck.forEach(t => {
                        let isOccupied = units.some(u => u.gridX === t.c && u.gridY === t.r);
                        if (!isOccupied) {
                            ctx.fillRect(t.c * cellSize + 2, t.r * cellSize + 2, cellSize - 4, cellSize - 4);
                            ctx.strokeRect(t.c * cellSize + 2, t.r * cellSize + 2, cellSize - 4, cellSize - 4);
                        }
                    });
                }
            });
        } else if (pendingDeploymentType === 'tank') {
            let baseSquares = typeof getBaseSquares === 'function' ? getBaseSquares('blue') : [];
            baseSquares.forEach(t => {
                let isOccupied = units.some(u => u.gridX === t.c && u.gridY === t.r);
                if (!isOccupied) {
                    ctx.fillRect(t.c * cellSize + 2, t.r * cellSize + 2, cellSize - 4, cellSize - 4);
                    ctx.strokeRect(t.c * cellSize + 2, t.r * cellSize + 2, cellSize - 4, cellSize - 4);
                }
            });
        }
        ctx.restore();
    }

    units.forEach(u => {
        let targetX = u.gridX * cellSize;
        let targetY = u.gridY * cellSize;
        
        u.x = lerp(u.x, targetX, 0.05);
        u.y = lerp(u.y, targetY, 0.05);

        u.renderX = u.x;
        u.renderY = u.y;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(u.renderX + cellSize / 2, u.renderY + cellSize - 8, cellSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
    });

    if (selectedUnit && !(typeof gameOver !== 'undefined' && gameOver)) {
        if (rangeMode) {
            ctx.strokeStyle = '#ffffff'; 
            ctx.lineWidth = 3.5;
            rangeSquares.forEach(sq => {
                let px = sq.startC * cellSize;
                let py = sq.startR * cellSize;
                let pWidth = (sq.endC - sq.startC + 1) * cellSize;
                let pHeight = (sq.endR - sq.startR + 1) * cellSize;
                ctx.strokeRect(px + 2, py + 2, pWidth - 4, pHeight - 4);
            });
        } else {
            legalMoves.forEach(m => {
                let cx = m.c * cellSize + cellSize / 2;
                let cy = m.r * cellSize + cellSize / 2;

                ctx.save();
                if (m.connection === 'enemy') {
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
                    ctx.strokeStyle = 'rgba(248, 113, 113, 0.95)';
                } else if (m.connection === 'friendly') {
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
                    ctx.strokeStyle = 'rgba(34, 211, 238, 1.0)';
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                }

                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.28, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                if (pendingMoveDestination && pendingMoveDestination.c === m.c && pendingMoveDestination.r === m.r) {
                    ctx.save();
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = '#f59e0b';
                    ctx.shadowBlur = 8;
                    ctx.strokeRect(m.c * cellSize + 2, m.r * cellSize + 2, cellSize - 4, cellSize - 4);
                    ctx.restore();
                }
            });

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.strokeRect(selectedUnit.renderX + 3, selectedUnit.renderY + 3, cellSize - 6, cellSize - 6);
        }
    }

    units.forEach(u => {
        if (u.invisible) return;

        if (u.loaded && u.loaded()) {
            let unitSize = cellSize * 1.3;
            if (typeof u.facing === 'undefined') u.facing = 0;
            drawRotatedUnit(ctx, u.img, u.renderX, u.renderY, unitSize, u.facing);

            let unitTeam = typeof getTeamFromUnit === 'function' ? getTeamFromUnit(u) : u.team;
            if (unitTeam === 'blue' && !(typeof gameOver !== 'undefined' && gameOver)) {
                ctx.save();
                ctx.lineWidth = 3.5;
                let expandSize = 8;
                let rx = u.renderX - expandSize / 2;
                let ry = u.renderY - expandSize / 2;
                let rSize = cellSize + expandSize;
                let cornerRadius = 8;

                if (typeof currentTurn !== 'undefined' && currentTurn === 'blue') {
                    ctx.strokeStyle = '#10b981';
                    ctx.shadowColor = '#10b981';
                    ctx.shadowBlur = 8;
                } else {
                    ctx.strokeStyle = '#ef4444';
                    ctx.shadowColor = '#ef4444';
                    ctx.shadowBlur = 8;
                }

                if (typeof ctx.roundRect === 'function') {
                    ctx.beginPath();
                    ctx.roundRect(rx, ry, rSize, rSize, cornerRadius);
                    ctx.stroke();
                } else {
                    ctx.strokeRect(rx, ry, rSize, rSize);
                }
                ctx.restore();
            }
        }
    });

    // Render and update unit destruction particle / halo effects
    if (typeof unitDestructionEffects !== 'undefined' && unitDestructionEffects.length > 0) {
        ctx.save();
        let nowTime = performance.now();
        for (let i = unitDestructionEffects.length - 1; i >= 0; i--) {
            let fx = unitDestructionEffects[i];
            let elapsed = nowTime - fx.startTime;
            let progress = elapsed / fx.duration;

            if (progress >= 1) {
                unitDestructionEffects.splice(i, 1);
                continue;
            }

            // Draw expanding halo ring
            let currentRadius = (cellSize * 0.8) * (0.2 + progress * 1.2);
            let alpha = 1 - progress;

            ctx.beginPath();
            ctx.arc(fx.x, fx.y, currentRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw burst particles
            fx.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                ctx.beginPath();
                ctx.arc(fx.x + p.x, fx.y + p.y, p.radius * (1 - progress * 0.5), 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha;
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
        }
        ctx.restore();
    }

    ctx.restore();
    requestAnimationFrame(update);
}

window.getLegalMoves = getLegalMoves;
window.tryMoveUnit = tryMoveUnit;

SystemLog.info('Unit movement controller updated with destruction visual effects and non-selectable units during game over.');
update();