// src/utopia/data/constants.ts

// ----- Age / Time -----
export const AGE = {
    NUMBER: 113,
    TICK_HOURS: 1,
    TICKS_PER_DAY: 24,
    PROTECTION_TICKS: 24,
};

// ----- Jobs & Building Efficiency -----
export const JOBS = {
    JOBS_PER_COMPLETED_BUILDING: 25,
    JOBS_EXCLUDED_BUILDINGS: ["Homes"], // no jobs from Homes
};

export const BE = {
    OPTIMAL_JOBS_FACTOR: 0.67, // optimal workers = jobs * 0.67
    BASE_A: 0.5,               // BE = 0.5 * (1 + jobFillRatio) * (1 + raceBeBonus)
};

// ----- Economy -----
export const ECONOMY = {
    GC_PER_EMPLOYED_PEASANT: 3,   // gold per peasant per tick
    GC_PER_UNEMPLOYED_PEASANT: 1, // (we'll handle unemployment later)
    GC_PER_PRISONER: 0.75,        // not used yet
    GC_PER_BANK_FLAT: 25,         // flat gc per Bank Building
    BANK_INCOME_BONUS_PER_PERCENT: 0.03, // 3% per 1% Banks
};

// ----- Food -----
export const FOOD = {
    CONSUMPTION_PER_POP: 0.25,   // Food eaten per population point per tick
    FARMS_PRODUCTION_PER_BUILDING: 60,    // Food produced per Farm building per tick at 100% BE
    BARREN_FOOD_PER_ACRE: 0,   // (optional) any base food from barren acres, leave 0 for now
};

// ----- Wages -----
export const WAGES = {
    // base gold per unit per tick at 100% wages
    // Soldiers do not get paid wages in-game
    SOLDIER: 0,
    OFF_SPEC: 0.5,
    DEF_SPEC: 0.5,
    ELITE: 0.75,
};
