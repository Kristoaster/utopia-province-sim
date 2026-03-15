// src/utopia/calc/be.ts
import type { Province, BuildingId } from "../types.ts";
import { BUILDINGS } from "../data/buildings";
import { BE as BE_CONST } from "../data/constants.ts";
import { getRace } from "../current/races";

export interface BEResult {
    be: number; // effective BE actually used by the sim
    targetBe: number; // formula result
    exportBe: number | null; // rounded BE from intel export if present
    source: "override" | "export" | "calculated";
    jobs: {
        totalJobs: number;
        optimalWorkers: number;
        availableWorkers: number;
        filledJobs: number;
    };
}

const BE_HEADER_ALIASES = ["BE", "B.E.", "BE%"];

function getExportBe(prov: Province): number | null {
    for (const header of BE_HEADER_ALIASES) {
        const raw = prov.rawIntel?.[header];
        if (raw == null) continue;

        const cleaned = String(raw).replace(/[,%'"]/g, "").trim();
        if (!cleaned) continue;

        const value = Number(cleaned);
        if (Number.isFinite(value)) {
            return value / 100;
        }
    }

    return null;
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

    const race = getRace(prov.race);
    const raceBeBonus = race?.mods.be ?? 0;

    const targetBe =
        BE_CONST.BASE_A *
        (1 + jobFillRatio) *
        (1 + raceBeBonus);

    const exportBe = getExportBe(prov);

    const source: BEResult["source"] =
        prov.beOverride != null
            ? "override"
            : exportBe != null
                ? "export"
                : "calculated";

    const effectiveBe =
        prov.beOverride ??
        exportBe ??
        targetBe;

    return {
        be: effectiveBe,
        targetBe,
        exportBe,
        source,
        jobs: {
            totalJobs,
            optimalWorkers,
            availableWorkers,
            filledJobs: Math.min(availableWorkers, totalJobs),
        },
    };
}
