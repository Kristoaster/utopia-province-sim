import { RACES as ACTIVE_RACES, RACE_LIST as ACTIVE_RACE_LIST } from "../ages/age114/races";
import type { Race, RaceUnits } from "../ages/shared/races";
import type { RaceId } from "../types";

export const RACES = ACTIVE_RACES;
export const RACE_LIST = ACTIVE_RACE_LIST;

export type { Race, RaceUnits };

export function getRace(id: RaceId): Race | null {
    return RACES[id] ?? null;
}

export function isActiveRace(id: RaceId): boolean {
    return getRace(id) !== null;
}