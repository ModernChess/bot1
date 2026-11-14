// =========================================================================
// TEAM CORE, ECONOMY, BASES, & WIN CONDITIONS CONTROLLER (LOGIC ONLY)
// =========================================================================

let currentTurn = 'blue';
let humanMatchXp = 0;   // Match XP tracker (resets to 0 each game)
let humanXpMax = 100;   // XP required for next rank/level up inside match
let humanLevel = 1;     // Human player level rank inside match

let destroyedUnitsQueue = [];
let flagAnimations = {};
let gameOver = false;
let winnerMessage = '';

window.activeRedBotPath = [];

// Default goldCores (dynamically overwritten when maps switch via syncGoldCoresFromMap)
let goldCores = [];

function syncGoldCoresFromMap(mapData) {
    if (!mapData) return;
    const rebuiltCores = [];

    if (Array.isArray(mapData.gold_core_links)) {
        mapData.gold_core_links.forEach((gc, idx) => {
            const corePos = parseCoordString(gc.coordinates);
            const zones = (gc.linked_tiles || []).map(parseCoordString);
            rebuiltCores.push({
                id: gc.custom_name || `gc_${idx + 1}`,
                c: corePos.c,
                r: corePos.r,
                owner: null,
                isBase: false,
                captureZones: zones
            });
        });
    }

    if (Array.isArray(mapData.hq)) {
        const redCore = mapData.hq.find(h => h.type_name === 'rbc');
        if (redCore) {
            const rPos = parseCoordString(redCore.coordinates);
            const rZones = mapData.hq
                .filter(h => h.type_name === 'r')
                .map(h => parseCoordString(h.coordinates));
            rebuiltCores.push({
                id: redCore.custom_name || 'rbc',
                c: rPos.c,
                r: rPos.r,
                owner: 'red',
                isBase: true,
                teamBase: 'red',
                captureZones: rZones
            });
        }

        const blueCore = mapData.hq.find(h => h.type_name === 'bbc');
        if (blueCore) {
            const bPos = parseCoordString(blueCore.coordinates);
            const bZones = mapData.hq
                .filter(h => h.type_name === 'b')
                .map(h => parseCoordString(h.coordinates));
            rebuiltCores.push({
                id: blueCore.custom_name || 'bbc',
                c: bPos.c,
                r: bPos.r,
                owner: 'blue',
                isBase: true,
                teamBase: 'blue',
                captureZones: bZones
            });
        }
    }

    goldCores.length = 0;
    rebuiltCores.forEach(c => goldCores.push(c));
    console.log(`[SUCCESS][team_core] Synced and freshly reset ${goldCores.length} cores/HQs for map '${mapData.key}'.`);
}

if (typeof activeMapData !== 'undefined' && activeMapData) {
    syncGoldCoresFromMap(activeMapData);
}

const TeamLog = {
    info: (msg, data = null) => console.log(`[INFO][team_core]: ${msg}`, data ?? ''),
    warn: (msg, data = null) => console.warn(`[WARN][team_core]: ${msg}`, data ?? ''),
    success: (msg, data = null) => console.log(`[SUCCESS][team_core]: ${msg}`, data ?? '')
};

function getTeamFromUnit(unit) {
    if (!unit) return null;
    if (unit.team) return unit.team.toLowerCase();
    if (unit._assignedTeam) return unit._assignedTeam;
    
    let nameStr = (unit.name || '').toLowerCase();
    if (nameStr.includes('red') || nameStr.includes('black')) return 'red';
    if (nameStr.includes('blue') || nameStr.includes('white')) return 'blue';
    
    if (unit.img && unit.img.src) {
        let src = unit.img.src.toLowerCase();
        if (src.includes('red')) return 'red';
        if (src.includes('blue')) return 'blue';
    }

    let team = unit.gridY < 9 ? 'red' : 'blue';
    unit._assignedTeam = team;
    unit.team = team;
    return team;
}

function getUnitPower(unit) {
    if (!unit) return 0;
    let name = (unit.name || '').toLowerCase();
    if (name.includes('ship')) return Infinity;
    if (name.includes('artillery') || name.includes('boat')) return 0;
    if (name.includes('tank')) return 2;
    if (name.includes('infantry') || name.includes('soldier')) return 1;
    return 1;
}

