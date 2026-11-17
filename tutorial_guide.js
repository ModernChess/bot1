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

    // Tutorial 1 State Tracking
    t1SubState: 1, 
    t1LastUnitPos: null,

    // Tutorial 2 State Tracking
    t2SubState: 1, 
    t2LastUnitPos: null,

    // Tutorial 3 State Tracking
    t3SubState: 1, 
    t3LastUnitPos: null,

    // Tutorial 4 State Tracking
    t4SubState: 1, 
    t4LastUnitPos: null,

    // Tutorial 5 State Tracking
    t5SubState: 1, 
    t5LastUnitPos: null,

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
            margin: 8px auto 6px auto;
            background: rgba(18, 18, 18, 0.95);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(59, 130, 246, 0.6);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15);
            padding: 12px 16px;
            border-radius: 14px;
            color: #ffffff;
            font-family: 'Poppins', 'Segoe UI', sans-serif;
            font-size: 13px;
            font-weight: 600;
            z-index: 99;
            max-width: 500px;
            width: 96%;
            text-align: center;
            box-sizing: border-box;
            transition: all 0.3s ease;
        `;
        cloud.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 4px;">
                <span style="font-size: 14px;">🏁</span>
                <span style="color: #60a5fa; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; font-weight: 800;">Battle Trainer</span>
            </div>
            <div id="tutorialCloudMessage" style="line-height: 1.4; text-shadow: 0 2px 4px rgba(0,0,0,0.6); min-height: 36px;"></div>
        `;

        const boardOuterFrame = document.querySelector('.board-outer-frame');
        if (boardOuterFrame && boardOuterFrame.parentNode) {
            boardOuterFrame.parentNode.insertBefore(cloud, boardOuterFrame.nextSibling);
        } else {
            document.body.appendChild(cloud);
        }
    },

    // Smooth & slower typewriter text state manager (55ms per character)
    typewriterTarget: "",
    typewriterCurrent: "",
    typewriterIndex: 0,
    typewriterTimer: null,

    setFullText(newText) {
        if (this.typewriterTarget === newText) return;
        this.typewriterTarget = newText;
        this.typewriterIndex = 0;
        this.typewriterCurrent = "";
        
        if (this.typewriterTimer) clearInterval(this.typewriterTimer);

        const msgEl = document.getElementById('tutorialCloudMessage');
        if (!msgEl) return;

        this.typewriterTimer = setInterval(() => {
            if (this.typewriterIndex < this.typewriterTarget.length) {
                this.typewriterCurrent += this.typewriterTarget.charAt(this.typewriterIndex);
                this.typewriterIndex++;
                msgEl.innerText = this.typewriterCurrent + "_";
            } else {
                clearInterval(this.typewriterTimer);
                msgEl.innerText = this.typewriterCurrent;
            }
        }, 55);
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

    isUnitStalemated(unit) {
        if (!unit) return false;
        if (typeof isUnitLockedInStalemate === 'function' && isUnitLockedInStalemate(unit, units)) {
            return true;
        }
        if (unit.isStalemated || unit.stalemated || unit.locked || unit.isLocked || unit.frozen) {
            return true;
        }
        return false;
    },

    getTargetBaseCoordinates() {
        if (typeof activeMapData !== 'undefined' && activeMapData && activeMapData.hq) {
            const redCore = activeMapData.hq.find(h => h.type_name === 'rbc');
            if (redCore && typeof parseCoordString === 'function') {
                return parseCoordString(redCore.coordinates);
            }
        }
        if (typeof goldCores !== 'undefined') {
            const redBaseCore = goldCores.find(gc => gc.isBase && gc.teamBase === 'red');
            if (redBaseCore) {
                return { c: redBaseCore.c, r: redBaseCore.r };
            }
        }
        return { c: 11, r: 0 };
    },

    update() {
        const cloudEl = document.getElementById('tutorialChatCloud');
        if (!cloudEl) return;

        if (typeof gameOver !== 'undefined' && gameOver) {
            cloudEl.style.display = 'none';
            this.active = false;
            this.targetPosition = null;
            this.targetUnitName = null;
            return;
        }

        if (typeof currentCampaignLevel !== 'undefined' && currentCampaignLevel >= 1 && currentCampaignLevel <= 20) {
            cloudEl.style.display = 'block';
            this.active = true;

            let baseCoord = this.getTargetBaseCoordinates();

            if (currentCampaignLevel === 1) {
                const blueUnit = typeof units !== 'undefined' ? units.find(u => u.team === 'blue') : null;
                
                if (blueUnit) {
                    if (!this.t1LastUnitPos) {
                        this.t1LastUnitPos = { x: blueUnit.gridX, y: blueUnit.gridY };
                    } else if (this.t1LastUnitPos.x !== blueUnit.gridX || this.t1LastUnitPos.y !== blueUnit.gridY) {
                        this.t1SubState = 3; 
                    }

                    if (typeof window.selectedUnit !== 'undefined' && window.selectedUnit === blueUnit && this.t1SubState === 1) {
                        this.t1SubState = 2; 
                    }
                }

                if (this.t1SubState === 1) {
                    this.setFullText("Select your infantry to move it!");
                } else if (this.t1SubState === 2) {
                    this.setFullText("click the white circle ⚪ to move your infantry there");
                } else if (this.t1SubState === 3) {
                    this.setFullText("Place the unit inside the base to win the game");
                }

                this.targetPosition = baseCoord;
                this.targetUnitName = null;
            } else if (currentCampaignLevel === 2) {
                const blueUnit = typeof units !== 'undefined' ? units.find(u => u.team === 'blue') : null;
                
                if (blueUnit) {
                    if (!this.t2LastUnitPos) {
                        this.t2LastUnitPos = { x: blueUnit.gridX, y: blueUnit.gridY };
                    } else if (this.t2LastUnitPos.x !== blueUnit.gridX || this.t2LastUnitPos.y !== blueUnit.gridY) {
                        this.t2SubState = 3; 
                    }

                    if (typeof window.selectedUnit !== 'undefined' && window.selectedUnit === blueUnit && this.t2SubState === 1) {
                        this.t2SubState = 2; 
                    }
                }

                if (this.t2SubState === 1) {
                    this.setFullText("Select your tank to move it!");
                } else if (this.t2SubState === 2) {
                    this.setFullText("click the white circle ⚪ to move your tank there");
                } else if (this.t2SubState === 3) {
                    this.setFullText("Drive straight to the enemy base!");
                }

                this.targetPosition = baseCoord; 
                this.targetUnitName = null;
            } else if (currentCampaignLevel === 3) {
                const blueUnit = typeof units !== 'undefined' ? units.find(u => u.team === 'blue') : null;
                const enemyInfantry = typeof units !== 'undefined' ? units.find(u => u.team === 'red' && u.name === 'Infantry') : null;

                if (blueUnit) {
                    if (!this.t3LastUnitPos) {
                        this.t3LastUnitPos = { x: blueUnit.gridX, y: blueUnit.gridY };
                    } else if (this.t3LastUnitPos.x !== blueUnit.gridX || this.t3LastUnitPos.y !== blueUnit.gridY) {
                        this.t3SubState = 3; 
                    }

                    if (typeof window.selectedUnit !== 'undefined' && window.selectedUnit === blueUnit && this.t3SubState === 1) {
                        this.t3SubState = 2; 
                    }
                }

                if (this.t3SubState === 1) {
                    this.setFullText("Select your tank to attack!");
                } else if (this.t3SubState === 2) {
                    this.setFullText("click the white circle ⚪ to attack the enemy infantry");
                } else if (this.t3SubState === 3) {
                    this.setFullText("Time to fight! Red movement dots mean moving there will start a battle!");
                }

                if (enemyInfantry) {
                    this.targetPosition = { c: enemyInfantry.gridX, r: enemyInfantry.gridY };
                    this.targetUnitName = 'Infantry';
                }
            } else if (currentCampaignLevel === 4) {
                const blueUnits = typeof units !== 'undefined' ? units.filter(u => u.team === 'blue') : [];
                const stalematedUnit = blueUnits.find(u => this.isUnitStalemated(u));
                const activeBlue = blueUnits.find(u => !this.isUnitStalemated(u)) || blueUnits[0];
                const redUnits = typeof units !== 'undefined' ? units.filter(u => u.team === 'red') : [];
                const targetRedUnit = redUnits.length > 0 ? redUnits[0] : null;

                if (activeBlue) {
                    if (!this.t4LastUnitPos) {
                        this.t4LastUnitPos = { x: activeBlue.gridX, y: activeBlue.gridY };
                    } else if (this.t4LastUnitPos.x !== activeBlue.gridX || this.t4LastUnitPos.y !== activeBlue.gridY) {
                        this.t4SubState = 3; 
                    }

                    if (typeof window.selectedUnit !== 'undefined' && window.selectedUnit === activeBlue && this.t4SubState === 1) {
                        this.t4SubState = 2; 
                    }
                }

                if (stalematedUnit && this.isUnitStalemated(stalematedUnit)) {
                    this.targetPosition = { c: stalematedUnit.gridX, r: stalematedUnit.gridY };
                    this.targetUnitName = stalematedUnit.name;
                    this.setFullText("oh no, your unit is Stalemated! Which means you can't move it, to remove the lock, bring reinforcement");
                } else if (this.t4SubState === 3) {
                    this.setFullText("unit is moving to the pressed direction");
                } else if (this.t4SubState === 2) {
                    this.setFullText("click the white circle ⚪ to move towards the enemy unit");
                } else {
                    this.setFullText("Select your infantry to move towards the enemy unit!");
                }

                if (targetRedUnit) {
                    this.targetPosition = { c: targetRedUnit.gridX, r: targetRedUnit.gridY };
                    this.targetUnitName = targetRedUnit.name;
                }
            } else if (currentCampaignLevel === 5) {
                const blueUnits = typeof units !== 'undefined' ? units.filter(u => u.team === 'blue') : [];
                const stalematedTank = blueUnits.find(u => (u.name === 'Tank' || u.type === 'tank') && this.isUnitStalemated(u));
                const activeTank = blueUnits.find(u => (u.name === 'Tank' || u.type === 'tank') && !this.isUnitStalemated(u)) || blueUnits[0];
                const redUnits = typeof units !== 'undefined' ? units.filter(u => u.team === 'red') : [];
                const targetRedUnit = redUnits.find(u => u.name === 'Tank' || u.type === 'tank') || (redUnits.length > 0 ? redUnits[0] : null);

                if (activeTank) {
                    if (!this.t5LastUnitPos) {
                        this.t5LastUnitPos = { x: activeTank.gridX, y: activeTank.gridY };
                    } else if (this.t5LastUnitPos.x !== activeTank.gridX || this.t5LastUnitPos.y !== activeTank.gridY) {
                        this.t5SubState = 3; 
                    }

                    if (typeof window.selectedUnit !== 'undefined' && window.selectedUnit === activeTank && this.t5SubState === 1) {
                        this.t5SubState = 2; 
                    }
                }

                if (stalematedTank && this.isUnitStalemated(stalematedTank)) {
                    this.targetPosition = { c: stalematedTank.gridX, r: stalematedTank.gridY };
                    this.targetUnitName = stalematedTank.name;
                    this.setFullText("oh no, your tank is Stalemated! Which means you can't move it, to remove the lock, bring reinforcement tank");
                } else if (this.t5SubState === 3) {
                    this.setFullText("unit is moving to the pressed direction");
                } else if (this.t5SubState === 2) {
                    this.setFullText("click the white circle ⚪ to drive towards the enemy tank");
                } else {
                    this.setFullText("Select your tank to move towards the enemy tank!");
                }

                if (targetRedUnit) {
                    this.targetPosition = { c: targetRedUnit.gridX, r: targetRedUnit.gridY };
                    this.targetUnitName = targetRedUnit.name;
                }
            } else {
                const stageNum = currentCampaignLevel - 5;
                this.targetPosition = baseCoord;
                this.targetUnitName = null;

                if (stageNum === 1) {
                    this.setFullText(`You are now playing with a bot. Move faster than the red Infantry and reach the enemy base`);
                } else if (stageNum === 2) {
                    this.setFullText(`Go around the bad guys and capture their base before the bot unit takes your base`);
                } else if (stageNum === 3) {
                    this.setFullText(`The enemy tank is fast (3 squares at one go) and powerful. Keep your unit close to your other units!`);
                } else if (stageNum === 4) {
                    this.setFullText(`Use your tank to block the enemy tanks and help your trapped friends!`);
                } else if (stageNum === 5) {
                    this.setFullText(`Send your big tank to break the enemy lock and rescue your team!`);
                } else if (stageNum === 6) {
                    this.setFullText(`Your team is spread out everywhere! Think carefully to bring them together and win!`);
                } else if (stageNum === 7) {
                    this.setFullText(`Warning! Three enemy tanks are coming right at you! Play safe and defend!`);
                } else if (stageNum === 8) {
                    this.setFullText(`The bad guys are scattered. Attack together and take over the board!`);
                } else {
                    this.setFullText(this.getRandomMessageForStage(currentCampaignLevel, stageNum));
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
                        window.activeRedBotPath = findPathToTarget(blueUnit, baseCoord.c, baseCoord.r, unitPowerMap, [], true) || [];
                    }
                }
            }
        } else {
            cloudEl.style.display = 'none';
            this.active = false;
            this.targetPosition = null;
            this.targetUnitName = null;
        }
    },

    renderBattlefieldOverlays(ctx) {
        if (!this.active || (typeof gameOver !== 'undefined' && gameOver)) return;

        this.dashOffset = (this.dashOffset - 0.5) % 32;

        let activeBlueUnit = null;
        let isLevelStalemate = false;

        if (currentCampaignLevel === 4) {
            let blueUnits = typeof units !== 'undefined' ? units.filter(u => u.team === 'blue') : [];
            let stalematedUnit = blueUnits.find(u => this.isUnitStalemated(u));
            isLevelStalemate = Boolean(stalematedUnit && this.isUnitStalemated(stalematedUnit));

            if (isLevelStalemate) {
                activeBlueUnit = blueUnits.find(u => !this.isUnitStalemated(u)) || (typeof window.selectedUnit !== 'undefined' ? window.selectedUnit : null);
            } else {
                activeBlueUnit = (typeof window.selectedUnit !== 'undefined' && window.selectedUnit) ? window.selectedUnit : (blueUnits.length > 0 ? blueUnits[0] : null);
            }
        } else if (currentCampaignLevel === 5) {
            let blueUnits = typeof units !== 'undefined' ? units.filter(u => u.team === 'blue') : [];
            let stalematedTank = blueUnits.find(u => this.isUnitStalemated(u) && (u.name === 'Tank' || u.type === 'tank'));
            isLevelStalemate = Boolean(stalematedTank && this.isUnitStalemated(stalematedTank));

            if (isLevelStalemate) {
                activeBlueUnit = blueUnits.find(u => !this.isUnitStalemated(u) && (u.name === 'Tank' || u.type === 'tank')) || blueUnits.find(u => !this.isUnitStalemated(u)) || (typeof window.selectedUnit !== 'undefined' ? window.selectedUnit : null);
            } else {
                activeBlueUnit = (typeof window.selectedUnit !== 'undefined' && window.selectedUnit) ? window.selectedUnit : (blueUnits.length > 0 ? blueUnits[0] : null);
            }
        } else {
            if (typeof window.selectedUnit !== 'undefined' && window.selectedUnit && window.selectedUnit.team === 'blue') {
                activeBlueUnit = window.selectedUnit;
            } else if (typeof units !== 'undefined') {
                activeBlueUnit = units.find(u => u.team === 'blue');
            }
        }

        if (this.targetPosition) {
            let targetX = this.targetPosition.c * cellSize + cellSize / 2;
            let targetY = this.targetPosition.r * cellSize + cellSize / 2;

            let pulseFactor = Math.sin(Date.now() / 250) * 0.15 + 0.65;
            let currentRadius = cellSize * pulseFactor;

            // 1. Target ring
            ctx.save();
            ctx.strokeStyle = isLevelStalemate ? '#f59e0b' : '#ef4444';
            ctx.fillStyle = isLevelStalemate ? 'rgba(245, 158, 11, 0.18)' : 'rgba(239, 68, 68, 0.18)';
            ctx.lineWidth = 3.5;
            ctx.shadowColor = isLevelStalemate ? '#f59e0b' : '#ef4444';
            ctx.shadowBlur = 10;
            ctx.setLineDash([8, 6, 2, 6]);
            ctx.lineDashOffset = this.dashOffset;
            ctx.beginPath();
            ctx.arc(targetX, targetY, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // 2. Animated Line & Arrowhead pointing towards target coordinates
            if (activeBlueUnit && (currentCampaignLevel === 1 || currentCampaignLevel === 2 || currentCampaignLevel === 3 || currentCampaignLevel === 4 || currentCampaignLevel === 5)) {
                let startX = (activeBlueUnit.renderX !== undefined ? activeBlueUnit.renderX : activeBlueUnit.gridX * cellSize) + cellSize / 2;
                let startY = (activeBlueUnit.renderY !== undefined ? activeBlueUnit.renderY : activeBlueUnit.gridY * cellSize) + cellSize / 2;

                ctx.save();
                ctx.strokeStyle = isLevelStalemate ? '#38bdf8' : '#ef4444';
                ctx.fillStyle = isLevelStalemate ? '#38bdf8' : '#ef4444';
                ctx.lineWidth = 4;
                ctx.shadowColor = isLevelStalemate ? '#38bdf8' : '#ef4444';
                ctx.shadowBlur = 8;
                
                ctx.setLineDash([10, 6]);
                ctx.lineDashOffset = this.dashOffset;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(targetX, targetY);
                ctx.stroke();

                // Arrowhead pointing towards target coordinates
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

                // 3. "TOUCH HERE" pointer: ONLY show when subState !== 3 (i.e. before the unit has been moved). Once moved, it permanently disappears!
                let showTouchHere = false;
                if (currentCampaignLevel === 1 && this.t1SubState === 1) showTouchHere = true;
                else if (currentCampaignLevel === 2 && this.t2SubState === 1) showTouchHere = true;
                else if (currentCampaignLevel === 3 && this.t3SubState === 1) showTouchHere = true;
                else if (currentCampaignLevel === 4 && this.t4SubState !== 3) showTouchHere = true;
                else if (currentCampaignLevel === 5 && this.t5SubState !== 3) showTouchHere = true;

                if (showTouchHere) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.font = 'bold 11px Poppins, sans-serif';
                    
                    let bubbleX = startX;
                    let bubbleY = startY - cellSize * 0.9;
                    
                    ctx.beginPath();
                    ctx.roundRect(bubbleX - 42, bubbleY - 14, 84, 24, 6);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.fillText("TOUCH HERE", bubbleX, bubbleY + 2);
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