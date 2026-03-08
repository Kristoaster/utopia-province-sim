// src/utopia/calc/income.ts
import type { Province } from "../types.ts";
import { ECONOMY, JOBS } from "../data/constants.ts";
import { RACES } from "../current/races";
import { BUILDINGS } from "../data/buildings";
import { calculateBE } from "./be.ts";

export interface IncomeResult {
    raw: {
        peasants: number;
        banksFlat: number;
        prisoners: number;
    };
    mods: {
        raceIncomeMultiplier: number;
        bankIncomeMultiplier: number;
        beFromBanks: number;
    };
    finalIncome: number;
}

export function calculateIncome(prov: Province): IncomeResult {
    const race = RACES[prov.race];
    const { be } = calculateBE(prov);

    const homes = prov.buildings.HOMES ?? 0;

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

    const banks = prov.buildings.BANKS ?? 0;
    const bankFlat =
        banks * ECONOMY.GC_PER_BANK_FLAT * be;

    const rawIncome =
        employedIncome +
        unemployedIncome +
        prisonerIncome +
        bankFlat;

    const acres = prov.acres || 1;
    const banksPct = (banks / acres) * 100;

    const bankIncomeEffect = BUILDINGS.BANKS.percent?.income;
    let bankIncomeBonusPercent = 0;

    if (bankIncomeEffect) {
        const scaled =
            banksPct *
            bankIncomeEffect.base *
            (bankIncomeEffect.affectedByBE ? be : 1);

        bankIncomeBonusPercent = Math.min(scaled, bankIncomeEffect.max);
    }

    const bankIncomeMultiplier = 1 + bankIncomeBonusPercent / 100;

    const raceIncomeMod = race?.mods.income ?? 0;
    const raceIncomeMultiplier = 1 + raceIncomeMod;

    const finalIncome =
        rawIncome * bankIncomeMultiplier * raceIncomeMultiplier;

    return {
        raw: {
            peasants: employedIncome + unemployedIncome,
            banksFlat: bankFlat,
            prisoners: prisonerIncome,
        },
        mods: {
            raceIncomeMultiplier,
            bankIncomeMultiplier,
            beFromBanks: be,
        },
        finalIncome,
    };
}