function isSpecialUnit(unit) {
    if (!unit) return false;
    let name = (unit.name || '').toLowerCase();
    return name.includes('artillery') || name.includes('boat') || getUnitPower(unit) === 0;
}

function areUnitsAdjacent(u1, u2) {
    let dx = Math.abs(u1.gridX - u2.gridX);
    let dy = Math.abs(u1.gridY - u2.gridY);
    return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
}

function getSuperunitsForTeam(teamName, allUnits) {
    let teamUnits = allUnits.filter(u => getTeamFromUnit(u) === teamName);
    let superunits = [];
    let visited = new Set();

    teamUnits.forEach(u => {
        if (visited.has(u)) return;

        let cluster = [u];
        visited.add(u);

        let queue = [u];
        while (queue.length > 0) {
            let current = queue.shift();
            teamUnits.forEach(other => {
                if (!visited.has(other) && areUnitsAdjacent(current, other)) {
                    visited.add(other);
                    cluster.push(other);
                    queue.push(other);
                }
            });
        }

        let powerSum = cluster.reduce((sum, unit) => sum + getUnitPower(unit), 0);
        let hasInfinite = cluster.some(unit => getUnitPower(unit) === Infinity);

        superunits.push({
            units: cluster,
            power: hasInfinite ? Infinity : powerSum,
            isSpecialSuperunit: cluster.some(unit => isSpecialUnit(unit))
        });
    });

    return superunits;
}

window.rewardHumanCapture = function() {
    humanMatchXp += 35;
    
    // Gold is strictly temporary session state; never saved to localStorage or Firebase
    if (typeof userGoldCoins !== 'undefined') {
        userGoldCoins += 1;
    }

    TeamLog.success(`Human captured a base/core! +35 Match XP & +1 Temporary Gold Coin Gained.`);

    if (typeof updateHudDisplay === 'function') {
        updateHudDisplay();
    }

    if (humanMatchXp >= humanXpMax) {
        humanMatchXp -= humanXpMax;
        humanLevel += 1;
        humanXpMax = Math.floor(humanXpMax * 1.3);
        TeamLog.success(`HUMAN PLAYER LEVEL UP IN MATCH! Reached Level ${humanLevel}!`);
    }
};

let postGameTimerActive = false;

function checkWinConditions(allUnits) {
    if (gameOver || postGameTimerActive) return;

    let redLandUnits = allUnits.filter(u => getTeamFromUnit(u) === 'red' && !isSpecialUnit(u) && getUnitPower(u) !== Infinity);
    let blueLandUnits = allUnits.filter(u => getTeamFromUnit(u) === 'blue' && !isSpecialUnit(u) && getUnitPower(u) !== Infinity);
    let redTotal = allUnits.filter(u => getTeamFromUnit(u) === 'red');
    let blueTotal = allUnits.filter(u => getTeamFromUnit(u) === 'blue');

    if (redLandUnits.length === 0 || redTotal.length === 0) {
        winnerMessage = 'BLUE TEAM WINS BY ANNIHILATION!';
        TeamLog.success(winnerMessage);
        triggerPostGameSequence();
        return;
    }
    if (blueLandUnits.length === 0 || blueTotal.length === 0) {
        winnerMessage = 'RED TEAM WINS BY ANNIHILATION!';
        TeamLog.success(winnerMessage);
        triggerPostGameSequence();
        return;
    }

    goldCores.forEach(core => {
        if (core.isBase && core.owner && core.teamBase) {
            if (core.owner !== core.teamBase) {
                winnerMessage = `${core.owner.toUpperCase()} TEAM WINS BY CAPTURING ENEMY BASE!`;
                TeamLog.success(winnerMessage);
                triggerPostGameSequence();
            }
        }
    });

    if (gameOver || postGameTimerActive) return;

    let blueUnits = allUnits.filter(u => getTeamFromUnit(u) === 'blue');
    let redUnits = allUnits.filter(u => getTeamFromUnit(u) === 'red');

    let isTeamCompletelyStalmated = (teamUnits) => {
        if (teamUnits.length === 0) return false;
        return teamUnits.every(u => {
            return typeof isUnitLockedInStalemate === 'function' && isUnitLockedInStalemate(u, allUnits);
        });
    };

    let blueStalmated = isTeamCompletelyStalmated(blueUnits);
    let redStalmated = isTeamCompletelyStalmated(redUnits);

    if (blueStalmated || redStalmated) {
        if (blueUnits.length > redUnits.length) {
            winnerMessage = 'BLUE TEAM WINS BY GREATER NUMBER OF UNITS (RED STALEMATED)!';
        } else if (redUnits.length > blueUnits.length) {
            winnerMessage = 'RED TEAM WINS BY GREATER NUMBER OF UNITS (BLUE STALEMATED)!';
        } else {
            winnerMessage = 'STALEMATE DRAW! Equal units remaining.';
        }
        TeamLog.success(winnerMessage);
        triggerPostGameSequence();
    }
}

