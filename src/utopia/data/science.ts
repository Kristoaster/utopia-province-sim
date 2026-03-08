// src/utopia/data/science.ts
import type { ProvinceScience, ScienceCategoryId } from "../types";

export interface ScienceCategoryDef {
    id: ScienceCategoryId;
    label: string;
    exportHeader: string;
}

export const SCIENCE_CATEGORIES: ScienceCategoryDef[] = [
    { id: "alchemy", label: "Alchemy", exportHeader: "Alche" },
    { id: "tools", label: "Tools", exportHeader: "Tools" },
    { id: "housing", label: "Housing", exportHeader: "Housi" },
    { id: "production", label: "Production", exportHeader: "Produ" },
    { id: "bookkeeping", label: "Bookkeeping", exportHeader: "Bookk" },
    { id: "artisan", label: "Artisan", exportHeader: "Artis" },
    { id: "strategy", label: "Strategy", exportHeader: "Strat" },
    { id: "siege", label: "Siege", exportHeader: "Siege" },
    { id: "tactics", label: "Tactics", exportHeader: "Tacti" },
    { id: "valor", label: "Valor", exportHeader: "Valor" },
    { id: "heroism", label: "Heroism", exportHeader: "Heroi" },
    { id: "resilience", label: "Resilience", exportHeader: "Resil" },
    { id: "crime", label: "Crime", exportHeader: "Crime" },
    { id: "channeling", label: "Channeling", exportHeader: "Chann" },
    { id: "shielding", label: "Shielding", exportHeader: "Shiel" },
    { id: "cunning", label: "Cunning", exportHeader: "Cunni" },
    { id: "sorcery", label: "Sorcery", exportHeader: "Sorce" },
    { id: "finesse", label: "Finesse", exportHeader: "Fines" },
];

/**
 * Temporary placeholder formula.
 * Easy to tune later.
 *
 * Example:
 * 10% science on 1,000 acres -> 100,000 books
 * because 10 * 1000 * 10 = 100,000
 */
export const TEMP_BOOKS_PER_PERCENT_PER_ACRE = 10;

export function estimateScienceBooksFromEffect(
    effectPercent: number,
    acres: number
): number {
    const safeEffect = Number.isFinite(effectPercent)
        ? Math.max(0, effectPercent)
        : 0;

    const safeAcres = Number.isFinite(acres)
        ? Math.max(0, acres)
        : 0;

    return Math.round(
        safeEffect * safeAcres * TEMP_BOOKS_PER_PERCENT_PER_ACRE
    );
}

export function createEmptyScience(): ProvinceScience {
    return SCIENCE_CATEGORIES.reduce((acc, category) => {
        acc[category.id] = { books: 0, effect: 0 };
        return acc;
    }, {} as ProvinceScience);
}