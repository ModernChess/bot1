const gridElement = document.getElementById('grid');
const infoPanel = document.getElementById('info-panel');
const turnBreakdownPanel = document.getElementById('turn-breakdown');
const nextTurnBtn = document.getElementById('next-turn-btn');

function rebuildPriorityCache(targetX, targetY) {
    priorityCostMap.fill(0);
    priorityBlockedMap.fill(0);

    for (let i = 0; i < priorityUnits.length; i++) {
        let pu = priorityUnits[i];
        let isTargetDest = (pu.x === targetX && pu.y === targetY);
        let pIdx = pu.y * GRID_SIZE + pu.x;

        if (!isTargetDest) {
            priorityBlockedMap[pIdx] = 1;
        }

        let minX = Math.max(0, pu.x - 3);
        let maxX = Math.min(GRID_SIZE - 1, pu.x + 3);
        let minY = Math.max(0, pu.y - 3);
        let maxY = Math.min(GRID_SIZE - 1, pu.y + 3);

        for (let cy = minY; cy <= maxY; cy++) {
            for (let cx = minX; cx <= maxX; cx++) {
                let idx = cy * GRID_SIZE + cx;
                let dist = Math.max(Math.abs(cx - pu.x), Math.abs(cy - pu.y));
                let cellIsTarget = (cx === targetX && cy === targetY);

                if (pu.priority < 0) {
                    if (dist === 0 && !cellIsTarget) {
                        priorityBlockedMap[idx] = 1;
                    } else if (dist === 1) {
                        priorityCostMap[idx] += Math.abs(pu.priority) * 15.0;
                    } else if (dist === 2) {
                        priorityCostMap[idx] += Math.abs(pu.priority) * 4.0;
                    } else if (dist === 3) {
                        priorityCostMap[idx] += Math.abs(pu.priority) / (0.5 * dist * dist);
                    }
                } else if (pu.priority > 0) {
                    let attraction = pu.priority / (1.0 + (0.5 * dist));
                    priorityCostMap[idx] -= attraction;
                }
            }
        }
    }
}