function triggerPostGameSequence() {
    if (postGameTimerActive) return;
    postGameTimerActive = true;

    console.log("[team_core] Victory condition detected! Locking selection. Waiting 2.5 seconds before showing victory message...");

    let isHumanWinner = winnerMessage.includes('BLUE TEAM WINS') || winnerMessage.includes('BLUE TEAM WINS BY CAPTURING ENEMY BASE');
    
    if (isHumanWinner && typeof cachedUser !== 'undefined') {
        let earnedXpReward = humanMatchXp + 15;
        
        if (typeof totalUserXp !== 'undefined') {
            totalUserXp += earnedXpReward;
            localStorage.setItem(`chess_campaign_xp_${cachedUser}`, totalUserXp);
        }

        if (typeof getPlayerRank === 'function') {
            let rankData = getPlayerRank(totalUserXp);
            let rankVal = document.getElementById('hudRankVal');
            let lvlVal = document.getElementById('hudLevelVal');
            let xpVal = document.getElementById('hudXpVal');
            
            if (rankVal) { rankVal.innerText = rankData.title; rankVal.style.color = rankData.color; }
            if (lvlVal) lvlVal.innerText = currentCampaignLevel;
            if (xpVal) xpVal.innerText = totalUserXp;
        }

        if (typeof renderAccountModalContent === 'function') {
            renderAccountModalContent();
        }
    }

    // Wait 2.5 seconds before triggering the victory popup message
    setTimeout(() => {
        gameOver = true; 
        console.log("[team_core] Victory message displayed. Advancing to next stage in 3 seconds...");

        // Wait 3 more seconds with the victory message showing, then load the next stage
        setTimeout(() => {
            humanMatchXp = 0;
            humanLevel = 1;
            humanXpMax = 100;
            gameOver = false;
            winnerMessage = '';
            currentTurn = 'blue';
            flagAnimations = {};
            postGameTimerActive = false;

            // Level advancement handled exclusively in gamelogic.js to prevent double-skipping

            // Reset temporary gold to 2 upon advancing to next stage
            if (typeof userGoldCoins !== 'undefined') {
                userGoldCoins = 2;
            }

            if (typeof currentCampaignLevel !== 'undefined' && typeof initLevelUnits === 'function') {
                initLevelUnits(currentCampaignLevel);
            } else if (typeof activeMapData !== 'undefined' && activeMapData) {
                syncGoldCoresFromMap(activeMapData);
            }
            updateHudDisplay();
            console.log("[team_core] Successfully advanced to the next stage! Gold reset to 2.");
        }, 3000);

    }, 2500); // 2.5 seconds delay before victory message pops up
}

function commitUnitDestruction(unitsArray, unitsToDestroy) {
    unitsToDestroy.forEach(u => {
        let index = unitsArray.indexOf(u);
        if (index !== -1) {
            unitsArray.splice(index, 1);
        }
        if (!destroyedUnitsQueue.some(item => item.unit === u)) {
            destroyedUnitsQueue.push({
                unit: u,
                startTime: performance.now(),
                duration: 1800
            });
        }
    });
}

TeamLog.success("Team core logic controller successfully updated with temporary session gold and no persistence.");
