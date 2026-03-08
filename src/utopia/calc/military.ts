// src/utopia/calc/military.ts
import type { Province } from "../types.ts";
import { RACES } from "../current/races";
import { PERSONALITIES } from "../current/personalities";
import { BUILDINGS } from "../data/buildings";
import { calculateBE } from "./be.ts";

export interface MilitaryResult {
    rawOffense: number;
    rawDefense: number;
    ome: number;
    dme: number;
    modOffense: number;
    modDefense: number;
}

export function calculateMilitary(prov: Province): MilitaryResult {
    const race = RACES[prov.race];
    const pers = PERSONALITIES[prov.personality];

    if (!race) {
        return {
            rawOffense: 0,
            rawDefense: 0,
            ome: 1,
            dme: 1,
            modOffense: 0,
            modDefense: 0,
        };
    }

    const units = race.units;

    const eliteDefBonus = pers?.mods.eliteDefBonus ?? 0;
    const defSpecDefBonus = pers?.mods.defSpecDefBonus ?? 0;

    const rawOffense =
        prov.soldiers * units.soldier.off +
        prov.offSpecs * units.offSpec.off +
        prov.elites * units.elite.off;

    const rawDefense =
        prov.soldiers * units.soldier.def +
        prov.defSpecs * (units.defSpec.def + defSpecDefBonus) +
        prov.elites * (units.elite.def + eliteDefBonus);

    const acres = prov.acres || 1;

    const tgCount = prov.buildings.TRAINING_GROUNDS ?? 0;
    const fortsCount = prov.buildings.FORTS ?? 0;

    const tgPercent = (tgCount / acres) * 100;
    const fortsPercent = (fortsCount / acres) * 100;

    const { be } = calculateBE(prov);

    const tgEffect = BUILDINGS.TRAINING_GROUNDS.percent?.ome;
    const fortsEffect = BUILDINGS.FORTS.percent?.dme;

    let omeBonusFromBuildings = 0;
    if (tgEffect) {
        const scaled =
            tgPercent *
            tgEffect.base *
            (tgEffect.affectedByBE ? be : 1);

        omeBonusFromBuildings = Math.min(scaled, tgEffect.max) / 100;
    }

    let dmeBonusFromBuildings = 0;
    if (fortsEffect) {
        const scaled =
            fortsPercent *
            fortsEffect.base *
            (fortsEffect.affectedByBE ? be : 1);

        dmeBonusFromBuildings = Math.min(scaled, fortsEffect.max) / 100;
    }

    const omeFromBuildings = 1 + omeBonusFromBuildings;
    const dmeFromBuildings = 1 + dmeBonusFromBuildings;

    const raceOmeBonus = race.mods.ome ?? 0;
    const persOmeBonus = pers?.mods.ome ?? 0;
    const raceDmeBonus = race.mods.dme ?? 0;

    const ome =
        omeFromBuildings *
        (1 + raceOmeBonus) *
        (1 + persOmeBonus);

    const dme =
        dmeFromBuildings *
        (1 + raceDmeBonus);

    const modOffense = rawOffense * ome;
    const modDefense = rawDefense * dme;

    return {
        rawOffense,
        rawDefense,
        ome,
        dme,
        modOffense,
        modDefense,
    };
}