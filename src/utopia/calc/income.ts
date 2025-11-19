// src/utopia/income.ts
import type {Province} from "../types.ts";
import { ECONOMY } from "../constants-age113.ts";
import { RACES } from "../age113/races";

export interface IncomeResult {
    raw: {
        peasants: number;
        banksFlat: number;
    };
    mods: {
        raceIncomeMultiplier: number;
    };
    finalIncome: number;
}

export function calculateIncome(prov: Province): IncomeResult {
    const race = RACES[prov.race];

    // For now, assume all peasants are employed and no prisoners.
    const peasantIncome =
        prov.peasants * ECONOMY.GC_PER_EMPLOYED_PEASANT;

    const banks = prov.buildings.BANKS ?? 0;
    const bankFlat = banks * ECONOMY.GC_PER_BANK_FLAT;

    const rawIncome = peasantIncome + bankFlat;

    const raceIncomeMod = race?.mods.income ?? 0; // e.g. 0.10 = +10%
    const raceIncomeMultiplier = 1 + raceIncomeMod;

    const finalIncome = rawIncome * raceIncomeMultiplier;

    return {
        raw: {
            peasants: peasantIncome,
            banksFlat: bankFlat,
        },
        mods: {
            raceIncomeMultiplier,
        },
        finalIncome,
    };
}