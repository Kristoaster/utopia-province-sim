// src/App.tsx
import React, { useState } from "react";
import "./App.css";
import type { Province } from "./utopia/types";
import { RACE_LIST } from "./utopia/age113/races";
import { PERSONALITY_LIST } from "./utopia/age113/personalities";
import { BUILDING_LIST } from "./utopia/data/buildings";
import { calculateBE } from "./utopia/calc/be.ts";
import { calculateIncome } from "./utopia/calc/income.ts";
import { calculateMilitary} from "./utopia/calc/military.ts";
import { calculateWages } from "./utopia/calc/wages.ts";
import { calculateFood } from "./utopia/calc/food.ts";
import { parseIntelCsv } from "./utopia/intel-parse";
import { calculateMaxPopulation } from "./utopia/calc/population.ts";


const initialProvince: Province = {
    name: "Province",
    race: "HUMAN",
    personality: "PALADIN",

    location: "0:0",
    rulerName: "Cayn",
    honorLevel: 0,

    acres: 0,
    builtAcres: 0,
    barrenAcres: 0,

    peasants: 0,
    soldiers: 0,
    offSpecs: 0,
    defSpecs: 0,
    elites: 0,
    thieves: 0,
    wizards: 0,

    buildings: {
        HOMES: 0,
        FARMS: 0,
        MILLS: 0,
        BANKS: 0,
        TRAINING_GROUNDS: 0,
        ARMOURIES: 0,
        BARRACKS: 0,
        FORTS: 0,
        CASTLES: 0,
        HOSPITALS: 0,
        GUILDS: 0,
        TOWERS: 0,
        THIEVES_DENS: 0,
        WATCH_TOWERS: 0,
        UNIVERSITIES: 0,
        LIBRARIES: 0,
        STABLES: 0,
        DUNGEONS: 0,
    },

    gold: 0,
    wageRate: 1.0,
    food: 0,
    runes: 0,
    horses: 0,
    prisoners: 0,
    networth: 0,
    tradeBalance: 0,
    trainingCredits: 0,
    buildingCredits: 0,

    intelOffenseHome: 0,
    intelDefenseHome: 0,
    intelWagePercent: 100,
    draftTargetPercent: 60,
};

