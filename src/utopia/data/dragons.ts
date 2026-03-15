import type { DragonId } from "../types";

export interface Dragon {
    id: DragonId;
    display: string;
    effects: string[];
}

export const DRAGONS: Record<DragonId, Dragon> = {
    EMERALD: {
        id: "EMERALD",
        display: "Emerald",
        effects: [
            "+25% Military Losses in Combat",
            "-20% Combat Gains",
            "-40% Building and Specialist Credits Gained in Combat",
        ],
    },
    RUBY: {
        id: "RUBY",
        display: "Ruby",
        effects: [
            "-15% Military Efficiency",
            "+30% Military Wages",
            "Lose 30% of new drafted Soldiers",
        ],
    },
    SAPPHIRE: {
        id: "SAPPHIRE",
        display: "Sapphire",
        effects: [
            "-30% Magic Effectiveness (WPA)",
            "-30% Thievery Effectiveness (TPA)",
            "+12.5% Instant Spell and Sabotage Damage Taken",
            "-12.5% Instant Spell and Sabotage Damage Dealt",
        ],
    },
    TOPAZ: {
        id: "TOPAZ",
        display: "Topaz",
        effects: [
            "-30% Building Efficiency",
            "-25% Income",
            "Destroys 4% of Buildings Instantly and Every 6 Ticks thereafter",
        ],
    },
    CELESTITE: {
        id: "CELESTITE",
        display: "Celestite",
        effects: [
            "-60% Birth Rates",
            "-40% Hospital Effectiveness",
            "+50% Build Cost and Time",
        ],
    },
    AMETHYST: {
        id: "AMETHYST",
        display: "Amethyst",
        effects: [
            "-40% Spell Success",
            "-40% Thievery Success on sabotage",
            "Enemy provinces suffer +25% thievery and wizard losses on failed spells/ops",
        ],
    },
};

export const DRAGON_LIST = Object.values(DRAGONS);

export function getDragon(id: DragonId | null | undefined): Dragon | null {
    if (!id) return null;
    return DRAGONS[id] ?? null;
}