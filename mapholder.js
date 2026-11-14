// =========================================================================
// MAP HOLDER & LEVEL-TO-MAP REGISTRY (mapholder.js) - Levels 1 to 55
// =========================================================================

const mapRegistry = {
    map_8: {
        key: 'map_8',
        fileName: 'map_8.jpg',
        useLegacyTerrain: true,
        water: [],
        land: [],
        hq: [
            { custom_name: "rbc_11_0", type_name: "rbc", coordinates: "11,0" },
            { custom_name: "bbc_0_11", type_name: "bbc", coordinates: "0,11" },
            { custom_name: "r_10_0", type_name: "r", coordinates: "10,0" },
            { custom_name: "r_12_0", type_name: "r", coordinates: "12,0" },
            { custom_name: "r_10_1", type_name: "r", coordinates: "10,1" },
            { custom_name: "r_11_1", type_name: "r", coordinates: "11,1" },
            { custom_name: "r_12_1", type_name: "r", coordinates: "12,1" },
            { custom_name: "b_0_10", type_name: "b", coordinates: "0,10" },
            { custom_name: "b_1_10", type_name: "b", coordinates: "1,10" },
            { custom_name: "b_1_11", type_name: "b", coordinates: "1,11" },
            { custom_name: "b_0_12", type_name: "b", coordinates: "0,12" },
            { custom_name: "b_1_12", type_name: "b", coordinates: "1,12" }
        ],
        gold_core_links: [
            { custom_name: "gc_6_4", type_name: "gold_core_links", coordinates: "6,4", linked_tiles: ["6,3", "6,5", "5,4", "7,4", "5,3", "5,5", "7,3", "7,5"], linked_units_and_industry: [] },
            { custom_name: "gc_1_5", type_name: "gold_core_links", coordinates: "1,5", linked_tiles: ["1,4", "1,6", "0,5", "2,5", "0,4", "0,6", "2,4", "2,6"], linked_units_and_industry: [] },
            { custom_name: "gc_12_7", type_name: "gold_core_links", coordinates: "12,7", linked_tiles: ["12,6", "12,8", "11,7", "13,7", "11,6", "11,8", "13,6", "13,8"], linked_units_and_industry: [] },
            { custom_name: "gc_5_14", type_name: "gold_core_links", coordinates: "5,14", linked_tiles: ["5,13", "5,15", "4,14", "6,14", "4,13", "4,15", "6,13", "6,15"], linked_units_and_industry: [] },
            { custom_name: "gc_16_12", type_name: "gold_core_links", coordinates: "16,12", linked_tiles: ["16,11", "16,13", "15,12", "17,12", "15,11", "15,13", "17,11", "17,13"], linked_units_and_industry: [] },
            { custom_name: "gc_11_16", type_name: "gold_core_links", coordinates: "11,16", linked_tiles: ["11,15", "11,17", "10,16", "12,16", "10,15", "10,17", "12,15", "12,17"], linked_units_and_industry: [] }
        ]
    },

    botmapinfo1: {
        key: 'botmapinfo1',
        fileName: 'botmapinfo1.jpg',
        useLegacyTerrain: false,
        water: [
            "0,17","0,16","0,15","1,15","0,14","1,14","2,14","0,13","0,12","1,12","1,13","2,12","2,13","3,12","3,13","4,12","4,11","4,10","5,10","6,10","7,10","8,10","8,9","9,9","9,8","10,8","10,7","9,7","9,6","8,6","8,5","7,5","7,6","6,5","6,6","5,5","5,6","4,5","4,6","3,5","3,6","2,5","2,6","2,4","1,4","1,5","1,6","1,3","0,3","0,2","0,1","0,4","0,5","0,6","0,7","1,7","0,8","1,8","2,7","2,8","3,7","3,8","4,7","4,8","5,7","5,8","6,7","6,8","7,7","7,8","8,7","8,8","7,9","6,9","5,9","4,9","3,9","3,11","3,10","2,10","2,11","2,9","1,9","1,10","1,11","0,11","0,10","0,9","13,7","13,8","14,7","14,8","14,6","14,5","15,5","15,6","15,7","15,8","14,9","15,9","15,10","16,10","17,10","17,11","16,11","16,9","17,9","17,8","16,8","16,7","17,7","17,6","16,6","16,5","17,5","17,4","16,4","15,4"
        ],
        land: [
            "0,0","1,0","1,1","1,2","2,1","2,2","2,0","2,3","3,3","3,4","4,3","4,4","4,2","3,2","3,1","4,1","3,0","4,0","5,0","5,1","6,0","6,1","7,0","7,1","7,2","7,3","7,4","6,4","5,4","8,3","8,4","9,3","9,4","9,2","8,2","8,1","9,5","10,4","10,3","10,5","11,3","11,2","12,2","12,3","12,1","13,1","13,0","14,0","14,1","13,2","14,2","13,3","14,3","13,4","14,4","13,5","13,6","12,6","11,6","10,6","11,7","12,7","11,8","12,8","11,9","10,9","12,9","13,9","9,10","10,10","11,10","12,10","13,10","14,10","8,11","7,11","6,11","5,11","5,12","6,12","5,13","6,13","4,13","4,14","3,14","3,15","2,15","2,16","1,17","1,16","2,17","3,16","3,17","4,16","4,17","4,15","5,15","5,16","5,17","5,14","6,14","6,15","6,16","6,17","7,17","8,17","9,17","9,16","10,16","9,15","10,15","11,15","11,14","10,14","9,14","8,14","7,14","7,13","7,12","8,12","8,13","9,12","9,13","10,12","10,13","9,11","10,11","11,11","11,12","11,13","12,12","12,11","13,12","13,11","14,11","14,12","15,11","15,12","16,12","17,12","14,13","14,14","15,13","15,14","13,15","14,15","15,15","14,16","15,16","15,17","16,15","17,15","17,14","16,14","16,13","17,13","15,3","16,3","17,3","17,2","17,1","17,0","16,0","15,0"
        ],
        hq: [
            { custom_name: "rbc_12_17", type_name: "rbc", coordinates: "12,17" },
            { custom_name: "bbc_10_0", type_name: "bbc", coordinates: "10,0" },
            { custom_name: "r_10_17", type_name: "r", coordinates: "10,17" },
            { custom_name: "r_11_17", type_name: "r", coordinates: "11,17" },
            { custom_name: "r_11_16", type_name: "r", coordinates: "11,16" },
            { custom_name: "r_12_16", type_name: "r", coordinates: "12,16" },
            { custom_name: "r_13_16", type_name: "r", coordinates: "13,16" },
            { custom_name: "r_13_17", type_name: "r", coordinates: "13,17" },
            { custom_name: "r_14_17", type_name: "r", coordinates: "14,17" },
            { custom_name: "r_12_15", type_name: "r", coordinates: "12,15" },
            { custom_name: "b_8_0", type_name: "b", coordinates: "8,0" },
            { custom_name: "b_9_0", type_name: "b", coordinates: "9,0" },
            { custom_name: "b_9_1", type_name: "b", coordinates: "9,1" },
            { custom_name: "b_10_1", type_name: "b", coordinates: "10,1" },
            { custom_name: "b_10_2", type_name: "b", coordinates: "10,2" },
            { custom_name: "b_11_1", type_name: "b", coordinates: "11,1" },
            { custom_name: "b_11_0", type_name: "b", coordinates: "11,0" },
            { custom_name: "b_12_0", type_name: "b", coordinates: "12,0" }
        ],
        gold_core_links: [
            { custom_name: "gc_7_16", type_name: "gold_core_links", coordinates: "7,16", linked_tiles: ["7,15", "8,15", "8,16"], linked_units_and_industry: [] },
            { custom_name: "gc_12_13", type_name: "gold_core_links", coordinates: "12,13", linked_tiles: ["12,14", "13,14", "13,13"], linked_units_and_industry: [] },
            { custom_name: "gc_16_17", type_name: "gold_core_links", coordinates: "16,17", linked_tiles: ["16,16", "17,16", "17,17"], linked_units_and_industry: [] },
            { custom_name: "gc_11_5", type_name: "gold_core_links", coordinates: "11,5", linked_tiles: ["11,4", "12,4", "12,5"], linked_units_and_industry: [] },
            { custom_name: "gc_15_2", type_name: "gold_core_links", coordinates: "15,2", linked_tiles: ["15,1", "16,1", "16,2"], linked_units_and_industry: [] },
            { custom_name: "gc_6_3", type_name: "gold_core_links", coordinates: "6,3", linked_tiles: ["5,3", "5,2", "6,2"], linked_units_and_industry: [] }
        ]
    },

    botmapinfo2: {
        key: 'botmapinfo2',
        fileName: 'botmapinfo2.jpg',
        useLegacyTerrain: false,
        water: [
            "17,0","16,0","15,0","14,0","13,0","12,0","11,0","10,0","9,0","8,0","7,0","6,0","5,0","4,0","3,0","2,0","1,0","0,0","1,1","2,1","3,1","3,2","4,1","4,2","5,1","5,2","6,1","7,1","8,1","9,1","9,2","12,1","13,1","15,1","14,1","16,1","17,1"
        ],
        land: [
            "0,13","0,14","0,15","0,16","0,17","1,13","1,14","1,15","1,16","1,17","2,13","2,14","2,15","2,16","2,17","3,15","3,16","3,17","4,15","4,16","4,17","5,15","5,16","5,17","6,15","6,16","6,17","7,15","7,16","7,17","8,15","8,16","8,17","9,15","9,16","9,17","10,15","10,16","10,17","11,15","11,16","11,17","12,15","12,16","12,17","13,15","13,16","13,17","14,16","14,17","15,16","15,17","16,16","16,17","17,16","17,17","5,13","5,14","6,13","6,14","7,13","7,14","8,13","8,14","9,13","9,14","10,13","10,14","11,13","11,14","12,13","12,14","13,13","13,14","3,10","3,11","3,12","4,10","4,11","4,12","5,10","5,11","5,12","6,10","6,11","6,12","7,10","7,11","7,12","8,10","8,11","8,12","9,10","9,11","9,12","6,3","6,4","6,5","6,6","6,7","6,8","6,9","7,3","7,4","7,5","7,6","7,7","7,8","7,9","8,3","8,4","8,5","8,6","8,7","8,8","8,9","9,3","9,4","9,5","9,6","9,7","9,8","9,9","10,3","10,4","10,5","10,6","10,7","10,8","10,9","11,2","11,3","11,4","11,5","11,6","12,2","12,3","12,4","12,5","12,6","13,6","13,7","14,6","14,7","15,6","15,7","16,6","16,7","15,2","15,3","15,4","15,5","16,2","16,3","16,4","16,5","17,2","17,3","17,4","17,5","12,9","12,10","12,11","12,12","13,9","13,10","13,11","13,12","14,9","14,10","14,11","14,12","16,13","16,14","16,15","17,13","17,14","17,15","0,3","0,4","0,5","0,6","0,7","1,3","1,4","1,5","1,6","1,7","2,3","2,4","2,5","2,6","2,7","3,3","3,4","3,5","3,6","3,7","4,3","5,3","2,2","1,2","0,2","0,1","4,6","4,7","5,6","5,7","1,8","2,8","2,9","3,8","3,9","2,11","2,12","1,12","14,13","15,13","15,12","15,11","15,10","16,11","16,12","17,12","11,9","11,10","10,10","13,8","14,8","15,8","17,6","13,3","14,3","14,2","13,2","10,2","10,1","11,1","8,2","7,2","6,2"
        ],
        hq: [
            { custom_name: "rbc_17_9", type_name: "rbc", coordinates: "17,9" },
            { custom_name: "bbc_0_10", type_name: "bbc", coordinates: "0,10" },
            { custom_name: "r_16_9", type_name: "r", coordinates: "16,9" },
            { custom_name: "r_15_9", type_name: "r", coordinates: "15,9" },
            { custom_name: "r_16_8", type_name: "r", coordinates: "16,8" },
            { custom_name: "r_17_8", type_name: "r", coordinates: "17,8" },
            { custom_name: "r_17_7", type_name: "r", coordinates: "17,7" },
            { custom_name: "r_16_10", type_name: "r", coordinates: "16,10" },
            { custom_name: "r_17_10", type_name: "r", coordinates: "17,10" },
            { custom_name: "r_17_11", type_name: "r", coordinates: "17,11" },
            { custom_name: "b_0_12", type_name: "b", coordinates: "0,12" },
            { custom_name: "b_0_11", type_name: "b", coordinates: "0,11" },
            { custom_name: "b_1_11", type_name: "b", coordinates: "1,11" },
            { custom_name: "b_1_10", type_name: "b", coordinates: "1,10" },
            { custom_name: "b_2_10", type_name: "b", coordinates: "2,10" },
            { custom_name: "b_1_9", type_name: "b", coordinates: "1,9" },
            { custom_name: "b_0_9", type_name: "b", coordinates: "0,9" },
            { custom_name: "b_0_8", type_name: "b", coordinates: "0,8" }
        ],
        gold_core_links: [
            { custom_name: "gc_3_13", type_name: "gold_core_links", coordinates: "3,13", linked_tiles: ["3,14", "4,14", "4,13"], linked_units_and_industry: [] },
            { custom_name: "gc_4_9", type_name: "gold_core_links", coordinates: "4,9", linked_tiles: ["4,8", "5,8", "5,9"], linked_units_and_industry: [] },
            { custom_name: "gc_5_5", type_name: "gold_core_links", coordinates: "5,5", linked_tiles: ["4,5", "4,4", "5,4"], linked_units_and_industry: [] },
            { custom_name: "gc_11_7", type_name: "gold_core_links", coordinates: "11,7", linked_tiles: ["11,8", "12,8", "12,7"], linked_units_and_industry: [] },
            { custom_name: "gc_10_11", type_name: "gold_core_links", coordinates: "10,11", linked_tiles: ["11,11", "11,12", "10,12"], linked_units_and_industry: [] },
            { custom_name: "gc_13_5", type_name: "gold_core_links", coordinates: "13,5", linked_tiles: ["13,4", "14,4", "14,5"], linked_units_and_industry: [] },
            { custom_name: "gc_14_14", type_name: "gold_core_links", coordinates: "14,14", linked_tiles: ["15,14", "15,15", "14,15"], linked_units_and_industry: [] }
        ]
    },

    botmapinfo3: {
        key: 'botmapinfo3',
        fileName: 'botmapinfo3.jpg',
        useLegacyTerrain: false,
        water: [
            "6,13","6,12","6,11","6,10","6,9","6,8","6,7","6,6","7,5","7,6","7,7","7,8","5,9","5,10","5,11","7,11","7,12","7,13","7,14","10,12","10,11","10,10","10,9","8,17","9,17","10,17","11,17","10,16","11,16","11,9","11,8","12,8","14,10","14,11","14,12","15,11","15,12","12,7","11,2","11,3","11,4","12,3","12,4","1,0","0,0"
        ],
        land: [
            "12,13","12,14","12,15","12,16","12,17","13,13","13,14","13,15","13,16","13,17","14,13","14,14","14,15","14,16","14,17","16,0","16,1","16,2","16,3","16,4","16,5","16,6","16,7","16,8","16,9","16,10","16,11","16,12","16,13","16,14","17,0","17,1","17,2","17,3","17,4","17,5","17,6","17,7","17,8","17,9","17,10","17,11","17,12","17,13","17,14","2,0","2,1","3,0","3,1","4,0","4,1","5,0","5,1","6,0","6,1","7,0","7,1","8,0","8,1","9,0","9,1","10,0","10,1","11,0","11,1","12,0","12,1","13,0","13,1","14,0","14,1","15,0","15,1","2,2","2,3","2,4","2,5","2,6","3,2","3,3","3,4","3,5","3,6","4,2","4,3","4,4","4,5","4,6","0,8","0,9","0,10","0,11","1,8","1,9","1,10","1,11","2,8","2,9","2,10","2,11","3,9","3,10","3,11","3,12","3,13","3,14","3,15","3,16","3,17","4,9","4,10","4,11","4,12","4,13","4,14","4,15","4,16","4,17","0,14","0,15","0,16","0,17","1,14","1,15","1,16","1,17","2,14","2,15","2,16","2,17","8,2","8,3","8,4","8,5","8,6","8,7","8,8","8,9","8,10","8,11","8,12","8,13","9,2","9,3","9,4","9,5","9,6","9,7","9,8","9,9","9,10","9,11","9,12","9,13","10,5","10,6","11,5","11,6","12,5","12,6","13,5","13,6","5,15","5,16","5,17","6,15","6,16","6,17","7,15","7,16","7,17","0,1","0,2","0,3","0,4","1,1","1,2","1,3","1,4","1,5","1,7","2,7","5,5","5,6","5,7","5,8","6,5","5,12","5,13","5,14","6,14","8,16","8,15","9,16","8,14","10,13","11,13","11,14","11,15","11,12","12,12","13,12","11,11","11,10","12,9","13,9","13,8","13,7","14,8","14,9","15,8","15,9","15,10","11,7","10,7","10,8","15,13","15,14","15,15","15,16","16,15","15,4","15,5","14,4","14,5","13,4","13,2","12,2","13,3","10,2","10,3","10,4","7,4","7,3","7,2","6,2","5,2","0,12","0,13","7,9","7,10"
        ],
        hq: [
            { custom_name: "rbc_17_17", type_name: "rbc", coordinates: "17,17" },
            { custom_name: "bbc_0_6", type_name: "bbc", coordinates: "0,6" },
            { custom_name: "r_15_17", type_name: "r", coordinates: "15,17" },
            { custom_name: "r_16_17", type_name: "r", coordinates: "16,17" },
            { custom_name: "r_16_16", type_name: "r", coordinates: "16,16" },
            { custom_name: "r_17_16", type_name: "r", coordinates: "17,16" },
            { custom_name: "r_17_15", type_name: "r", coordinates: "17,15" },
            { custom_name: "b_0_7", type_name: "b", coordinates: "0,7" },
            { custom_name: "b_1_6", type_name: "b", coordinates: "1,6" },
            { custom_name: "b_0_5", type_name: "b", coordinates: "0,5" }
        ],
        gold_core_links: [
            { custom_name: "gc_2_12", type_name: "gold_core_links", coordinates: "2,12", linked_tiles: ["2,13", "1,13", "1,12"], linked_units_and_industry: [] },
            { custom_name: "gc_4_7", type_name: "gold_core_links", coordinates: "4,7", linked_tiles: ["3,7", "3,8", "4,8"], linked_units_and_industry: [] },
            { custom_name: "gc_6_4", type_name: "gold_core_links", coordinates: "6,4", linked_tiles: ["5,4", "5,3", "6,3"], linked_units_and_industry: [] },
            { custom_name: "gc_14_3", type_name: "gold_core_links", coordinates: "14,3", linked_tiles: ["14,2", "15,2", "15,3"], linked_units_and_industry: [] },
            { custom_name: "gc_14_7", type_name: "gold_core_links", coordinates: "14,7", linked_tiles: ["14,6", "15,6", "15,7"], linked_units_and_industry: [] },
            { custom_name: "gc_12_10", type_name: "gold_core_links", coordinates: "12,10", linked_tiles: ["13,10", "13,11", "12,11"], linked_units_and_industry: [] },
            { custom_name: "gc_9_14", type_name: "gold_core_links", coordinates: "9,14", linked_tiles: ["10,14", "10,15", "9,15"], linked_units_and_industry: [] }
        ]
    }
};

function getMapKeyForLevel(lvlNum) {
    if (lvlNum >= 41) return 'botmapinfo3'; // Levels 41-55
    if (lvlNum >= 31) return 'botmapinfo2'; // Levels 31-40
    if (lvlNum >= 21) return 'botmapinfo1'; // Levels 21-30
    return 'map_8';                       // Levels 1-20
}

function getMapConfigByKey(key) {
    return mapRegistry[key] || mapRegistry['map_8'];
}

function parseCoordString(coordStr) {
    const [c, r] = coordStr.split(',').map(Number);
    return { c, r };
}

console.log("[SUCCESS][mapholder] Level-to-map mappings successfully configured for Levels 1 to 55.");
