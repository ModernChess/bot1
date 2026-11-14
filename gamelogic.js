// =========================================================================
// GAME RENDERER, UNIT MANAGEMENT, & LOOP LOGIC (gamelogic.js)
// =========================================================================

window.loadCampaignLevel = function(targetLevel) {
    currentCampaignLevel = targetLevel;
    localStorage.setItem(`chess_campaign_level_${cachedUser}`, currentCampaignLevel);
    
    // Always reset temporary gold to 2 when loading any stage (including retrying/reloading a lost stage)
    if (typeof userGoldCoins !== 'undefined') {
        userGoldCoins = 2;
    }

    if (typeof window.activeRedBotPath !== 'undefined') {
        window.activeRedBotPath = [];
    }

    toggleLevelSelectModal();

    // 1. Switch the map layout, background image, and core coordinates dynamically based on level
    if (typeof switchActiveMap === 'function') {
        switchActiveMap(currentCampaignLevel);
    }

    // 2. Initialize units for the newly selected level and map
    initLevelUnits(currentCampaignLevel);
    updateHudDisplay();
    
    if (typeof gameOver !== 'undefined') gameOver = false;
    if (typeof winnerMessage !== 'undefined') winnerMessage = '';
    if (typeof currentTurn !== 'undefined') currentTurn = 'blue';
    window._xpAwardedProcessed = false;
    window._levelAdvancementLocked = false;

    console.log(`[INFO][gamelogic.js] Loaded Campaign Level ${targetLevel} (${getStageDisplayLabel(targetLevel)}) & switched map successfully. Gold reset to 2.`);
};

function initLevelUnits(lvlNum) {
    // Ensure map config and gold cores are completely fresh for the target level
    if (typeof switchActiveMap === 'function') {
        switchActiveMap(lvlNum);
    }

    if (typeof units === 'undefined') return;
    units.length = 0;

    const config = campaignLevels.find(l => l.level === lvlNum) || campaignLevels[0];
    const blueBase = typeof getBaseSquares === 'function' ? getBaseSquares('blue') : [{c:0, r:11}];
    const redBase = typeof getBaseSquares === 'function' ? getBaseSquares('red') : [{c:11, r:0}];

    // Helper resolver to handle Artillery, Tanks, and Infantry correctly for any team
    const resolveUnitAssets = (team, templateName) => {
        let nameLower = (templateName || '').toLowerCase();
        let isBlue = (team === 'blue');

        if (nameLower.includes('artillery')) {
            return {
                img: isBlue ? blueArtilleryImg : redArtilleryImg,
                load: isBlue ? () => blueArtilleryLoaded : () => redArtilleryLoaded,
                speed: 2
            };
        } else if (nameLower.includes('tank')) {
            return {
                img: isBlue ? blueTankImg : redTankImg,
                load: isBlue ? () => blueTankLoaded : () => redTankLoaded,
                speed: 3
            };
        } else {
            return {
                img: isBlue ? blueInfantryImg : redInfantryImg,
                load: isBlue ? () => blueInfantryLoaded : () => redInfantryLoaded,
                speed: 2
            };
        }
    };

    if (config.blueUnits && Array.isArray(config.blueUnits)) {
        config.blueUnits.forEach((template, index) => {
            let pos = (config.customBluePos && config.customBluePos[index]) ? config.customBluePos[index] : (blueBase[index % blueBase.length] || { c: 0, r: 11 });
            let assetData = resolveUnitAssets('blue', template.name);

            units.push({
                name: template.name, type: template.type, range: template.range,
                speed: template.speed || assetData.speed, gridX: pos.c, gridY: pos.r,
                x: pos.c * cellSize, y: pos.r * cellSize, img: assetData.img, loaded: assetData.load, team: 'blue', facing: 0,
                invisible: false
            });
        });
    }

    if (config.redUnits && Array.isArray(config.redUnits)) {
        config.redUnits.forEach((template, index) => {
            let pos = (config.customRedPos && config.customRedPos[index]) ? config.customRedPos[index] : (redBase[index % redBase.length] || { c: 11, r: 0 });
            let isInvisible = (pos.c === 17 && pos.r === 0);
            let assetData = resolveUnitAssets('red', template.name);

            units.push({
                name: template.name, type: template.type, range: template.range,
                speed: template.speed || assetData.speed, gridX: pos.c, gridY: pos.r,
                x: pos.c * cellSize, y: pos.r * cellSize, img: assetData.img, loaded: assetData.load, team: 'red', facing: 0,
                invisible: isInvisible
            });
        });
    }
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

            if (currentCampaignLevel < 55) {
                currentCampaignLevel++;
                localStorage.setItem(`chess_campaign_level_${cachedUser}`, currentCampaignLevel);
                console.log(`[INFO][gamelogic.js] Victory registered! Advanced to level: ${currentCampaignLevel}`);
            }

            // Reset temporary session gold to 2 upon victory/stage transition
            if (typeof userGoldCoins !== 'undefined') {
                userGoldCoins = 2;
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
        // Always ensure gold starts at 2 when page first loads or reloads
        if (typeof userGoldCoins !== 'undefined') {
            userGoldCoins = 2;
        }
        injectCampaignUI();
        if (typeof switchActiveMap === 'function') {
            switchActiveMap(currentCampaignLevel);
        }
        initLevelUnits(currentCampaignLevel);
    }, 500);
});
