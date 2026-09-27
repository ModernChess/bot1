// =========================================================================
// UNIT MOVEMENT, INTERACTION, AND RENDERING LOOP CONTROLLER
// =========================================================================

let selectedUnit = null;     
let legalMoves = [];         
let pressTimer = null;       
let rangeMode = false;
let rangeSquares = [];

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
                if (typeof isGoldCore === 'function' && isGoldCore(nc, nr)) break;

                // Stop pathing through any occupied square (friendly or enemy unit)
                let isOccupied = units.some(u => u.gridX === nc && u.gridY === nr);
                if (isOccupied) break;

                let terrain = getTerrain(nc, nr);
                let isWater = isWaterTerrain(terrain);
                let validTerrain = false;

                if (unit.type === 'land' && !isWater) validTerrain = true;
                if (unit.type === 'water' && isWater) validTerrain = true;

                if (!validTerrain) break;
                moves.push({c: nc, r: nr});
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
                                } else if (typeof rewardHumanCapture === 'function') {
                                    rewardHumanCapture();
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
                            } else if (typeof rewardHumanCapture === 'function') {
                                rewardHumanCapture();
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
    if (typeof currentTurn !== 'undefined' && currentTurn === 'red') {
        SystemLog.warn('Input ignored: It is currently Red bot turn. Human control is locked.');
        return;
    }

    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;

    let touchX = (e.clientX - rect.left) * scaleX;
    let touchY = (e.clientY - rect.top) * scaleY;

    let c = Math.floor(touchX / cellSize);
    let r = Math.floor(touchY / cellSize);

    if (!validateCoordinates(c, r)) return;

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
        let clickedUnit = units.find(u => u.gridX === c && u.gridY === r && !u.invisible);

        if (selectedUnit && !rangeMode) {
            let matchedLegalMove = legalMoves.find(m => m.c === c && m.r === r);
            if (matchedLegalMove) {
                let success = tryMoveUnit(selectedUnit, c, r);
                if (success) {
                    selectedUnit = null;
                    legalMoves = [];

                    if (typeof currentTurn !== 'undefined') {
                        currentTurn = (currentTurn === 'blue') ? 'red' : 'blue';
                        SystemLog.success(`Instant move complete. Turn switched to: ${currentTurn}`);
                    }
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
                        return;
                    }
                }
            }

            if (typeof currentTurn !== 'undefined' && unitTeam !== currentTurn) {
                SystemLog.warn(`Ignored selection: It is team '${currentTurn}' turn, but clicked team '${unitTeam}' unit.`);
                return; 
            }

            pressTimer = setTimeout(() => {
                selectedUnit = clickedUnit;
                legalMoves = getLegalMoves(clickedUnit);
                rangeMode = false; 

                if (typeof window.triggerSelectSound === 'function') {
                    window.triggerSelectSound(clickedUnit.name);
                }
            }, 5); 
        } else {
            if (selectedUnit && ((selectedUnit.name || '').includes('Ship') || (selectedUnit.name || '').includes('Artillery'))) {
                let btnX = selectedUnit.renderX + cellSize + 12;
                let btnY = selectedUnit.renderY - 12;
                let btnSize = cellSize * 0.85;

                if (touchX >= btnX && touchX <= btnX + btnSize && touchY >= btnY && touchY <= btnY + btnSize) {
                    rangeMode = !rangeMode; 
                    rangeSquares = rangeMode ? getUnitCombatRange(selectedUnit) : [];
                    return;
                }
            }

            if (!rangeMode) {
                selectedUnit = null;
                legalMoves = [];
            }
        }
    }
});

canvas.addEventListener('pointerup', () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } });
canvas.addEventListener('pointercancel', () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } });

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

    if (mapLoaded) {
        ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (typeof drawTeamUIAndFlags === 'function') {
        drawTeamUIAndFlags();
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

    if (selectedUnit) {
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
                ctx.fillStyle = 'rgba(59, 130, 246, 0.45)';
                ctx.strokeStyle = 'rgba(147, 197, 253, 0.8)';
                ctx.lineWidth = 2;
                
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.28, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            });

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.strokeRect(selectedUnit.renderX + 3, selectedUnit.renderY + 3, cellSize - 6, cellSize - 6);
        }

        if ((selectedUnit.name || '').includes('Ship') || (selectedUnit.name || '').includes('Artillery')) {
            let btnX = selectedUnit.renderX + cellSize + 12;
            let btnY = selectedUnit.renderY - 12;
            let btnSize = cellSize * 0.85;
            
            ctx.fillStyle = rangeMode ? '#c0392b' : '#e74c3c';
            ctx.fillRect(btnX, btnY, btnSize, btnSize);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(btnX, btnY, btnSize, btnSize);

            ctx.beginPath();
            ctx.arc(btnX + btnSize / 2, btnY + btnSize / 2, btnSize * 0.25, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    units.forEach(u => {
        if (u.invisible) return;

        if (u.loaded && u.loaded()) {
            let unitSize = cellSize * 1.3;
            if (typeof u.facing === 'undefined') u.facing = 0;
            drawRotatedUnit(ctx, u.img, u.renderX, u.renderY, unitSize, u.facing);
        }
    });

    if (typeof unitDestructionEffects !== 'undefined' && unitDestructionEffects.length > 0) {
        ctx.save();
        let now = performance.now();

        for (let i = unitDestructionEffects.length - 1; i >= 0; i--) {
            let fx = unitDestructionEffects[i];
            let elapsed = now - fx.startTime;

            if (elapsed < fx.duration) {
                let progress = elapsed / fx.duration;
                let alpha = 1 - progress;

                ctx.beginPath();
                ctx.arc(fx.x, fx.y, progress * (cellSize * 0.9), 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.8})`;
                ctx.lineWidth = 2.5;
                ctx.stroke();

                fx.particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;

                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(fx.x + p.x, fx.y + p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.globalAlpha = 1.0;
            } else {
                unitDestructionEffects.splice(i, 1);
            }
        }
        ctx.restore();
    }

    requestAnimationFrame(update);
}

SystemLog.info('Unit movement controller updated with sound triggers, modern indicators, and instant tap-to-move.');
update();
