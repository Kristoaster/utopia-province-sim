import type { Province } from "./types";
import { AGE } from "./data/constants";
import { calculateBE } from "./calc/be.ts";
import { calculateIncome } from "./calc/income.ts";
import { calculateMilitary } from "./calc/military.ts";
import { calculateWages } from "./calc/wages.ts";
import { calculateFood } from "./calc/food.ts";
import { calculateMaxPopulation } from "./calc/population.ts";

export interface ProvinceMetrics {
    beResult: ReturnType<typeof calculateBE>;
    militaryResult: ReturnType<typeof calculateMilitary>;
    maxPopulation: number;
    totalPop: number;
    dailyIncome: number;
    dailyWages: number;
    dailyNetIncome: number;
    dailyFoodProduced: number;
    dailyFoodConsumed: number;
    dailyFoodNet: number;
}

export function computeProvinceMetrics(prov: Province): ProvinceMetrics {
    const beResult = calculateBE(prov);
    const incomeResult = calculateIncome(prov);
    const wagesResult = calculateWages(prov);
    const foodResult = calculateFood(prov);
    const militaryResult = calculateMilitary(prov);
    const maxPopulation = calculateMaxPopulation(prov);

    const totalPop =
        prov.peasants +
        prov.soldiers +
        prov.offSpecs +
        prov.defSpecs +
        prov.elites +
        prov.thieves +
        prov.wizards;

    const ticksPerDay = AGE.TICKS_PER_DAY;

    const dailyIncome = incomeResult.finalIncome * ticksPerDay;
    const dailyWages = wagesResult.totalWages * ticksPerDay;
    const dailyNetIncome =
        (incomeResult.finalIncome - wagesResult.totalWages) * ticksPerDay;

    const dailyFoodProduced = foodResult.production.total * ticksPerDay;
    const dailyFoodConsumed =
        foodResult.consumption.populationConsumption * ticksPerDay;
    const dailyFoodNet = foodResult.netPerTick * ticksPerDay;

    return {
        beResult,
        militaryResult,
        maxPopulation,
        totalPop,
        dailyIncome,
        dailyWages,
        dailyNetIncome,
        dailyFoodProduced,
        dailyFoodConsumed,
        dailyFoodNet,
    };
}