// src/utopia/data/buildings.ts
import type { BuildingId } from "../types";

export const BARREN_EXTRA_POP = 15;
export const BARREN_FOOD_PER_ACRE = 2;

export interface FlatEffect {
    perBuildingPerTick: number;
    affectedByBE: boolean;
}

export interface PercentEffect {
    base: number;
    max: number;
    affectedByBE: boolean;
}

export interface BuildingDef {
    id: BuildingId;
    display: string;
    livingSpace: number;
    jobs: number;

    capacity?: {
        population?: number;
        horses?: number;
        prisoners?: number;
    };

    flat?: {
        peasants?: FlatEffect;
        food?: FlatEffect;
        gold?: FlatEffect;
        wizards?: FlatEffect;
        runes?: FlatEffect;
        horses?: FlatEffect;
    };

    percent?: {
        income?: PercentEffect;

        buildCost?: PercentEffect;
        exploreGoldCost?: PercentEffect;
        exploreSoldierCost?: PercentEffect;

        ome?: PercentEffect;
        trainTime?: PercentEffect;

        draftCost?: PercentEffect;
        wages?: PercentEffect;
        trainCost?: PercentEffect;

        attackTime?: PercentEffect;
        mercCost?: PercentEffect;

        dme?: PercentEffect;

        resourceLoss?: PercentEffect;
        honorLoss?: PercentEffect;

        militaryLosses?: PercentEffect;
        plagueCure?: PercentEffect;
        birthRate?: PercentEffect;

        thiefLosses?: PercentEffect;
        tpaBonus?: PercentEffect;

        catchThieves?: PercentEffect;
        thiefDamageReduction?: PercentEffect;

        scientistSpawn?: PercentEffect;
        bookGen?: PercentEffect;
        scienceEff?: PercentEffect;
    };

    note?: string; // short effect summary
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
    HOMES: {
        id: "HOMES",
        display: "Homes",
        livingSpace: 35, // base 25 + 10 extra
        jobs: 0,
        capacity: {
            population: 10, // "Increases max population by 10"
        },
        flat: {
            peasants: {
                perBuildingPerTick: 0.3, // 0.3 peasants per tick
                affectedByBE: false, // explicitly unaffected
            },
        },
        note:
            "Houses +10 pop and generates 0.3 peasants/tick; capacity & peasant generation are unaffected by BE.",
    },

    FARMS: {
        id: "FARMS",
        display: "Farms",
        livingSpace: 25,
        jobs: 25,
        flat: {
            food: {
                perBuildingPerTick: 60, // 60 bushels per tick
                affectedByBE: true,
            },
        },
        note: "Produces 60 bushels per tick (affected by BE).",
    },

    MILLS: {
        id: "MILLS",
        display: "Mills",
        livingSpace: 25,
        jobs: 25,
        percent: {
            buildCost: {
                base: 4, // "% * 4"
                max: 100, // "Max of 100%"
                affectedByBE: true,
            },
            exploreGoldCost: {
                base: 3,
                max: 75,
                affectedByBE: true,
            },
            exploreSoldierCost: {
                base: 2,
                max: 50,
                affectedByBE: true,
            },
        },
        note:
            "Reduces build cost (4%/pct), exploration gold (3%/pct) and soldier cost (2%/pct); caps 100/75/50%.",
    },

    BANKS: {
        id: "BANKS",
        display: "Banks",
        livingSpace: 25,
        jobs: 25,
        flat: {
            gold: {
                perBuildingPerTick: 25, // 25gc per tick
                affectedByBE: true, // flat-rate -> BE affected
            },
        },
        percent: {
            income: {
                base: 1.5,
                max: 37.5,
                affectedByBE: true,
            },
        },
        note:
            "Produces 25gc/tick and increases income by 1.5% per 1% Banks (max 37.5%).",
    },

    TRAINING_GROUNDS: {
        id: "TRAINING_GROUNDS",
        display: "Training Grounds",
        livingSpace: 25,
        jobs: 25,
        percent: {
            ome: {
                base: 1.5,
                max: 37.5,
                affectedByBE: true,
            },
            trainTime: {
                base: 1,
                max: 25,
                affectedByBE: true,
            },
        },
        note:
            "Increases OME (1.5%/pct, max 37.5%) and reduces training time (1%/pct, max 25%).",
    },

    ARMOURIES: {
        id: "ARMOURIES",
        display: "Armouries",
        livingSpace: 25,
        jobs: 25,
        percent: {
            draftCost: {
                base: 2,
                max: 50,
                affectedByBE: true,
            },
            wages: {
                base: 2,
                max: 50,
                affectedByBE: true,
            },
            trainCost: {
                base: 1.5,
                max: 37.5,
                affectedByBE: true,
            },
        },
        note:
            "Reduces draft costs and wages (2%/pct, max 50%) and training costs (1.5%/pct, max 37.5%).",
    },

    BARRACKS: {
        id: "BARRACKS",
        display: "Military Barracks",
        livingSpace: 25,
        jobs: 25,
        percent: {
            attackTime: {
                base: 1.5,
                max: 37.5,
                affectedByBE: true,
            },
            mercCost: {
                base: 2,
                max: 50,
                affectedByBE: true,
            },
        },
        note:
            "Lowers attack time (1.5%/pct, max 37.5%) and reduces mercenary costs (2%/pct, max 50%).",
    },

