// src/utopia/calc/build-planner.ts
import type { Province, BuildingId } from "../types.ts";
import { BUILDINGS, BUILDING_LIST } from "../data/buildings.ts";
import { RACES } from "../age113/races";
import { calculateIncome } from "./income.ts";
import { calculateWages } from "./wages.ts";
import { calculateFood } from "./food.ts";
import { calculateMilitary } from "./military.ts";
import { calculateBE } from "./be.ts";

export type BuildFocus = "INCOME" | "OFFENSE" | "TM" | "HYBRID";

export interface BuildGoals {
    minNetIncome?: number;   // gc / tick
    noStarvation?: boolean;  // enforce net food >= 0
    minTPA?: number;         // thieves per acre target
    minWPA?: number;         // wizards per acre target
    minGuildsPercent?: number;
    minTDsPercent?: number;
    maxRebuildPercent?: number; // max % of built land we'll alter
    focus: BuildFocus;
}

export interface BuildEvaluation {
    income: number;
    wages: number;
    netIncome: number;
    netFoodPerTick: number;
    be: number;
    modOffense: number;
    modDefense: number;
    tpa: number;
    wpa: number;
}

export interface BuildPlan {
    buildings: Partial<Record<BuildingId, number>>;
    evaluation: BuildEvaluation;
    requiredExtraThieves: number;
    requiredExtraWizards: number;
}

// Clone a province with a different building layout
export function cloneProvinceWithBuildings(
    prov: Province,
    buildings: Partial<Record<BuildingId, number>>
): Province {
    let builtAcres = 0;
    for (const id of Object.keys(buildings) as BuildingId[]) {
        builtAcres += buildings[id] ?? 0;
    }
    const barrenAcres = Math.max(prov.acres - builtAcres, 0);

    return {
        ...prov,
        buildings,
        builtAcres,
        barrenAcres,
    };
}

export function evaluateProvinceBuild(prov: Province): BuildEvaluation {
    const beResult = calculateBE(prov);
    const incomeResult = calculateIncome(prov);
    const wagesResult = calculateWages(prov);
    const foodResult = calculateFood(prov);
    const militaryResult = calculateMilitary(prov);

    const netIncome = incomeResult.finalIncome - wagesResult.totalWages;
    const acres = prov.acres || 1;

    const tpa = acres > 0 ? prov.thieves / acres : 0;
    const wpa = acres > 0 ? prov.wizards / acres : 0;

    return {
        income: incomeResult.finalIncome,
        wages: wagesResult.totalWages,
        netIncome,
        netFoodPerTick: foodResult.netPerTick,
        be: beResult.be,
        modOffense: militaryResult.modOffense,
        modDefense: militaryResult.modDefense,
        tpa,
        wpa,
    };
}

