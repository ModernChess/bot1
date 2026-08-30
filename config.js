const GRID_SIZE = 18;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

// Unit configuration lookup table categorized by team with asset image paths and power attributes
const UNIT_TYPES = {
    red: {
        redinf: { name: 'Red Infantry', type: 'infantry', image: 'images/red_infantry.jpg', speed: 2, power: 1 },
        redtank: { name: 'Red Tank', type: 'tank', image: 'images/red_tank.jpg', speed: 3, power: 2 },
        redart: { name: 'Red Artillery', type: 'artillery', image: 'images/red_artillery.jpg', speed: 2, power: 'infinity' },
        redship: { name: 'Red Ship', type: 'ship', image: 'images/red_ship.jpg', speed: 4, power: 'infinity' },
        redflag: { name: 'Red Flag', type: 'flag', image: 'images/red_flag.jpg', speed: 0, power: 0 }
    },
    blue: {
        blueinf: { name: 'Blue Infantry', type: 'infantry', image: 'images/blue_infantry.jpg', speed: 2, power: 1 },
        bluetank: { name: 'Blue Tank', type: 'tank', image: 'images/blue_tank.jpg', speed: 3, power: 2 },
        blueart: { name: 'Blue Artillery', type: 'artillery', image: 'images/blue_artillery.jpg', speed: 2, power: 'infinity' },
        blueship: { name: 'Blue Ship', type: 'ship', image: 'images/blue_ship.jpg', speed: 2, power: 'infinity' },
        blueflag: { name: 'Blue Flag', type: 'flag', image: 'images/blue_flag.jpg', speed: 0, power: 0 }
    }
};

let units = [
    // Red Team: 3 tanks and 6 infantry on row 2 (y = 1) columns 0 to 8
    { id: 1, team: 'red', key: 'redinf', x: 0, y: 1, memoryPath: [], currentTurnIndex: 0 },
    { id: 2, team: 'red', key: 'redinf', x: 1, y: 1, memoryPath: [], currentTurnIndex: 0 },
    { id: 3, team: 'red', key: 'redinf', x: 2, y: 1, memoryPath: [], currentTurnIndex: 0 },
    { id: 4, team: 'red', key: 'redinf', x: 3, y: 1, memoryPath: [], currentTurnIndex: 0 },
    { id: 5, team: 'red', key: 'redinf', x: 4, y: 1, memoryPath: [], currentTurnIndex: 0 },
    { id: 6, team: 'red', key: 'redinf', x: 5, y: 1, memoryPath: [], currentTurnIndex: 0 },
    { id: 7, team: 'red', key: 'redtank', x: 6, y: 1, memoryPath: [], currentTurnIndex: 0 },
    { id: 8, team: 'red', key: 'redtank', x: 7, y: 1, memoryPath: [], currentTurnIndex: 0 },
    { id: 9, team: 'red', key: 'redtank', x: 8, y: 1, memoryPath: [], currentTurnIndex: 0 },

    // Blue Team: 3 tanks and 6 infantry on row 17 (y = 16) columns 0 to 8
    { id: 10, team: 'blue', key: 'blueinf', x: 0, y: 16, memoryPath: [], currentTurnIndex: 0 },
    { id: 11, team: 'blue', key: 'blueinf', x: 1, y: 16, memoryPath: [], currentTurnIndex: 0 },
    { id: 12, team: 'blue', key: 'blueinf', x: 2, y: 16, memoryPath: [], currentTurnIndex: 0 },
    { id: 13, team: 'blue', key: 'blueinf', x: 3, y: 16, memoryPath: [], currentTurnIndex: 0 },
    { id: 14, team: 'blue', key: 'blueinf', x: 4, y: 16, memoryPath: [], currentTurnIndex: 0 },
    { id: 15, team: 'blue', key: 'blueinf', x: 5, y: 16, memoryPath: [], currentTurnIndex: 0 },
    { id: 16, team: 'blue', key: 'bluetank', x: 6, y: 16, memoryPath: [], currentTurnIndex: 0 },
    { id: 17, team: 'blue', key: 'bluetank', x: 7, y: 16, memoryPath: [], currentTurnIndex: 0 },
    { id: 18, team: 'blue', key: 'bluetank', x: 8, y: 16, memoryPath: [], currentTurnIndex: 0 }
];

