import type { PersonalityId } from "../../types";
import type { Personality } from "../shared/personalities";

export const PERSONALITIES: Partial<Record<PersonalityId, Personality>> = {
    ARTISAN: {
        id: "ARTISAN",
        display: "Artisan",
        mods: {
            buildingCapacity: 0.30,
            buildingProduction: 0.30,
            buildingCreditsGain: 0.40,
            econSciEff: 0.15,
        },
        starting: {
            soldiers: 600,
            specCredits: 600,
            buildingCredits: 200,
        },
        spellbook: ["Ghost Workers", "Greater Protection"],
        uniqueAbility:
            "Construction Delays: For 6 ticks after a successful attack, the target's building efficiency is reduced by 10% (does not stack).",
        notes: ["Espionage is always successful with double stealth."],
    },

    GENERAL: {
        id: "GENERAL",
        display: "General",
        mods: {
            specCreditsGain: 0.20,
        },
        starting: {
            soldiers: 800,
            specCredits: 800,
        },
        spellbook: ["Wrath"],
        uniqueAbility:
            "Generals Authority: When attacking with 2 or more generals, enemy military casualties are increased by +15%.",
        notes: [
            "-25% military training cost.",
            "+1 army general.",
            "+15% Bookkeeping science effectiveness.",
            "Train elites with credits in war.",
        ],
    },

    HERETIC: {
        id: "HERETIC",
        display: "Heretic",
        mods: {
            guildEff: 0.50,
            sabotageDamage: 0.20,
        },
        starting: {
            thieves: 400,
            wizards: 400,
        },
        spellbook: ["Nightmare", "Fools Gold", "Invisibility", "Vermin"],
        uniqueAbility:
            "Chaotic Affliction: For 2 ticks, offensive spells and sabotage operations deal a random +10% to +30% increased damage.",
        notes: [
            "+25% thieves per acre.",
            "-40% thief cost.",
            "+15% science effectiveness in Cunning, Finesse, Channeling, Shielding, Sorcery, and Crime.",
            "Allowed thief op: Steal War Horses.",
        ],
    },

    MYSTIC: {
        id: "MYSTIC",
        display: "Mystic",
        mods: {
            guildEff: 1.25,
            channelingSciEff: 0.15,
        },
        starting: {
            wizards: 800,
        },
        spellbook: ["Meteor Showers", "Chastity", "Pitfalls", "Vermin"],
        uniqueAbility:
            "Focused Channeling: While your mana is above 40%, all spells gain +20% wizard effectiveness (WPA).",
        notes: ["+1 extra mana per tick."],
    },

    NECROMANCER: {
        id: "NECROMANCER",
        display: "Necromancer",
        mods: {
            wpa: 0.30,
            channelingSciEff: 0.15,
        },
        starting: {
            soldiers: 400,
            specCredits: 400,
            wizards: 400,
        },
        spellbook: ["Mystic Aura", "Animate Dead", "Vermin", "Pitfalls", "Mind Focus"],
        uniqueAbility:
            "Black Magic: Successful offensive instant spells also kill 1% of the target's peasant population.",
        notes: [
            "25% of self battle casualties convert to soldiers.",
            "30% of enemy battle casualties convert to soldiers.",
        ],
    },

    PALADIN: {
        id: "PALADIN",
        display: "Paladin",
        mods: {
            valorSciEff: 0.15,
        },
        starting: {
            soldiers: 800,
            specCredits: 800,
        },
        spellbook: [],
        uniqueAbility:
            "Divine Blessing: All daily bonuses granted on the 1st of each month are doubled.",
        notes: [
            "+15% enemy casualties when attacking.",
            "+10% own casualties when attacking.",
            "+50% stable capacity and production.",
            "+5% max population.",
            "Plague immunity.",
        ],
    },

    ROGUE: {
        id: "ROGUE",
        display: "Rogue",
        mods: {
            crimeSciEff: 0.15,
            tdEff: 1.0,
            stealthRecovery: 1,
        },
        starting: {
            thieves: 800,
        },
        spellbook: [],
        uniqueAbility:
            "Shadow Persistence: You may perform thievery operations even while overpopulated.",
        notes: ["+15% thieves per acre.", "Access all thievery operations."],
    },

    TACTICIAN: {
        id: "TACTICIAN",
        display: "Tactician",
        mods: {
            attackTime: -0.15,
            siegeSciEff: 0.15,
            specCreditsGain: 0.40,
        },
        starting: {
            soldiers: 800,
            specCredits: 800,
        },
        spellbook: ["Clear Sight"],
        uniqueAbility:
            "Dragon's Wrath: When attacking with a dragon, 3% of your raw offense from units also deals damage to the dragon.",
        notes: [
            "Access Conquest regardless of net worth.",
            "No thief losses on espionage operations.",
        ],
    },

    WARRIOR: {
        id: "WARRIOR",
        display: "Warrior",
        mods: {
            ome: 0.10,
            mercStrength: 4,
            mercCost: -0.50,
            tacticsSciEff: 0.15,
        },
        starting: {
            soldiers: 800,
            specCredits: 800,
        },
        spellbook: ["Bloodlust"],
        uniqueAbility:
            "Battle Cry: Upon a successful attack, the attack destroys 1% of the target's total population.",
    },

    WAR_HERO: {
        id: "WAR_HERO",
        display: "War Hero",
        mods: {},
        starting: {
            soldiers: 800,
            specCredits: 800,
        },
        spellbook: [],
        uniqueAbility:
            "Honor and Glory: All successful attacks generate +2.5% additional honor gains.",
        notes: [
            "+50% honor bonus.",
            "-30% honor losses.",
            "Converts specialists into elites on attack.",
            "Offensive specialists get +2 strength.",
        ],
    },
};

export const PERSONALITY_LIST = Object.values(PERSONALITIES).filter(
    (personality): personality is Personality => Boolean(personality)
);