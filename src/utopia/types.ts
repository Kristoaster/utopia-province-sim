// src/utopia/types.ts

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

export type PersonalityId =
    | "ARTISAN"
    | "CLERIC"
    | "GENERAL"
    | "HERETIC"
    | "MYSTIC"
    | "NECROMANCER"
    | "PALADIN"
    | "ROGUE"
    | "TACTICIAN"
    | "WARRIOR"
    | "WAR_HERO";

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

export type ScienceCategoryId =
    | "alchemy"
    | "tools"
    | "housing"
    | "production"
    | "bookkeeping"
    | "artisan"
    | "strategy"
    | "siege"
    | "tactics"
    | "valor"
    | "heroism"
    | "resilience"
    | "crime"
    | "channeling"
    | "shielding"
    | "cunning"
    | "sorcery"
    | "finesse";

export interface ScienceEntry {
    books: number;
    effect: number;
}

export type ProvinceScience = Record<ScienceCategoryId, ScienceEntry>;

export interface Province {
    name: string;
    race: RaceId;
    personality: PersonalityId;

    location: string;
    rulerName: string;
    honorLevel: number;

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

    buildings: Partial<Record<BuildingId, number>>;

    science: ProvinceScience;

    gold: number;
    wageRate: number;

    food: number;
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

    rawIntel?: Record<string, string>;
}