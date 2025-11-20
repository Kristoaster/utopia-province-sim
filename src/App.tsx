// src/App.tsx
import React, { useState } from "react";
import "./App.css";
import type { BuildGoals, BuildPlan } from "./utopia/calc/build-planner.ts";
import { generateSuggestedBuild, cloneProvinceWithBuildings, } from "./utopia/calc/build-planner.ts";
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
    rulerName: " ",
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

    const [goals, setGoals] = useState<BuildGoals>({
        minNetIncome: 0,
        noStarvation: true,
        minTPA: 2,
        minWPA: 2,
        minGuildsPercent: 10,
        minTDsPercent: 10,
        maxRebuildPercent: 40,
        focus: "HYBRID",
    });

    const [buildPlan, setBuildPlan] = useState<BuildPlan | null>(null);

    const handleGenerateSuggestion = () => {
        const plan = generateSuggestedBuild(province, goals);
        setBuildPlan(plan);
    };
    const suggestedProvince = buildPlan
        ? cloneProvinceWithBuildings(province, buildPlan.buildings)
        : null;


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

            {/* PROVINCE INPUTS (Intel + manual) */}
            <div className="card">
                <div className="card-title">Province inputs</div>

                <div className="control-grid">
                    {/* Intel file upload & selection */}
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
                                        setBuildPlan(null); // reset suggestion when province changes
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

                    {/* Identity & meta */}
                    <div>
                        <label>Province name</label>
                        <input
                            type="text"
                            value={province.name}
                            onChange={(e) =>
                                setProvince((prev) => ({ ...prev, name: e.target.value }))
                            }
                        />
                    </div>

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
                        <label>Kingdom location (x:y)</label>
                        <input
                            type="text"
                            value={province.location}
                            onChange={(e) =>
                                setProvince((prev) => ({ ...prev, location: e.target.value }))
                            }
                        />
                    </div>

                    <div>
                        <label>Ruler name</label>
                        <input
                            type="text"
                            value={province.rulerName}
                            onChange={(e) =>
                                setProvince((prev) => ({ ...prev, rulerName: e.target.value }))
                            }
                        />
                    </div>

                    <div>
                        <label>Honor level</label>
                        <input
                            type="number"
                            value={province.honorLevel}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    honorLevel: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Total acres</label>
                        <input
                            type="number"
                            value={province.acres}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    acres: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Networth</label>
                        <input
                            type="number"
                            value={province.networth}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    networth: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Trade balance</label>
                        <input
                            type="number"
                            value={province.tradeBalance}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    tradeBalance: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    {/* Population & units */}
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
                        <label>Soldiers</label>
                        <input
                            type="number"
                            value={province.soldiers}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    soldiers: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Off specs</label>
                        <input
                            type="number"
                            value={province.offSpecs}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    offSpecs: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Def specs</label>
                        <input
                            type="number"
                            value={province.defSpecs}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    defSpecs: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Elites</label>
                        <input
                            type="number"
                            value={province.elites}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    elites: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Thieves</label>
                        <input
                            type="number"
                            value={province.thieves}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    thieves: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Wizards</label>
                        <input
                            type="number"
                            value={province.wizards}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    wizards: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    {/* Resources & econ settings */}
                    <div>
                        <label>Gold (gc)</label>
                        <input
                            type="number"
                            value={province.gold}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    gold: Number(e.target.value) || 0,
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
                        <label>Runes</label>
                        <input
                            type="number"
                            value={province.runes}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    runes: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Horses</label>
                        <input
                            type="number"
                            value={province.horses}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    horses: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Prisoners</label>
                        <input
                            type="number"
                            value={province.prisoners}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    prisoners: Number(e.target.value) || 0,
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

                    {/* Intel-only fields (for reference/comparisons later) */}
                    <div>
                        <label>Intel offense (home)</label>
                        <input
                            type="number"
                            value={province.intelOffenseHome}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    intelOffenseHome: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Intel defense (home)</label>
                        <input
                            type="number"
                            value={province.intelDefenseHome}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    intelDefenseHome: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Intel wages setting (%)</label>
                        <input
                            type="number"
                            value={province.intelWagePercent}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    intelWagePercent: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Draft target (%)</label>
                        <input
                            type="number"
                            value={province.draftTargetPercent}
                            onChange={(e) =>
                                setProvince((prev) => ({
                                    ...prev,
                                    draftTargetPercent: Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>
                </div>

                {/* Buildings manual entry */}
                <hr />
                <div style={{ marginTop: "0.5rem" }}>
                    <div
                        className="card-title"
                        style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}
                    >
                        Buildings (acres)
                    </div>
                    <div className="buildings-input-grid">
                        {BUILDING_LIST.map((b) => (
                            <div key={b.id}>
                                <label>{b.display}</label>
                                <input
                                    type="number"
                                    value={province.buildings[b.id] ?? 0}
                                    onChange={(e) =>
                                        setProvince((prev) => ({
                                            ...prev,
                                            buildings: {
                                                ...prev.buildings,
                                                [b.id]: Number(e.target.value) || 0,
                                            },
                                        }))
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* GOALS & OPTIMIZER */}
            <div className="card">
                <div className="card-title">Goals & suggested build</div>
                <div className="control-grid">
                    <div>
                        <label>Target TPA (min)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={goals.minTPA ?? ""}
                            onChange={(e) =>
                                setGoals((prev) => ({
                                    ...prev,
                                    minTPA:
                                        e.target.value === ""
                                            ? undefined
                                            : Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Target WPA (min)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={goals.minWPA ?? ""}
                            onChange={(e) =>
                                setGoals((prev) => ({
                                    ...prev,
                                    minWPA:
                                        e.target.value === ""
                                            ? undefined
                                            : Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Min net income / tick (gc)</label>
                        <input
                            type="number"
                            value={goals.minNetIncome ?? ""}
                            onChange={(e) =>
                                setGoals((prev) => ({
                                    ...prev,
                                    minNetIncome:
                                        e.target.value === ""
                                            ? undefined
                                            : Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Max land to rebuild (%)</label>
                        <input
                            type="number"
                            value={goals.maxRebuildPercent ?? ""}
                            onChange={(e) =>
                                setGoals((prev) => ({
                                    ...prev,
                                    maxRebuildPercent:
                                        e.target.value === ""
                                            ? undefined
                                            : Number(e.target.value) || 0,
                                }))
                            }
                        />
                    </div>

                    <div>
                        <label>Build focus</label>
                        <select
                            value={goals.focus}
                            onChange={(e) =>
                                setGoals((prev) => ({
                                    ...prev,
                                    focus: e.target.value as BuildGoals["focus"],
                                }))
                            }
                        >
                            <option value="HYBRID">Hybrid</option>
                            <option value="INCOME">Income</option>
                            <option value="OFFENSE">Attacker</option>
                            <option value="TM">T/M</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <label>
                            <input
                                type="checkbox"
                                checked={goals.noStarvation ?? false}
                                onChange={(e) =>
                                    setGoals((prev) => ({
                                        ...prev,
                                        noStarvation: e.target.checked,
                                    }))
                                }
                            />{" "}
                            Avoid starvation
                        </label>
                    </div>

                    <div>
                        <label>&nbsp;</label>
                        <button type="button" onClick={handleGenerateSuggestion}>
                            Generate suggested build
                        </button>
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

                {/* Suggested build vs current */}
                <div className="card">
                    <div className="card-title">Suggested build (vs current)</div>

                    {!buildPlan ? (
                        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                            Set your goals above and click{" "}
                            <strong>Generate suggested build</strong> to see a proposed layout
                            based on your current intel snapshot.
                        </p>
                    ) : (
                        <>
                            <div className="field-row">
                                <span>Net income / tick</span>
                                <strong>
                                    {netIncome.toFixed(0)} →{" "}
                                    {buildPlan.evaluation.netIncome.toFixed(0)} gc
                                </strong>
                            </div>
                            <div className="field-row">
                                <span>Net food / tick</span>
                                <strong>
                                    {foodResult.netPerTick.toFixed(1)} →{" "}
                                    {buildPlan.evaluation.netFoodPerTick.toFixed(1)} bushels
                                </strong>
                            </div>
                            <div className="field-row">
                                <span>Building efficiency</span>
                                <strong>
                                    {(beResult.be * 100).toFixed(1)}% →{" "}
                                    {(buildPlan.evaluation.be * 100).toFixed(1)}%
                                </strong>
                            </div>
                            <div className="field-row">
                                <span>Mod offense</span>
                                <strong>
                                    {militaryResult.modOffense.toFixed(0)} →{" "}
                                    {buildPlan.evaluation.modOffense.toFixed(0)}
                                </strong>
                            </div>
                            <div className="field-row">
                                <span>Mod defense</span>
                                <strong>
                                    {militaryResult.modDefense.toFixed(0)} →{" "}
                                    {buildPlan.evaluation.modDefense.toFixed(0)}
                                </strong>
                            </div>

                            {(buildPlan.requiredExtraThieves > 0 ||
                                buildPlan.requiredExtraWizards > 0) && (
                                <p
                                    style={{
                                        fontSize: "0.8rem",
                                        color: "#9ca3af",
                                        marginTop: "0.5rem",
                                    }}
                                >
                                    To reach your TPA/WPA targets, you’d need approximately{" "}
                                    {buildPlan.requiredExtraThieves > 0 &&
                                        `${buildPlan.requiredExtraThieves.toLocaleString()} more thieves`}
                                    {buildPlan.requiredExtraThieves > 0 &&
                                        buildPlan.requiredExtraWizards > 0 &&
                                        " and "}
                                    {buildPlan.requiredExtraWizards > 0 &&
                                        `${buildPlan.requiredExtraWizards.toLocaleString()} more wizards.`}
                                </p>
                            )}

                            <table className="buildings-table">
                                <thead>
                                <tr>
                                    <th>Building</th>
                                    <th style={{ textAlign: "right" }}>Current</th>
                                    <th style={{ textAlign: "right" }}>Suggested</th>
                                    <th style={{ textAlign: "right" }}>Δ acres</th>
                                </tr>
                                </thead>
                                <tbody>
                                {BUILDING_LIST.map((b) => {
                                    const curAcres = province.buildings[b.id] ?? 0;
                                    const sugAcres = buildPlan.buildings[b.id] ?? 0;
                                    if (!curAcres && !sugAcres) return null;
                                    const delta = sugAcres - curAcres;
                                    return (
                                        <tr key={b.id}>
                                            <td>{b.display}</td>
                                            <td style={{ textAlign: "right" }}>
                                                {curAcres}
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                {sugAcres}
                                            </td>
                                            <td
                                                style={{
                                                    textAlign: "right",
                                                    color:
                                                        delta > 0
                                                            ? "#4ade80"
                                                            : delta < 0
                                                                ? "#f97373"
                                                                : "inherit",
                                                }}
                                            >
                                                {delta > 0 ? `+${delta}` : delta}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}

export default App;