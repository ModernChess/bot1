// =========================================================================
// CAMPAIGN, ACCOUNT RANK, & CACHE CONTROLLER (game.js)
// Unlocked Test Mode: All levels selectable
// =========================================================================

const cachedUser = localStorage.getItem('arena_chess_user') || 'GuestPlayer';
let currentCampaignLevel = parseInt(localStorage.getItem(`chess_campaign_level_${cachedUser}`)) || 1;
let totalUserXp = parseInt(localStorage.getItem(`chess_campaign_xp_${cachedUser}`)) || 0;

console.log(`[INFO][game.js] Logged into account: ${cachedUser} | Level: ${currentCampaignLevel} | Total Account XP: ${totalUserXp}`);

function getPlayerRank(xp) {
    if (xp >= 300) return { title: "Grandmaster", color: "#f59e0b" };
    if (xp >= 135) return { title: "Tactician", color: "#8b5cf6" };
    if (xp >= 45) return { title: "Veteran", color: "#3b82f6" };
    return { title: "Recruit", color: "#10b981" };
}


const campaignLevels = [
    { level: 1, title: "Tutorial 1: Infantry Advance", blueUnits: [{name: 'Infantry', type: 'land', range: 2}], redUnits: [{name: 'Infantry', type: 'land', range: 2}], customRedPos: [{c: 17, r: 0}] },
    { level: 2, title: "Tutorial 2: Armored Advance", blueUnits: [{name: 'Tank', type: 'land', range: 3}], redUnits: [{name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 17, r: 0}] },
    { level: 3, title: "Tutorial 3: Elimination Protocol", blueUnits: [{name: 'Tank', type: 'land', range: 3}], redUnits: [{name: 'Infantry', type: 'land', range: 2}], customRedPos: [{c: 4, r: 5}] },
    { level: 4, title: "Tutorial 4: Defensive Line", blueUnits: [{name: 'Infantry', type: 'land', range: 2}, {name: 'Infantry', type: 'land', range: 2}], redUnits: [{name: 'Infantry', type: 'land', range: 2}, {name: 'Infantry', type: 'land', range: 2}], customRedPos: [{c: 3, r: 4}, {c: 7, r: 1}] },
    { level: 5, title: "Tutorial 5: Armored Defense", blueUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 3, r: 4}, {c: 7, r: 1}] },
    { level: 6, title: "Level 1: Border Skirmish", blueUnits: [{name: 'Infantry', type: 'land', range: 2}], redUnits: [{name: 'Infantry', type: 'land', range: 2}] },
    { level: 7, title: "Level 2: Dual Threat", blueUnits: [{name: 'Infantry', type: 'land', range: 2}], redUnits: [{name: 'Infantry', type: 'land', range: 2}, {name: 'Infantry', type: 'land', range: 2}], customRedPos: [{c: 21, r: 4}, {c: 11, r: 2}] },
    { level: 8, title: "Level 3: Armored Advance", blueUnits: [{name: 'Infantry', type: 'land', range: 2}, {name: 'Infantry', type: 'land', range: 2}, {name: 'Infantry', type: 'land', range: 2}], redUnits: [{name: 'Tank', type: 'land', range: 3}] },
    { level: 9, title: "Level 4: Gold Core Clash", blueUnits: [{name: 'Infantry', type: 'land', range: 2}, {name: 'Tank', type: 'land', range: 3}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}], customRedPos: [{c: 6, r: 4}, {c: 12, r: 7}], customBluePos: [{c: 0, r: 11}, {c: 6, r: 14}] },
    { level: 10, title: "Level 5: Gold Core Blitz", blueUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 1, r: 5}, {c: 12, r: 7}], customBluePos: [{c: 0, r: 11}, {c: 5, r: 14}] },
    { level: 11, title: "Level 6: Gold Core Siege", blueUnits: [{name: 'Infantry', type: 'land', range: 2}, {name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}], customRedPos: [{c: 6, r: 4}, {c: 12, r: 7}, {c: 16, r: 12}], customBluePos: [{c: 0, r: 11}, {c: 6, r: 14}, {c: 11, r: 16}] },
    { level: 12, title: "Level 7: Tactical Gold Pincer", blueUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 1, r: 5}, {c: 6, r: 4}, {c: 12, r: 7}], customBluePos: [{c: 0, r: 11}, {c: 6, r: 14}, {c: 5, r: 14}] },
    { level: 13, title: "Level 8: Iron Core Wall", blueUnits: [{name: 'Infantry', type: 'land', range: 2}, {name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}, {name: 'Tank', type: 'land', range: 3}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}, {name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 6, r: 4}, {c: 12, r: 7}, {c: 1, r: 5}, {c: 16, r: 12}], customBluePos: [{c: 0, r: 11}, {c: 6, r: 14}, {c: 11, r: 16}, {c: 5, r: 14}] },
    { level: 14, title: "Level 9: Vanguard Core Breach", blueUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 6, r: 4}, {c: 12, r: 7}, {c: 16, r: 12}], customBluePos: [{c: 0, r: 11}, {c: 6, r: 14}, {c: 11, r: 16}] },
    { level: 15, title: "Level 10: Combined Gold Ops", blueUnits: [{name: 'Infantry', type: 'land', range: 2}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], redUnits: [{name: 'Infantry', type: 'land', range: 2}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 1, r: 5}, {c: 6, r: 4}, {c: 12, r: 7}], customBluePos: [{c: 0, r: 11}, {c: 6, r: 14}, {c: 5, r: 14}] },
    { level: 16, title: "Level 11: Fortress Core Outpost", blueUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}, {name: 'Infantry', type: 'land', range: 2}, {name: 'Tank', type: 'land', range: 3}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 6, r: 4}, {c: 12, r: 7}, {c: 16, r: 12}], customBluePos: [{c: 0, r: 11}, {c: 6, r: 14}, {c: 11, r: 16}, {c: 5, r: 14}] },
    { level: 17, title: "Level 12: The Core Gauntlet", blueUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 1, r: 5}, {c: 6, r: 4}, {c: 12, r: 7}, {c: 16, r: 12}], customBluePos: [{c: 0, r: 11}, {c: 6, r: 14}, {c: 11, r: 16}] },
    { level: 18, title: "Level 13: Grand Core Siege", blueUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}, {name: 'Tank', type: 'land', range: 3}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 6, r: 4}, {c: 12, r: 7}, {c: 1, r: 5}, {c: 16, r: 12}], customBluePos: [{c: 0, r: 11}, {c: 6, r: 14}, {c: 11, r: 16}] },
    { level: 19, title: "Level 14: Final Core Front", blueUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 1, r: 5}, {c: 6, r: 4}, {c: 12, r: 7}, {c: 16, r: 12}], customBluePos: [{c: 0, r: 11}, {c: 6, r: 14}, {c: 11, r: 16}] },
    { level: 20, title: "Level 15: Ultimate Judgment Core", blueUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Infantry', type: 'land', range: 2}, {name: 'Tank', type: 'land', range: 3}], redUnits: [{name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}, {name: 'Tank', type: 'land', range: 3}], customRedPos: [{c: 1, r: 5}, {c: 6, r: 4}, {c: 12, r: 7}, {c: 16, r: 12}, {c: 11, r: 2}], customBluePos: [{c: 0, r: 11}, {c: 6, r: 14}, {c: 11, r: 16}, {c: 5, r: 14}] }
];

