// =========================================================================
// MAP SETUP & ASSET INITIALIZATION CONTROLLER (Dynamic & Multi-Map Safe)
// =========================================================================

const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    console.error("[ERROR][map_setup] Canvas element with ID 'gameCanvas' not found in DOM.");
}
const ctx = canvas ? canvas.getContext('2d') : null;
if (!ctx) {
    console.error("[ERROR][map_setup] Failed to acquire 2D rendering context from canvas.");
}

const cols = 18;
const rows = 18;
const cellSize = canvas ? canvas.width / cols : 0;

function lerp(start, end, t) {
    return start + (end - start) * t;
}

const repoBaseUrl = 'https://raw.githubusercontent.com/ModernChess/assets-images/main/';

// Dynamic Loading Screen Overlay Element Creation with Reload Button
const loadingOverlay = document.createElement('div');
loadingOverlay.id = 'dynamicLoadingOverlay';
loadingOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background-color: #111111; z-index: 9999; display: flex;
    flex-direction: column; justify-content: center; align-items: center;
    color: #ffffff; font-family: sans-serif; transition: opacity 0.4s ease;
`;
loadingOverlay.innerHTML = `
    <h3 style="margin-bottom: 10px; font-weight: 600; letter-spacing: 1px;">Loading Game Assets...</h3>
    <div style="width: 240px; height: 8px; background: #222; border-radius: 4px; overflow: hidden; border: 1px solid #333;">
        <div id="progressBar" style="width: 0%; height: 100%; background: #2ecc71; transition: width 0.2s ease;"></div>
    </div>
    <span id="progressText" style="margin-top: 10px; font-size: 13px; color: #aaa;">0%</span>
    <button id="manualReloadBtn" onclick="window.location.reload()" style="
        margin-top: 20px; padding: 8px 16px; background: #e74c3c; color: white;
        border: none; border-radius: 6px; font-size: 12px; font-weight: bold;
        cursor: pointer; display: none; box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
    ">Reload Game</button>
