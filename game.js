// =========================================================================
// CAMPAIGN, ACCOUNT RANK, & CACHE CONTROLLER (game.js)
// Independent Project Version (Standard Script Compatible)
// =========================================================================

const cachedUser = localStorage.getItem('arena_chess_user') || 'GuestPlayer';
let currentCampaignLevel = parseInt(localStorage.getItem(`chess_campaign_level_${cachedUser}`)) || 1;

let totalUserXp = parseInt(localStorage.getItem(`arena_chess_xp_${cachedUser}`)) || parseInt(localStorage.getItem(`chess_campaign_xp_${cachedUser}`)) || 0;

// Gold coins are strictly temporary session state (never saved to localStorage or Firebase)
let userGoldCoins = 2; 

let pendingDeploymentType = null; // 'infantry' or 'tank'

let userAvatar = localStorage.getItem(`chess_campaign_avatar_${cachedUser}`) || localStorage.getItem('arena_chess_avatar') || '😀';
let userFaction = localStorage.getItem(`chess_campaign_faction_${cachedUser}`) || localStorage.getItem('arena_chess_faction') || 'Order';
let userRank = localStorage.getItem(`chess_chess_rank_${cachedUser}`) || localStorage.getItem('arena_chess_rank') || 'Trainee ⭐';

console.log(`[INFO][game.js] Logged into account: ${cachedUser} | Level: ${currentCampaignLevel} | Total Account XP: ${totalUserXp} | Temporary Gold: ${userGoldCoins}`);

function getPlayerRank(xp) {
    if (xp >= 300) return { title: "Grandmaster", color: "#f59e0b" };
    if (xp >= 135) return { title: "Tactician", color: "#8b5cf6" };
    if (xp >= 45) return { title: "Veteran", color: "#3b82f6" };
    return { title: "Recruit", color: "#10b981" };
}

const sharedGlassModalStyle = `
    background: rgba(18, 18, 18, 0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85);
`;

const sharedTextShadow = `text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);`;

function injectCampaignUI() {
    const topBar = document.querySelector('.game-top-bar');
    if (!topBar) return;

    const shopBtn = document.getElementById('shop-btn');
    if (shopBtn) shopBtn.style.display = 'none';

    let campaignHud = document.getElementById('campaignHudContainer');
    if (!campaignHud) {
        campaignHud = document.createElement('div');
        campaignHud.id = 'campaignHudContainer';
        campaignHud.style.cssText = `
            display: flex; 
            align-items: center; 
            gap: 10px; 
            font-size: 12px; 
            font-weight: 700; 
            color: #ffffff; 
            flex-wrap: wrap; 
            ${sharedTextShadow}
        `;
        
        const avatarHTML = (userAvatar && (userAvatar.startsWith('data:image/') || userAvatar.startsWith('http')))
            ? `<img src="${userAvatar}" style="width: 28px; height: 28px; min-width: 28px; min-height: 28px; aspect-ratio: 1 / 1; border-radius: 50%; object-fit: cover; vertical-align: middle;">`
            : `<span style="font-size: 1.2rem; vertical-align: middle;">${userAvatar}</span>`;

        const factionColor = userFaction === 'Order' ? '#00cec9' : '#ff7675';

        campaignHud.innerHTML = `
            <div id="openAccountModalBtn" class="glass-btn" style="display: flex; align-items: center; gap: 6px; cursor: pointer;" title="View Profile">
                <div id="hudAvatarContainer" style="width: 28px; height: 28px; min-width: 28px; min-height: 28px; aspect-ratio: 1 / 1; border-radius: 50%; overflow: hidden; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                    ${avatarHTML}
                </div>
                <span style="color: #c084fc; font-size: 12px;">${cachedUser}</span> 
                <span style="color: ${factionColor}; font-size: 11px;">[${userFaction}]</span>
            </div>
            
            <div class="stage-gradient-hud">
                STAGE: <span id="hudLevelVal">T1</span> | XP: <span id="hudXpVal">${totalUserXp}</span> | 🪙 <span id="hudGoldVal">${userGoldCoins}</span>
            </div>

            <button id="openLevelSelectBtn" class="glass-action-btn">Levels</button>
            <button id="openUnitShopBtn" class="glass-action-btn" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.75), rgba(217, 119, 6, 0.75)); box-shadow: 0 8px 22px rgba(245, 158, 11, 0.4); border-color: rgba(245, 158, 11, 0.4);">Buy Shop Unit</button>
        `;
        topBar.appendChild(campaignHud);

        document.getElementById('openLevelSelectBtn').addEventListener('click', toggleLevelSelectModal);
        document.getElementById('openAccountModalBtn').addEventListener('click', toggleAccountModal);
        document.getElementById('openUnitShopBtn').addEventListener('click', toggleUnitShopModal);
    }

    let fileInput = document.getElementById('globalGameAvatarUpload');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'globalGameAvatarUpload';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', handleGameAvatarUpload);
        document.body.appendChild(fileInput);
    }

    let accModal = document.getElementById('accountProfileModal');
    if (!accModal) {
        accModal = document.createElement('div');
        accModal.id = 'accountProfileModal';
        accModal.style.cssText = `
            display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            ${sharedGlassModalStyle} padding: 24px; border-radius: 20px;
            width: 92%; max-width: 340px; z-index: 100; text-align: center; color: #fff;
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
            width: 92%; max-width: 380px; z-index: 100; text-align: center; color: #fff;
        `;
        document.body.appendChild(modal);
    }
    renderLevelSelectContent();

    let shopModal = document.getElementById('unitShopModal');
    if (!shopModal) {
        shopModal = document.createElement('div');
        shopModal.id = 'unitShopModal';
        shopModal.style.cssText = `
            display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            ${sharedGlassModalStyle} padding: 24px; border-radius: 20px;
            width: 92%; max-width: 320px; z-index: 101; text-align: center; color: #fff;
        `;
        document.body.appendChild(shopModal);
    }
    renderUnitShopContent();

    let deployModal = document.getElementById('deploymentPromptModal');
    if (!deployModal) {
        deployModal = document.createElement('div');
        deployModal.id = 'deploymentPromptModal';
        deployModal.style.cssText = `
            display: none; position: fixed; top: 15%; left: 50%; transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(12px);
            border: 1px solid rgba(245, 158, 11, 0.5); padding: 12px 20px; border-radius: 14px;
            font-weight: bold; font-size: 13px; z-index: 102; color: #fff;
            box-shadow: 0 10px 25px rgba(0,0,0,0.6); text-align: center;
        `;
        document.body.appendChild(deployModal);
    }

    updateHudDisplay();
}

function handleGameAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        userAvatar = event.target.result;
        localStorage.setItem(`chess_campaign_avatar_${cachedUser}`, userAvatar);
        localStorage.setItem('arena_chess_avatar', userAvatar);
        
        renderAccountModalContent();
        let hudContainer = document.getElementById('hudAvatarContainer');
        if (hudContainer) {
            hudContainer.innerHTML = `<img src="${userAvatar}" style="width: 100%; height: 100%; aspect-ratio: 1 / 1; border-radius: 50%; object-fit: cover;">`;
        }
        console.log("[SUCCESS][game.js] Profile avatar updated successfully.");
    };
    reader.readAsDataURL(file);
}

function triggerGameAvatarPicker() {
    const input = document.getElementById('globalGameAvatarUpload');
    if (input) input.click();
}

function getStageDisplayLabel(lvlNum) {
    return lvlNum <= 5 ? `T${lvlNum}` : `${lvlNum - 5}`;
}

function updateHudDisplay() {
    let lvlVal = document.getElementById('hudLevelVal');
    let xpVal = document.getElementById('hudXpVal');
    let goldVal = document.getElementById('hudGoldVal');
    if (lvlVal) lvlVal.innerText = getStageDisplayLabel(currentCampaignLevel);
    if (xpVal) xpVal.innerText = totalUserXp;
    if (goldVal) goldVal.innerText = userGoldCoins;
}

