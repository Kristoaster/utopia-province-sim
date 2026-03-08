// src/utopia/data/honor.ts

export interface HonorRank {
    level: number;
    rank: string;
    lower: number;
    upper: number | null;
    populationMod: number;
    omeMod: number;
    incomeMod: number;
    foodMod: number;
    runeMod: number;
    wpaMod: number;
    tpaMod: number;
    votes: number;
}

export const HONOR_RANKS: HonorRank[] = [
    {
        level: 0,
        rank: "Peasant",
        lower: 0,
        upper: 750,
        populationMod: 1.0,
        omeMod: 1.0,
        incomeMod: 1.0,
        foodMod: 1.0,
        runeMod: 1.0,
        wpaMod: 1.0,
        tpaMod: 1.0,
        votes: 1,
    },
    {
        level: 1,
        rank: "Knight",
        lower: 751,
        upper: 1500,
        populationMod: 1.01,
        omeMod: 1.02,
        incomeMod: 1.02,
        foodMod: 1.02,
        runeMod: 1.02,
        wpaMod: 1.04,
        tpaMod: 1.04,
        votes: 2,
    },
    {
        level: 2,
        rank: "Lord",
        lower: 1501,
        upper: 2250,
        populationMod: 1.02,
        omeMod: 1.04,
        incomeMod: 1.04,
        foodMod: 1.04,
        runeMod: 1.04,
        wpaMod: 1.06,
        tpaMod: 1.06,
        votes: 3,
    },
    {
        level: 3,
        rank: "Baron",
        lower: 2251,
        upper: 3000,
        populationMod: 1.03,
        omeMod: 1.06,
        incomeMod: 1.06,
        foodMod: 1.06,
        runeMod: 1.06,
        wpaMod: 1.08,
        tpaMod: 1.08,
        votes: 4,
    },
    {
        level: 4,
        rank: "Viscount",
        lower: 3001,
        upper: 3750,
        populationMod: 1.04,
        omeMod: 1.08,
        incomeMod: 1.08,
        foodMod: 1.08,
        runeMod: 1.08,
        wpaMod: 1.12,
        tpaMod: 1.12,
        votes: 5,
    },
    {
        level: 5,
        rank: "Count",
        lower: 3751,
        upper: 4500,
        populationMod: 1.06,
        omeMod: 1.10,
        incomeMod: 1.12,
        foodMod: 1.12,
        runeMod: 1.12,
        wpaMod: 1.18,
        tpaMod: 1.18,
        votes: 7,
    },
    {
        level: 6,
        rank: "Marquis",
        lower: 4501,
        upper: 5250,
        populationMod: 1.08,
        omeMod: 1.12,
        incomeMod: 1.16,
        foodMod: 1.16,
        runeMod: 1.16,
        wpaMod: 1.24,
        tpaMod: 1.24,
        votes: 9,
    },
    {
        level: 7,
        rank: "Duke",
        lower: 5251,
        upper: 6000,
        populationMod: 1.10,
        omeMod: 1.14,
        incomeMod: 1.20,
        foodMod: 1.20,
        runeMod: 1.20,
        wpaMod: 1.30,
        tpaMod: 1.30,
        votes: 10,
    },
    {
        level: 8,
        rank: "Prince",
        lower: 6001,
        upper: null,
        populationMod: 1.12,
        omeMod: 1.16,
        incomeMod: 1.24,
        foodMod: 1.24,
        runeMod: 1.24,
        wpaMod: 1.36,
        tpaMod: 1.36,
        votes: 10,
    },
];

export function clampHonorLevel(level: number): number {
    if (!Number.isFinite(level)) return 0;
    const rounded = Math.round(level);
    return Math.max(0, Math.min(rounded, HONOR_RANKS.length - 1));
}

export function getHonorRank(level: number): HonorRank {
    return HONOR_RANKS[clampHonorLevel(level)] ?? HONOR_RANKS[0];
}

export function getHonorRankLabel(level: number): string {
    return getHonorRank(level).rank;
}

export function formatHonorRange(rank: HonorRank): string {
    return rank.upper == null
        ? `${rank.lower.toLocaleString()}+`
        : `${rank.lower.toLocaleString()} - ${rank.upper.toLocaleString()}`;
}