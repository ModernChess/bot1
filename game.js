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

const sharedGlassModalStyle = `
    background: rgba(18, 18, 18, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
`;

const sharedTextShadow = `text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);`;

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
            <div id="openAccountModalBtn" style="background: rgba(139, 92, 246, 0.25); border: 1px solid rgba(139, 92, 246, 0.5); padding: 5px 10px; border-radius: 8px; cursor: pointer;" title="View Profile">
                👤 <span style="color: #c084fc;">${cachedUser}</span> [<span id="hudRankVal" style="color: ${currentRank.color};">${currentRank.title}</span>]
            </div>
            <div style="background: rgba(59, 130, 246, 0.25); border: 1px solid rgba(59, 130, 246, 0.5); padding: 5px 10px; border-radius: 8px;">
                STAGE: <span id="hudLevelVal">T1</span> | XP: <span id="hudXpVal">${totalUserXp}</span>
            </div>
            <button id="openLevelSelectBtn" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 10px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">Levels</button>
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
            ${sharedGlassModalStyle} padding: 24px; border-radius: 20px;
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
            ${sharedGlassModalStyle} padding: 24px; border-radius: 20px;
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
        <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px; border-radius: 12px; margin-bottom: 16px; text-align: left; font-size: 12px; line-height: 1.6; color: #ffffff; ${sharedTextShadow}">
            <div>👤 <strong>Username:</strong> <span style="color: #c084fc;">${cachedUser}</span></div>
            <div>🛡️ <strong>Campaign Rank:</strong> <span style="color: ${rank.color}; font-weight: bold;">${rank.title}</span></div>
            <div>⭐ <strong>Total Account XP:</strong> ${totalUserXp} XP</div>
            <div>🎯 <strong>Current Stage:</strong> ${getStageDisplayLabel(currentCampaignLevel)}</div>
        </div>
        <button onclick="toggleAccountModal()" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; width: 100%; padding: 10px; border-radius: 10px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);">Close</button>
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
        <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 16px; ${sharedTextShadow}">Select any level to play freely:</p>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; max-height: 220px; overflow-y: auto; margin-bottom: 16px; padding: 4px;">
    `;

    campaignLevels.forEach(lvl => {
        let isCurrent = lvl.level === currentCampaignLevel;
        let bgColor = isCurrent ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #10b981, #059669)';
        let borderStyle = isCurrent ? '2px solid #93c5fd' : '1px solid rgba(255,255,255,0.1)';

        html += `
            <button onclick="window.loadCampaignLevel(${lvl.level})" style="
                background: ${bgColor}; color: white; border: ${borderStyle}; padding: 10px 0; border-radius: 8px;
                font-weight: 800; font-size: 11px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ">${getStageDisplayLabel(lvl.level)}</button>
        `;
    });

    html += `
        </div>
        <button onclick="toggleLevelSelectModal()" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; width: 100%; padding: 10px; border-radius: 10px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);">Close</button>
    `;
    modal.innerHTML = html;
}
