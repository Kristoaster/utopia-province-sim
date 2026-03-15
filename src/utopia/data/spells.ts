import type {
    PersonalityId,
    ProvinceSpell,
    ProvinceSpellSource,
    RaceId,
} from "../types";
import { getRace } from "../current/races";
import { getPersonality } from "../current/personalities";

interface SpellDefinition {
    display: string;
    source: ProvinceSpellSource;
    effect: string;
    aliases?: string[];
    universal?: boolean; // only meaningful for good spells
}

function normalizeSpellName(value: string): string {
    return value
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/['’.-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

const GOOD_SPELLS: SpellDefinition[] = [
    {
        display: "Aggression",
        source: "good",
        universal: true,
        effect: "Your soldiers gain +2 offense.",
    },
    {
        display: "Anonymity",
        source: "good",
        universal: true,
        aliases: ["ANN"],
        effect: "Conceals your identity on your next attack.",
    },
    {
        display: "Bloodlust",
        source: "good",
        effect: "+10% OME, +15% enemy military casualties, +15% own military losses.",
    },
    {
        display: "Builder's Boon",
        source: "good",
        universal: true,
        aliases: ["BB", "Builders Boon", "Builders' Boon"],
        effect: "-25% construction time for buildings started while active.",
    },
    {
        display: "Clear Sight",
        source: "good",
        effect: "Improves protection against thievery operations.",
    },
    {
        display: "Divine Shield",
        source: "good",
        effect: "-20% instant spell damage taken.",
    },
    {
        display: "Fanaticism",
        source: "good",
        universal: true,
        effect: "+5% OME, -5% DME.",
    },
    {
        display: "Fertile Lands",
        source: "good",
        universal: true,
        aliases: ["FL"],
        effect: "+25% food production.",
    },
    {
        display: "Fountain of Knowledge",
        source: "good",
        aliases: ["FoK", "FOK"],
        effect: "+10% science book production.",
    },
    {
        display: "Ghost Workers",
        source: "good",
        effect: "Reduces workers needed for max BE.",
    },
    {
        display: "Greater Protection",
        source: "good",
        effect: "+5% DME. Stacks with Minor Protection.",
    },
    {
        display: "Guile",
        source: "good",
        effect: "+10% instant spell and sabotage damage.",
    },
    {
        display: "Illuminate Shadows",
        source: "good",
        effect: "-20% damage from thievery operations.",
    },
    {
        display: "Inspire Army",
        source: "good",
        universal: true,
        aliases: ["IA"],
        effect: "-15% military wages and -20% military training time.",
    },
    {
        display: "Invisibility",
        source: "good",
        effect: "+10% offensive thievery effectiveness and -20% thief losses.",
    },
    {
        display: "Love & Peace",
        source: "good",
        universal: true,
        aliases: ["LP", "Love and Peace", "Love Peace"],
        effect: "Increases birth rate and war horse production.",
    },
    {
        display: "Mage's Fury",
        source: "good",
        effect: "+25% offensive WPA and -25% defensive WPA.",
    },
    {
        display: "Magic Shield",
        source: "good",
        universal: true,
        effect: "+20% defensive magic efficiency.",
    },
    {
        display: "Mind Focus",
        source: "good",
        effect: "+25% wizard production.",
    },
    {
        display: "Miner's Mystique",
        source: "good",
        aliases: ["MM", "Miners Mystique"],
        effect: "+0.3 income per peasant.",
    },
    {
        display: "Minor Protection",
        source: "good",
        universal: true,
        effect: "+5% DME.",
    },
    {
        display: "Mist",
        source: "good",
        effect: "Enemy gains are reduced when attacking you.",
    },
    {
        display: "Nature's Blessing",
        source: "good",
        universal: true,
        aliases: ["Natures Blessing"],
        effect: "Protects against weather effects and can cure plague.",
    },
    {
        display: "Patriotism",
        source: "good",
        universal: true,
        aliases: ["PAT"],
        effect: "+30% draft speed and reduced Propaganda damage received.",
    },
    {
        display: "Quick Feet",
        source: "good",
        effect: "-10% attack time.",
    },
    {
        display: "Reflect Magic",
        source: "good",
        effect: "Chance to reflect offensive spells.",
    },
    {
        display: "Revelation",
        source: "good",
        aliases: ["REV"],
        effect: "+20% scientist emergence rate.",
    },
    {
        display: "Salvation",
        source: "good",
        effect: "-15% military casualties.",
    },
    {
        display: "Shadowlight",
        source: "good",
        effect: "Deflects the next thievery operation and reveals the source province.",
    },
    {
        display: "Town Watch",
        source: "good",
        effect: "Every 5 peasants defend with 1 point of defense.",
    },
    {
        display: "Wrath",
        source: "good",
        effect: "Enemy attackers suffer increased military casualties.",
    },
];

const BAD_SPELLS: SpellDefinition[] = [
    {
        display: "Blizzard",
        source: "bad",
        effect: "-10% Building Efficiency.",
    },
    {
        display: "Chastity",
        source: "bad",
        effect: "-50% birth rate.",
    },
    {
        display: "Droughts",
        source: "bad",
        effect: "Reduces food production.",
    },
    {
        display: "Explosions",
        source: "bad",
        effect: "Damages rune economy over time.",
    },
    {
        display: "Expose Thieves",
        source: "bad",
        effect: "Weakens thievery performance and protection.",
    },
    {
        display: "Gluttony",
        source: "bad",
        effect: "Harms food economy and increases food pressure.",
    },
    {
        display: "Greed",
        source: "bad",
        effect: "+25% military wages and draft costs.",
    },
    {
        display: "Meteor Showers",
        source: "bad",
        effect: "Kills peasants and troops at home over time.",
    },
    {
        display: "Pitfalls",
        source: "bad",
        effect: "+20% defensive military losses.",
    },
    {
        display: "Storms",
        source: "bad",
        effect: "Kills peasants daily.",
    },
    {
        display: "Sabotage Wizards",
        source: "bad",
        effect: "Represents wizard damage or suppression.",
    },
    {
        display: "Destabilize Guilds",
        source: "bad",
        effect: "Represents reduced guild strength or effectiveness.",
    },
    {
        display: "Incite Riots",
        source: "bad",
        effect: "Reduces income and raises wage pressure.",
    },
    {
        display: "Bribe Thieves",
        source: "bad",
        effect: "Represents hostile penalties affecting thieves.",
    },
    {
        display: "Bribe Generals",
        source: "bad",
        effect: "Represents hostile penalties affecting generals or army use.",
    },
];

const GOOD_SPELL_ORDER = GOOD_SPELLS.map((spell) => spell.display);
const BAD_SPELL_ORDER = BAD_SPELLS.map((spell) => spell.display);

const SPELL_DEFINITIONS = [...GOOD_SPELLS, ...BAD_SPELLS];

const SPELL_LOOKUP = new Map<string, SpellDefinition>();

for (const spell of SPELL_DEFINITIONS) {
    SPELL_LOOKUP.set(normalizeSpellName(spell.display), spell);

    for (const alias of spell.aliases ?? []) {
        SPELL_LOOKUP.set(normalizeSpellName(alias), spell);
    }
}

function getDefinition(name: string): SpellDefinition | null {
    return SPELL_LOOKUP.get(normalizeSpellName(name)) ?? null;
}

function makeSpellKey(name: string, source: ProvinceSpellSource): string {
    return `${normalizeSpellName(name)}|${source}`;
}

function splitSpellList(raw: string | undefined): string[] {
    if (!raw) return [];

    return raw
        .split(/[,\n;|/]+/)
        .map((value) => value.trim())
        .filter(Boolean);
}

function normalizeImportedSpell(
    rawName: string,
    source: ProvinceSpellSource
): ProvinceSpell {
    const definition = getDefinition(rawName);

    return {
        name: definition?.display ?? rawName.trim(),
        source,
        active: true,
    };
}

function buildExistingSpellStateMap(
    spells: ProvinceSpell[]
): Map<string, ProvinceSpell> {
    const map = new Map<string, ProvinceSpell>();

    for (const spell of spells) {
        const definition = getDefinition(spell.name);
        const canonicalName = definition?.display ?? spell.name;

        map.set(makeSpellKey(canonicalName, spell.source), {
            ...spell,
            name: canonicalName,
        });
    }

    return map;
}

function getAvailableGoodSpellNames(
    raceId: RaceId,
    personalityId: PersonalityId
): string[] {
    const available = new Set<string>();

    for (const spell of GOOD_SPELLS) {
        if (spell.universal) {
            available.add(normalizeSpellName(spell.display));
        }
    }

    const race = getRace(raceId);
    const personality = getPersonality(personalityId);

    for (const spellName of race?.spellbook ?? []) {
        const definition = getDefinition(spellName);
        if (definition?.source === "good") {
            available.add(normalizeSpellName(definition.display));
        }
    }

    for (const spellName of personality?.spellbook ?? []) {
        const definition = getDefinition(spellName);
        if (definition?.source === "good") {
            available.add(normalizeSpellName(definition.display));
        }
    }

    return GOOD_SPELL_ORDER.filter((name) =>
        available.has(normalizeSpellName(name))
    );
}

export function createProvinceSpellbook(
    raceId: RaceId,
    personalityId: PersonalityId,
    existingSpells: ProvinceSpell[] = []
): ProvinceSpell[] {
    const existingMap = buildExistingSpellStateMap(existingSpells);

    const availableGoodNames = getAvailableGoodSpellNames(raceId, personalityId);

    const goodSpells = availableGoodNames.map((name) => {
        const key = makeSpellKey(name, "good");
        const existing = existingMap.get(key);

        return {
            name,
            source: "good" as const,
            active: existing?.active ?? false,
        };
    });

    const badSpells = BAD_SPELL_ORDER.map((name) => {
        const key = makeSpellKey(name, "bad");
        const existing = existingMap.get(key);

        return {
            name,
            source: "bad" as const,
            active: existing?.active ?? false,
        };
    });

    return [...goodSpells, ...badSpells];
}

export function parseProvinceSpellsFromIntel(
    row: Record<string, string>,
    raceId: RaceId,
    personalityId: PersonalityId
): ProvinceSpell[] {
    const importedActive: ProvinceSpell[] = [
        ...splitSpellList(row["GoodSpells"]).map((spell) =>
            normalizeImportedSpell(spell, "good")
        ),
        ...splitSpellList(row["BadSpells"]).map((spell) =>
            normalizeImportedSpell(spell, "bad")
        ),
    ];

    return createProvinceSpellbook(raceId, personalityId, importedActive);
}

export function groupProvinceSpells(spells: ProvinceSpell[]): {
    good: ProvinceSpell[];
    bad: ProvinceSpell[];
} {
    return {
        good: spells.filter((spell) => spell.source === "good"),
        bad: spells.filter((spell) => spell.source === "bad"),
    };
}

export function getSpellEffect(name: string): string | null {
    return getDefinition(name)?.effect ?? null;
}

export function getActiveSpells(spells: ProvinceSpell[]): ProvinceSpell[] {
    return spells.filter((spell) => spell.active);
}

export function summarizeActiveSpells(spells: ProvinceSpell[]): string {
    const active = getActiveSpells(spells);
    if (active.length === 0) return "None";
    return `${active.length} active`;
}

export function previewActiveSpellNames(
    spells: ProvinceSpell[],
    max = 3
): string | null {
    const active = getActiveSpells(spells);
    if (active.length === 0) return null;

    const names = active.slice(0, max).map((spell) => spell.name);
    const extra = active.length - names.length;

    return extra > 0
        ? `${names.join(", ")} +${extra} more`
        : names.join(", ");
}