export function generateSuggestedBuild(
    prov: Province,
    goals: BuildGoals
): BuildPlan {
    const race = RACES[prov.race];

    const currentBuildings: Partial<Record<BuildingId, number>> = {
        ...prov.buildings,
    };

    let builtAcres =
        prov.builtAcres && prov.builtAcres > 0
            ? prov.builtAcres
            : (Object.values(currentBuildings).reduce(
                (sum, v) => sum + (v ?? 0),
                0
            ) || 0);

    if (!builtAcres) {
        // nothing built yet, just bail with current layout
        const baseEval = evaluateProvinceBuild(prov);
        return {
            buildings: currentBuildings,
            evaluation: baseEval,
            requiredExtraThieves: 0,
            requiredExtraWizards: 0,
        };
    }

    const maxRebuildAcres =
        goals.maxRebuildPercent != null
            ? Math.floor((goals.maxRebuildPercent / 100) * builtAcres)
            : builtAcres;

    let rebuiltAcres = 0;

    const restricted = new Set<BuildingId>();
    if (race.restrictions.noBarracks) restricted.add("BARRACKS");
    if (race.restrictions.noStables) restricted.add("STABLES");
    if (race.restrictions.noDungeons) restricted.add("DUNGEONS");
    if (race.restrictions.noTrainingGrounds) restricted.add("TRAINING_GROUNDS" as BuildingId);

    const get = (id: BuildingId) => currentBuildings[id] ?? 0;
    const set = (id: BuildingId, value: number) => {
        currentBuildings[id] = Math.max(0, Math.round(value));
    };

    const softDonors: BuildingId[] = [
        "DUNGEONS",
        "STABLES",
        "CASTLES",
        "LIBRARIES",
        "UNIVERSITIES",
        "MILLS",
        "BARRACKS",
        "ARMOURIES",
        "FORTS",
        "TRAINING_GROUNDS",
        "BANKS",
        "HOMES",
    ];
    const donorList = softDonors.filter((b) => !restricted.has(b));

    const moveAcres = (from: BuildingId, to: BuildingId, acres: number) => {
        if (acres <= 0) return 0;
        if (restricted.has(to)) return 0;
        const fromHave = get(from);
        if (!fromHave) return 0;
        const canMove = Math.min(
            fromHave,
            acres,
            maxRebuildAcres - rebuiltAcres
        );
        if (canMove <= 0) return 0;
        set(from, fromHave - canMove);
        set(to, get(to) + canMove);
        rebuiltAcres += canMove;
        return canMove;
    };

    const takeFromDonors = (amount: number, to: BuildingId) => {
        let remaining = amount;
        for (const donor of donorList) {
            if (remaining <= 0) break;
            if (donor === to) continue;
            const moved = moveAcres(donor, to, remaining);
            remaining -= moved;
        }
    };

    // --- Step 1: ensure minimum Guilds/TDs if goals require WPA/TPA ---
    const effectiveMinGuildsPercent =
        goals.minGuildsPercent ??
        (goals.minWPA && goals.minWPA > 0 ? 10 : 0);
    if (effectiveMinGuildsPercent > 0) {
        const desired = Math.ceil(
            (effectiveMinGuildsPercent / 100) * builtAcres
        );
        const have = get("GUILDS");
        if (have < desired) {
            takeFromDonors(desired - have, "GUILDS");
        }
    }

    const effectiveMinTDsPercent =
        goals.minTDsPercent ??
        (goals.minTPA && goals.minTPA > 0 ? 10 : 0);
    if (effectiveMinTDsPercent > 0) {
        const desired = Math.ceil(
            (effectiveMinTDsPercent / 100) * builtAcres
        );
        const have = get("THIEVES_DENS");
        if (have < desired) {
            takeFromDonors(desired - have, "THIEVES_DENS");
        }
    }

    let candidateProv = cloneProvinceWithBuildings(prov, currentBuildings);
    let evalResult = evaluateProvinceBuild(candidateProv);

    // --- Step 2: fix starvation if requested ---
    if (
        goals.noStarvation &&
        evalResult.netFoodPerTick < 0 &&
        rebuiltAcres < maxRebuildAcres
    ) {
        const farmDef = BUILDINGS.FARMS;
        const { be } = calculateBE(candidateProv);
        const perFarm =
            (farmDef.flat?.food?.perBuildingPerTick ?? 60) * be;

        if (perFarm > 0) {
            const neededFarms = Math.min(
                maxRebuildAcres - rebuiltAcres,
                Math.ceil(-evalResult.netFoodPerTick / perFarm)
            );
            if (neededFarms > 0) {
                takeFromDonors(neededFarms, "FARMS");
                candidateProv = cloneProvinceWithBuildings(
                    prov,
                    currentBuildings
                );
                evalResult = evaluateProvinceBuild(candidateProv);
            }
        }
    }

    // --- Step 3: raise net income to target ---
    if (
        goals.minNetIncome != null &&
        rebuiltAcres < maxRebuildAcres
    ) {
        let attempts = 0;
        while (
            evalResult.netIncome < goals.minNetIncome &&
            rebuiltAcres < maxRebuildAcres &&
            attempts < 200
            ) {
            const beforeNet = evalResult.netIncome;
            takeFromDonors(1, "BANKS");
            candidateProv = cloneProvinceWithBuildings(
                prov,
                currentBuildings
            );
            evalResult = evaluateProvinceBuild(candidateProv);
            attempts += 1;
            if (evalResult.netIncome <= beforeNet + 0.1) {
                // no improvement; stop to avoid churn
                break;
            }
        }
    }

    // --- Step 4: small focus-based tweaks ---
    if (rebuiltAcres < maxRebuildAcres) {
        if (goals.focus === "OFFENSE") {
            const targetTgPct = 18;
            const haveTg = get("TRAINING_GROUNDS");
            const desiredTg = Math.ceil(
                (targetTgPct / 100) * builtAcres
            );
            if (
                !race.restrictions.noTrainingGrounds &&
                haveTg < desiredTg
            ) {
                takeFromDonors(desiredTg - haveTg, "TRAINING_GROUNDS");
                candidateProv = cloneProvinceWithBuildings(
                    prov,
                    currentBuildings
                );
                evalResult = evaluateProvinceBuild(candidateProv);
            }
        } else if (goals.focus === "TM") {
            const targetGuildsPct = Math.max(
                effectiveMinGuildsPercent,
                16
            );
            const haveGuilds = get("GUILDS");
            const desiredGuilds = Math.ceil(
                (targetGuildsPct / 100) * builtAcres
            );
            if (haveGuilds < desiredGuilds) {
                takeFromDonors(desiredGuilds - haveGuilds, "GUILDS");
                candidateProv = cloneProvinceWithBuildings(
                    prov,
                    currentBuildings
                );
                evalResult = evaluateProvinceBuild(candidateProv);
            }
        }
    }

    // --- TPA/WPA shortfalls relative to goals (for display only) ---
    const acres = prov.acres || 1;
    const requiredThieves = goals.minTPA ? goals.minTPA * acres : 0;
    const requiredWizards = goals.minWPA ? goals.minWPA * acres : 0;
    const requiredExtraThieves = Math.max(
        0,
        Math.ceil(requiredThieves - prov.thieves)
    );
    const requiredExtraWizards = Math.max(
        0,
        Math.ceil(requiredWizards - prov.wizards)
    );

    return {
        buildings: currentBuildings,
        evaluation: evalResult,
        requiredExtraThieves,
        requiredExtraWizards,
    };
}
