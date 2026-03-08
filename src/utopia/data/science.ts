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

export function createEmptyScience(): ProvinceScience {
    return SCIENCE_CATEGORIES.reduce((acc, category) => {
        acc[category.id] = { books: 0, effect: 0 };
        return acc;
    }, {} as ProvinceScience);
}