// =========================================================================
// MAP SETUP & ASSET INITIALIZATION CONTROLLER (Optimized)
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

// Dynamic Loading Screen Overlay Element Creation
const loadingOverlay = document.createElement('div');
loadingOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background-color: #111111; z-index: 9999; display: flex;
    flex-direction: column; justify-content: center; align-items: center;
    color: #ffffff; font-family: sans-serif;
`;
loadingOverlay.innerHTML = `
    <h3 style="margin-bottom: 10px; font-weight: 600; letter-spacing: 1px;">Loading Game Assets...</h3>
    <div style="width: 240px; height: 8px; background: #222; border-radius: 4px; overflow: hidden; border: 1px solid #333;">
        <div id="progressBar" style="width: 0%; height: 100%; background: #2ecc71; transition: width 0.2s ease;"></div>
    </div>
    <span id="progressText" style="margin-top: 10px; font-size: 13px; color: #aaa;">0%</span>
`;
document.body.appendChild(loadingOverlay);

const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

const assetEntries = [
    { key: 'map', url: `${repoBaseUrl}map_8.jpg` },
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

let mapImg = new Image(), mapLoaded = false;
let blueAntiairImg = new Image(), blueAntiairLoaded = false;
let redAntiairImg = new Image(), redAntiairLoaded = false;
let blueArtilleryImg = new Image(), blueArtilleryLoaded = false;
let redArtilleryImg = new Image(), redArtilleryLoaded = false;
let blueEngineerImg = new Image(), blueEngineerLoaded = false;
let redEngineerImg = new Image(), redEngineerLoaded = false;
let blueInfantryImg = new Image(), blueInfantryLoaded = false;
let redInfantryImg = new Image(), redInfantryLoaded = false;
let blueMineImg = new Image(), blueMineLoaded = false;
let redMineImg = new Image(), redMineLoaded = false;
let bluePlaneImg = new Image(), bluePlaneLoaded = false;
let redPlaneImg = new Image(), redPlaneLoaded = false;
let blueShipImg = new Image(), blueShipLoaded = false;
let redShipImg = new Image(), redShipLoaded = false;
let blueTankImg = new Image(), blueTankLoaded = false;
let redTankImg = new Image(), redTankLoaded = false;

function updateLoadingProgress() {
    loadedCount++;
    let percent = Math.min(100, Math.floor((loadedCount / totalAssets) * 100));
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.innerText = percent + '%';

    if (loadedCount >= totalAssets) {
        console.log("[SUCCESS][map_setup] All game assets loaded successfully.");
        dismissLoadingScreen();
    }
}

function dismissLoadingScreen() {
    setTimeout(() => {
        if (loadingOverlay && loadingOverlay.parentNode) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.4s ease';
            setTimeout(() => loadingOverlay.remove(), 400);
        }
    }, 200);
}

// Failsafe: Force-dismiss loading overlay after 6 seconds even if a CDN asset stalls
setTimeout(() => {
    if (loadedCount < totalAssets) {
        console.warn("[WARN][map_setup] Loading timeout reached. Force-dismissing loading screen.");
        dismissLoadingScreen();
    }
}, 6000);

function loadAssetDirectly(url, imgObj, setLoadedFlag) {
    imgObj.crossOrigin = "anonymous";
    imgObj.onload = () => {
        setLoadedFlag(true);
        updateLoadingProgress();
    };
    imgObj.onerror = (err) => {
        console.error(`[ERROR][map_setup] Failed to load asset: ${url}`, err);
        // Still count it as processed so the loading bar doesn't freeze permanently
        setLoadedFlag(true);
        updateLoadingProgress();
    };
    imgObj.src = url;
}

// Map key assignments to actual Image objects
const imageBindingMap = {
    'map': { obj: mapImg, flag: (val) => { mapLoaded = val; } },
    'blueAntiair': { obj: blueAntiairImg, flag: (val) => { blueAntiairLoaded = val; } },
    'redAntiair': { obj: redAntiairImg, flag: (val) => { redAntiairLoaded = val; } },
    'blueArtillery': { obj: blueArtilleryImg, flag: (val) => { blueArtilleryLoaded = val; } },
    'redArtillery': { obj: redArtilleryImg, flag: (val) => { redArtilleryLoaded = val; } },
    'blueEngineer': { obj: blueEngineerImg, flag: (val) => { blueEngineerLoaded = val; } },
    'redEngineer': { obj: redEngineerImg, flag: (val) => { redEngineerLoaded = val; } },
    'blueInfantry': { obj: blueInfantryImg, flag: (val) => { blueInfantryLoaded = val; } },
    'redInfantry': { obj: redInfantryImg, flag: (val) => { redInfantryLoaded = val; } },
    'blueMine': { obj: blueMineImg, flag: (val) => { blueMineLoaded = val; } },
    'redMine': { obj: redMineImg, flag: (val) => { redMineLoaded = val; } },
    'bluePlane': { obj: bluePlaneImg, flag: (val) => { bluePlaneLoaded = val; } },
    'redPlane': { obj: redPlaneImg, flag: (val) => { redPlaneLoaded = val; } },
    'blueShip': { obj: blueShipImg, flag: (val) => { blueShipLoaded = val; } },
    'redShip': { obj: redShipImg, flag: (val) => { redShipLoaded = val; } },
    'blueTank': { obj: blueTankImg, flag: (val) => { blueTankLoaded = val; } },
    'redTank': { obj: redTankImg, flag: (val) => { redTankLoaded = val; } }
};

// Trigger parallel non-blocking loads for all assets
assetEntries.forEach(entry => {
    let binding = imageBindingMap[entry.key];
    if (binding) {
        loadAssetDirectly(entry.url, binding.obj, binding.flag);
    }
});

function getTerrain(c, r) {
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

    const goldCoresList = ['G5', 'B6', 'M8', 'F15', 'Q13', 'L17'];
    if (goldCoresList.includes(coord)) return 'gold_core';

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

function getPortSquare(team) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let t = getTerrain(c, r);
            if (team === 'blue' && t === 'blue_navy') return {c, r};
            if (team === 'red' && t === 'red_navy') return {c, r};
        }
    }
    return {c:0, r:0};
}

function spawnTeam(team) {
    let isBlue = (team === 'blue');
    let baseSquares = getBaseSquares(team);

    let infImgRef = isBlue ? blueInfantryImg : redInfantryImg;
    let infLoadRef = () => isBlue ? blueInfantryLoaded : redInfantryLoaded;

    let tankImgRef = isBlue ? blueTankImg : redTankImg;
    let tankLoadRef = () => isBlue ? blueTankLoaded : redTankLoaded;

    let unitsToSpawn = isBlue ? [
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef, loaded: infLoadRef }
    ] : [
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef, loaded: infLoadRef },
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef, loaded: infLoadRef },
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef, loaded: infLoadRef },
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef, loaded: infLoadRef },
        { name: 'Infantry', type: 'land', range: 2, speed: 2, img: infImgRef, loaded: infLoadRef },
        { name: 'Tank', type: 'land', range: 3, speed: 3, img: tankImgRef, loaded: tankLoadRef },
        { name: 'Tank', type: 'land', range: 3, speed: 3, img: tankImgRef, loaded: tankLoadRef },
        { name: 'Tank', type: 'land', range: 3, speed: 3, img: tankImgRef, loaded: tankLoadRef }
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
            loaded: template.loaded,
            team: team,
            facing: 0
        });
    });

    console.log(`[SUCCESS][map_setup] Team '${team}' successfully spawned.`);
}

spawnTeam('blue');
spawnTeam('red');

console.log("[SUCCESS][map_setup] Optimized map setup initialization complete.");