function toggleAccountModal() {
    const modal = document.getElementById('accountProfileModal');
    if (!modal) return;
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function toggleUnitShopModal() {
    const modal = document.getElementById('unitShopModal');
    if (!modal) return;
    renderUnitShopContent();
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

function updateDeploymentPromptUI(unitType, show) {
    let deployModal = document.getElementById('deploymentPromptModal');
    if (!deployModal) return;

    if (show) {
        deployModal.style.display = 'block';
        deployModal.innerHTML = `
            <div style="margin-bottom: 8px; color: #f59e0b;">Deploying: <strong>${unitType.toUpperCase()}</strong></div>
            <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 10px;">Tap a highlighted yellow tile or pinch/pan to look around.</div>
            <button onclick="window.cancelDeploymentMode()" class="glass-action-btn" style="background: rgba(239, 68, 68, 0.8); border-color: rgba(239, 68, 68, 0.5);">Cancel Deployment</button>
        `;
    } else {
        deployModal.style.display = 'none';
    }
}

window.cancelDeploymentMode = function() {
    pendingDeploymentType = null;
    updateDeploymentPromptUI('', false);
};

function renderUnitShopContent() {
    const modal = document.getElementById('unitShopModal');
    if (!modal) return;

    modal.innerHTML = `
        <h3 style="margin-top: 0; color: #f59e0b; text-transform: uppercase; font-size: 16px; font-weight: 800; ${sharedTextShadow}">Unit Store</h3>
        <p style="font-size: 12px; color: #cbd5e1; margin-bottom: 16px; ${sharedTextShadow}">Available Coins: 🪙 <strong>${userGoldCoins}</strong></p>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
            <button onclick="window.buyGameUnit('infantry', 1)" class="glass-btn" style="background: rgba(59, 130, 246, 0.35); border-color: #3b82f6; width: 100%; text-align: left; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: bold;">
                <span>🛡️ Infantry</span>
                <span style="color: #f59e0b;">🪙 1 Gold</span>
            </button>
            <button onclick="window.buyGameUnit('tank', 2)" class="glass-btn" style="background: rgba(239, 68, 68, 0.35); border-color: #ef4444; width: 100%; text-align: left; display: flex; justify-content: space-between; align-items: center; cursor: pointer; font-weight: bold;">
                <span>🚜 Tank</span>
                <span style="color: #f59e0b;">🪙 2 Gold</span>
            </button>
        </div>
        <button onclick="toggleUnitShopModal()" class="glass-action-btn" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.8)); width: 100%;">Close</button>
    `;
}

window.buyGameUnit = function(unitType, cost) {
    if (userGoldCoins < cost) {
        alert("Not enough gold coins!");
        return;
    }
    userGoldCoins -= cost; // Temporary session decrease
    updateHudDisplay();

    const shopModal = document.getElementById('unitShopModal');
    if (shopModal) shopModal.style.display = 'none';

    pendingDeploymentType = unitType;
    updateDeploymentPromptUI(unitType, true);
};

function renderAccountModalContent() {
    const modal = document.getElementById('accountProfileModal');
    if (!modal) return;
    let rank = getPlayerRank(totalUserXp);
    let factionColor = userFaction === 'Order' ? '#00cec9' : '#ff7675';

    const profileAvatarHTML = (userAvatar && (userAvatar.startsWith('data:image/') || userAvatar.startsWith('http')))
        ? `<img src="${userAvatar}" style="width: 100%; height: 100%; aspect-ratio: 1 / 1; border-radius: 50%; object-fit: cover;">`
        : `<span style="font-size: 34px;">${userAvatar}</span>`;

    modal.innerHTML = `
        <h3 style="margin-top: 0; color: #3b82f6; text-transform: uppercase; font-size: 16px; font-weight: 800; ${sharedTextShadow}">Player Profile</h3>
        
        <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 16px;">
            <div style="width: 68px; height: 68px; min-width: 68px; min-height: 68px; aspect-ratio: 1 / 1; border-radius: 50%; overflow: hidden; border: 2px solid #8b5cf6; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(139,92,246,0.3);">
                ${profileAvatarHTML}
            </div>
            <button onclick="triggerGameAvatarPicker()" class="glass-btn" style="color: #c084fc; font-size: 12px; font-weight: 700; cursor: pointer;">📷 Change Avatar</button>
        </div>

        <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); padding: 14px; border-radius: 12px; margin-bottom: 16px; text-align: left; font-size: 13px; line-height: 1.6; color: #ffffff; ${sharedTextShadow}">
            <div>👤 <strong>Username:</strong> <span style="color: #c084fc;">${cachedUser}</span></div>
            <div>🛡️ <strong>Faction:</strong> <span style="color: ${factionColor}; font-weight: bold;">${userFaction}</span></div>
            <div>⭐ <strong>Class Rank:</strong> <span style="color: #00cec9; font-weight: bold;">${userRank}</span></div>
            <div>🏆 <strong>Campaign Rank:</strong> <span style="color: ${rank.color}; font-weight: bold;">${rank.title}</span></div>
            <div>⚡ <strong>Total Account XP:</strong> ${totalUserXp} XP</div>
            <div>🪙 <strong>Gold Coins:</strong> ${userGoldCoins} (Temporary)</div>
            <div>🎯 <strong>Current Stage:</strong> ${getStageDisplayLabel(currentCampaignLevel)}</div>
        </div>
        <button onclick="toggleAccountModal()" class="glass-action-btn" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.8)); width: 100%;">Close</button>
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
        <h3 style="margin-top: 0; color: #8b5cf6; text-transform: uppercase; font-size: 16px; font-weight: 800; ${sharedTextShadow}">Campaign & Tutorials (Test Mode)</h3>
        <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 14px; ${sharedTextShadow}">Select any level to play freely:</p>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; max-height: 220px; overflow-y: auto; margin-bottom: 16px; padding: 4px;">
    `;

    if (typeof campaignLevels !== 'undefined' && Array.isArray(campaignLevels)) {
        campaignLevels.forEach(lvl => {
            let isCurrent = lvl.level === currentCampaignLevel;
            let bgColor = isCurrent ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #10b981, #059669)';
            let borderStyle = isCurrent ? '2px solid #93c5fd' : '1px solid rgba(255,255,255,0.15)';

            html += `
                <button onclick="window.loadCampaignLevel(${lvl.level})" style="
                    background: ${bgColor}; color: white; border: ${borderStyle}; padding: 10px 0; border-radius: 8px;
                    font-weight: 800; font-size: 12px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                ">${getStageDisplayLabel(lvl.level)}</button>
            `;
        });
    }

    html += `
        </div>
        <button onclick="toggleLevelSelectModal()" class="glass-action-btn" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.8)); width: 100%;">Close</button>
    `;
    modal.innerHTML = html;
}

window.injectCampaignUI = injectCampaignUI;
window.triggerGameAvatarPicker = triggerGameAvatarPicker;
window.toggleAccountModal = toggleAccountModal;
window.toggleLevelSelectModal = toggleLevelSelectModal;
window.toggleUnitShopModal = toggleUnitShopModal;
window.updateDeploymentPromptUI = updateDeploymentPromptUI;

