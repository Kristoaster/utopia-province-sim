import {
    PERSONALITIES as ACTIVE_PERSONALITIES,
    PERSONALITY_LIST as ACTIVE_PERSONALITY_LIST,
} from "../ages/age114/personalities";
import type { Personality } from "../ages/shared/personalities";
import type { PersonalityId } from "../types";

export const PERSONALITIES = ACTIVE_PERSONALITIES;
export const PERSONALITY_LIST = ACTIVE_PERSONALITY_LIST;

export type { Personality };

export function getPersonality(id: PersonalityId): Personality | null {
    return PERSONALITIES[id] ?? null;
}

export function isActivePersonality(id: PersonalityId): boolean {
    return getPersonality(id) !== null;
}