// Board Layout Feature Mappings (Coordinates to metadata/types)
const boardFeatures = {
    cores: {
        rc: ['M1'],
        bc: ['A12']
    },
    bases: {
        r: ['K1', 'M1', 'K2', 'L2', 'M2'],
        b: ['A11', 'B11', 'B12', 'A13', 'B13']
    },
    navyPorts: {
        nr: ['L6'],
        nb: ['F12']
    },
    goldCores: {
        gc1: 'M8',
        gc2: 'Q13',
        gc3: 'L17',
        gc4: 'F15',
        gc5: 'G5',
        gc6: 'B6'
    },
    goldSquares: {
        g1: ['L7', 'M7', 'N7', 'L8', 'N8', 'M9', 'N9'],
        g2: ['P12', 'Q12', 'R12', 'P13', 'R13', 'P14', 'Q14', 'R14'],
        g3: ['K16', 'L16', 'M16', 'K17', 'M17', 'K18', 'L18', 'M18'],
        g4: ['E14', 'F14', 'G14', 'E15', 'G15', 'E16', 'F16', 'G16'],
        g5: ['F4', 'G4', 'H4', 'F5', 'H5', 'F6', 'G6', 'H6'],
        g6: ['A5', 'B5', 'C5', 'A6', 'C6', 'A7', 'B7', 'C7']
    }
};

const rawPriorities = [-5, -3, -8, -0.2, 0, 0.9, 2, 7, 18];

// Combine Cores, Navy Ports, and Gold Cores into a target deployment list
const deploymentCoords = [
    ...boardFeatures.cores.rc,
    ...boardFeatures.cores.bc,
    ...boardFeatures.navyPorts.nr,
    ...boardFeatures.navyPorts.nb,
    ...Object.values(boardFeatures.goldCores)
];

let priorityUnits = rawPriorities.map((p, index) => {
    let coordStr = deploymentCoords[index % deploymentCoords.length];
    let colChar = coordStr.charAt(0);
    let rowNum = parseInt(coordStr.slice(1), 10);
    
    return {
        id: index + 1,
        x: colChar.charCodeAt(0) - 65,
        y: rowNum - 1,
        priority: p,
        name: `P${index+1}(${p})`
    };
});

let selectedUnitId = 1;
let selectedPriorityId = null;
let renderedPathNodes = [];

const waterMap = new Uint8Array(TOTAL_CELLS);
const priorityCostMap = new Float32Array(TOTAL_CELLS);
const priorityBlockedMap = new Uint8Array(TOTAL_CELLS);

// Exact water tile list based on your 18x18 spreadsheet coordinates
const waterList = [
    'I5', 'J5', 'I6', 'J6', 'K6', 'H7', 'I7', 'J7', 'K7', 'G8', 'H8', 'I8', 'J8', 'K8', 
    'E9', 'F9', 'G9', 'H9', 'I9', 'J9', 'K9', 'L9', 'E10', 'F10', 'G10', 'H10', 'I10', 
    'J10', 'K10', 'L10', 'F11', 'G11', 'H11', 'I11', 'J11', 'K11', 'L11', 'M11', 'I12', 
    'J12', 'K12', 'L12', 'M12', 'N12', 'K13', 'L13', 'M13', 'N13', 'L14', 'M14', 'N14'
];

waterList.forEach(coord => {
    let colChar = coord.charAt(0);
    let rowNum = parseInt(coord.slice(1), 10);
    
    let c = colChar.charCodeAt(0) - 65; 
    let r = rowNum - 1;                 
    
    if (c >= 0 && c < GRID_SIZE && r >= 0 && r < GRID_SIZE) {
        waterMap[r * GRID_SIZE + c] = 1;
    }
});

class FastMinHeap {
    constructor() { this.heap = []; }
    push(node) { this.heap.push(node); this.up(this.heap.length - 1); }
    pop() {
        if (this.heap.length === 0) return null;
        const top = this.heap[0];
        const bottom = this.heap.pop();
        if (this.heap.length > 0) { this.heap[0] = bottom; this.down(0); }
        return top;
    }
    size() { return this.heap.length; }
    up(i) {
        let p = (i - 1) >> 1;
        while (i > 0 && this.heap[i].fScore < this.heap[p].fScore) {
            let tmp = this.heap[i]; this.heap[i] = this.heap[p]; this.heap[p] = tmp;
            i = p; p = (i - 1) >> 1;
        }
    }
    down(i) {
        let l = (i << 1) + 1, r = l + 1, smallest = i;
        if (l < this.heap.length && this.heap[l].fScore < this.heap[smallest].fScore) smallest = l;
        if (r < this.heap.length && this.heap[r].fScore < this.heap[smallest].fScore) smallest = r;
        if (smallest !== i) {
            let tmp = this.heap[i]; this.heap[i] = this.heap[smallest]; this.heap[smallest] = tmp;
            this.down(smallest);
        }
    }
}
