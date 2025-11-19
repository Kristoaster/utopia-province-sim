// src/utopia/calc/population.ts
import {
    BUILDINGS,
    BASE_POP_PER_BUILT_ACRE,
    BARREN_EXTRA_POP,
} from "../data/buildings.ts";
import type { BuildingId, Province } from "../types.ts";
import { RACES } from "../age113/races";

export function calculateMaxPopulation(prov: Province): number {
    // Completed buildings = sum of all building counts
    let completedBuildings = 0;

    for (const id of Object.keys(prov.buildings) as BuildingId[]) {
        const count = prov.buildings[id] ?? 0;
        if (!count) continue;
        completedBuildings += count;
    }

    // Barren = total acres minus built land
    const barrenAcres = Math.max(prov.acres - completedBuildings, 0);

    const homes = prov.buildings.HOMES ?? 0;
    const homesExtra =
        homes * (BUILDINGS.HOMES.capacity?.population ?? 0); // +10 pop per Home

    // Built land: 25 pop per acre, plus Homes extra
    const builtCapacity =
        completedBuildings * BASE_POP_PER_BUILT_ACRE + homesExtra;

    // Barren land: 15 pop per acre
    const barrenCapacity =
        barrenAcres * BARREN_EXTRA_POP;

    const rawLivingSpace = builtCapacity + barrenCapacity;

    // Race pop bonus (e.g. Halfling +15% pop)
    const race = RACES[prov.race];
    const racePopBonus = race?.mods.pop ?? 0;

    const maxPopulation =
        rawLivingSpace * (1 + racePopBonus);

    return maxPopulation;
}
