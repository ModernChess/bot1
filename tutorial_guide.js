// =========================================================================
// TUTORIAL GUIDE & CHAT CLOUD SYSTEM (tutorial_guide.js)
// Active battlefield scanner, chat cloud UI, and dynamic path/target arrows
// =========================================================================

const TutorialGuide = {
    active: false,
    currentStepText: "",
    targetUnitName: null,
    targetPosition: null,
    stageMessagesAssigned: {}, // Cache random messages per session/stage load
    dashOffset: 0,            // Animation offset for dash/orbiting effect

    init() {
        this.injectChatCloudDOM();
    },

    injectChatCloudDOM() {
        if (document.getElementById('tutorialChatCloud')) return;

        const cloud = document.createElement('div');
        cloud.id = 'tutorialChatCloud';
        cloud.style.cssText = `
            display: none;
            position: relative;
            margin: 6px auto 4px auto;
            background: rgba(18, 18, 18, 0.85);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(59, 130, 246, 0.4);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            padding: 8px 12px;
            border-radius: 10px;
            color: #ffffff;
            font-family: 'Poppins', 'Segoe UI', sans-serif;
            font-size: 11px;
            font-weight: 600;
            z-index: 99;
            max-width: 480px;
            width: 95%;
            text-align: center;
            pointer-events: none;
            box-sizing: border-box;
            transition: all 0.3s ease;
        `;
        cloud.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 2px;">
                <span style="font-size: 13px;">🏁</span>
                <span style="color: #60a5fa; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; font-weight: 800;">Battle Trainer</span>
            </div>
            <div id="tutorialCloudMessage" style="line-height: 1.35; text-shadow: 0 2px 4px rgba(0,0,0,0.6);"></div>
        `;

        // Append the cloud right below the board's outer frame container
        const boardOuterFrame = document.querySelector('.board-outer-frame');
        if (boardOuterFrame && boardOuterFrame.parentNode) {
            boardOuterFrame.parentNode.insertBefore(cloud, boardOuterFrame.nextSibling);
        } else {
            document.body.appendChild(cloud);
        }
    },

    getRandomMessageForStage(level, stageNum) {
        if (this.stageMessagesAssigned[level]) {
            return this.stageMessagesAssigned[level];
        }
        const pool = [
            `Stage (${stageNum}): "Watch out! Your team is spread out. Move them together before the bad guys surround you!"`,
            `Stage (${stageNum}): "Look out! Big enemy tanks are coming! Get your team ready to fight!"`,
            `Stage (${stageNum}): "Alert! A super strong enemy is blocking the way. Be careful as you move!"`,
            `Stage (${stageNum}): "Quick! Bring helper units to the front line so your team doesn't lose!"`
        ];
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        this.stageMessagesAssigned[level] = chosen;
        return chosen;
    },

    // Helper to determine if a unit is stalemated or disabled
    isUnitStalemated(unit) {
        if (!unit) return true;
        if (unit.isStalemated || unit.stalemated || unit.locked || unit.isLocked || unit.frozen) {
            return true;
        }
        if (typeof unit.movesLeft !== 'undefined' && unit.movesLeft <= 0) {
            return true;
        }
        return false;
    },

    update() {
        const cloudEl = document.getElementById('tutorialChatCloud');
        const msgEl = document.getElementById('tutorialCloudMessage');

        if (!cloudEl || !msgEl) return;

        if (typeof currentCampaignLevel !== 'undefined' && ((currentCampaignLevel >= 1 && currentCampaignLevel <= 5) || (currentCampaignLevel >= 6 && currentCampaignLevel <= 20))) {
            cloudEl.style.display = 'block';
            this.active = true;

            if (currentCampaignLevel === 1) {
                this.currentStepText = "Tutorial (1): \"Welcome! Zoom in and tap your Infantry soldier to select him. He can move up to 2 tiles at a time. Green outlines mean it's your turn to play. Follow the red line to reach the base!\"";
                this.targetPosition = { c: 17, r: 0 }; 
                this.targetUnitName = null;
            } else if (currentCampaignLevel === 2) {
                this.currentStepText = "Tutorial (2): \"Great job! Tanks are faster and can move 3 tiles at once. Tap your Tank, follow the red markers, and drive straight to the enemy base!\"";
                this.targetPosition = { c: 17, r: 0 }; 
                this.targetUnitName = null;
            } else if (currentCampaignLevel === 3) {
                this.currentStepText = "Tutorial (3): \"Time to fight! Drive your Tank toward the red enemy soldier. Red movement dots mean moving there will start a battle!\"";
                const enemyInfantry = typeof units !== 'undefined' ? units.find(u => u.team === 'red' && u.name === 'Infantry') : null;
                if (enemyInfantry) {
                    this.targetPosition = { c: enemyInfantry.gridX, r: enemyInfantry.gridY };
                    this.targetUnitName = 'Infantry';
                }
            } else if (currentCampaignLevel === 4) {
                this.currentStepText = "Tutorial (4): \"Teaming up makes you stronger! One soldier needs help to defeat the enemy. Move a second soldier next to him—bright cyan dots show where your team joins together! Look for lock (🔒) icons to see who needs help!\"";
                const redInfantries = typeof units !== 'undefined' ? units.filter(u => u.team === 'red' && u.name === 'Infantry') : [];
                if (redInfantries.length > 0) {
                    let targetInf = redInfantries[0];
                    let minDist = Infinity;
                    redInfantries.forEach(inf => {
                        let dist = Math.max(Math.abs(inf.gridX - 0), Math.abs(inf.gridY - 11));
                        if (dist < minDist) {
                            minDist = dist;
                            targetInf = inf;
                        }
                    });
                    this.targetPosition = { c: targetInf.gridX, r: targetInf.gridY };
                    this.targetUnitName = 'Infantry';
                }
            } else if (currentCampaignLevel === 5) {
                this.currentStepText = "Tutorial (5): \"You know all the basic moves now! Finish the battle goals and stay safe!\"";
                const redTanks = typeof units !== 'undefined' ? units.filter(u => u.team === 'red' && u.name === 'Tank') : [];
                if (redTanks.length > 0) {
                    let targetTank = redTanks[0];
                    let minDist = Infinity;
                    redTanks.forEach(tank => {
                        let dist = Math.max(Math.abs(tank.gridX - 0), Math.abs(tank.gridY - 11));
                        if (dist < minDist) {
                            minDist = dist;
                            targetTank = tank;
                        }
                    });
                    this.targetPosition = { c: targetTank.gridX, r: targetTank.gridY };
                    this.targetUnitName = 'Tank';
                }
            } else {
                const stageNum = currentCampaignLevel - 5;
                this.targetPosition = { c: 11, r: 0 }; 
                this.targetUnitName = null;

                if (stageNum === 1) {
                    this.currentStepText = `Stage (1): "Sneak around the red enemies and reach the enemy base first to win!"`;
                } else if (stageNum === 2) {
                    this.currentStepText = `Stage (2): "Go around the bad guys and capture their castle before time runs out!"`;
                } else if (stageNum === 3) {
                    this.currentStepText = `Stage (3): "Be careful! The enemy tank is super fast and powerful. Stay close to your friends!"`;
                } else if (stageNum === 4) {
                    this.currentStepText = `Stage (4): "Use your tank to block the enemy tanks and help your trapped friends!"`;
                } else if (stageNum === 5) {
                    this.currentStepText = `Stage (5): "Send your big tank to break the enemy lock and rescue your team!"`;
                } else if (stageNum === 6) {
                    this.currentStepText = `Stage (6): "Your team is spread out everywhere! Think carefully to bring them together and win!"`;
                } else if (stageNum === 7) {
                    this.currentStepText = `Stage (7): "Warning! Three enemy tanks are coming right at you! Play safe and defend!"`;
                } else if (stageNum === 8) {
                    this.currentStepText = `Stage (8): "The bad guys are scattered. Attack together and take over the board!"`;
                } else {
                    this.currentStepText = this.getRandomMessageForStage(currentCampaignLevel, stageNum);
                }
            }

            if (currentCampaignLevel >= 6) {
                if (typeof units !== 'undefined' && typeof findPathToTarget === 'function') {
                    const blueUnit = units.find(u => u.team === 'blue');
                    if (blueUnit) {
                        let unitPowerMap = new Map();
                        if (typeof buildSuperpowerCache === 'function') {
                            let cacheRes = buildSuperpowerCache(units);
                            unitPowerMap = cacheRes.unitPowerMap;
                        }
                        window.activeRedBotPath = findPathToTarget(blueUnit, 11, 0, unitPowerMap, [], true) || [];
                    }
                }
            }

            msgEl.innerText = this.currentStepText;
        } else {
            cloudEl.style.display = 'none';
            this.active = false;
            this.targetPosition = null;
            this.targetUnitName = null;
        }
    },

    renderBattlefieldOverlays(ctx) {
        if (!this.active) return;

        // Increment dash offset for continuous orbiting animation
        this.dashOffset = (this.dashOffset - 0.5) % 32;

        if (this.targetPosition) {
            let targetX = this.targetPosition.c * cellSize + cellSize / 2;
            let targetY = this.targetPosition.r * cellSize + cellSize / 2;

            // Pulse animation formula for scaling size slightly larger/smaller over time
            let pulseFactor = Math.sin(Date.now() / 250) * 0.15 + 0.65;
            let currentRadius = cellSize * pulseFactor;

            // 1. Dynamic Orbiting Dot-Dash Red Target Ring
            ctx.save();
            ctx.strokeStyle = '#ef4444';
            ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
            ctx.lineWidth = 3.5;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            
            ctx.setLineDash([8, 6, 2, 6]);
            ctx.lineDashOffset = this.dashOffset;

            ctx.beginPath();
            ctx.arc(targetX, targetY, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // 2. Animated Arrow from Active (Non-Stalemated) Unit to Target (Tutorials 3, 4, and 5)
            if (typeof currentCampaignLevel !== 'undefined' && (currentCampaignLevel === 3 || currentCampaignLevel === 4 || currentCampaignLevel === 5)) {
                let sourceUnit = null;

                // Priority: Selected active unit > Closest non-stalemated Blue team unit
                if (typeof selectedUnit !== 'undefined' && selectedUnit && selectedUnit.team === 'blue' && !this.isUnitStalemated(selectedUnit)) {
                    sourceUnit = selectedUnit;
                } else if (typeof units !== 'undefined') {
                    let validBlueUnits = units.filter(u => u.team === 'blue' && !this.isUnitStalemated(u));
                    
                    validBlueUnits.sort((a, b) => {
                        let distA = Math.hypot(a.gridX - this.targetPosition.c, a.gridY - this.targetPosition.r);
                        let distB = Math.hypot(b.gridX - this.targetPosition.c, b.gridY - this.targetPosition.r);
                        return distA - distB;
                    });

                    if (validBlueUnits.length > 0) {
                        sourceUnit = validBlueUnits[0];
                    }
                }

                if (sourceUnit) {
                    let startX = (sourceUnit.renderX !== undefined ? sourceUnit.renderX : sourceUnit.gridX * cellSize) + cellSize / 2;
                    let startY = (sourceUnit.renderY !== undefined ? sourceUnit.renderY : sourceUnit.gridY * cellSize) + cellSize / 2;

                    ctx.save();
                    ctx.strokeStyle = '#ef4444';
                    ctx.fillStyle = '#ef4444';
                    ctx.lineWidth = 4;
                    ctx.shadowColor = '#ef4444';
                    ctx.shadowBlur = 8;
                    
                    // Animated dashed pointing line
                    ctx.setLineDash([10, 6]);
                    ctx.lineDashOffset = this.dashOffset;

                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(targetX, targetY);
                    ctx.stroke();

                    // Solid Arrowhead pointed directly at target
                    let angle = Math.atan2(targetY - startY, targetX - startX);
                    let arrowLength = 16;
                    
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.moveTo(targetX, targetY);
                    ctx.lineTo(targetX - arrowLength * Math.cos(angle - Math.PI / 6), targetY - arrowLength * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(targetX - arrowLength * Math.cos(angle + Math.PI / 6), targetY - arrowLength * Math.sin(angle + Math.PI / 6));
                    ctx.lineTo(targetX, targetY);
                    ctx.fill();

                    ctx.restore();
                }
            }
        }
    }
};

window.addEventListener('load', () => {
    TutorialGuide.init();
});

setInterval(() => {
    TutorialGuide.update();
}, 250);