    FORTS: {
        id: "FORTS",
        display: "Forts",
        livingSpace: 25,
        jobs: 25,
        percent: {
            dme: {
                base: 1.5,
                max: 37.5,
                affectedByBE: true,
            },
        },
        note: "Increases DME by 1.5% per 1% Forts (max 37.5%).",
    },

    CASTLES: {
        id: "CASTLES",
        display: "Castles",
        livingSpace: 25,
        jobs: 25,
        percent: {
            resourceLoss: {
                base: 2.25,
                max: 50,
                affectedByBE: true,
            },
            honorLoss: {
                base: 2,
                max: 50,
                affectedByBE: true,
            },
        },
        note:
            "Reduces land/resource losses (2.25%/pct, max 50%) and honor losses (2%/pct, max 50%) when attacked.",
    },

    HOSPITALS: {
        id: "HOSPITALS",
        display: "Hospitals",
        livingSpace: 25,
        jobs: 25,
        percent: {
            militaryLosses: {
                base: 3,
                max: 75,
                affectedByBE: true,
            },
            plagueCure: {
                base: 3,
                max: 75,
                affectedByBE: true,
            },
            birthRate: {
                base: 2,
                max: 50,
                affectedByBE: true,
            },
        },
        note:
            "Reduces military casualties (3%/pct, max 75%), gives plague-cure chance (3%/pct, max 75%) and boosts birth rate (2%/pct, max 50%).",
    },

    GUILDS: {
        id: "GUILDS",
        display: "Guilds",
        livingSpace: 25,
        jobs: 25,
        flat: {
            wizards: {
                perBuildingPerTick: 0.02, // 0.02 wizards/tick
                affectedByBE: false, // explicitly unaffected
            },
        },
        note:
            "Trains 0.02 wizards/tick and increases spell duration/success; wizard training & duration are unaffected by BE.",
    },

    TOWERS: {
        id: "TOWERS",
        display: "Towers",
        livingSpace: 25,
        jobs: 25,
        flat: {
            runes: {
                perBuildingPerTick: 12,
                affectedByBE: true,
            },
        },
        note: "Produces 12 runes per tick (affected by BE).",
    },

    THIEVES_DENS: {
        id: "THIEVES_DENS",
        display: "Thieves’ Dens",
        livingSpace: 25,
        jobs: 25,
        percent: {
            thiefLosses: {
                base: 3.6,
                max: 90,
                affectedByBE: true,
            },
            tpaBonus: {
                base: 3,
                max: 75,
                affectedByBE: true,
            },
        },
        note:
            "Reduces thief losses (3.6%/pct, max 90%) and increases thievery effectiveness (3%/pct, max 75%).",
    },

    WATCH_TOWERS: {
        id: "WATCH_TOWERS",
        display: "Watch Towers",
        livingSpace: 25,
        jobs: 25,
        percent: {
            catchThieves: {
                base: 2,
                max: 50,
                affectedByBE: true,
            },
            thiefDamageReduction: {
                base: 2.5,
                max: 62.5,
                affectedByBE: true,
            },
        },
        note:
            "Chance to catch enemy thieves (2%/pct, max 50%) and reduces damage from enemy thieves (2.5%/pct, max 62.5%).",
    },

    UNIVERSITIES: {
        id: "UNIVERSITIES",
        display: "Universities",
        livingSpace: 25,
        jobs: 25,
        percent: {
            scientistSpawn: {
                base: 1.5,
                max: 37.5,
                affectedByBE: false, // explicitly unaffected
            },
            bookGen: {
                base: 1,
                max: 25,
                affectedByBE: false,
            },
        },
        note:
            "Increases scientist spawn (1.5%/pct, max 37.5%) and book generation (1%/pct, max 25%); both unaffected by BE.",
    },

    LIBRARIES: {
        id: "LIBRARIES",
        display: "Libraries",
        livingSpace: 25,
        jobs: 25,
        percent: {
            scienceEff: {
                base: 1,
                max: 25,
                affectedByBE: false,
            },
        },
        note:
            "Increases science efficiency by 1% per 1% Libraries (max 25%); unaffected by BE.",
    },

    STABLES: {
        id: "STABLES",
        display: "Stables",
        livingSpace: 25,
        jobs: 25,
        capacity: {
            horses: 80,
        },
        flat: {
            horses: {
                perBuildingPerTick: 2,
                affectedByBE: true,
            },
        },
        note: "Holds 80 horses and produces 2 horses per tick (flat production affected by BE).",
    },

    DUNGEONS: {
        id: "DUNGEONS",
        display: "Dungeons",
        livingSpace: 25,
        jobs: 25,
        capacity: {
            prisoners: 30,
        },
        note: "Holds up to 30 prisoners per dungeon.",
    },
};

export const BUILDING_LIST = Object.values(BUILDINGS);

export const BARREN = {
    livingSpace: 15,
    jobs: 0,
    capacity: {
        population: BARREN_EXTRA_POP, // 15
    },
    flat: {
        food: {
            perAcrePerTick: BARREN_FOOD_PER_ACRE, // 2
            affectedByBE: false,
        },
    },
};