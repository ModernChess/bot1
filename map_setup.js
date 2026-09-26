// =========================================================================
// MAP SETUP & ASSET INITIALIZATION CONTROLLER
// =========================================================================

// References the main canvas element from the HTML document DOM
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
loadingOverlay.style.position = 'fixed';
loadingOverlay.style.top = '0';
loadingOverlay.style.left = '0';
loadingOverlay.style.width = '100vw';
loadingOverlay.style.height = '100vh';
loadingOverlay.style.backgroundColor = '#111111';
loadingOverlay.style.zIndex = '9999';
loadingOverlay.style.display = 'flex';
loadingOverlay.style.flexDirection = 'column';
loadingOverlay.style.justifyContent = 'center';
loadingOverlay.style.alignItems = 'center';
loadingOverlay.style.color = '#ffffff';
loadingOverlay.style.fontFamily = 'sans-serif';
loadingOverlay.innerHTML = `
    <h3 style="margin-bottom: 10px; font-weight: 600; letter-spacing: 1px;">Loading Game Assets...</h3>
    <div style="width: 240px; height: 8px; background: #222; border-radius: 4px; overflow: hidden; border: 1px solid #333;">
        <div id="progressBar" style="width: 0%; height: 100%; background: #2ecc71; transition: width 0.1s ease;"></div>
    </div>
    <span id="progressText" style="margin-top: 10px; font-size: 13px; color: #aaa;">0%</span>
`;
document.body.appendChild(loadingOverlay);

const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

const assetEntries = [
    { url: `${repoBaseUrl}map_8.jpg` },
    { url: `${repoBaseUrl}blueantiair.png` },
    { url: `${repoBaseUrl}redantiair.png` },
    { url: `${repoBaseUrl}blueartillery.png` },
    { url: `${repoBaseUrl}redartillery.png` },
    { url: `${repoBaseUrl}blueengineer.png` },
    { url: `${repoBaseUrl}redengineer.png` },
    { url: `${repoBaseUrl}blueinfantry.png` },
    { url: `${repoBaseUrl}redinfantry.png` },
    { url: `${repoBaseUrl}bluemine.png` },
    { url: `${repoBaseUrl}redmine.png` },
    { url: `${repoBaseUrl}blueplane.png` },
    { url: `${repoBaseUrl}redplane.png` },
    { url: `${repoBaseUrl}blueship.png` },
    { url: `${repoBaseUrl}redship.png` },
    { url: `${repoBaseUrl}bluetank.png` },
    { url: `${repoBaseUrl}redtank.png` }
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
    let percent = Math.floor((loadedCount / totalAssets) * 100);
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.innerText = percent + '%';

    if (loadedCount >= totalAssets) {
        console.log("[SUCCESS][map_setup] All game assets loaded successfully.");
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.4s ease';
            setTimeout(() => loadingOverlay.remove(), 400);
        }, 300);
    }
}

function loadOnlineAsset(url, imgObj, setLoadedFlag) {
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.blob();
        })
        .then(blob => {
            let objectURL = URL.createObjectURL(blob);
            imgObj.src = objectURL;
            imgObj.onload = () => {
                setLoadedFlag(true);
                updateLoadingProgress();
            };
        })
        .catch(err => {
            imgObj.src = url;
            imgObj.onload = () => {
                setLoadedFlag(true);
                updateLoadingProgress();
            };
            imgObj.onerror = (loadErr) => {
                console.error(`[ERROR][map_setup] Failed to load asset: ${url}`, loadErr);
                updateLoadingProgress();
            };
        });
}

loadOnlineAsset(`${repoBaseUrl}map_8.jpg`, mapImg, (val) => { mapLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}blueantiair.png`, blueAntiairImg, (val) => { blueAntiairLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}redantiair.png`, redAntiairImg, (val) => { redAntiairLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}blueartillery.png`, blueArtilleryImg, (val) => { blueArtilleryLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}redartillery.png`, redArtilleryImg, (val) => { redArtilleryLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}blueengineer.png`, blueEngineerImg, (val) => { blueEngineerLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}redengineer.png`, redEngineerImg, (val) => { redEngineerLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}blueinfantry.png`, blueInfantryImg, (val) => { blueInfantryLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}redinfantry.png`, redInfantryImg, (val) => { redInfantryLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}bluemine.png`, blueMineImg, (val) => { blueMineLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}redmine.png`, redMineImg, (val) => { redMineLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}blueplane.png`, bluePlaneImg, (val) => { bluePlaneLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}redplane.png`, redPlaneImg, (val) => { redPlaneLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}blueship.png`, blueShipImg, (val) => { blueShipLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}redship.png`, redShipImg, (val) => { redShipLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}bluetank.png`, blueTankImg, (val) => { blueTankLoaded = val; });
loadOnlineAsset(`${repoBaseUrl}redtank.png`, redTankImg, (val) => { redTankLoaded = val; });

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

// Spawns initial units preserving the original placement logic structure
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
            facing: 0 // Default facing up
        });
    });

    console.log(`[SUCCESS][map_setup] Team '${team}' successfully spawned.`);
}

spawnTeam('blue');
spawnTeam('red');

console.log("[SUCCESS][map_setup] Map setup initialization complete with original base coordinate matching.");
