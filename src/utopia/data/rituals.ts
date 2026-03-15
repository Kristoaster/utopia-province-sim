import type { RitualId } from "../types";

export interface Ritual {
    id: RitualId;
    display: string;
    effects: string[];
}

export const RITUALS: Record<RitualId, Ritual> = {
    ASCENDENCY: {
        id: "ASCENDENCY",
        display: "Ascendency",
        effects: [
            "+50% Wizard Production",
            "-50% Wizard Losses on Failed Spells",
            "-25% Book Generation",
        ],
    },
    BARRIER: {
        id: "BARRIER",
        display: "Barrier",
        effects: [
            "+20% Birth Rates",
            "-25% Damage from Enemy Instant Magic & Thievery Ops",
            "-20% Massacre Damage",
            "-10% Battle (Resource) Losses",
        ],
    },
    EXPEDIENT: {
        id: "EXPEDIENT",
        display: "Expedient",
        effects: [
            "+20% Building Efficiency",
            "-25% Military Wages",
            "-25% Construction Cost",
            "-25% Construction Time",
        ],
    },
    HASTE: {
        id: "HASTE",
        display: "Haste",
        effects: [
            "-10% Attack Time",
            "-25% Training Time",
            "-25% Construction Time",
        ],
    },
    HAVOC: {
        id: "HAVOC",
        display: "Havoc",
        effects: [
            "+20% Offensive WPA",
            "+20% Offensive TPA",
            "+20% Spell Damage",
            "+20% Sabotage Damage",
        ],
    },
    ONSLAUGHT: {
        id: "ONSLAUGHT",
        display: "Onslaught",
        effects: [
            "+10% Offensive Military Efficiency",
            "+15% Enemy Military Casualties on Attacks",
        ],
    },
    STALWART: {
        id: "STALWART",
        display: "Stalwart",
        effects: [
            "+5% Defensive Military Efficiency",
            "-20% Military Casualties",
        ],
    },
};

export const RITUAL_LIST = Object.values(RITUALS);

export function getRitual(id: RitualId | null | undefined): Ritual | null {
    if (!id) return null;
    return RITUALS[id] ?? null;
}