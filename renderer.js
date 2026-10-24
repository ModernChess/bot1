// =========================================================================
// RENDERER CONTROLLER (UI, HUBS, FLAGS, PATHS, & OVERLAYS)
// =========================================================================

const RendererLog = {
    success: (msg) => console.log(`[SUCCESS][renderer]: ${msg}`)
};

// State trackers for the 5-second match end wait
let matchEndTimerStarted = false;
let matchEndCountdown = 5;
let matchEndIntervalRef = null;

// Initialize independent HTML DOM Game Over Overlay with Blur and Loading Button
function initGameOverDOMOverlay() {
    if (document.getElementById('gameOverModalOverlay')) return;
    
    // Create full-screen general background blur container
    const backdropBlur = document.createElement('div');
    backdropBlur.id = 'matchEndBlurBackdrop';
    backdropBlur.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        background: rgba(0, 0, 0, 0.55);
        z-index: 999998;
    `;
    document.body.appendChild(backdropBlur);

    const overlay = document.createElement('div');
    overlay.id = 'gameOverModalOverlay';
    overlay.style.cssText = `
        display: none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(18, 18, 18, 0.92);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1.5px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
        padding: 24px;
        border-radius: 16px;
        color: #fff;
        z-index: 999999;
        width: 90%;
        max-width: 420px;
        text-align: center;
        font-family: 'Poppins', 'Segoe UI', sans-serif;
    `;
    overlay.innerHTML = `
        <div style="font-size: 11px; font-weight: bold; color: #b0b0b0; letter-spacing: 1px; margin-bottom: 8px;">MISSION STATUS: COMPLETED</div>
        <div id="gameOverMessageText" style="font-size: 14px; font-weight: bold; margin-bottom: 16px; text-shadow: 0 2px 4px rgba(0,0,0,0.6);"></div>
        
        <!-- Loading Button with Spinner -->
        <div id="matchEndLoadingContainer" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(59, 130, 246, 0.25); border: 1px solid rgba(59, 130, 246, 0.5); padding: 10px; border-radius: 8px; margin-bottom: 8px;">
            <div style="width: 14px; height: 14px; border: 2px solid #38bdf8; border-top: 2px solid transparent; border-radius: 50%; animation: spinLoader 0.8s linear infinite;"></div>
            <span id="matchEndLoadingText" style="font-size: 11px; font-weight: 800; color: #38bdf8;">Loading next deployment in 5s...</span>
        </div>
    `;
    document.body.appendChild(overlay);

    // Inject spinner keyframes style if not present
    if (!document.getElementById('spinnerKeyframes')) {
        const style = document.createElement('style');
        style.id = 'spinnerKeyframes';
        style.innerHTML = `@keyframes spinLoader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
    }
}

window.addEventListener('load', () => {
    initGameOverDOMOverlay();
});

