// src/utopia/age113/races.ts

import type { RaceId } from "../types";

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
        income?: number; // income bonus (we'll use later)
        be?: number;     // BE bonus (like Dwarf)
        pop?: number;
        birthRate?: number;
        foodConsumption?: number // +0.5 = +50%; -1 = no food needed
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

export const RACES: Record<RaceId, Race> = {
    AVIAN: {
        id: "AVIAN",
        display: "Avian",
        mods: {
            attackTime: -0.25,
            birthRate: 0.20,
            militaryCasualties: 0.15,
        },
        restrictions: {
            noBarracks: true,
            noStables: true,
            noWarHorses: true,
        },
        spellbook: ["Town Watch", "Reflect Magic"],
        uniqueAbility:
            "Skybound Strike: (War/Hostile) next attack auto-succeeds with –50% losses; gains scale by off vs def; 0 honour gains. 23h CD.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 12, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 15, def: 3, cost: 900, nw: 6.75 },
        },
    },
    DARK_ELF: {
        id: "DARK_ELF",
        display: "Dark Elf",
        mods: {
            wpa: 0.20,
            ome: 0.10,
            wages: 0.20, // +20% military wages
            thiefCost: 0.20, // +20% thief costs
            horseOffenseBonus: 1,
        },
        restrictions: {},
        spellbook: ["Blizzard", "Guile", "Mage's Fury", "Invisibility"],
        uniqueAbility:
            "Shadow Surge: offensive spells cost –60% runes for 2 ticks. 23h CD.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 10, def: 0 },
            defSpec: { off: 0, def: 11 },
            elite: { off: 13, def: 6, cost: 900, nw: 7.5 },
        },
    },

    DWARF: {
        id: "DWARF",
        display: "Dwarf",
        mods: {
            be: 0.25,
            foodConsumption: 0.50,
            wpa: -0.10,
            exploreCost: 0.20,
            // –25% construction & training time left as notes
        },
        restrictions: {},
        spellbook: ["Miner's Mystique"],
        uniqueAbility:
            "Molten Anvil: for 6 ticks, +15% BE, +15% income, +25% draft speed. 23h CD.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 10, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 13, def: 6, cost: 1000, nw: 7.5 },
        },
    },

    ELF: {
        id: "ELF",
        display: "Elf",
        mods: {
            wpa: 0.25,
            runeProduction: 0.20,
        },
        restrictions: {
            noTrainingGrounds: true,
            noDungeons: true,
        },
        spellbook: ["Pitfalls", "Wrath", "Mist"],
        uniqueAbility:
            "Arcane Surge: while mana < 30%, spells deal +25% damage.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 10, def: 0 },
            defSpec: { off: 0, def: 12 },
            elite: { off: 12, def: 7, cost: 1000, nw: 7.5 },
        },
    },

    FAERY: {
        id: "FAERY",
        display: "Faery",
        mods: {
            wpa: 0.25,
            be: -0.05,
            runeCost: 0.30,
            // +25% offensive spell duration handled elsewhere
        },
        restrictions: {},
        spellbook: [
            "Tree of Gold",
            "Quick Feet",
            "Town Watch",
            "Vermin",
            "Mist",
            "Wrath",
            "Blizzard",
            "Guile",
            "Mage's Fury",
            "Greater Protection",
            "Fountain of Knowledge",
            "Miner's Mystique",
            "Pitfalls",
            "Revelation",
            "Animate Dead",
            "Invisibility",
            "Fools Gold",
        ],
        uniqueAbility:
            "Ethereal Mirage: for 2 ticks, Mystic Vortex removes all active spells from target. 23h CD.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 10, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 4, def: 13, cost: 1200, nw: 7.25 },
        },
    },

    HALFLING: {
        id: "HALFLING",
        display: "Halfling",
        mods: {
            pop: 0.15,
            tpa: 0.30,
            birthRate: -0.25,
            buildCost: 0.25,
        },
        restrictions: {},
        spellbook: ["Quick Feet", "Town Watch", "Vermin", "Invisibility"],
        uniqueAbility:
            "Sneak Attack: for 2 ticks, thievery ops incur –50% losses. 23h CD.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 10, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 12, def: 7, cost: 950, nw: 7.5 },
        },
    },

    HUMAN: {
        id: "HUMAN",
        display: "Human",
        mods: {
            income: 0.30,
            mercCost: -0.50,
            trainingCost: -0.25,
            trainingTime: 0.25,
            horseOffenseBonus: 1,
        },
        restrictions: {},
        spellbook: ["Fountain of Knowledge", "Revelation"],
        uniqueAbility:
            "First Aid: removes all negative statuses (BG, Riots, BT, Plague, hostile spells). 23h CD.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 13, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 7, def: 12, cost: 1050, nw: 8.0 },
        },
    },

    ORC: {
        id: "ORC",
        display: "Orc",
        mods: {
            gains: 0.05,
            gainsWar: 0.10,
            draftCost: -0.50,
            bookProduction: -0.20,
            thieveryEffectiveness: -0.20,
        },
        restrictions: {},
        spellbook: ["Aggression", "Bloodlust"],
        uniqueAbility:
            "Carnage: each successful attack gets a random bonus (e.g. +casualties, +gains, -self losses).",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 10, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 15, def: 2, cost: 1000, nw: 6.25 },
        },
    },

    UNDEAD: {
        id: "UNDEAD",
        display: "Undead",
        mods: {
            militaryCasualties: -0.40,
            foodConsumption: -1, // special: no food needed
        },
        restrictions: {
            onlyThieveryIntel: true,
        },
        spellbook: ["Animate Dead", "Aggression", "Hero's Inspiration"],
        uniqueAbility:
            "No food, immune to plague, converts specs to elites on TM.",
        units: {
            soldier: { off: 3, def: 3 },
            offSpec: { off: 10, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 15, def: 4, cost: 900, nw: 7.25 },
        },
    },

    GNOME: {
        id: "GNOME",
        display: "Gnome",
        mods: {
            attackTime: -0.10,
            tpa: 0.15,
            runeCost: 0.25,
            wpa: -0.15,
            // +15% enemy casualties left as note
        },
        restrictions: {},
        spellbook: ["Quick Feet", "Aggression"],
        uniqueAbility:
            "Cunning Assault: successful attacks can grant stacked thievery boosts for 6 ticks.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 11, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 14, def: 4, cost: 900, nw: 6.5 },
        },
    },
};

export const RACE_LIST = Object.values(RACES);