// src/utopia/military.ts
import type { Province } from "../types.ts";
import { RACES } from "../age113/races";
import { PERSONALITIES } from "../age113/personalities";

import { calculateBE } from "./be.ts";

export interface MilitaryResult {
    rawOffense: number;
    rawDefense: number;
    ome: number;       // offense multiplier
    dme: number;       // defense multiplier
    modOffense: number;
    modDefense: number;
}

export function calculateMilitary(prov: Province): MilitaryResult {
    const race = RACES[prov.race];
    const pers = PERSONALITIES[prov.personality];
    const units = race.units;

    // ---- 1) Raw offense & defense from units ----
    const rawOffense =
        prov.soldiers * units.soldier.off +
        prov.offSpecs * units.offSpec.off +
        prov.elites * units.elite.off;

    const rawDefense =
        prov.soldiers * units.soldier.def +
        prov.defSpecs * units.defSpec.def +
        prov.elites * units.elite.def;

    // ---- 2) OME/DME from TG/Forts + BE + race/pers mods ----
    const acres = prov.acres || 1;

    const tgCount = prov.buildings.TRAINING_GROUNDS ?? 0;
    const fortsCount = prov.buildings.FORTS ?? 0;

    const tgPercent = (tgCount / acres) * 100;    // % of land as TGs
    const fortsPercent = (fortsCount / acres) * 100; // % of land as Forts

    const { be } = calculateBE(prov); // e.g. 1.00 for 100%, 1.10 for 110% BE

    // Assume: 1.5% OME per 1% TG, scaled by BE
    const omeBonusFromBuildings = (tgPercent * 1.5 * be) / 100;
    const dmeBonusFromBuildings = (fortsPercent * 1.5 * be) / 100;

    const omeFromBuildings = 1 + omeBonusFromBuildings;
    const dme = 1 + dmeBonusFromBuildings;

    // Race + personality OME (e.g. Dark Elf =10%, Warrior +15%)
    const raceOmeBonus = race.mods.ome ?? 0;
    const persOmeBonus = pers?.mods.ome ?? 0;

    const ome =
        omeFromBuildings *
        (1 + raceOmeBonus) *
        (1 + persOmeBonus);

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
