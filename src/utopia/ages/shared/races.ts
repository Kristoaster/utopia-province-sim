import type { RaceId } from "../../types";

export interface RaceUnits {
    soldier: { off: number; def: number };
    offSpec: { off: number; def: number; cost?: number; nw?: number };
    defSpec: { off: number; def: number; cost?: number; nw?: number };
    elite: { off: number; def: number; cost: number; nw: number };
}

export interface Race {
    id: RaceId;
    display: string;
    mods: {
        income?: number;
        be?: number;
        pop?: number;
        birthRate?: number;
        foodConsumption?: number;
        wpa?: number;
        tpa?: number;
        runeProduction?: number;
        runeCost?: number;
        attackTime?: number;
        militaryCasualties?: number;
        draftCost?: number;
        trainingCost?: number;
        trainingTime?: number;
        bookProduction?: number;
        thieveryEffectiveness?: number;
        horseOffenseBonus?: number;
        mercCost?: number;
        exploreCost?: number;
        buildCost?: number;
        gains?: number;
        gainsWar?: number;
        ome?: number;
        wages?: number;
        thiefCost?: number;
    };
    restrictions: {
        noBarracks?: boolean;
        noStables?: boolean;
        noWarHorses?: boolean;
        noTrainingGrounds?: boolean;
        noDungeons?: boolean;
        onlyThieveryIntel?: boolean;
    };
    spellbook: string[];
    uniqueAbility: string;
    units: RaceUnits;
}