// src/utopia/calc/military.ts
import type { Province } from "../types.ts";
import { RACES } from "../current/races";
import { PERSONALITIES } from "../current/personalities";
import { BUILDINGS } from "../data/buildings";
import { calculateBE } from "./be.ts";

export interface MilitaryResult {
    soldierRawOffense: number;
    soldierRawDefense: number;
    offSpecRawOffense: number;
    offSpecModOffense: number;
    defSpecRawDefense: number;
    defSpecModDefense: number;
    eliteRawOffense: number;
    eliteModOffense: number;
    eliteRawDefense: number;
    eliteModDefense: number;
    rawHorseOffense: number;
    rawPrisonerOffense: number;
    rawOffense: number;
    rawDefense: number;
    ome: number;
    dme: number;
    modOffense: number;
    modDefense: number;
    horseCapacity: number;
    horseCapHit: boolean;
    notes: string[];
}

function getHorseOffensePerHorse(prov: Province): number {
    const race = RACES[prov.race];

    if (!race) return 2;

    if (race.restrictions.noWarHorses) {
        return 0;
    }

    return race.id === "HUMAN" ? 3 : 2;
}

function getPrisonerOffensePerPrisoner(_prov: Province): number {
    // Age 114 rule per your spec:
    // all active races use 8 offense prisoners
    return 8;
}

function getHorseCapacity(prov: Province): number {
    // Current project default:
    // horses can only be sent by attacking units
    return prov.soldiers + prov.offSpecs + prov.elites;
}

export function calculateMilitary(prov: Province): MilitaryResult {
    const race = RACES[prov.race];
    const pers = PERSONALITIES[prov.personality];

    if (!race) {
        return {
            soldierRawOffense: 0,
            soldierRawDefense: 0,
            offSpecRawOffense: 0,
            offSpecModOffense: 0,
            defSpecRawDefense: 0,
            defSpecModDefense: 0,
            eliteRawOffense: 0,
            eliteModOffense: 0,
            eliteRawDefense: 0,
            eliteModDefense: 0,
            rawHorseOffense: 0,
            rawPrisonerOffense: 0,
            rawOffense: 0,
            rawDefense: 0,
            ome: 1,
            dme: 1,
            modOffense: 0,
            modDefense: 0,
            horseCapacity: 0,
            horseCapHit: false,
            notes: [],
        };
    }

    const units = race.units;

    const eliteDefBonus = pers?.mods.eliteDefBonus ?? 0;
    const defSpecDefBonus = pers?.mods.defSpecDefBonus ?? 0;

    const soldierRawOffense = prov.soldiers * units.soldier.off;
    const soldierRawDefense = prov.soldiers * units.soldier.def;

    const offSpecRawOffense = prov.offSpecs * units.offSpec.off;
    const defSpecRawDefense =
        prov.defSpecs * (units.defSpec.def + defSpecDefBonus);

    const eliteRawOffense = prov.elites * units.elite.off;
    const eliteRawDefense =
        prov.elites * (units.elite.def + eliteDefBonus);

    const horseOffensePerHorse = getHorseOffensePerHorse(prov);
    const prisonerOffensePerPrisoner = getPrisonerOffensePerPrisoner(prov);

    const rawHorseOffense = prov.horses * horseOffensePerHorse;
    const rawPrisonerOffense = prov.prisoners * prisonerOffensePerPrisoner;

    const rawOffense =
        soldierRawOffense +
        offSpecRawOffense +
        eliteRawOffense +
        rawHorseOffense +
        rawPrisonerOffense;

    const rawDefense =
        soldierRawDefense +
        defSpecRawDefense +
        eliteRawDefense;

    const horseCapacity = getHorseCapacity(prov);
    const horseCapHit = prov.horses > horseCapacity;

    const notes: string[] = [];

    if (race.restrictions.noWarHorses && prov.horses > 0) {
        notes.push(
            `${race.display} cannot use war horses in Age 114, so horse offense is treated as 0.`
        );
    }

    if (horseCapHit) {
        notes.push(
            `Horse cap exceeded: ${prov.horses.toLocaleString()} horses vs ${horseCapacity.toLocaleString()} attacking units. All entered horses are currently counted in offense.`
        );
    }

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

    const offSpecModOffense = offSpecRawOffense * ome;
    const defSpecModDefense = defSpecRawDefense * dme;
    const eliteModOffense = eliteRawOffense * ome;
    const eliteModDefense = eliteRawDefense * dme;

    const modOffense = rawOffense * ome;
    const modDefense = rawDefense * dme;

    return {
        soldierRawOffense,
        soldierRawDefense,
        offSpecRawOffense,
        offSpecModOffense,
        defSpecRawDefense,
        defSpecModDefense,
        eliteRawOffense,
        eliteModOffense,
        eliteRawDefense,
        eliteModDefense,
        rawHorseOffense,
        rawPrisonerOffense,
        rawOffense,
        rawDefense,
        ome,
        dme,
        modOffense,
        modDefense,
        horseCapacity,
        horseCapHit,
        notes,
    };
}