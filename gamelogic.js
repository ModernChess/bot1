// =========================================================================
// GAME RENDERER, UNIT MANAGEMENT, & LOOP LOGIC (game-renderer.js)
// =========================================================================

window.loadCampaignLevel = function(targetLevel) {
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

    console.log(`[INFO][game-renderer.js] Loaded Campaign Level ${targetLevel} (${getStageDisplayLabel(targetLevel)}) & Cleared Pathfinders.`);
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
                console.log(`[INFO][game-renderer.js] Victory registered! Advanced to level: ${currentCampaignLevel}`);
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