function injectCampaignUI() {
    const topBar = document.querySelector('.game-top-bar');
    if (!topBar) return;

    const shopBtn = document.getElementById('shop-btn');
    if (shopBtn) shopBtn.style.display = 'none';

    let currentRank = getPlayerRank(totalUserXp);

    let campaignHud = document.getElementById('campaignHudContainer');
    if (!campaignHud) {
        campaignHud = document.createElement('div');
        campaignHud.id = 'campaignHudContainer';
        campaignHud.style.cssText = `display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: #f8fafc;`;
        
        campaignHud.innerHTML = `
            <div id="openAccountModalBtn" style="background: rgba(139, 92, 246, 0.2); border: 1px solid #8b5cf6; padding: 4px 8px; border-radius: 6px; cursor: pointer;" title="View Profile">
                👤 <span style="color: #c084fc;">${cachedUser}</span> [<span id="hudRankVal" style="color: ${currentRank.color};">${currentRank.title}</span>]
            </div>
            <div style="background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; padding: 4px 8px; border-radius: 6px;">
                STAGE: <span id="hudLevelVal">T1</span> | XP: <span id="hudXpVal">${totalUserXp}</span>
            </div>
            <button id="openLevelSelectBtn" style="background: #8b5cf6; color: white; border: none; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-weight: 800; font-size: 10px;">Levels</button>
        `;
        topBar.appendChild(campaignHud);

        document.getElementById('openLevelSelectBtn').addEventListener('click', toggleLevelSelectModal);
        document.getElementById('openAccountModalBtn').addEventListener('click', toggleAccountModal);
    }

    let accModal = document.getElementById('accountProfileModal');
    if (!accModal) {
        accModal = document.createElement('div');
        accModal.id = 'accountProfileModal';
        accModal.style.cssText = `
            display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #1e293b; border: 2px solid #3b82f6; padding: 20px; border-radius: 14px;
            width: 90%; max-width: 320px; z-index: 100; box-shadow: 0 25px 50px rgba(0,0,0,0.8); text-align: center; color: #fff;
        `;
        document.body.appendChild(accModal);
    }
    renderAccountModalContent();

    let modal = document.getElementById('levelSelectModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'levelSelectModal';
        modal.style.cssText = `
            display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #1e293b; border: 2px solid #3b82f6; padding: 20px; border-radius: 14px;
            width: 90%; max-width: 380px; z-index: 100; box-shadow: 0 25px 50px rgba(0,0,0,0.8); text-align: center;
        `;
        document.body.appendChild(modal);
    }
    renderLevelSelectContent();
    updateHudDisplay();
}

