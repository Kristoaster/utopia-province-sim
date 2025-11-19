// src/utopia/calc/be.ts

import type { Province, BuildingId } from "../types.ts";
import { BUILDINGS } from "../data/buildings";
import { BE as BE_CONST } from "../data/constants.ts";
import { RACES } from "../age113/races";

export interface BEResult {
    be: number;
    jobs: {
        totalJobs: number;
        optimalWorkers: number;
        availableWorkers: number;
        filledJobs: number;
    };
}

export function calculateBE(prov: Province): BEResult {
    let totalJobs = 0;

    for (const id of Object.keys(prov.buildings) as BuildingId[]) {
        const count = prov.buildings[id] ?? 0;
        if (!count) continue;
        const def = BUILDINGS[id];
        if (!def) continue;

        totalJobs += count * def.jobs;
    }

    const prisonerWorkers = Math.floor((prov.prisoners ?? 0) / 2);
    const availableWorkers = prov.peasants + prisonerWorkers;

    const optimalWorkers = Math.floor(
        totalJobs * BE_CONST.OPTIMAL_JOBS_FACTOR
    );

    const jobFillRatio =
        optimalWorkers > 0
            ? Math.min(availableWorkers / optimalWorkers, 1)
            : 1;

    const race = RACES[prov.race];
    const raceBeBonus = race?.mods.be ?? 0; // e.g. Dwarf +0.25, Faery -0.05

    // BE = 0.5 * (1 + jobFillRatio) * (1 + raceBeBonus)
    const be =
        BE_CONST.BASE_A *
        (1 + jobFillRatio) *
        (1 + raceBeBonus);

    return {
        be,
        jobs: {
            totalJobs,
            optimalWorkers,
            availableWorkers,
            filledJobs: Math.min(availableWorkers, totalJobs),
        },
    };
}
