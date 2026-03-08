import type { RaceId } from "../../types";
import type { Race } from "../shared/races";

export const RACES: Partial<Record<RaceId, Race>> = {
    AVIAN: {
        id: "AVIAN",
        display: "Avian",
        mods: {
            attackTime: -0.20,
            trainingTime: -0.40,
        },
        restrictions: {
            cannotAmbush: true,
            noStables: true,
            noWarHorses: true,
        },
        spellbook: ["Town Watch", "Illuminate Shadows", "Divine Shield", "Salvation"],
        uniqueAbility:
            "Opportunistic Raiders: Learn and Plunder attacks return armies 1 tick faster (after modifiers).",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 13, def: 0 },
            defSpec: { off: 0, def: 9 },
            elite: { off: 16, def: 6, cost: 900, nw: 8.0 },
        },
    },

    DARK_ELF: {
        id: "DARK_ELF",
        display: "Dark Elf",
        mods: {
            spellDamage: 0.25,
            runeCost: -0.50,
            birthRate: -0.25,
        },
        restrictions: {},
        spellbook: ["Blizzard", "Mage's Fury", "Illuminate Shadows", "Pitfalls", "Quick Feet"],
        uniqueAbility:
            "Mystic Enthusiasts: Successful offensive instant spells refund 20% of the rune cost.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 15, def: 0 },
            defSpec: { off: 0, def: 8 },
            elite: { off: 4, def: 12, cost: 750, nw: 7.0 },
        },
        notes: ["Can train thieves with specialist credits."],
    },

    DWARF: {
        id: "DWARF",
        display: "Dwarf",
        mods: {
            be: 0.25,
            buildingCreditsGain: 0.20,
        },
        restrictions: {
            cannotAccelerateConstruction: true,
        },
        spellbook: ["Miner's Mystique", "Town Watch", "Reflect Magic", "Mist"],
        uniqueAbility:
            "Architect's Revenge: Raze damage received is reduced by 15%, and your razes destroy an additional 20% buildings.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 10, def: 0 },
            defSpec: { off: 0, def: 11 },
            elite: { off: 15, def: 9, cost: 900, nw: 8.0 },
        },
        notes: ["-50% building construction time.", "+10% attack travel time."],
    },

    ELF: {
        id: "ELF",
        display: "Elf",
        mods: {
            wpa: 0.30,
            tpa: -0.20,
            manaRecovery: 1,
        },
        restrictions: {},
        spellbook: ["Pitfalls", "Wrath", "Fountain of Knowledge", "Revelation"],
        uniqueAbility:
            "Mana Surge: While mana is below 40%, your offensive spells deal +25% spell damage.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 10, def: 0 },
            defSpec: { off: 0, def: 13 },
            elite: { off: 14, def: 6, cost: 800, nw: 7.0 },
        },
        notes: ["+1 mana per tick applies in war."],
    },

    FAERY: {
        id: "FAERY",
        display: "Faery",
        mods: {
            wpa: 0.25,
            offensiveSpellDuration: 0.25,
            selfSpellDuration: 0.25,
            manaRecovery: 1,
            be: -0.10,
            wages: 0.15,
        },
        restrictions: {},
        spellbook: [
            "Miner's Mystique",
            "Pitfalls",
            "Blizzard",
            "Greater Protection",
            "Quick Feet",
            "Town Watch",
            "Fountain of Knowledge",
            "Mage's Fury",
            "Tree of Gold",
            "Revelation",
            "Animate Dead",
        ],
        uniqueAbility:
            "Leyline Interference: Enemy spells cast against your province have a 15% chance to fail completely.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 10, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 8, def: 15, cost: 900, nw: 9.0 },
        },
    },

    HALFLING: {
        id: "HALFLING",
        display: "Halfling",
        mods: {
            pop: 0.10,
            tpa: 0.20,
            stealthRecovery: 1,
            militaryCasualties: 0.15,
        },
        restrictions: {},
        spellbook: ["Town Watch", "Greater Protection"],
        uniqueAbility:
            "Sneak Attack: For 2 ticks, all thievery operations incur zero thievery losses.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 10, def: 0 },
            defSpec: { off: 0, def: 11 },
            elite: { off: 10, def: 13, cost: 900, nw: 8.0 },
        },
        notes: ["+15% own casualties when attacking.", "+15% own casualties when defending."],
    },

    HUMAN: {
        id: "HUMAN",
        display: "Human",
        mods: {
            prisonerCapacityPerAcre: 2,
            scienceEff: 0.15,
            stealthRecovery: 1,
            libraryEffectiveness: -0.50,
            runeCost: 0.50,
        },
        restrictions: {},
        spellbook: ["Fountain of Knowledge", "Revelation", "Invisibility", "Guile"],
        uniqueAbility:
            "Civil Administration: Prisoners generate an additional 2.0gc per tick and mercenary costs are reduced by 25%.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 12, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 14, def: 9, cost: 1000, nw: 8.0 },
        },
        notes: [
            "Wages affect positive military efficiency growth at half the normal rate.",
            "War horses provide 3 offense.",
        ],
    },

    ORC: {
        id: "ORC",
        display: "Orc",
        mods: {
            gains: 0.15,
            draftCost: -0.50,
            dme: -0.15,
        },
        restrictions: {},
        spellbook: ["Bloodlust", "Aggression"],
        uniqueAbility:
            "Pillage and Burn: Traditional Marches capture +30% additional prisoners, and Massacre attacks are +15% more effective at killing wizards.",
        units: {
            soldier: { off: 3, def: 0 },
            offSpec: { off: 13, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 20, def: 1, cost: 850, nw: 7.0 },
        },
    },

    UNDEAD: {
        id: "UNDEAD",
        display: "Undead",
        mods: {
            foodConsumption: -1,
            militaryCasualties: -0.40,
            ome: -0.05,
        },
        restrictions: {},
        spellbook: ["Animate Dead"],
        uniqueAbility:
            "Plaguebearers: All successful attacks have a 33% chance to spread plague to the target province.",
        units: {
            soldier: { off: 3, def: 3 },
            offSpec: { off: 11, def: 0 },
            defSpec: { off: 0, def: 10 },
            elite: { off: 16, def: 7, cost: 900, nw: 8.0 },
        },
        notes: ["Plague immunity."],
    },
};

export const RACE_LIST = Object.values(RACES).filter(
    (race): race is Race => Boolean(race)
);