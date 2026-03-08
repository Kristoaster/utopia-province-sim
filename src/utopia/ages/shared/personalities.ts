import type { PersonalityId } from "../../types";

export interface Personality {
    id: PersonalityId;
    display: string;
    mods: {
        buildingCapacity?: number;
        buildingProduction?: number;
        buildingCreditsGain?: number;
        espionageSuccess?: number;
        espionageStealthCost?: number;
        econSciEff?: number;
        eliteDefBonus?: number;
        defSpecDefBonus?: number;
        selfSpellManaCost?: number;
        hospitalEff?: number;
        wizardProduction?: number;
        thiefLosses?: number;
        spellDamage?: number;
        sabotageDamage?: number;
        arcaneSciEff?: number;
        guildEff?: number;
        channelingSciEff?: number;
        tdEff?: number;
        crimeSciEff?: number;
        stealthRecovery?: number;
        attackTime?: number;
        siegeSciEff?: number;
        ome?: number;
        mercStrength?: number;
        mercCost?: number;
        tacticsSciEff?: number;
        valorSciEff?: number;
        wpa?: number;
        resilienceSciEff?: number;
        trainingTime?: number;
        specCreditsGain?: number;
    };
    starting: {
        soldiers?: number;
        specCredits?: number;
        buildingCredits?: number;
        wizards?: number;
        thieves?: number;
    };
    spellbook: string[];
    uniqueAbility: string;
}