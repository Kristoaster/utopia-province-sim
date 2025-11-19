// src/utopia/calc/wages.ts
import type { Province } from "../types.ts";
import { WAGES } from "../data/constants.ts";
import { RACES } from "../age113/races";
import { BUILDINGS } from "../data/buildings";
import { calculateBE } from "./be.ts";

export interface WagesResult {
    unitWages: {
        soldiers: number;
        offSpecs: number;
        defSpecs: number;
        elites: number;
    };
    baseWages: number;   // sum at 100% wages, before race/Armouries
    wageRate: number;    // e.g. 1.0 for 100%, 0.5 for 50%
    mods: {
        raceWagesMultiplier: number;
        armouriesMultiplier: number;
    };
    totalWages: number;  // what you actually pay
}

export function calculateWages(prov: Province): WagesResult {
    // Base wages at 100% wage rate, no race/Armouries
    const offSpecsBase = prov.offSpecs * WAGES.OFF_SPEC;
    const defSpecsBase = prov.defSpecs * WAGES.DEF_SPEC;
    const elitesBase = prov.elites * WAGES.ELITE;

    const baseWages =
        offSpecsBase + defSpecsBase + elitesBase;

    const wageRate = prov.wageRate; // 1.0 = 100%

    // --- Race wages mod ---
    const race = RACES[prov.race];
    const raceWagesMod = race?.mods.wages ?? 0; // e.g. Dark Elf +0.20 wages
    const raceWagesMultiplier = 1 + raceWagesMod;

    // --- Armouries wages reduction ---
    const { be } = calculateBE(prov);
    const acres = prov.acres || 1;
    const armouriesBuildings = prov.buildings.ARMOURIES ?? 0;
    const armouriesPct = (armouriesBuildings / acres) * 100;

    const armouriesDef = BUILDINGS.ARMOURIES;
    const wagesEffect = armouriesDef.percent?.wages;

    let armouriesReduction = 0; // percentage, 0–50
    if (wagesEffect) {
        // Each 1% Armouries gives base% reduction, scaled by BE
        armouriesReduction = (armouriesPct * wagesEffect.base * be) / 100;
        if (armouriesReduction > wagesEffect.max) {
            armouriesReduction = wagesEffect.max;
        }
    }

    const armouriesMultiplier = 1 - armouriesReduction / 100;

    const totalWages =
        baseWages *
        wageRate *
        raceWagesMultiplier *
        armouriesMultiplier;

    return {
        unitWages: {
            soldiers: 0,            // no wages for soldiers
            offSpecs: offSpecsBase,
            defSpecs: defSpecsBase,
            elites: elitesBase,
        },
        baseWages,
        wageRate,
        mods: {
            raceWagesMultiplier,
            armouriesMultiplier,
        },
        totalWages,
    };
}
