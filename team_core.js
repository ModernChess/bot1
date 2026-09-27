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

// Global container to hold the Red bot's currently calculated path for visualization
window.activeRedBotPath = [];

// ALL gold cores (1 to 6) start NEUTRAL (owner: null), while gc7 and gc8 act as team base win-conditions.
let goldCores = [
    { id: 'gc1', c: 6, r: 4, owner: null, isBase: false, captureZones: [{c:6, r:3}, {c:6, r:5}, {c:5, r:4}, {c:7, r:4}, {c:5, r:3}, {c:5, r:5}, {c:7, r:3}, {c:7, r:5}] },
    { id: 'gc2', c: 1, r: 5, owner: null, isBase: false, captureZones: [{c:1, r:4}, {c:1, r:6}, {c:0, r:5}, {c:2, r:5}, {c:0, r:4}, {c:0, r:6}, {c:2, r:4}, {c:2, r:6}] }, 
    { id: 'gc3', c: 12, r: 7, owner: null, isBase: false, captureZones: [{c:12, r:6}, {c:12, r:8}, {c:11, r:7}, {c:13, r:7}, {c:11, r:6}, {c:11, r:8}, {c:13, r:6}, {c:13, r:8}] },
    { id: 'gc4', c: 5, r: 14, owner: null, isBase: false, captureZones: [{c:5, r:13}, {c:5, r:15}, {c:4, r:14}, {c:6, r:14}, {c:4, r:13}, {c:4, r:15}, {c:6, r:13}, {c:6, r:15}] },
    { id: 'gc5', c: 16, r: 12, owner: null, isBase: false, captureZones: [{c:16, r:11}, {c:16, r:13}, {c:15, r:12}, {c:17, r:12}, {c:15, r:11}, {c:15, r:13}, {c:17, r:11}, {c:17, r:13}] },
    { id: 'gc6', c: 11, r: 16, owner: null, isBase: false, captureZones: [{c:11, r:15}, {c:11, r:17}, {c:10, r:16}, {c:12, r:16}, {c:10, r:15}, {c:10, r:17}, {c:12, r:15}, {c:12, r:17}] },
    // gc7: Red Base Special Gold Core (placed at Red original base coordinate c:11, r:0 / L1)
    { id: 'gc7', c: 11, r: 0, owner: 'red', isBase: true, teamBase: 'red', captureZones: [{c:11, r:1}, {c:10, r:0}, {c:12, r:0}, {c:10, r:1}, {c:12, r:1}] },
    // gc8: Blue Base Special Gold Core (placed at Blue original base coordinate c:0, r:11 / A12)
    { id: 'gc8', c: 0, r: 11, owner: 'blue', isBase: true, teamBase: 'blue', captureZones: [{c:0, r:10}, {c:0, r:12}, {c:1, r:11}, {c:1, r:10}, {c:1, r:12}] }
];

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
    TeamLog.success(`Human captured a base/core! +35 Match XP Gained.`);

    if (humanMatchXp >= humanXpMax) {
        humanMatchXp -= humanXpMax;
        humanLevel += 1;
        humanXpMax = Math.floor(humanXpMax * 1.3);
        TeamLog.success(`HUMAN PLAYER LEVEL UP IN MATCH! Reached Level ${humanLevel}!`);
    }
};