function drawTeamUIAndFlags() {
    let now = performance.now();

    // Synchronize external HTML DOM match XP bar & Turn Badge elements
    let turnBadgeEl = document.getElementById('external-turn-badge');
    if (turnBadgeEl) {
        let turnText = `● TURN: ${currentTurn.toUpperCase()}`;
        turnBadgeEl.innerText = turnText;
        turnBadgeEl.style.color = currentTurn === 'blue' ? '#3b82f6' : '#ef4444';
        turnBadgeEl.style.borderColor = currentTurn === 'blue' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    }

    let xpTextEl = document.getElementById('xp-title-text');
    let xpFillEl = document.getElementById('xp-progress-fill');
    if (xpTextEl && xpFillEl) {
        xpTextEl.innerText = `⚡ BLUE MATCH XP: ${humanMatchXp} / ${humanXpMax} (LVL ${humanLevel})`;
        let progressRatio = Math.min((humanMatchXp / humanXpMax) * 100, 100);
        xpFillEl.style.width = `${progressRatio}%`;
    }

    // Independent DOM-based Game Over / Victory Modal Toggle with 5-Second Wait & Blur Backdrop
    initGameOverDOMOverlay();
    let blurBackdrop = document.getElementById('matchEndBlurBackdrop');
    let gameOverModal = document.getElementById('gameOverModalOverlay');
    let gameOverText = document.getElementById('gameOverMessageText');
    let loadingTextEl = document.getElementById('matchEndLoadingText');

    if (gameOver) {
        if (blurBackdrop) blurBackdrop.style.display = 'block';
        if (gameOverModal && gameOverText) {
            gameOverModal.style.display = 'block';
            gameOverText.innerText = winnerMessage;

            let isBlueWin = winnerMessage.includes('BLUE');
            let isRedWin = winnerMessage.includes('RED');
            gameOverText.style.color = isBlueWin ? '#38bdf8' : (isRedWin ? '#f87171' : '#fbbf24');

            // Trigger the 5-second countdown timer once per match end
            if (!matchEndTimerStarted) {
                matchEndTimerStarted = true;
                matchEndCountdown = 5;
                if (loadingTextEl) loadingTextEl.innerText = `Loading next deployment in ${matchEndCountdown}s...`;

                if (matchEndIntervalRef) clearInterval(matchEndIntervalRef);
                matchEndIntervalRef = setInterval(() => {
                    matchEndCountdown--;
                    if (matchEndCountdown > 0) {
                        if (loadingTextEl) loadingTextEl.innerText = `Loading next deployment in ${matchEndCountdown}s...`;
                    } else {
                        clearInterval(matchEndIntervalRef);
                        matchEndIntervalRef = null;
                        if (loadingTextEl) loadingTextEl.innerText = `Deployment reloading...`;
                    }
                }, 1000);
            }
        }
        return;
    } else {
        // Reset state when game restarts or continues
        matchEndTimerStarted = false;
        if (matchEndIntervalRef) {
            clearInterval(matchEndIntervalRef);
            matchEndIntervalRef = null;
        }
        if (blurBackdrop) blurBackdrop.style.display = 'none';
        if (gameOverModal) {
            gameOverModal.style.display = 'none';
        }
    }

    // Bot Path Overlay
    ctx.save();
    if (window.activeRedBotPath && window.activeRedBotPath.length > 0) {
        window.activeRedBotPath.forEach((tile, index) => {
            let cx = tile.c * cellSize + cellSize / 2;
            let cy = tile.r * cellSize + cellSize / 2;

            ctx.fillStyle = '#ef4444';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.arc(cx, cy, cellSize * 0.22, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(index + 1, cx, cy);
        });
    }

    // Gold Cores & Capture Flag Animations
    goldCores.forEach(core => {
        let cx = core.c * cellSize + cellSize / 2;
        let cy = core.r * cellSize + cellSize / 2;

        if (core.owner) {
            ctx.fillStyle = core.owner === 'blue' ? '#3b82f6' : '#ef4444';
            ctx.beginPath();
            ctx.arc(cx, cy, cellSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
        }

        if (flagAnimations[core.id]) {
            let elapsed = now - flagAnimations[core.id];
            let duration = 500;
            if (elapsed < duration) {
                let progress = elapsed / duration;
                let dropOffset = (1 - Math.cos(progress * Math.PI * 0.5)) * (cellSize * 1.5);
                let renderY = cy - (cellSize * 1.5) + dropOffset;

                ctx.fillStyle = core.owner === 'blue' ? '#2563eb' : '#dc2626';
                ctx.fillRect(cx - 4, renderY, 8, cellSize * 0.8);
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.moveTo(cx + 4, renderY);
                ctx.lineTo(cx + 16, renderY + 6);
                ctx.lineTo(cx + 4, renderY + 12);
                ctx.fill();
            } else {
                delete flagAnimations[core.id];
            }
        }
    });

    // Circular Superunit Power Badges with Stalemate 🔒 Badge Support
    let mapCenterX = canvas.width / 2;
    let mapCenterY = canvas.height / 2;

    ['blue', 'red'].forEach(teamName => {
        let suList = getSuperunitsForTeam(teamName, units);
        suList.forEach(su => {
            let isStalocked = su.units.some(u => isUnitLockedInStalemate(u, units));
            
            if (su.units.length <= 1 && su.power !== Infinity && !su.isSpecialSuperunit && !isStalocked) return;

            // Use grid-safe coordinate fallbacks to ensure red units are never skipped or treated as invisible
            let avgX = su.units.reduce((sum, u) => sum + (u.renderX !== undefined ? u.renderX : u.gridX * cellSize), 0) / su.units.length;
            let avgY = su.units.reduce((sum, u) => sum + (u.renderY !== undefined ? u.renderY : u.gridY * cellSize), 0) / su.units.length;

            if (su.isSpecialSuperunit && su.core) {
                avgX = (avgX + su.core.c * cellSize) / 2;
                avgY = (avgY + su.core.r * cellSize) / 2;
            }

            let unitCenterX = avgX + cellSize / 2;
            let unitCenterY = avgY + cellSize / 2;

            let dirX = mapCenterX - unitCenterX;
            let dirY = mapCenterY - unitCenterY;
            let length = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
            
            let significantDistance = cellSize * 1.8;
            let offsetX = (dirX / length) * significantDistance;
            let offsetY = (dirY / length) * significantDistance;

            let badgeCenterX = unitCenterX + offsetX;
            let badgeCenterY = unitCenterY + offsetY;
            let badgeRadius = 14;

            ctx.fillStyle = '#ef4444';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            let powerDisplay = su.power === Infinity ? '∞' : su.power;
            let lockedText = isStalocked ? ' 🔒' : '';
            
            ctx.beginPath();
            ctx.arc(badgeCenterX, badgeCenterY, badgeRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.fillText(`${powerDisplay}${lockedText}`, badgeCenterX, badgeCenterY);
        });
    });
    ctx.restore();
}

RendererLog.success("Renderer controller file successfully loaded.");
