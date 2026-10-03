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

    init() {
        this.injectChatCloudDOM();
    },

    injectChatCloudDOM() {
        if (document.getElementById('tutorialChatCloud')) return;

        const cloud = document.createElement('div');
        cloud.id = 'tutorialChatCloud';
        cloud.style.cssText = `
            display: none;
            position: fixed;
            bottom: 85px; /* Shifted higher up to prevent overlap with bottom console/panels */
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.95);
            border: 2px solid #3b82f6;
            box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
            padding: 14px 20px;
            border-radius: 12px;
            color: #ffffff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            font-weight: 700;
            z-index: 99999; /* Increased z-index to stay on top of everything */
            max-width: 440px;
            width: 90%;
            text-align: center;
            pointer-events: none;
            transition: all 0.3s ease;
        `;
        cloud.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 16px;">🤖</span>
                <span style="color: #60a5fa; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Tactical AI Advisor</span>
            </div>
            <div id="tutorialCloudMessage" style="line-height: 1.4; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);"></div>
        `;
        document.body.appendChild(cloud);
    },

    getRandomMessageForStage(level, stageNum) {
        if (this.stageMessagesAssigned[level]) {
            return this.stageMessagesAssigned[level];
        }
        const pool = [
            `Stage (${stageNum}): "Your units are scattered everywhere—can you successfully unite them before it's too late?!"`,
            `Stage (${stageNum}): "Whoa, that's a massive wave of enemy armor! Do you have what it takes to crush them?"`,
            `Stage (${stageNum}): "High alert! A heavily fortified elite enemy force is blocking your path. Proceed with caution!"`,
            `Stage (${stageNum}): "Critical situation! Will you be able to reinforce your frontline units in time to hold the line?"`
        ];
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        this.stageMessagesAssigned[level] = chosen;
        return chosen;
    },

    update() {
        const cloudEl = document.getElementById('tutorialChatCloud');
        const msgEl = document.getElementById('tutorialCloudMessage');

        if (!cloudEl || !msgEl) return;

        // Active for Tutorials 1 to 5, and Stages 1 to 15 (levels 6 through 20)
        if (typeof currentCampaignLevel !== 'undefined' && ((currentCampaignLevel >= 1 && currentCampaignLevel <= 5) || (currentCampaignLevel >= 6 && currentCampaignLevel <= 20))) {
            cloudEl.style.display = 'block';
            this.active = true;

            if (currentCampaignLevel === 1) {
                this.currentStepText = "Tutorial (1): \"Zoom in to properly select the unit and select which tile to move to! Follow the glowing red pathfinders toward the base.\"";
                this.targetPosition = { c: 17, r: 0 }; // Red base coordinate from info.js
                this.targetUnitName = null;
            } else if (currentCampaignLevel === 2) {
                this.currentStepText = "Tutorial (2): \"Keep up the momentum! Follow the pathfinder markers toward the base and maneuver your heavy tank forward.\"";
                this.targetPosition = { c: 17, r: 0 }; 
                this.targetUnitName = null;
            } else if (currentCampaignLevel === 3) {
                this.currentStepText = "Tutorial (3): \"Enemy contact! Direct your tank straight toward the opposing infantry and eliminate them.\"";
                // Scan for enemy infantry on the battlefield
                const enemyInfantry = typeof units !== 'undefined' ? units.find(u => u.team === 'red' && u.name === 'Infantry') : null;
                if (enemyInfantry) {
                    this.targetPosition = { c: enemyInfantry.gridX, r: enemyInfantry.gridY };
                    this.targetUnitName = 'Infantry';
                }
            } else if (currentCampaignLevel === 4) {
                this.currentStepText = "Tutorial (4): \"Coordinate your assault! Note that the 🔒 symbol indicates a locked unit. Join forces with your secondary unit to break the deadlock and destroy the target!\"";
                // Scan for enemy infantry and target the one closest to the blue base (c: 0, r: 11)
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
                this.currentStepText = "Tutorial (5): \"Heavy armor incoming! The 🔒 symbol marks a locked asset. Synchronize your strike with companion units to pierce their defenses and obliterate them!\"";
                // Scan for enemy tanks and target the one closest to the blue base (c: 0, r: 11)
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
                // Campaign Stages (Levels 6 to 20 map precisely to Stages 1 to 15)
                const stageNum = currentCampaignLevel - 5;
                this.targetPosition = { c: 11, r: 0 }; 
                this.targetUnitName = null;

                if (stageNum === 1) {
                    this.currentStepText = `Stage (1): "Sidestep hostile red units with clever outmaneuvering to secure the primary objective. Beat them to the enemy base first!"`;
                } else if (stageNum === 2) {
                    this.currentStepText = `Stage (2): "Exploit the terrain flanks, slip past hostile patrols, and claim the enemy stronghold before time runs out!"`;
                } else if (stageNum === 3) {
                    this.currentStepText = `Stage (3): "Warning! That hostile tank is extremely fast and devastatingly powerful. Keep your formations tight and stick together!"`;
                } else if (stageNum === 4) {
                    this.currentStepText = `Stage (4): "Intercept and halt the approaching enemy armor with your own tank, and execute tactical maneuvers to free your locked assets!"`;
                } else if (stageNum === 5) {
                    this.currentStepText = `Stage (5): "Deploy your frontline tank to intercept the threat and smash through the security locks holding your forces back!"`;
                } else if (stageNum === 6) {
                    this.currentStepText = `Stage (6): "Your forces are completely scattered across the grid. Execute precise, strategic plays to survive this chaos!"`;
                } else if (stageNum === 7) {
                    this.currentStepText = `Stage (7): "Hostile alert: Three enemy tanks are closing in on your position simultaneously. Play it safe and prioritize defense!"`;
                } else if (stageNum === 8) {
                    this.currentStepText = `Stage (8): "You are facing a heavily scattered enemy vanguard. Plan your counter-offensive and conquer the battlefield!"`;
                } else {
                    // Stages 9 through 15 (Levels 14 through 20) with dynamically synced stage numbers in the randomized text
                    this.currentStepText = this.getRandomMessageForStage(currentCampaignLevel, stageNum);
                }
            }

            // Apply shared pathfinder calculation for all Stages (Level 6 and above)
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

        // TUTORIAL 3, 4 & 5: Scan units and highlight target with a thicker, dark green outline
        if (typeof currentCampaignLevel !== 'undefined' && (currentCampaignLevel >= 3 && currentCampaignLevel <= 5)) {
            if (typeof units !== 'undefined' && this.targetUnitName) {
                units.forEach(u => {
                    if (u.team === 'red' && u.name === this.targetUnitName) {
                        let rx = u.renderX !== undefined ? u.renderX : u.gridX * cellSize;
                        let ry = u.renderY !== undefined ? u.renderY : u.gridY * cellSize;

                        ctx.save();
                        ctx.strokeStyle = '#15803d'; // Dark green outline
                        ctx.lineWidth = 6;           // Increased thickness
                        ctx.shadowColor = '#15803d';
                        ctx.shadowBlur = 12;
                        ctx.strokeRect(rx + 2, ry + 2, cellSize - 4, cellSize - 4);
                        ctx.restore();
                    }
                });
            }
        }

        // Draw red target circles for Tutorials and Stages pathfinder markers
        if (this.targetPosition) {
            let targetX = this.targetPosition.c * cellSize + cellSize / 2;
            let targetY = this.targetPosition.r * cellSize + cellSize / 2;

            ctx.save();
            ctx.strokeStyle = '#ef4444'; // Red circle indicator
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(targetX, targetY, cellSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // TUTORIAL 3, 4 & 5 ONLY: Draw the green directional guidance arrow
            if (typeof currentCampaignLevel !== 'undefined' && (currentCampaignLevel >= 3 && currentCampaignLevel <= 5)) {
                if (typeof selectedUnit !== 'undefined' && selectedUnit) {
                    let startX = (selectedUnit.renderX !== undefined ? selectedUnit.renderX : selectedUnit.gridX * cellSize) + cellSize / 2;
                    let startY = (selectedUnit.renderY !== undefined ? selectedUnit.renderY : selectedUnit.gridY * cellSize) + cellSize / 2;

                    ctx.save();
                    ctx.strokeStyle = '#15803d'; // Dark green line
                    ctx.fillStyle = '#15803d';   // Dark green arrow head
                    ctx.lineWidth = 6;           // Increased thickness
                    ctx.setLineDash([8, 8]);

                    // Draw dashed guidance line
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(targetX, targetY);
                    ctx.stroke();

                    // Draw arrow head
                    let angle = Math.atan2(targetY - startY, targetX - startX);
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.moveTo(targetX, targetY);
                    ctx.lineTo(targetX - 16 * Math.cos(angle - Math.PI / 6), targetY - 16 * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(targetX - 16 * Math.cos(angle + Math.PI / 6), targetY - 16 * Math.sin(angle + Math.PI / 6));
                    ctx.lineTo(targetX, targetY);
                    ctx.fill();

                    ctx.restore();
                }
            }
        }
    }
};

// Initialize and hook into game loops
window.addEventListener('load', () => {
    TutorialGuide.init();
});

// Run update checks continuously
setInterval(() => {
    TutorialGuide.update();
}, 250);
