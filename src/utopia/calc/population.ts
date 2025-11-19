// src/utopia/calc/population.ts
import { BUILDINGS, BASE_POP_PER_BUILT_ACRE, BARREN_EXTRA_POP } from "../data/buildings.ts";
import type { BuildingId, Province } from "../types.ts";

export function calculateMaxPopulation(prov: Province): number {
    let builtCapacity = 0;

    for (const id of Object.keys(prov.buildings) as BuildingId[]) {
        const count = prov.buildings[id] ?? 0;
        if (!count) continue;
        const def = BUILDINGS[id];
        if (!def) continue;

        // livingSpace is total capacity per acre for that building
        builtCapacity += count * def.livingSpace;
    }

    // Barren land: base 25 + 15 extra (from wiki) = 40 total per acre
    const barrenCapacity =
        prov.barrenAcres *
        (BASE_POP_PER_BUILT_ACRE + BARREN_EXTRA_POP);

    return builtCapacity + barrenCapacity;
}
