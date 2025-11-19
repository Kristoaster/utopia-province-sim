// src/utopia/calc/income.ts
import type { Province } from "../types.ts";
import { ECONOMY, JOBS } from "../data/constants.ts";
import { RACES } from "../age113/races";
import { calculateBE } from "./be.ts";

export interface IncomeResult {
    raw: {
        peasants: number;   // gold from all peasants (employed + unemployed)
        banksFlat: number;  // flat gold from Banks (already BE-scaled)
        prisoners: number;  // gold from prisoners
    };
    mods: {
        raceIncomeMultiplier: number;
        beFromBanks: number;
    };
    finalIncome: number;
}

export function calculateIncome(prov: Province): IncomeResult {
    const race = RACES[prov.race];
    const { be } = calculateBE(prov);

    // --- Employment (Economy page) ---
    const homes = prov.buildings.HOMES ?? 0;

    // Completed buildings = sum of all building counts
    let completedBuildings = 0;
    for (const count of Object.values(prov.buildings)) {
        completedBuildings += count ?? 0;
    }

    const availableJobs = Math.max(
        0,
        (completedBuildings - homes) * JOBS.JOBS_PER_COMPLETED_BUILDING
    );

    const prisonerWorkers = Math.floor((prov.prisoners ?? 0) / 2);

    const employedPeasants = Math.min(
        prov.peasants,
        Math.max(availableJobs - prisonerWorkers, 0)
    );

    const unemployedPeasants = Math.max(
        prov.peasants - employedPeasants,
        0
    );

    const employedIncome =
        employedPeasants * ECONOMY.GC_PER_EMPLOYED_PEASANT;
    const unemployedIncome =
        unemployedPeasants * ECONOMY.GC_PER_UNEMPLOYED_PEASANT;
    const prisonerIncome =
        (prov.prisoners ?? 0) * ECONOMY.GC_PER_PRISONER;

    // Banks: 25 gc * BE each
    const banks = prov.buildings.BANKS ?? 0;
    const bankFlat =
        banks * ECONOMY.GC_PER_BANK_FLAT * be;

    const rawIncome =
        employedIncome +
        unemployedIncome +
        prisonerIncome +
        bankFlat;

    const raceIncomeMod = race?.mods.income ?? 0; // e.g. Human +0.30
    const raceIncomeMultiplier = 1 + raceIncomeMod;

    const finalIncome = rawIncome * raceIncomeMultiplier;

    return {
        raw: {
            peasants: employedIncome + unemployedIncome,
            banksFlat: bankFlat,
            prisoners: prisonerIncome,
        },
        mods: {
            raceIncomeMultiplier,
            beFromBanks: be,
        },
        finalIncome,
    };
}
