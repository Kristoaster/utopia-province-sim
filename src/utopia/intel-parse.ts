// src/utopia/intel-parse.ts
import Papa from "papaparse";
import type { Province, RaceId, PersonalityId, BuildingId } from "./types";
import { RACES } from "./age113/races";
import { PERSONALITIES } from "./age113/personalities";

type IntelRow = Record<string, string>;

// remove commas and leading apostrophes Excel sometimes adds
function parseNumber(value: string | undefined): number {
    if (!value) return 0;
    const cleaned = value.replace(/[,%'"]/g, "").trim();
    if (!cleaned) return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
}

function parsePercent(value: string | undefined): number {
    if (!value) return 0;
    const cleaned = value.replace("%", "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
}

function mapRaceId(name: string | undefined): RaceId {
    const fallback: RaceId = "HUMAN";
    if (!name) return fallback;
    const key = name.trim().toUpperCase().replace(/\s+/g, "_");
    if (key in RACES) {
        return key as RaceId;
    }
    return fallback;
}

function mapPersonalityId(name: string | undefined): PersonalityId {
    const fallback: PersonalityId = "TACTICIAN";
    if (!name) return fallback;
    const key = name.trim().toUpperCase().replace(/\s+/g, "_");
    if (key in PERSONALITIES) {
        return key as PersonalityId;
    }
    return fallback;
}

function rowToProvince(row: IntelRow): Province | null {
    const acres = parseNumber(row["Acres"]);
    if (!acres) {
        return null; // skip broken rows
    }

    const race = mapRaceId(row["Race"]);
    const personality = mapPersonalityId(row["Personality"]);

    const peasants = parseNumber(row["Peons"]);
    const soldiers = parseNumber(row["Solds"]);
    const offSpecs = parseNumber(row["OS"]);
    const defSpecs = parseNumber(row["DS"]);
    const elites = parseNumber(row["Leets"]);
    const thieves = parseNumber(row["Thv"]);
    const wizards = parseNumber(row["Wiz"]);
    const horses = parseNumber(row["Horses"]);
    const prisoners = parseNumber(row["Prisoners"]);

    const location = row["Location"] || "";
    const rulerName = row["Ruler"] || "";
    const honorLevel = parseNumber(row["Honor"]);

    const networth = parseNumber(row["NW"]);
    const tradeBalance = parseNumber(row["TB"]);

    const gold = parseNumber(row["GCs"]);
    const food = parseNumber(row["Food"]);
    const runes = parseNumber(row["Runes"]);
    const trainingCredits = parseNumber(row["T-Credits"]);
    const buildingCredits = parseNumber(row["B-Credits"]);


    const intelOffenseHome = parseNumber(row["OffHome"]);
    const intelDefenseHome = parseNumber(row["DefHome"]);
    const intelWagePercent = parseNumber(row["Wages"]);
    const draftTargetPercent = parsePercent(row["DrftTgt"]);

    const pct = (col: string) => parseNumber(row[col]); // these are % of land

    const homesPct = pct("Home");
    const farmsPct = pct("Farm");
    const millsPct = pct("Mill");
    const banksPct = pct("Bank");
    const tgsPct = pct("TGs");
    const armsPct = pct("Arms");
    const barracksPct = pct("Rax");
    const fortsPct = pct("Fort");
    const castPct = pct("Cast");
    const hospPct = pct("Hosp");
    const guildsPct = pct("Guil");
    const towersPct = pct("Towe");
    const tdsPct = pct("TDs");
    const wtsPct = pct("WTs");
    const univPct = pct("Univ");
    const libsPct = pct("Libs");
    const stablesPct = pct("Stab");
    const dungeonsPct = pct("Dung");


    const buildings: Partial<Record<BuildingId, number>> = {
        HOMES: Math.round((acres * homesPct) / 100),
        FARMS: Math.round((acres * farmsPct) / 100),
        MILLS: Math.round((acres * millsPct) / 100),
        BANKS: Math.round((acres * banksPct) / 100),
        TRAINING_GROUNDS: Math.round((acres * tgsPct) / 100),
        ARMOURIES: Math.round((acres * armsPct) / 100),
        BARRACKS: Math.round((acres * barracksPct) / 100),
        FORTS: Math.round((acres * fortsPct) / 100),
        CASTLES: Math.round((acres * castPct) / 100),
        HOSPITALS: Math.round((acres * hospPct) / 100),
        GUILDS: Math.round((acres * guildsPct) / 100),
        TOWERS: Math.round((acres * towersPct) / 100),
        THIEVES_DENS: Math.round((acres * tdsPct) / 100),
        WATCH_TOWERS: Math.round((acres * wtsPct) / 100),
        UNIVERSITIES: Math.round((acres * univPct) / 100),
        LIBRARIES: Math.round((acres * libsPct) / 100),
        STABLES: Math.round((acres * stablesPct) / 100),
        DUNGEONS: Math.round((acres * dungeonsPct) / 100),
    };

    const builtAcres = Object.values(buildings).reduce(
        (sum, v) => sum + (v || 0),
        0
    );
    const barrenAcres = Math.max(0, acres - builtAcres);

    const province: Province = {
        name: row["Name"] || "Unnamed Province",
        race,
        personality,

        location,
        rulerName,
        honorLevel,

        acres,
        buildings,
        builtAcres,
        barrenAcres,

        peasants,
        soldiers,
        offSpecs,
        defSpecs,
        elites,
        thieves,
        wizards,

        gold,
        wageRate: intelWagePercent ? intelWagePercent / 100 : 1.0,
        food,

        runes,
        horses,
        prisoners,
        networth,
        tradeBalance,
        trainingCredits,
        buildingCredits,

        intelOffenseHome,
        intelDefenseHome,
        intelWagePercent: intelWagePercent || 100,
        draftTargetPercent,

        rawIntel: row,
    };

    return province;
}

export function parseIntelCsv(text: string): Province[] {
    const result = Papa.parse<IntelRow>(text, {
        header: true,
        skipEmptyLines: true,
    });

    const rows = result.data;
    const provinces: Province[] = [];

    for (const row of rows) {
        const prov = rowToProvince(row);
        if (prov) {
            provinces.push(prov);
        }
    }

    return provinces;
}
