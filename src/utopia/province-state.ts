import type { Province } from "./types";
import { SCIENCE_CATEGORIES, createEmptyScience } from "./data/science";
import { createProvinceSpellbook } from "./data/spells";

export const initialProvince: Province = {
    name: "Province",
    race: "HUMAN",
    personality: "PALADIN",

    location: "0:0",
    rulerName: "",
    honorLevel: 0,

    ritual: null,
    ritualEffectiveness: 100,
    dragon: null,
    activeSpells: createProvinceSpellbook("HUMAN", "PALADIN"),

    acres: 0,
    builtAcres: 0,
    barrenAcres: 0,

    peasants: 0,
    soldiers: 0,
    offSpecs: 0,
    defSpecs: 0,
    elites: 0,
    thieves: 0,
    wizards: 0,

    buildings: {
        HOMES: 0,
        FARMS: 0,
        MILLS: 0,
        BANKS: 0,
        TRAINING_GROUNDS: 0,
        ARMOURIES: 0,
        BARRACKS: 0,
        FORTS: 0,
        CASTLES: 0,
        HOSPITALS: 0,
        GUILDS: 0,
        TOWERS: 0,
        THIEVES_DENS: 0,
        WATCH_TOWERS: 0,
        UNIVERSITIES: 0,
        LIBRARIES: 0,
        STABLES: 0,
        DUNGEONS: 0,
    },

    science: createEmptyScience(),

    gold: 0,
    wageRate: 1.0,
    beOverride: null,

    food: 0,
    runes: 0,
    horses: 0,
    prisoners: 0,
    networth: 0,
    tradeBalance: 0,
    trainingCredits: 0,
    buildingCredits: 0,

    intelOffenseHome: 0,
    intelDefenseHome: 0,
    intelWagePercent: 100,
    draftTargetPercent: 60,
};

export function cloneProvince(prov: Province): Province {
    return {
        ...prov,
        buildings: { ...prov.buildings },
        science: SCIENCE_CATEGORIES.reduce((acc, category) => {
            acc[category.id] = { ...prov.science[category.id] };
            return acc;
        }, {} as Province["science"]),
        activeSpells: prov.activeSpells.map((spell) => ({ ...spell })),
        rawIntel: prov.rawIntel ? { ...prov.rawIntel } : undefined,
    };
}