function App() {
    const [province, setProvince] = useState<Province>(initialProvince);
    const [intelProvinces, setIntelProvinces] = useState<Province[]>([]);
    const [selectedIntelIndex, setSelectedIntelIndex] = useState<number | null>(
        null
    );

    const beResult = calculateBE(province);
    const incomeResult = calculateIncome(province);
    const wagesResult = calculateWages(province);
    const netIncome = incomeResult.finalIncome - wagesResult.totalWages;
    const foodResult = calculateFood(province);
    const militaryResult = calculateMilitary(province);

    // --- Derived "state page" style numbers ---
    const totalPop =
        province.peasants +
        province.soldiers +
        province.offSpecs +
        province.defSpecs +
        province.elites +
        province.thieves +
        province.wizards;

    const armyPop =
        province.soldiers +
        province.offSpecs +
        province.defSpecs +
        province.elites;

    const thiefPop = province.thieves;
    const wizardPop = province.wizards;

    // Very simple max pop approximation for now; we can refine with Homes later
    const maxPopulation= calculateMaxPopulation(province);

    const jobsUnfilled = Math.max(
        0,
        beResult.jobs.optimalWorkers - beResult.jobs.filledJobs
    );
    const employmentPct =
        beResult.jobs.optimalWorkers > 0
            ? (beResult.jobs.filledJobs / beResult.jobs.optimalWorkers) * 100
            : 100;

    // Base construction and raze cost formulas (no mods)
    const baseBuildCostPerAcre = 0.05 * (province.acres + 10000);
    const baseRazeCostPerAcre = 300 + 0.05 * province.acres;


    // --- Intel upload handler (using your working version) ---
    const handleIntelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result as string;
            const provinces = parseIntelCsv(text);

            if (provinces.length > 0) {
                setIntelProvinces(provinces);
                setSelectedIntelIndex(0);
                setProvince(provinces[0]);
            } else {
                alert("No valid provinces found in intel file.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="page">
            {/* THRONE SUMMARY */}
            <div className="card throne-card">
                <div className="throne-header">
                    <div>
                        <div className="throne-name">{province.name}</div>
                        <div className="throne-sub">
                            <span>
                                {province.race} / {province.personality}
                            </span>
                            <span>KD {province.location}</span>
                            <span>
                                Ruler: {province.rulerName}
                                {province.honorLevel
                                    ? ` (Honor ${province.honorLevel})`
                                    : ""}
                            </span>
                        </div>
                        <div className="throne-pills">
                            <span className="pill">
                                Acres: {province.acres.toLocaleString()}
                            </span>
                            <span className="pill">
                                Peasants: {province.peasants.toLocaleString()}
                            </span>
                            <span className="pill">
                                Total Pop: {totalPop.toLocaleString()}
                            </span>
                            <span className="pill">
                                BE: {(beResult.be * 100).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="throne-summary-grid">
                    <div>
                        <div className="stat-label">Networth</div>
                        <div className="stat-value">
                            {province.networth.toLocaleString()} nw
                        </div>
                    </div>
                    <div>
                        <div className="stat-label">Trade balance</div>
                        <div className="stat-value">
                            {province.tradeBalance.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="stat-label">Gold</div>
                        <div className="stat-value">
                            {province.gold.toLocaleString()} gc
                        </div>
                    </div>
                    <div>
                        <div className="stat-label">Food stock</div>
                        <div className="stat-value">
                            {province.food.toLocaleString()} bushels
                        </div>
                    </div>
                    <div>
                        <div className="stat-label">Runes</div>
                        <div className="stat-value">
                            {province.runes.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="stat-label">Horses / Prisoners</div>
                        <div className="stat-value">
                            {province.horses.toLocaleString()} /{" "}
                            {province.prisoners.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="stat-label">Income / tick</div>
                        <div className="stat-value">
                            {incomeResult.finalIncome.toFixed(0)} gc
                        </div>
                    </div>
                    <div>
                        <div className="stat-label">Net income / tick</div>
                        <div className="stat-value">
                            {netIncome.toFixed(0)} gc
                        </div>
                    </div>
                </div>
            </div>

            {/* INPUTS & INTEL */}
            <div className="card">
                <div className="card-title">Inputs & Intel</div>
                <div className="control-grid">
                    <div>
                        <label>Load intel CSV</label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleIntelUpload}
                        />
                    </div>

                    {intelProvinces.length > 1 && (
                        <div>
                            <label>Province from intel</label>
                            <select
                                value={selectedIntelIndex ?? ""}
                                onChange={(e) => {
                                    const idx = Number(e.target.value);
                                    setSelectedIntelIndex(idx);
                                    const chosen = intelProvinces[idx];
                                    if (chosen) {
                                        setProvince(chosen);
                                    }
                                }}
                            >
                                {intelProvinces.map((prov, idx) => (
                                    <option key={prov.name + idx} value={idx}>
                                        {prov.name} ({prov.race} / {prov.personality})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label>Race</label>
                        <select
                            value={province.race}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    race: e.target.value as Province["race"],
                                }))
                            }
                        >
                            {RACE_LIST.map((race) => (
                                <option key={race.id} value={race.id}>
                                    {race.display}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Personality</label>
                        <select
                            value={province.personality}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    personality: e.target.value as Province["personality"],
                                }))
                            }
                        >
                            {PERSONALITY_LIST.map((pers) => (
                                <option key={pers.id} value={pers.id}>
                                    {pers.display}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Peasants</label>
                        <input
                            type="number"
                            value={province.peasants}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    peasants: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Wages (%)</label>
                        <input
                            type="number"
                            value={(province.wageRate * 100).toFixed(0)}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    wageRate: (Number(e.target.value) || 0) / 100,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Food stock (bushels)</label>
                        <input
                            type="number"
                            value={province.food}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    food: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Homes</label>
                        <input
                            type="number"
                            value={province.buildings.HOMES ?? 0}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    buildings: {
                                        ...prev.buildings,
                                        HOMES: Number(e.target.value) || 0,
                                    },
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Farms</label>
                        <input
                            type="number"
                            value={province.buildings.FARMS ?? 0}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    buildings: {
                                        ...prev.buildings,
                                        FARMS: Number(e.target.value) || 0,
                                    },
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Banks</label>
                        <input
                            type="number"
                            value={province.buildings.BANKS ?? 0}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    buildings: {
                                        ...prev.buildings,
                                        BANKS: Number(e.target.value) || 0,
                                    },
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Training Grounds</label>
                        <input
                            type="number"
                            value={province.buildings.TRAINING_GROUNDS ?? 0}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    buildings: {
                                        ...prev.buildings,
                                        TRAINING_GROUNDS:
                                            Number(e.target.value) || 0,
                                    },
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Forts</label>
                        <input
                            type="number"
                            value={province.buildings.FORTS ?? 0}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    buildings: {
                                        ...prev.buildings,
                                        FORTS: Number(e.target.value) || 0,
                                    },
                                }))
                            }
                        />
                    </div>
                </div>
            </div>

            {/* MAIN PANELS: STATE, MIL, FOOD, SCIENCE */}
            <div className="content-grid">
                {/* State & Economy */}
                <div className="card">
                    <div className="card-title">State & Economy</div>
                    <div className="field-row">
                        <span>Total population</span>
                        <strong>{totalPop.toLocaleString()}</strong>
                    </div>
                    <div className="field-row">
                        <span>Max population</span>
                        <strong>{maxPopulation.toLocaleString()}</strong>
                    </div>
                    <div className="field-row">
                        <span>Peasants</span>
                        <strong>{province.peasants.toLocaleString()}</strong>
                    </div>
                    <div className="field-row">
                        <span>Army population</span>
                        <strong>{armyPop.toLocaleString()}</strong>
                    </div>
                    <div className="field-row">
                        <span>Thieves</span>
                        <strong>{thiefPop.toLocaleString()}</strong>
                    </div>
                    <div className="field-row">
                        <span>Wizards</span>
                        <strong>{wizardPop.toLocaleString()}</strong>
                    </div>
                    <hr />
                    <div className="field-row">
                        <span>Available jobs</span>
                        <strong>{beResult.jobs.totalJobs.toFixed(0)}</strong>
                    </div>
                    <div className="field-row">
                        <span>Workers at work</span>
                        <strong>{beResult.jobs.filledJobs.toFixed(0)}</strong>
                    </div>
                    <div className="field-row">
                        <span>Unfilled jobs</span>
                        <strong>{jobsUnfilled.toFixed(0)}</strong>
                    </div>
                    <div className="field-row">
                        <span>Employment</span>
                        <strong>{employmentPct.toFixed(1)}%</strong>
                    </div>
                    <hr />
                    <div className="field-row">
                        <span>Income / tick</span>
                        <strong>{incomeResult.finalIncome.toFixed(0)} gc</strong>
                    </div>
                    <div className="field-row">
                        <span>Wages / tick</span>
                        <strong>{wagesResult.totalWages.toFixed(0)} gc</strong>
                    </div>
                    <div className="field-row">
                        <span>Net income / tick</span>
                        <strong>{netIncome.toFixed(0)} gc</strong>
                    </div>
                </div>

                {/* Military */}
                <div className="card">
                    <div className="card-title">Military</div>
                    <div className="field-row">
                        <span>Soldiers</span>
                        <strong>{province.soldiers.toLocaleString()}</strong>
                    </div>
                    <div className="field-row">
                        <span>Off specs</span>
                        <strong>{province.offSpecs.toLocaleString()}</strong>
                    </div>
                    <div className="field-row">
                        <span>Def specs</span>
                        <strong>{province.defSpecs.toLocaleString()}</strong>
                    </div>
                    <div className="field-row">
                        <span>Elites</span>
                        <strong>{province.elites.toLocaleString()}</strong>
                    </div>
                    <hr />
                    <div className="field-row">
                        <span>Raw offense</span>
                        <strong>{militaryResult.rawOffense.toFixed(0)}</strong>
                    </div>
                    <div className="field-row">
                        <span>Raw defense</span>
                        <strong>{militaryResult.rawDefense.toFixed(0)}</strong>
                    </div>
                    <div className="field-row">
                        <span>OME (total)</span>
                        <strong>{(militaryResult.ome * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="field-row">
                        <span>DME (from forts)</span>
                        <strong>{(militaryResult.dme * 100).toFixed(1)}%</strong>
                    </div>
                    <div className="field-row">
                        <span>Mod offense</span>
                        <strong>{militaryResult.modOffense.toFixed(0)}</strong>
                    </div>
                    <div className="field-row">
                        <span>Mod defense</span>
                        <strong>{militaryResult.modDefense.toFixed(0)}</strong>
                    </div>
                </div>

                {/* Food & Production */}
                <div className="card">
                    <div className="card-title">Food & Production</div>
                    <div className="field-row">
                        <span>Farms</span>
                        <strong>{(province.buildings.FARMS ?? 0).toFixed(0)}</strong>
                    </div>
                    <div className="field-row">
                        <span>Food production</span>
                        <strong>
                            {foodResult.production.total.toFixed(1)} bushels/tick
                        </strong>
                    </div>
                    <div className="field-row">
                        <span>Food consumption</span>
                        <strong>
                            {foodResult.consumption.populationConsumption.toFixed(1)}{" "}
                            bushels/tick
                        </strong>
                    </div>
                    <div className="field-row">
                        <span>Net food / tick</span>
                        <strong
                            style={{
                                color: foodResult.netPerTick < 0 ? "#f97373" : "inherit",
                            }}
                        >
                            {foodResult.netPerTick.toFixed(1)} bushels/tick
                        </strong>
                    </div>
                    <div className="field-row">
                        <span>Projected stock (1 tick)</span>
                        <strong
                            style={{
                                color:
                                    foodResult.projectedNextStock < 0
                                        ? "#f97373"
                                        : "inherit",
                            }}
                        >
                            {foodResult.projectedNextStock.toFixed(0)} bushels
                        </strong>
                    </div>
                </div>

                {/* Buildings */}
                <div className="card">
                    <div className="card-title">Buildings</div>

                    <div className="field-row">
                        <span>Total land</span>
                        <strong>{province.acres.toLocaleString()} acres</strong>
                    </div>
                    <div className="field-row">
                        <span>Built acres</span>
                        <strong>{province.builtAcres.toLocaleString()}</strong>
                    </div>
                    <div className="field-row">
                        <span>Barren acres</span>
                        <strong>{province.barrenAcres.toLocaleString()}</strong>
                    </div>
                    <hr />
                    <div className="field-row">
                        <span>Construction cost / acre (base)</span>
                        <strong>{baseBuildCostPerAcre.toFixed(0)} gc</strong>
                    </div>
                    <div className="field-row">
                        <span>Raze cost / acre (base)</span>
                        <strong>{baseRazeCostPerAcre.toFixed(0)} gc</strong>
                    </div>
                    <div className="field-row">
                        <span>Building credits</span>
                        <strong>{province.buildingCredits.toLocaleString()}</strong>
                    </div>
                    <hr />
                    <div className="field-row">
                        <span>Total jobs</span>
                        <strong>{beResult.jobs.totalJobs.toFixed(0)}</strong>
                    </div>
                    <div className="field-row">
                        <span>Workers needed for max BE</span>
                        <strong>{beResult.jobs.optimalWorkers.toFixed(0)}</strong>
                    </div>
                    <div className="field-row">
                        <span>Building efficiency</span>
                        <strong>{(beResult.be * 100).toFixed(2)}%</strong>
                    </div>

                    {/* Per-building breakdown */}
                    <table className="buildings-table">
                        <thead>
                        <tr>
                            <th>Building</th>
                            <th style={{ textAlign: "right" }}>Acres</th>
                            <th style={{ textAlign: "right" }}>% land</th>
                            <th>Effect</th>
                        </tr>
                        </thead>
                        <tbody>
                        {BUILDING_LIST.filter(
                            (b) => (province.buildings[b.id] ?? 0) > 0
                        ).map((b) => {
                            const acres = province.buildings[b.id] ?? 0;
                            const pct = province.acres
                                ? (acres / province.acres) * 100
                                : 0;
                            return (
                                <tr key={b.id}>
                                    <td>{b.display}</td>
                                    <td style={{ textAlign: "right" }}>
                                        {acres.toLocaleString()}
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        {pct.toFixed(1)}%
                                    </td>
                                    <td>{b.note}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {/* Science placeholder */}
                <div className="card">
                    <div className="card-title">Science</div>
                    <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                        Science details (books & effects per category) will go here.
                        For now, this is just a placeholder panel until we wire in
                        science from the intel export.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;