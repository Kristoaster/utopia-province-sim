import type {PersonalityId} from "../types.ts";

export interface Personality {
    id: PersonalityId;
    display: string;
    mods: {
        buildingCapacity?: number;
        buildingProduction?: number;
        buildingCreditsGain?: number;
        espionageSuccess?: number;
        espionageStealthCost?: number;
        econSciEff?: number;
        eliteDefBonus?: number;
        defSpecDefBonus?: number;
        selfSpellManaCost?: number;
        hospitalEff?: number;
        wizardProduction?: number;
        thiefLosses?: number;
        spellDamage?: number;
        sabotageDamage?: number;
        arcaneSciEff?: number;
        guildEff?: number;
        channelingSciEff?: number;
        tdEff?: number;
        crimeSciEff?: number;
        stealthRecovery?: number;
        attackTime?: number;
        siegeSciEff?: number;
        ome?: number;
        mercStrength?: number;
        mercCost?: number;
        tacticsSciEff?: number;
        valorSciEff?: number;
        wpa?: number;
        resilienceSciEff?: number;
        trainingTime?: number;
        specCreditsGain?: number;
    };
    starting: {
        soldiers?: number;
        specCredits?: number;
        buildingCredits?: number;
        wizards?: number;
        thieves?: number;
    };
    spellbook: string[];
    uniqueAbility: string;
}

export const PERSONALITIES: Record<PersonalityId, Personality> = {
    ARTISAN: {
        id: "ARTISAN",
        display: "Artisan",
        mods: {
            buildingCapacity: 0.40,
            buildingProduction: 0.40,
            buildingCreditsGain: 0.40,
            espionageSuccess: 1.0,
            espionageStealthCost: 1.0,
            econSciEff: 0.10,
        },
        starting: {
            soldiers: 600,
            specCredits: 600,
            buildingCredits: 200,
        },
        spellbook: ["Ghost Workers"],
        uniqueAbility:
            "Demolition Mastery: in War, Raze destroys 40% of target buildings (base 30%).",
    },

    CLERIC: {
        id: "CLERIC",
        display: "Cleric",
        mods: {
            eliteDefBonus: 1,
            defSpecDefBonus: 1,
            selfSpellManaCost: -1,
            hospitalEff: 0.35,
        },
        starting: {
            soldiers: 800,
            specCredits: 800,
        },
        spellbook: ["Salvation", "Revelation", "Divine Shield", "Illuminate Shadows"],
        uniqueAbility:
            "Divine Favour: 50% chance to double duration on self-spells.",
    },

    HERETIC: {
        id: "HERETIC",
        display: "Heretic",
        mods: {
            wizardProduction: 0.50,
            thiefLosses: -0.50,
            spellDamage: 0.20,
            sabotageDamage: 0.20,
            arcaneSciEff: 0.15,
        },
        starting: {
            wizards: 400,
            thieves: 400,
        },
        spellbook: ["Nightmares", "Fools Gold"],
        uniqueAbility:
            "Chaotic Affliction: for 2 ticks, +10–30% spell & sabotage damage. 23h CD.",
    },

    MYSTIC: {
        id: "MYSTIC",
        display: "Mystic",
        mods: {
            guildEff: 0.85,
            channelingSciEff: 0.25,
        },
        starting: {
            wizards: 800,
        },
        spellbook: ["Pitfalls", "Meteor Showers", "Mind Focus", "Chastity"],
        uniqueAbility:
            "Mana Well: instantly regain ~15% mana. 23h CD.",
    },

    ROGUE: {
        id: "ROGUE",
        display: "Rogue",
        mods: {
            tdEff: 0.70,
            stealthRecovery: 1,
            sabotageDamage: 0.25,
            crimeSciEff: 0.25,
        },
        starting: {
            thieves: 800,
        },
        spellbook: [],
        uniqueAbility:
            "Shadows in the Night: +25% sabotage damage at ≥50% stealth.",
    },

    TACTICIAN: {
        id: "TACTICIAN",
        display: "Tactician",
        mods: {
            attackTime: -0.15,
            siegeSciEff: 0.25,
        },
        starting: {
            soldiers: 800,
            specCredits: 800,
        },
        spellbook: [],
        uniqueAbility:
            "Dragons Wrath: 3% of your raw offense also damages dragons.",
    },

    WARRIOR: {
        id: "WARRIOR",
        display: "Warrior",
        mods: {
            ome: 0.15,
            mercStrength: 4,
            mercCost: -0.40,
            tacticsSciEff: 0.25,
        },
        starting: {
            soldiers: 800,
            specCredits: 800,
        },
        spellbook: ["Righteous Aggressor"],
        uniqueAbility:
            "Battle Cry: successful attacks kill 0.5% of target population.",
    },

    PALADIN: {
        id: "PALADIN",
        display: "Paladin",
        mods: {
            valorSciEff: 0.25,
        },
        starting: {
            soldiers: 800,
            specCredits: 800,
        },
        spellbook: ["Righteous Aggressor", "Salvation", "Hero's Inspiration"],
        uniqueAbility:
            "Smite: next TM destroys 25% guilds/towers/TDs OR acts as a Holy Massacre. 23h CD.",
    },

    NECROMANCER: {
        id: "NECROMANCER",
        display: "Necromancer",
        mods: {
            wpa: 0.25,
            resilienceSciEff: 0.25,
        },
        starting: {
            soldiers: 800,
            specCredits: 800,
        },
        spellbook: ["Animate Dead", "Nightmares", "Mystic Aura"],
        uniqueAbility:
            "Grave Harvest: successful attack grants +20% instant spell damage for 2 ticks (non-stacking in War).",
    },

    GENERAL: {
        id: "GENERAL",
        display: "General",
        mods: {
            trainingTime: -0.20,
            specCreditsGain: 0.20,
        },
        starting: {
            soldiers: 800,
            specCredits: 800,
        },
        spellbook: [],
        uniqueAbility:
            "General's Command: for 2 ticks, +60% honour gains in War. 23h CD.",
    },
};

export const PERSONALITY_LIST = Object.values(PERSONALITIES);