`;
document.body.appendChild(loadingOverlay);

const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const manualReloadBtn = document.getElementById('manualReloadBtn');

const reloadButtonTimer = setTimeout(() => {
    if (manualReloadBtn && loadingOverlay.parentNode) {
        manualReloadBtn.style.display = 'block';
    }
}, 3000);

const assetEntries = [
    { key: 'map_8', url: `${repoBaseUrl}map_8.jpg` },
    { key: 'botmapinfo1', url: `${repoBaseUrl}botmapinfo1.jpg`, fallbackUrl: `${repoBaseUrl}botmapinfo1.png` },
    { key: 'botmapinfo2', url: `${repoBaseUrl}botmapinfo2.jpg`, fallbackUrl: `${repoBaseUrl}botmapinfo2.png` },
    { key: 'botmapinfo3', url: `${repoBaseUrl}botmapinfo3.jpg`, fallbackUrl: `${repoBaseUrl}botmapinfo3.png` },
    { key: 'blueAntiair', url: `${repoBaseUrl}blueantiair.png` },
    { key: 'redAntiair', url: `${repoBaseUrl}redantiair.png` },
    { key: 'blueArtillery', url: `${repoBaseUrl}blueartillery.png` },
    { key: 'redArtillery', url: `${repoBaseUrl}redartillery.png` },
    { key: 'blueEngineer', url: `${repoBaseUrl}blueengineer.png` },
    { key: 'redEngineer', url: `${repoBaseUrl}redengineer.png` },
    { key: 'blueInfantry', url: `${repoBaseUrl}blueinfantry.png` },
    { key: 'redInfantry', url: `${repoBaseUrl}redinfantry.png` },
    { key: 'blueMine', url: `${repoBaseUrl}bluemine.png` },
    { key: 'redMine', url: `${repoBaseUrl}redmine.png` },
    { key: 'bluePlane', url: `${repoBaseUrl}blueplane.png` },
    { key: 'redPlane', url: `${repoBaseUrl}redplane.png` },
    { key: 'blueShip', url: `${repoBaseUrl}blueship.png` },
    { key: 'redShip', url: `${repoBaseUrl}redship.png` },
    { key: 'blueTank', url: `${repoBaseUrl}bluetank.png` },
    { key: 'redTank', url: `${repoBaseUrl}redtank.png` }
];

let loadedCount = 0;
const totalAssets = assetEntries.length;

const gameImages = {};
const assetLoadedFlags = {};

assetEntries.forEach(entry => {
    gameImages[entry.key] = new Image();
    assetLoadedFlags[entry.key] = false;
});

let activeMapKey = 'map_8';
let activeMapData = typeof getMapConfigByKey === 'function' ? getMapConfigByKey('map_8') : null;
let mapImg = gameImages['map_8'];

const blueAntiairImg = gameImages['blueAntiair'];
const redAntiairImg = gameImages['redAntiair'];
const blueArtilleryImg = gameImages['blueArtillery'];
const redArtilleryImg = gameImages['redArtillery'];
const blueEngineerImg = gameImages['blueEngineer'];
const redEngineerImg = gameImages['redEngineer'];
const blueInfantryImg = gameImages['blueInfantry'];
const redInfantryImg = gameImages['redInfantry'];
const blueMineImg = gameImages['blueMine'];
const redMineImg = gameImages['redMine'];
const bluePlaneImg = gameImages['bluePlane'];
const redPlaneImg = gameImages['redPlane'];
const blueShipImg = gameImages['blueShip'];
const redShipImg = gameImages['redShip'];
const blueTankImg = gameImages['blueTank'];
const redTankImg = gameImages['redTank'];

let mapLoaded = false;
let blueAntiairLoaded = false, redAntiairLoaded = false;
let blueArtilleryLoaded = false, redArtilleryLoaded = false;
let blueEngineerLoaded = false, redEngineerLoaded = false;
let blueInfantryLoaded = false, redInfantryLoaded = false;
let blueMineLoaded = false, redMineLoaded = false;
let bluePlaneLoaded = false, redPlaneLoaded = false;
let blueShipLoaded = false, redShipLoaded = false;
let blueTankLoaded = false, redTankLoaded = false;

function updateLoadingProgress() {
    loadedCount++;
    let percent = Math.min(100, Math.floor((loadedCount / totalAssets) * 100));
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.innerText = percent + '%';

    if (loadedCount >= totalAssets) {
        clearTimeout(reloadButtonTimer);
        console.log("[SUCCESS][map_setup] All game assets loaded successfully.");
        dismissLoadingScreen();
    }
}

function dismissLoadingScreen() {
    setTimeout(() => {
        if (loadingOverlay && loadingOverlay.parentNode) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => loadingOverlay.remove(), 400);
        }
    }, 200);
}

setTimeout(() => {
    if (loadedCount < totalAssets) {
        console.warn("[WARN][map_setup] Loading timeout reached. Force-dismissing loading screen.");
        dismissLoadingScreen();
    }
}, 8000);

function loadAssetDynamic(entry) {
    const imgObj = gameImages[entry.key];
    imgObj.crossOrigin = "anonymous";
    let triedFallback = false;

    imgObj.onload = () => {
        assetLoadedFlags[entry.key] = true;
        syncLegacyFlags(entry.key, true);
        updateLoadingProgress();
    };

    imgObj.onerror = (err) => {
        if (entry.fallbackUrl && !triedFallback) {
            triedFallback = true;
            imgObj.src = entry.fallbackUrl;
            return;
        }
        console.warn(`[WARN][map_setup] Asset not available yet: ${entry.url}`);
        assetLoadedFlags[entry.key] = true;
        syncLegacyFlags(entry.key, true);
        updateLoadingProgress();
    };

    imgObj.src = entry.url;
}

function syncLegacyFlags(key, val) {
    if (key === activeMapKey) mapLoaded = val;
    if (key === 'blueAntiair') blueAntiairLoaded = val;
    if (key === 'redAntiair') redAntiairLoaded = val;
    if (key === 'blueArtillery') blueArtilleryLoaded = val;
    if (key === 'redArtillery') redArtilleryLoaded = val;
    if (key === 'blueEngineer') blueEngineerLoaded = val;
    if (key === 'redEngineer') redEngineerLoaded = val;
    if (key === 'blueInfantry') blueInfantryLoaded = val;
    if (key === 'redInfantry') redInfantryLoaded = val;
    if (key === 'blueMine') blueMineLoaded = val;
    if (key === 'redMine') redMineLoaded = val;
    if (key === 'bluePlane') bluePlaneLoaded = val;
    if (key === 'redPlane') redPlaneLoaded = val;
    if (key === 'blueShip') blueShipLoaded = val;
    if (key === 'redShip') redShipLoaded = val;
    if (key === 'blueTank') blueTankLoaded = val;
    if (key === 'redTank') redTankLoaded = val;
}

assetEntries.forEach(entry => {
    loadAssetDynamic(entry);
});

function switchActiveMap(lvlNum) {
    const targetKey = typeof getMapKeyForLevel === 'function' ? getMapKeyForLevel(lvlNum) : 'map_8';
    activeMapKey = targetKey;
    activeMapData = typeof getMapConfigByKey === 'function' ? getMapConfigByKey(targetKey) : null;

    if (gameImages[targetKey]) {
        mapImg = gameImages[targetKey];
        mapLoaded = Boolean(assetLoadedFlags[targetKey]);
    }

    if (typeof syncGoldCoresFromMap === 'function' && activeMapData) {
        syncGoldCoresFromMap(activeMapData);
    }

    console.log(`[INFO][map_setup] Active map switched to '${activeMapKey}' for Level ${lvlNum}.`);
}

function getTerrain(c, r) {
    if (activeMapData && !activeMapData.useLegacyTerrain) {
        const key = `${c},${r}`;

        if (activeMapData.hq) {
            const hqMatch = activeMapData.hq.find(item => item.coordinates === key);
            if (hqMatch) {
                if (hqMatch.type_name === 'rbc') return 'red_core';
                if (hqMatch.type_name === 'bbc') return 'blue_core';
                if (hqMatch.type_name === 'r') return 'red_base';
                if (hqMatch.type_name === 'b') return 'blue_base';
            }
        }

        if (activeMapData.water && activeMapData.water.includes(key)) {
            return 'water';
        }

        // Gold cores and gold tile links are now fully treated as land (passable)
        return 'land';
    }

    const colChar = String.fromCharCode(65 + c);
    const rowNum = r + 1;
    const coord = colChar + rowNum;

    const waterList = [
        'I5', 'J5', 'I6', 'J6', 'K6', 'H7', 'I7', 'J7', 'K7', 'G8', 'H8', 'I8', 'J8', 'K8', 
        'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9', 'E10', 'F10', 'G10', 'H10', 'I10', 
        'J10', 'K10', 'L10', 'F11', 'G11', 'H11', 'I11', 'J11', 'K11', 'L11', 'M11', 'I12', 
        'J12', 'K12', 'L12', 'M12', 'N12', 'K13', 'L13', 'M13', 'N13', 'L14', 'M14', 'N14'
    ];
    if (waterList.includes(coord)) return 'water';

    if (coord === 'F12') return 'blue_navy';
    if (coord === 'L6') return 'red_navy';

    if (coord === 'A12') return 'blue_core';
    if (coord === 'A11' || coord === 'B11' || coord === 'B12' || coord === 'A13' || coord === 'B13') return 'blue_base';

    if (coord === 'L1') return 'red_core';
    if (coord === 'K1' || coord === 'M1' || coord === 'K2' || coord === 'L2' || coord === 'M2') return 'red_base';

    return 'land';
}

function isWaterTerrain(terrain) {
    return terrain === 'water' || terrain === 'blue_navy' || terrain === 'red_navy';
}

let units = [];

function getBaseSquares(team) {
    let squares = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let t = getTerrain(c, r);
            if (team === 'blue' && (t === 'blue_base' || t === 'blue_core')) squares.push({c, r});
            if (team === 'red' && (t === 'red_base' || t === 'red_core')) squares.push({c, r});
        }
    }
    return squares;
}

function spawnTeam(team) {
    let isBlue = (team === 'blue');
    let baseSquares = getBaseSquares(team);

    let infImgRef = isBlue ? blueInfantryImg : redInfantryImg;
    let tankImgRef = isBlue ? blueTankImg : redTankImg;

    let unitsToSpawn = isBlue ? [
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef }
    ] : [
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef },
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef },
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef },
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef },
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef },
        { name: 'Tank', type: 'land', range: 3, speed: 3, img: tankImgRef },
        { name: 'Tank', type: 'land', range: 3, speed: 3, img: tankImgRef },
        { name: 'Tank', type: 'land', range: 3, speed: 3, img: tankImgRef }
    ];

    unitsToSpawn.forEach((template, index) => {
        let pos = baseSquares[index % baseSquares.length] || { c: isBlue ? 0 : 11, r: isBlue ? 11 : 0 };
        units.push({
            name: template.name,
            type: template.type,
            range: template.range,
            speed: template.speed,
            gridX: pos.c,
            gridY: pos.r,
            x: pos.c * cellSize,
            y: pos.r * cellSize,
            img: template.img,
            team: team,
            facing: 0
        });
    });

    console.log(`[SUCCESS][map_setup] Team '${team}' successfully spawned.`);
}

spawnTeam('blue');
spawnTeam('red');

console.log("[SUCCESS][map_setup] Safe dynamic map setup initialization complete.");
