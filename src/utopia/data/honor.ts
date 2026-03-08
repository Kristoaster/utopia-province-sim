// src/utopia/data/honor.ts

export const HONOR_RANKS = [
    "Peasant",
    "Knight",
    "Lord",
    "Baron",
    "Viscount",
    "Count",
    "Marquis",
    "Duke",
    "Prince",
] as const;

export function clampHonorLevel(level: number): number {
    if (!Number.isFinite(level)) return 0;

    const rounded = Math.round(level);

    return Math.max(0, Math.min(rounded, HONOR_RANKS.length - 1));
}

export function getHonorRankLabel(level: number): string {
    return HONOR_RANKS[clampHonorLevel(level)] ?? "Peasant";
}