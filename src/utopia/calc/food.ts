// src/utopia/food.ts
import type { Province } from "../types.ts";
import { BUILDINGS, BARREN_FOOD_PER_ACRE } from "../data/buildings";
import { calculateBE } from "./be.ts";

export interface FoodResult {
    production: {
        farms: number;
        barren: number;
        total: number;
    };
    consumption: {
        populationConsumption: number;
    };
    netPerTick: number;
    projectedNextStock: number;
}

export function calculateFood(prov: Province): FoodResult {
    const beResult = calculateBE(prov);
    const be = beResult.be;

    const farms = prov.buildings.FARMS ?? 0;
    const farmDef = BUILDINGS.FARMS;

    // Farms: 60 bushels per day, affected by BE
    const farmsProduction =
        farms *
        (farmDef.flat?.food?.perBuildingPerTick ?? 60) *
        be;

    // Barren: 2 bushels per acre per day, unaffected by BE
    const barrenProduction =
        prov.barrenAcres * BARREN_FOOD_PER_ACRE;

    const totalProduction = farmsProduction + barrenProduction;

    // Consumption: 0.25 bushels per person per tick
    const totalPop =
        prov.peasants +
        prov.soldiers +
        prov.offSpecs +
        prov.defSpecs +
        prov.elites +
        prov.thieves +
        prov.wizards;

    const populationConsumption = totalPop * 0.25;

    const netPerTick = totalProduction - populationConsumption;
    const projectedNextStock = prov.food + netPerTick;

    return {
        production: {
            farms: farmsProduction,
            barren: barrenProduction,
            total: totalProduction,
        },
        consumption: {
            populationConsumption,
        },
        netPerTick,
        projectedNextStock,
    };
}
