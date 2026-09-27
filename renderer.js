// =========================================================================
// RENDERER CONTROLLER (UI, HUBS, FLAGS, PATHS, & OVERLAYS)
// =========================================================================

const RendererLog = {
    success: (msg) => console.log(`[SUCCESS][renderer]: ${msg}`)
};

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

    // 2. Sleek Modern Glassmorphism Game Over Card
    if (gameOver) {
        ctx.save();
        ctx.fillStyle = 'rgba(5, 10, 20, 0.78)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let cardW = Math.min(canvas.width * 0.88, 460);
        let cardH = 160;
        let cardX = (canvas.width - cardW) / 2;
        let cardY = (canvas.height - cardH) / 2;
        let cardRadius = 14;

        ctx.shadowColor = 'rgba(59, 130, 246, 0.45)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(cardX + cardRadius, cardY);
        ctx.lineTo(cardX + cardW - cardRadius, cardY);
        ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cardRadius);
        ctx.lineTo(cardX + cardW, cardY + cardH - cardRadius);
        ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - cardRadius, cardY + cardH);
        ctx.lineTo(cardX + cardRadius, cardY + cardH);
        ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cardRadius);
        ctx.lineTo(cardX, cardY + cardRadius);
        ctx.quadraticCurveTo(cardX, cardY, cardX + cardRadius, cardY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.fillText("MISSION STATUS: COMPLETED", canvas.width / 2, cardY + 36);

        let isBlueWin = winnerMessage.includes('BLUE');
        let isRedWin = winnerMessage.includes('RED');
        ctx.fillStyle = isBlueWin ? '#38bdf8' : (isRedWin ? '#f87171' : '#fbbf24');
        
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText(winnerMessage, canvas.width / 2, cardY + 82);

        ctx.fillStyle = '#64748b';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText("🔄 Reloading next tactical deployment...", canvas.width / 2, cardY + 124);
        
        ctx.restore();
        return;
    }

    // 3. Bot Path Overlay
    ctx.save();
    if (window.activeRedBotPath && window.activeRedBotPath.length > 0) {
        window.activeRedBotPath.forEach((tile, index) => {
            let cx = tile.c * cellSize + cellSize / 2;
            let cy = tile.r * cellSize + cellSize / 2;

            ctx.fillStyle = '#ff3333';
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

    // 4. Gold Cores & Capture Flag Animations
    goldCores.forEach(core => {
        let cx = core.c * cellSize + cellSize / 2;
        let cy = core.r * cellSize + cellSize / 2;

        if (core.owner) {
            ctx.fillStyle = core.owner === 'blue' ? '#3498db' : '#e74c3c';
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

                ctx.fillStyle = core.owner === 'blue' ? '#2980b9' : '#c0392b';
                ctx.fillRect(cx - 4, renderY, 8, cellSize * 0.8);
                ctx.fillStyle = '#f1c40f';
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

    // 5. Circular Superunit Power Badges with Stalemate 🔒 Badge Support
    let mapCenterX = canvas.width / 2;
    let mapCenterY = canvas.height / 2;

    ['blue', 'red'].forEach(teamName => {
        let suList = getSuperunitsForTeam(teamName, units);
        suList.forEach(su => {
            let isStalocked = su.units.some(u => isUnitLockedInStalemate(u, units));
            
            // FIX: Do not skip single units if they are locked in a stalemate!
            if (su.units.length <= 1 && su.power !== Infinity && !su.isSpecialSuperunit && !isStalocked) return;

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
            let badgeRadius = 14; // Compact circular badge size

            ctx.fillStyle = '#cc0000';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            let powerDisplay = su.power === Infinity ? '∞' : su.power;
            let lockedText = isStalocked ? ' 🔒' : '';
            
            // Draw circular frame background
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
