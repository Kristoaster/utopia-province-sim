// src/utopia/calc/food.ts
import type { Province } from "../types.ts";
import { BUILDINGS, BARREN_FOOD_PER_ACRE } from "../data/buildings";
import { FOOD } from "../data/constants.ts";
import { RACES } from "../current/races";
import { calculateBE } from "./be.ts";

export interface FoodResult {
    production: {
        farms: number;
        barren: number;
        total: number;
    };
    consumption: {
        basePopulationConsumption: number;
        raceConsumptionMultiplier: number;
        populationConsumption: number;
    };
    netPerTick: number;
    projectedNextStock: number;
}

export function calculateFood(prov: Province): FoodResult {
    const beResult = calculateBE(prov);
    const be = beResult.be;
    const race = RACES[prov.race];

    const farms = prov.buildings.FARMS ?? 0;
    const farmDef = BUILDINGS.FARMS;

    const farmsProduction =
        farms *
        (farmDef.flat?.food?.perBuildingPerTick ?? 60) *
        be;

    const barrenProduction =
        prov.barrenAcres * BARREN_FOOD_PER_ACRE;

    const totalProduction = farmsProduction + barrenProduction;

    const totalPop =
        prov.peasants +
        prov.soldiers +
        prov.offSpecs +
        prov.defSpecs +
        prov.elites +
        prov.thieves +
        prov.wizards;

    const basePopulationConsumption =
        totalPop * FOOD.CONSUMPTION_PER_POP;

    const foodConsumptionMod = race?.mods.foodConsumption ?? 0;
    const raceConsumptionMultiplier = Math.max(0, 1 + foodConsumptionMod);

    const populationConsumption =
        basePopulationConsumption * raceConsumptionMultiplier;

    const netPerTick = totalProduction - populationConsumption;
    const projectedNextStock = prov.food + netPerTick;

    return {
        production: {
            farms: farmsProduction,
            barren: barrenProduction,
            total: totalProduction,
        },
        consumption: {
            basePopulationConsumption,
            raceConsumptionMultiplier,
            populationConsumption,
        },
        netPerTick,
        projectedNextStock,
    };
}