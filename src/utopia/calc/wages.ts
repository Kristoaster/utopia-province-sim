// src/utopia/calc/wages.ts
import type { Province } from "../types.ts";
import { WAGES } from "../data/constants.ts";

export interface WagesResult {
    unitWages: {
        soldiers: number;
        offSpecs: number;
        defSpecs: number;
        elites: number;
    };
    baseWages: number;   // sum at 100% wages
    wageRate: number;    // e.g. 1.0 for 100%, 0.5 for 50%
    totalWages: number;  // what you actually pay
}

export function calculateWages(prov: Province): WagesResult {
    const soldiersWages = prov.soldiers * WAGES.SOLDIER;
    const offSpecsWages = prov.offSpecs * WAGES.OFF_SPEC;
    const defSpecsWages = prov.defSpecs * WAGES.DEF_SPEC;
    const elitesWages = prov.elites * WAGES.ELITE;

    const baseWages =
        soldiersWages + offSpecsWages + defSpecsWages +elitesWages;

    const wageRate = prov.wageRate;  // 1.0 = 100%

    const totalWages = baseWages * wageRate;

    return {
        unitWages: {
            soldiers: soldiersWages,
            offSpecs: offSpecsWages,
            defSpecs: defSpecsWages,
            elites: elitesWages,
        },
        baseWages,
        wageRate,
        totalWages,
    };
}