function checkWinConditions(allUnits) {
    if (gameOver) return;

    let redLandUnits = allUnits.filter(u => getTeamFromUnit(u) === 'red' && !isSpecialUnit(u) && getUnitPower(u) !== Infinity);
    let blueLandUnits = allUnits.filter(u => getTeamFromUnit(u) === 'blue' && !isSpecialUnit(u) && getUnitPower(u) !== Infinity);
    let redTotal = allUnits.filter(u => getTeamFromUnit(u) === 'red');
    let blueTotal = allUnits.filter(u => getTeamFromUnit(u) === 'blue');

    if (redLandUnits.length === 0 || redTotal.length === 0) {
        gameOver = true;
        winnerMessage = 'BLUE TEAM WINS BY ANNIHILATION!';
        TeamLog.success(winnerMessage);
        triggerPostGameReload();
        return;
    }
    if (blueLandUnits.length === 0 || blueTotal.length === 0) {
        gameOver = true;
        winnerMessage = 'RED TEAM WINS BY ANNIHILATION!';
        TeamLog.success(winnerMessage);
        triggerPostGameReload();
        return;
    }

    goldCores.forEach(core => {
        if (core.isBase && core.owner && core.teamBase) {
            if (core.owner !== core.teamBase) {
                gameOver = true;
                winnerMessage = `${core.owner.toUpperCase()} TEAM WINS BY CAPTURING ENEMY BASE!`;
                TeamLog.success(winnerMessage);
                triggerPostGameReload();
            }
        }
    });

    if (gameOver) return;

    let blueUnits = allUnits.filter(u => getTeamFromUnit(u) === 'blue');
    let redUnits = allUnits.filter(u => getTeamFromUnit(u) === 'red');

    let isTeamCompletelyStalmated = (teamUnits) => {
        if (teamUnits.length === 0) return false;
        return teamUnits.every(u => {
            if (typeof isUnitLockedInStalemate === 'function' && isUnitLockedInStalemate(u, allUnits)) return true;
            let moves = typeof getLegalMoves === 'function' ? getLegalMoves(u) : [];
            return !moves || moves.length === 0;
        });
    };

    let blueStalmated = isTeamCompletelyStalmated(blueUnits);
    let redStalmated = isTeamCompletelyStalmated(redUnits);

    if (blueStalmated || redStalmated) {
        gameOver = true;
        if (blueUnits.length > redUnits.length) {
            winnerMessage = 'BLUE TEAM WINS BY GREATER NUMBER OF UNITS (RED STALEMATED)!';
        } else if (redUnits.length > blueUnits.length) {
            winnerMessage = 'RED TEAM WINS BY GREATER NUMBER OF UNITS (BLUE STALEMATED)!';
        } else {
            winnerMessage = 'STALEMATE DRAW! Equal units remaining.';
        }
        TeamLog.success(winnerMessage);
        triggerPostGameReload();
    }
}

function triggerPostGameReload() {
    console.log("[team_core] Game over reached. Processing account XP persistence & resetting match state...");
    
    let isHumanWinner = winnerMessage.includes('BLUE TEAM WINS') || winnerMessage.includes('BLUE TEAM WINS BY CAPTURING ENEMY BASE');
    
    if (isHumanWinner && typeof cachedUser !== 'undefined') {
        let earnedXpReward = humanMatchXp + 15;
        
        if (typeof totalUserXp !== 'undefined') {
            totalUserXp += earnedXpReward;
            localStorage.setItem(`chess_campaign_xp_${cachedUser}`, totalUserXp);
        }

        // FIXED: Level increment removed here to prevent double-incrementing / level skipping. 
        // game.js handles currentCampaignLevel progression exclusively now.
        /*
        if (typeof currentCampaignLevel !== 'undefined' && currentCampaignLevel < 15) {
            currentCampaignLevel++;
            localStorage.setItem(`chess_campaign_level_${cachedUser}`, currentCampaignLevel);
        }
        */

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

        console.log(`[SUCCESS][team_core] Saved ${earnedXpReward} XP to account ${cachedUser}! New Total XP: ${totalUserXp}`);
    }

    humanMatchXp = 0;
    humanLevel = 1;
    humanXpMax = 100;

    setTimeout(() => {
        gameOver = false;
        winnerMessage = '';
        currentTurn = 'blue';
        
        goldCores.forEach(core => {
            if (core.isBase && core.teamBase) {
                core.owner = core.teamBase;
            } else {
                core.owner = null;
            }
        });
        flagAnimations = {};

        if (typeof currentCampaignLevel !== 'undefined' && typeof initLevelUnits === 'function') {
            initLevelUnits(currentCampaignLevel);
        } else if (typeof resetGameBoards === 'function') {
            resetGameBoards();
        }
        console.log("[team_core] Board and capture tiles successfully reloaded for the next match!");
    }, 3500);
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

function toggleShop() {
    let modal = document.getElementById('shop-modal');
    if (!modal) return;
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function buyUnit(unitType) {
    TeamLog.info("Shop interaction disabled: Coins have been removed from the game.");
}

TeamLog.success("Team core logic controller successfully decoupled.");
