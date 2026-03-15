import type { ProvinceSpell, ProvinceSpellSource } from "../types";

interface SpellDefinition {
    display: string;
    effect: string;
    aliases?: string[];
}

function normalizeSpellName(value: string): string {
    return value
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/['’.-]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

const SPELL_DEFINITIONS: SpellDefinition[] = [
    { display: "Aggression", effect: "Your soldiers gain 2 offense points." },
    { display: "Bloodlust", effect: "+10% OME, +15% kills, +15% own military losses." },
    { display: "Blizzard", effect: "-10% Building Efficiency." },
    { display: "Builders' Boon", effect: "-25% construction time for buildings started while active.", aliases: ["Builders Boon"] },
    { display: "Chastity", effect: "-50% Birth Rate." },
    { display: "Divine Shield", effect: "-20% Instant Spell Damage taken." },
    { display: "Fanaticism", effect: "+5% OME, -5% DME." },
    { display: "Fertile Lands", effect: "+25% food production." },
    { display: "Fountain of Knowledge", effect: "+10% science book production." },
    { display: "Ghost Workers", effect: "Required jobs filled for max BE reduced by 25%." },
    { display: "Greater Protection", effect: "+5% DME. Stacks with Minor Protection." },
    { display: "Greed", effect: "+25% military wages and draft costs." },
    { display: "Guile", effect: "+10% Instant Spell and Sabotage Operation Damage." },
    { display: "Hero's Inspiration", effect: "-30% military wages and -30% military training time. Does not stack with Inspire Army." },
    { display: "Illuminate Shadows", effect: "-20% damage from thievery operations." },
    { display: "Inspire Army", effect: "-15% military wages and -20% military training time." },
    { display: "Invisibility", effect: "+10% offensive thievery effectiveness and -20% thief losses.", aliases: ["Invis"] },
    { display: "Love & Peace", effect: "Base birth rate rises from 2.05% to 2.85%, and war horse production increases by 40%.", aliases: ["Love and Peace", "Love Peace"] },
    { display: "Mage's Fury", effect: "+25% offensive WPA and -25% defensive WPA. No effect on self-spells." },
    { display: "Magic Shield", effect: "+20% defensive magic efficiency." },
    { display: "Mind Focus", effect: "+25% wizard production." },
    { display: "Miner's Mystique", effect: "+0.3 income per peasant.", aliases: ["Miners Mystique"] },
    { display: "Minor Protection", effect: "+5% DME." },
    { display: "Mist", effect: "Enemy gains are reduced by 10% when attacking you." },
    { display: "Meteor Showers", effect: "Kills peasants and troops at home each Utopian day while active." },
    { display: "Mystic Aura", effect: "Repels the next offensive spell cast upon you." },
    { display: "Nature's Blessing", effect: "Protects against Storms and Drought; 33% chance to cure Plague per cast.", aliases: ["Natures Blessing"] },
    { display: "Patriotism", effect: "+30% draft speed and -30% Propaganda damage received." },
    { display: "Pitfalls", effect: "+20% defensive military losses." },
    { display: "Quick Feet", effect: "-10% attack time." },
    { display: "Reflect Magic", effect: "25% chance to reflect offensive spells cast upon your province." },
    { display: "Revelation", effect: "+20% scientist emergence rate." },
    { display: "Salvation", effect: "-15% military casualties." },
    { display: "Shadowlight", effect: "Deflects the next thievery operation and reveals the province name." },
    { display: "Storms", effect: "Kills 1.5% of peasants per day and increases Tornado damage taken by 15%." },
    { display: "Town Watch", effect: "Every 5 peasants defend with 1 point of defense." },
    { display: "Wrath", effect: "Enemy attackers suffer +20% military casualties when attacking you." },
];

const SPELL_LOOKUP = new Map<string, SpellDefinition>();

for (const spell of SPELL_DEFINITIONS) {
    SPELL_LOOKUP.set(normalizeSpellName(spell.display), spell);

    for (const alias of spell.aliases ?? []) {
        SPELL_LOOKUP.set(normalizeSpellName(alias), spell);
    }
}

function splitSpellList(raw: string | undefined): string[] {
    if (!raw) return [];

    return raw
        .split(/[,\n;|/]+/)
        .map((value) => value.trim())
        .filter(Boolean);
}

function createProvinceSpell(
    rawName: string,
    source: ProvinceSpellSource
): ProvinceSpell {
    const def = SPELL_LOOKUP.get(normalizeSpellName(rawName));

    return {
        name: def?.display ?? rawName.trim(),
        source,
        active: true,
    };
}

function parseSpellColumn(
    raw: string | undefined,
    source: ProvinceSpellSource
): ProvinceSpell[] {
    return splitSpellList(raw).map((spell) => createProvinceSpell(spell, source));
}

export function parseProvinceSpellsFromIntel(
    row: Record<string, string>
): ProvinceSpell[] {
    const merged = new Map<string, ProvinceSpell>();

    for (const spell of parseSpellColumn(row["GoodSpells"], "good")) {
        merged.set(`${normalizeSpellName(spell.name)}|${spell.source}`, spell);
    }

    for (const spell of parseSpellColumn(row["BadSpells"], "bad")) {
        merged.set(`${normalizeSpellName(spell.name)}|${spell.source}`, spell);
    }

    return Array.from(merged.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );
}

export function getSpellEffect(name: string): string | null {
    return SPELL_LOOKUP.get(normalizeSpellName(name))?.effect ?? null;
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