function getStageDisplayLabel(lvlNum) {
    return lvlNum <= 5 ? `T${lvlNum}` : `${lvlNum - 5}`;
}

function updateHudDisplay() {
    let lvlVal = document.getElementById('hudLevelVal');
    let xpVal = document.getElementById('hudXpVal');
    if (lvlVal) lvlVal.innerText = getStageDisplayLabel(currentCampaignLevel);
    if (xpVal) xpVal.innerText = totalUserXp;
}

function toggleAccountModal() {
    const modal = document.getElementById('accountProfileModal');
    if (!modal) return;
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function renderAccountModalContent() {
    const modal = document.getElementById('accountProfileModal');
    if (!modal) return;
    let rank = getPlayerRank(totalUserXp);

    modal.innerHTML = `
        <h3 style="margin-top: 0; color: #3b82f6; text-transform: uppercase; font-size: 15px; font-weight: 800;">Player Profile</h3>
        <div style="background: #0f172a; padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: left; font-size: 12px; line-height: 1.6;">
            <div>👤 <strong>Username:</strong> <span style="color: #c084fc;">${cachedUser}</span></div>
            <div>🛡️ <strong>Campaign Rank:</strong> <span style="color: ${rank.color}; font-weight: bold;">${rank.title}</span></div>
            <div>⭐ <strong>Total Account XP:</strong> ${totalUserXp} XP</div>
            <div>🎯 <strong>Current Stage:</strong> ${getStageDisplayLabel(currentCampaignLevel)}</div>
        </div>
        <button onclick="toggleAccountModal()" style="background: #ef4444; color: white; border: none; width: 100%; padding: 8px; border-radius: 6px; font-weight: 800; cursor: pointer;">Close</button>
    `;
}

function toggleLevelSelectModal() {
    const modal = document.getElementById('levelSelectModal');
    if (!modal) return;
    if (modal.style.display !== 'block') {
        renderLevelSelectContent();
    }
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function renderLevelSelectContent() {
    const modal = document.getElementById('levelSelectModal');
    if (!modal) return;

    let html = `
        <h3 style="margin-top: 0; color: #8b5cf6; text-transform: uppercase; font-size: 15px; font-weight: 800;">Campaign & Tutorials (Test Mode)</h3>
        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 15px;">Select any level to play freely:</p>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; max-height: 220px; overflow-y: auto; margin-bottom: 15px; padding: 4px;">
    `;

    campaignLevels.forEach(lvl => {
        let isCurrent = lvl.level === currentCampaignLevel;
        
        // TEST MODE: All levels unlocked and clickable
        let bgColor = isCurrent ? '#3b82f6' : '#10b981';
        let borderStyle = isCurrent ? '2px solid #93c5fd' : '1px solid transparent';
        let cursor = 'pointer';
        let opacity = '1';

        html += `
            <button onclick="window.loadCampaignLevel(${lvl.level})" style="
                background: ${bgColor}; color: white; border: ${borderStyle}; padding: 8px 0; border-radius: 6px;
                font-weight: 800; font-size: 11px; cursor: ${cursor}; opacity: ${opacity};
            ">${getStageDisplayLabel(lvl.level)}</button>
        `;
    });

    html += `
        </div>
        <button onclick="toggleLevelSelectModal()" style="background: #ef4444; color: white; border: none; width: 100%; padding: 8px; border-radius: 6px; font-weight: 800; cursor: pointer;">Close</button>
    `;
    modal.innerHTML = html;
}

window.loadCampaignLevel = function(targetLevel) {
    // TEST MODE: Removed restriction check (targetLevel > currentCampaignLevel)
    currentCampaignLevel = targetLevel;
    localStorage.setItem(`chess_campaign_level_${cachedUser}`, currentCampaignLevel);
    
    if (typeof window.activeRedBotPath !== 'undefined') {
        window.activeRedBotPath = [];
    }

    toggleLevelSelectModal();
    initLevelUnits(currentCampaignLevel);
    updateHudDisplay();
    
    if (typeof gameOver !== 'undefined') gameOver = false;
    if (typeof winnerMessage !== 'undefined') winnerMessage = '';
    if (typeof currentTurn !== 'undefined') currentTurn = 'blue';
    window._xpAwardedProcessed = false;
    window._levelAdvancementLocked = false;

    console.log(`[INFO][game.js] Loaded Campaign Level ${targetLevel} (${getStageDisplayLabel(targetLevel)}) & Cleared Pathfinders.`);
};

function initLevelUnits(lvlNum) {
    if (typeof units === 'undefined') return;
    units.length = 0;

    const config = campaignLevels.find(l => l.level === lvlNum) || campaignLevels[0];
    const blueBase = typeof getBaseSquares === 'function' ? getBaseSquares('blue') : [{c:0, r:11}];
    const redBase = typeof getBaseSquares === 'function' ? getBaseSquares('red') : [{c:11, r:0}];

    config.blueUnits.forEach((template, index) => {
        let pos = (config.customBluePos && config.customBluePos[index]) ? config.customBluePos[index] : (blueBase[index % blueBase.length] || { c: 0, r: 11 });
        let imgRef = template.name === 'Tank' ? blueTankImg : blueInfantryImg;
        let loadRef = template.name === 'Tank' ? () => blueTankLoaded : () => blueInfantryLoaded;

        units.push({
            name: template.name, type: template.type, range: template.range,
            speed: template.name === 'Tank' ? 3 : 2, gridX: pos.c, gridY: pos.r,
            x: pos.c * cellSize, y: pos.r * cellSize, img: imgRef, loaded: loadRef, team: 'blue', facing: 0,
            invisible: false
        });
    });

    config.redUnits.forEach((template, index) => {
        let pos = (config.customRedPos && config.customRedPos[index]) ? config.customRedPos[index] : (redBase[index % redBase.length] || { c: 11, r: 0 });
        let isInvisible = (pos.c === 17 && pos.r === 0);

        let imgRef = template.name === 'Tank' ? redTankImg : redInfantryImg;
        let loadRef = template.name === 'Tank' ? () => redTankLoaded : () => redInfantryLoaded;

        units.push({
            name: template.name, type: template.type, range: template.range,
            speed: template.name === 'Tank' ? 3 : 2, gridX: pos.c, gridY: pos.r,
            x: pos.c * cellSize, y: pos.r * cellSize, img: imgRef, loaded: loadRef, team: 'red', facing: 0,
            invisible: isInvisible
        });
    });
}

setInterval(() => {
    if (typeof gameOver !== 'undefined' && gameOver) {
        let isHumanWinner = winnerMessage.includes('BLUE TEAM WINS');
        if (isHumanWinner && !window._xpAwardedProcessed) {
            window._xpAwardedProcessed = true;
            
            if (window._levelAdvancementLocked) return;
            window._levelAdvancementLocked = true;
            
            if (typeof window.activeRedBotPath !== 'undefined') {
                window.activeRedBotPath = [];
            }
            
            let earnedXpReward = (typeof humanMatchXp !== 'undefined' ? humanMatchXp : 0) + 15;
            totalUserXp += earnedXpReward;
            localStorage.setItem(`chess_campaign_xp_${cachedUser}`, totalUserXp);

            if (typeof humanMatchXp !== 'undefined') humanMatchXp = 0;

            if (currentCampaignLevel < 20) {
                currentCampaignLevel++;
                localStorage.setItem(`chess_campaign_level_${cachedUser}`, currentCampaignLevel);
                console.log(`[INFO][game.js] Victory registered! Advanced to level: ${currentCampaignLevel}`);
            }

            let rankData = getPlayerRank(totalUserXp);
            let rankVal = document.getElementById('hudRankVal');
            if (rankVal) { rankVal.innerText = rankData.title; rankVal.style.color = rankData.color; }
            
            updateHudDisplay();
            renderAccountModalContent();
            renderLevelSelectContent();
        }
    } else {
        window._xpAwardedProcessed = false;
        window._levelAdvancementLocked = false;
    }
}, 500);

window.addEventListener('load', () => {
    setTimeout(() => {
        injectCampaignUI();
        initLevelUnits(currentCampaignLevel);
    }, 500);
});
