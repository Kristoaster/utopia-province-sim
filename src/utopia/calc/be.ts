// src/utopia/be.ts
import type { Province, BuildingId } from "../types";
import { BUILDINGS } from "../data/buildings";

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

    const availableWorkers =
        prov.peasants + Math.floor((prov.prisoners ?? 0) / 2);

    const optimalWorkers = Math.floor(totalJobs * 0.67);
    const jobsPerformed =
        optimalWorkers > 0
            ? Math.min(availableWorkers / optimalWorkers, 1)
            : 1;

    const be = 0.5 * (1 + jobsPerformed);

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
