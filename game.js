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

const sharedUiBgStyle = `
    background-image: url('https://raw.githubusercontent.com/ModernChess/assets-images/main/uiback.png');
    background-size: 100% 100%;
    background-position: center;
    background-repeat: no-repeat;
    border: none;
    box-shadow: none;
`;

const sharedTextShadow = `text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.8), 1px -1px 2px rgba(0, 0, 0, 0.8), -1px 1px 2px rgba(0, 0, 0, 0.8);`;

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
        campaignHud.style.cssText = `display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: #ffffff; ${sharedTextShadow}`;
        
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
            ${sharedUiBgStyle} padding: 20px; border-radius: 14px;
            width: 90%; max-width: 320px; z-index: 100; text-align: center; color: #fff;
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
            ${sharedUiBgStyle} padding: 20px; border-radius: 14px;
            width: 90%; max-width: 380px; z-index: 100; text-align: center; color: #fff;
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
        <h3 style="margin-top: 0; color: #3b82f6; text-transform: uppercase; font-size: 15px; font-weight: 800; ${sharedTextShadow}">Player Profile</h3>
        <div style="background: rgba(15, 23, 42, 0.75); padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: left; font-size: 12px; line-height: 1.6; color: #ffffff; ${sharedTextShadow}">
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
        <h3 style="margin-top: 0; color: #8b5cf6; text-transform: uppercase; font-size: 15px; font-weight: 800; ${sharedTextShadow}">Campaign & Tutorials (Test Mode)</h3>
        <p style="color: #e0e0e0; font-size: 12px; margin-bottom: 15px; ${sharedTextShadow}">Select any level to play freely:</p>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; max-height: 220px; overflow-y: auto; margin-bottom: 15px; padding: 4px;">
    `;

    campaignLevels.forEach(lvl => {
        let isCurrent = lvl.level === currentCampaignLevel;
        
        let bgColor = isCurrent ? '#3b82f6' : '#10b981';
        let borderStyle = isCurrent ? '2px solid #93c5fd' : 'none';
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
