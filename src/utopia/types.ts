// src/utopia/types.ts

// All Age 113 races
export type RaceId =
    | "AVIAN"
    | "DARK_ELF"
    | "DWARF"
    | "ELF"
    | "FAERY"
    | "HALFLING"
    | "HUMAN"
    | "ORC"
    | "UNDEAD"
    | "GNOME";

// All Age 113 personalities
export type PersonalityId =
    | "ARTISAN"
    | "CLERIC"
    | "HERETIC"
    | "MYSTIC"
    | "ROGUE"
    | "TACTICIAN"
    | "WARRIOR"
    | "PALADIN"
    | "NECROMANCER"
    | "GENERAL";

// Minimal building set for now
export type BuildingId =
    | "HOMES"
    | "FARMS"
    | "MILLS"
    | "BANKS"
    | "TRAINING_GROUNDS"
    | "ARMOURIES"
    | "BARRACKS"
    | "FORTS"
    | "CASTLES"
    | "HOSPITALS"
    | "GUILDS"
    | "TOWERS"
    | "THIEVES_DENS"
    | "WATCH_TOWERS"
    | "UNIVERSITIES"
    | "LIBRARIES"
    | "STABLES"
    | "DUNGEONS";

// Represents the current state of a province
export interface Province {
    name: string;
    race: RaceId;
    personality: PersonalityId;

    // NEW: throne-style metadata
    location: string;   // e.g. "4:4"
    rulerName: string;  // "Cayn"
    honorLevel: number; // 1, 2, 3... (we can map to numbers later)

    acres: number;
    builtAcres: number;
    barrenAcres: number;

    peasants: number;
    soldiers: number;
    offSpecs: number;
    defSpecs: number;
    elites: number;
    thieves: number;
    wizards: number;

    // how many of each building type we have
    buildings: Partial<Record<BuildingId, number>>;

    gold: number;
    wageRate: number; // 1.0 = 100% wages

    food: number; // current stored food (bushels)
    runes: number;
    horses: number;
    prisoners: number;
    networth: number;
    tradeBalance: number;
    trainingCredits: number;
    buildingCredits: number;

    intelOffenseHome: number;
    intelDefenseHome: number;
    intelWagePercent: number;
    draftTargetPercent: number;
}