const moveCache = new Map();
function getValidVectorMoves(ox, oy, maxSpeed) {
    const cacheKey = (ox << 16) | (oy << 8) | maxSpeed;
    if (moveCache.has(cacheKey)) return moveCache.get(cacheKey);

    let moves = [];
    const directions = [
        {dx: 0, dy: -1}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0},
        {dx: -1, dy: -1}, {dx: 1, dy: -1}, {dx: -1, dy: 1}, {dx: 1, dy: 1}
    ];

    for (let dir of directions) {
        for (let step = 1; step <= maxSpeed; step++) {
            let nx = ox + dir.dx * step;
            let ny = oy + dir.dy * step;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                let idx = ny * GRID_SIZE + nx;
                if (waterMap[idx] === 1) break;
                
                let clear = true;
                let absDx = Math.abs(nx - ox), absDy = Math.abs(ny - oy);
                if (nx - ox !== 0 && ny - oy !== 0 && absDx !== absDy) { clear = false; }
                else {
                    let dist = Math.max(absDx, absDy);
                    let stepX = (nx - ox) === 0 ? 0 : (nx - ox) / absDx;
                    let stepY = (ny - oy) === 0 ? 0 : (ny - oy) / absDy;
                    let cx = ox, cy = oy;
                    for (let i = 0; i < dist; i++) {
                        cx += stepX; cy += stepY;
                        if (waterMap[cy * GRID_SIZE + cx] === 1) { clear = false; break; }
                    }
                }

                if (clear) {
                    moves.push({x: nx, y: ny, distance: step});
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }
    moveCache.set(cacheKey, moves);
    return moves;
}

function findVectorPath(startX, startY, targetX, targetY, maxSpeed) {
    let targetIdx = targetY * GRID_SIZE + targetX;
    if (waterMap[targetIdx] === 1) return null;
    if (startX === targetX && startY === targetY) return [];

    rebuildPriorityCache(targetX, targetY);

    const openHeap = new FastMinHeap();
    openHeap.push({ x: startX, y: startY, turn: 1, gScore: 0, fScore: Math.ceil(Math.max(Math.abs(startX - targetX), Math.abs(startY - targetY)) / maxSpeed), pathSegments: [] });

    const visited = new Float32Array(TOTAL_CELLS);
    visited.fill(Infinity);
    visited[startY * GRID_SIZE + startX] = 1;

    let bestPath = null;
    let minTurns = Infinity;

    while (openHeap.size() > 0) {
        let curr = openHeap.pop();

        if (curr.turn > minTurns) continue;
        if (curr.x === targetX && curr.y === targetY) {
            if (curr.turn - 1 < minTurns) {
                minTurns = curr.turn - 1;
                bestPath = curr.pathSegments;
            }
            continue;
        }

        let vectorMoves = getValidVectorMoves(curr.x, curr.y, maxSpeed);
        for (let i = 0; i < vectorMoves.length; i++) {
            let move = vectorMoves[i];
            let nextTurn = curr.turn + 1;
            let idx = move.y * GRID_SIZE + move.x;

            let dx = move.x - curr.x, dy = move.y - curr.y, dist = move.distance;
            let stepX = dx === 0 ? 0 : dx / Math.abs(dx), stepY = dy === 0 ? 0 : dy / Math.abs(dy);
            let cx = curr.x, cy = curr.y;
            let segmentBlocked = false;
            let linePriorityCost = 0;

            for (let j = 1; j <= dist; j++) {
                cx += stepX; cy += stepY;
                let lineIdx = cy * GRID_SIZE + cx;
                
                if (priorityBlockedMap[lineIdx] === 1 && !(cx === targetX && cy === targetY)) {
                    segmentBlocked = true;
                    break;
                }
                linePriorityCost += priorityCostMap[lineIdx];
            }

            if (segmentBlocked) continue;

            let adjustedTurnCost = 1.0 + (0.02 * linePriorityCost); 
            let tentativeG = curr.gScore + Math.max(0.1, adjustedTurnCost);

            if (visited[idx] > tentativeG) {
                visited[idx] = tentativeG;

                let jumpNodes = [];
                cx = curr.x; cy = curr.y;
                for (let j = 1; j <= dist; j++) {
                    cx += stepX; cy += stepY;
                    jumpNodes.push({ x: cx, y: cy, turn: curr.turn, isEnd: (j === dist) });
                }

                let hScore = Math.ceil(Math.max(Math.abs(move.x - targetX), Math.abs(move.y - targetY)) / maxSpeed);
                openHeap.push({
                    x: move.x,
                    y: move.y,
                    turn: nextTurn,
                    gScore: tentativeG,
                    fScore: nextTurn + hScore + (linePriorityCost > 0 ? linePriorityCost * 0.05 : 0),
                    pathSegments: [...curr.pathSegments, ...jumpNodes]
                });
            }
        }
    }
    return bestPath;
}

function computeTeamNetworksAndResolveConflicts() {
    let visitedMap = {};
    let networks = [];

    for (let u of units) {
        let uDef = UNIT_TYPES[u.team][u.key];
        if (uDef.type === 'artillery' || uDef.type === 'flag' || uDef.type === 'ship') continue;
        if (visitedMap[u.id]) continue;

        let componentUnits = [];
        let queue = [u];
        visitedMap[u.id] = true;

        while (queue.length > 0) {
            let curr = queue.shift();
            componentUnits.push(curr);

            for (let other of units) {
                if (visitedMap[other.id]) continue;
                let oDef = UNIT_TYPES[other.team][other.key];
                if (oDef.type === 'artillery' || oDef.type === 'flag' || oDef.type === 'ship') continue;
                if (other.team !== curr.team) continue;

                let dist = Math.max(Math.abs(other.x - curr.x), Math.abs(other.y - curr.y));
                if (dist === 1) {
                    visitedMap[other.id] = true;
                    queue.push(other);
                }
            }
        }

        let totalPower = 0;
        for (let compUnit of componentUnits) {
            let def = UNIT_TYPES[compUnit.team][compUnit.key];
            if (typeof def.power === 'number') totalPower += def.power;
        }

        let anchorUnit = componentUnits.reduce((acc, cur) => {
            if (cur.y > acc.y || (cur.y === acc.y && cur.x > acc.x)) return cur;
            return acc;
        }, componentUnits[0]);

        networks.push({
            units: componentUnits,
            power: totalPower,
            team: u.team,
            isGroup: componentUnits.length > 1,
            anchorId: anchorUnit.id
        });
    }

    let unitsToRemove = new Set();
    let stalematedUnitIds = new Set();

    let resolved = false;
    while (!resolved) {
        resolved = true;
        unitsToRemove.clear();
        stalematedUnitIds.clear();

        let rawStalemates = new Set();
        for (let i = 0; i < networks.length; i++) {
            for (let j = i + 1; j < networks.length; j++) {
                let netA = networks[i];
                let netB = networks[j];
                if (netA.team === netB.team) continue;

                let areConnected = false;
                for (let ua of netA.units) {
                    for (let ub of netB.units) {
                        let dist = Math.max(Math.abs(ua.x - ub.x), Math.abs(ua.y - ub.y));
                        if (dist <= 1) {
                            areConnected = true;
                            break;
                        }
                    }
                    if (areConnected) break;
                }

                if (areConnected) {
                    if (netA.power > netB.power) {
                        netB.units.forEach(u => unitsToRemove.add(u.id));
                    } else if (netB.power > netA.power) {
                        netA.units.forEach(u => unitsToRemove.add(u.id));
                    } else {
                        netA.units.forEach(u => rawStalemates.add(u.id));
                        netB.units.forEach(u => rawStalemates.add(u.id));
                    }
                }
            }
        }

        for (let net of networks) {
            let hasStalemated = net.units.some(u => rawStalemates.has(u.id));
            if (hasStalemated) {
                net.units.forEach(u => stalematedUnitIds.add(u.id));
                net.power = 0; 
            }
        }

        for (let i = 0; i < networks.length; i++) {
            for (let j = i + 1; j < networks.length; j++) {
                let netA = networks[i];
                let netB = networks[j];
                if (netA.team === netB.team) continue;

                let areConnected = false;
                for (let ua of netA.units) {
                    for (let ub of netB.units) {
                        let dist = Math.max(Math.abs(ua.x - ub.x), Math.abs(ua.y - ub.y));
                        if (dist <= 1) {
                            areConnected = true;
                            break;
                        }
                    }
                    if (areConnected) break;
                }

                if (areConnected) {
                    if (netA.power > netB.power) {
                        netB.units.forEach(u => unitsToRemove.add(u.id));
                    } else if (netB.power > netA.power) {
                        netA.units.forEach(u => unitsToRemove.add(u.id));
                    }
                }
            }
        }

        if (unitsToRemove.size > 0) {
            units = units.filter(u => !unitsToRemove.has(u.id));
            resolved = false;
            visitedMap = {};
            networks = [];
            for (let u of units) {
                let uDef = UNIT_TYPES[u.team][u.key];
                if (uDef.type === 'artillery' || uDef.type === 'flag' || uDef.type === 'ship') continue;
                if (visitedMap[u.id]) continue;

                let componentUnits = [];
                let queue = [u];
                visitedMap[u.id] = true;

                while (queue.length > 0) {
                    let curr = queue.shift();
                    componentUnits.push(curr);

                    for (let other of units) {
                        if (visitedMap[other.id]) continue;
                        let oDef = UNIT_TYPES[other.team][other.key];
                        if (oDef.type === 'artillery' || oDef.type === 'flag' || oDef.type === 'ship') continue;
                        if (other.team !== curr.team) continue;

                        let dist = Math.max(Math.abs(other.x - curr.x), Math.abs(other.y - curr.y));
                        if (dist === 1) {
                            visitedMap[other.id] = true;
                            queue.push(other);
                        }
                    }
                }

                let totalPower = 0;
                for (let compUnit of componentUnits) {
                    let def = UNIT_TYPES[compUnit.team][compUnit.key];
                    if (typeof def.power === 'number') totalPower += def.power;
                }

                let anchorUnit = componentUnits.reduce((acc, cur) => {
                    if (cur.y > acc.y || (cur.y === acc.y && cur.x > acc.x)) return cur;
                    return acc;
                }, componentUnits[0]);

                networks.push({
                    units: componentUnits,
                    power: totalPower,
                    team: u.team,
                    isGroup: componentUnits.length > 1,
                    anchorId: anchorUnit.id
                });
            }
        }
    }

    return { networks, stalematedUnitIds };
}

function executeNextTurn() {
    const activeUnit = units.find(u => u.id === selectedUnitId);
    if (!activeUnit || !activeUnit.memoryPath || activeUnit.memoryPath.length === 0) return;

    const unitDef = UNIT_TYPES[activeUnit.team][activeUnit.key];
    const targetTurnNum = activeUnit.currentTurnIndex + 1;
    const turnNodes = activeUnit.memoryPath.filter(n => n.turn === targetTurnNum);

    if (turnNodes.length > 0) {
        const endNode = turnNodes.find(n => n.isEnd) || turnNodes[turnNodes.length - 1];
        activeUnit.x = endNode.x;
        activeUnit.y = endNode.y;
        activeUnit.currentTurnIndex++;

        infoPanel.textContent = `${unitDef.name} advanced to Turn ${targetTurnNum} position [${endNode.x}, ${endNode.y}]`;

        const maxTurn = activeUnit.memoryPath[activeUnit.memoryPath.length - 1].turn;
        if (targetTurnNum >= maxTurn) {
            nextTurnBtn.textContent = "Destination Reached!";
            nextTurnBtn.style.backgroundColor = "#7f8c8d";
            nextTurnBtn.disabled = true;
        }
        renderGrid();
    }
}
function renderGrid() {
    gridElement.innerHTML = '';
    const { networks: teamNetworks, stalematedUnitIds } = computeTeamNetworksAndResolveConflicts();

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            if (waterMap[y * GRID_SIZE + x] === 1) {
                cell.classList.add('water');
            } else {
                let colLetter = String.fromCharCode(65 + x);
                let coordStr = colLetter + (y + 1);

                if (boardFeatures.cores.rc.includes(coordStr)) cell.classList.add('rc');
                if (boardFeatures.cores.bc.includes(coordStr)) cell.classList.add('bc');
                if (boardFeatures.bases.r.includes(coordStr) || boardFeatures.bases.b.includes(coordStr)) cell.classList.add('base');
                if (boardFeatures.navyPorts.nr.includes(coordStr) || boardFeatures.navyPorts.nb.includes(coordStr)) cell.classList.add('port');
                if (Object.values(boardFeatures.goldCores).includes(coordStr)) cell.classList.add('gold-core');
                
                for (let gKey in boardFeatures.goldSquares) {
                    if (boardFeatures.goldSquares[gKey].includes(coordStr)) {
                        cell.classList.add('gold-tile');
                        break;
                    }
                }
            }

            const pathNodesHere = renderedPathNodes.filter(p => p.x === x && p.y === y);
            if (pathNodesHere.length > 0) {
                let node = pathNodesHere[pathNodesHere.length - 1];
                let styleIndex = Math.min(node.turn, 15);
                if (node.isEnd) {
                    cell.classList.add(`turn-${styleIndex}-end`);
                    const marker = document.createElement('div'); marker.classList.add('turn-marker'); cell.appendChild(marker);
                    const label = document.createElement('div'); label.classList.add('turn-label'); label.textContent = node.turn; cell.appendChild(label);
                } else {
                    cell.classList.add(`turn-${styleIndex}-path`);
                }
            }

            const priorityUnit = priorityUnits.find(pu => pu.x === x && pu.y === y);
            if (priorityUnit) {
                const puDiv = document.createElement('div');
                puDiv.classList.add('priority-unit');
                if (priorityUnit.priority > 0) puDiv.classList.add('positive');
                else if (priorityUnit.priority < 0) puDiv.classList.add('negative');
                else puDiv.classList.add('neutral');

                if (selectedPriorityId === priorityUnit.id) puDiv.classList.add('selected');
                puDiv.textContent = priorityUnit.priority;
                puDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectedPriorityId = priorityUnit.id;
                    infoPanel.textContent = `Selected Priority Unit ${priorityUnit.name} at [${x}, ${y}].`;
                    renderGrid();
                });
                cell.appendChild(puDiv);
            }

            const unit = units.find(u => u.x === x && u.y === y);
            if (unit) {
                const unitDef = UNIT_TYPES[unit.team][unit.key];
                const unitDiv = document.createElement('div');
                unitDiv.classList.add('unit');
                if (unit.id === selectedUnitId) unitDiv.classList.add('selected');

                let unitNetwork = teamNetworks.find(net => net.units.some(uObj => uObj.id === unit.id));

                if (unitNetwork && unitNetwork.anchorId === unit.id) {
                    const powerBadge = document.createElement('div');
                    powerBadge.style.position = 'absolute';
                    powerBadge.style.top = '1px';
                    powerBadge.style.right = '1px';
                    powerBadge.style.backgroundColor = 'rgba(39, 174, 96, 0.45)';
                    powerBadge.style.color = 'rgba(255, 255, 255, 0.65)';
                    powerBadge.style.fontSize = '7px';
                    powerBadge.style.fontWeight = 'bold';
                    powerBadge.style.padding = '1px 2px';
                    powerBadge.style.borderRadius = '2px';
                    powerBadge.style.zIndex = '5';
                    powerBadge.textContent = `${unitNetwork.power}`;
                    cell.appendChild(powerBadge);
                }

                if (stalematedUnitIds.has(unit.id)) {
                    const lockBadge = document.createElement('div');
                    lockBadge.style.position = 'absolute';
                    lockBadge.style.bottom = '1px';
                    lockBadge.style.left = '1px';
                    lockBadge.style.backgroundColor = 'rgba(192, 57, 43, 0.45)';
                    lockBadge.style.color = 'rgba(255, 255, 255, 0.65)';
                    lockBadge.style.fontSize = '7px';
                    lockBadge.style.padding = '1px 2px';
                    lockBadge.style.borderRadius = '2px';
                    lockBadge.style.zIndex = '6';
                    lockBadge.textContent = '🔒';
                    cell.appendChild(lockBadge);
                }

                const img = document.createElement('img');
                img.src = unitDef.image;
                img.alt = unitDef.name;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.borderRadius = '0px';
                img.style.objectFit = 'cover';
                unitDiv.appendChild(img);

                unitDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (stalematedUnitIds.has(unit.id)) {
                        infoPanel.textContent = `Unit is locked in a stalemate and cannot be moved!`;
                        return;
                    }
                    selectedUnitId = unit.id;
                    selectedPriorityId = null;
                    renderedPathNodes = [];
                    nextTurnBtn.style.display = 'none';
                    infoPanel.textContent = `Selected ${unitDef.name} (Speed: ${unitDef.speed}) at [${unit.x}, ${unit.y}]`;
                    turnBreakdownPanel.textContent = '';
                    renderGrid();
                });
                cell.appendChild(unitDiv);
            }

            cell.addEventListener('click', () => {
                if (selectedPriorityId !== null) {
                    if (waterMap[y * GRID_SIZE + x] === 1) return;
                    let pu = priorityUnits.find(p => p.id === selectedPriorityId);
                    pu.x = x; pu.y = y;
                    selectedPriorityId = null;
                    renderedPathNodes = [];
                    nextTurnBtn.style.display = 'none';
                    infoPanel.textContent = `Moved Priority Unit ${pu.name} to [${x}, ${y}].`;
                    renderGrid();
                    return;
                }

                if (selectedUnitId === null) return;

                const activeUnit = units.find(u => u.id === selectedUnitId);
                if (!activeUnit || stalematedUnitIds.has(activeUnit.id)) return;

                const unitDef = UNIT_TYPES[activeUnit.team][activeUnit.key];
                
                const startTime = performance.now();
                const pathNodes = findVectorPath(activeUnit.x, activeUnit.y, x, y, unitDef.speed);
                const endTime = performance.now();
                
                const calculationTimeUs = ((endTime - startTime) * 1000).toFixed(1);

                if (!pathNodes || pathNodes.length === 0) {
                    cell.classList.add('invalid-click');
                    setTimeout(() => cell.classList.remove('invalid-click'), 400);
                    infoPanel.textContent = `Path Blocked | Time: ${calculationTimeUs} µs`;
                    turnBreakdownPanel.textContent = '';
                    renderedPathNodes = [];
                    nextTurnBtn.style.display = 'none';
                } else {
                    renderedPathNodes = pathNodes;
                    activeUnit.memoryPath = pathNodes;
                    activeUnit.currentTurnIndex = 0;

                    cell.classList.add('valid-click');
                    setTimeout(() => cell.classList.remove('valid-click'), 400);
                    const totalTurns = pathNodes[pathNodes.length - 1].turn;
                    infoPanel.textContent = `Success! Path stored in memory. Turns: ${totalTurns} | Time: ${calculationTimeUs} µs`;

                    nextTurnBtn.style.display = 'block';
                    nextTurnBtn.textContent = "Go to Next Turn";
                    nextTurnBtn.style.backgroundColor = "#27ae60";
                    nextTurnBtn.disabled = false;

                    let counts = {};
                    pathNodes.forEach(n => { counts[n.turn] = (counts[n.turn] || 0) + 1; });
                    turnBreakdownPanel.textContent = Object.keys(counts).map(t => `Turn ${t}: ${counts[t]} squares`).join(' | ');
                }
                renderGrid();
            });
            gridElement.appendChild(cell);
        }
    }
}

renderGrid();
console.log("High-performance vector pathfinder engine successfully initialized with zero-power superunit stalemates and dynamic reinforcement breaking.");
