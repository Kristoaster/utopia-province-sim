// src/App.tsx
import React, { useState } from "react";
import "./App.css";
import type { BuildGoals, BuildPlan } from "./utopia/calc/build-planner.ts";
import { generateSuggestedBuild } from "./utopia/calc/build-planner.ts";
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
import { ManualInputsPanel } from "./features/snapshot/ManualInputsPanel";
import type {
    ManualOverrides,
    IntelRow as SnapshotIntelRow,
} from "./features/snapshot/snapshotModel";




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

function computeProvinceMetrics(prov: Province) {
    const beResult = calculateBE(prov);
    const incomeResult = calculateIncome(prov);
    const wagesResult = calculateWages(prov);
    const netIncome = incomeResult.finalIncome - wagesResult.totalWages;
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

    const armyPop =
        prov.soldiers +
        prov.offSpecs +
        prov.defSpecs +
        prov.elites;

    const thiefPop = prov.thieves;
    const wizardPop = prov.wizards;

    const jobsUnfilled = Math.max(
        0,
        beResult.jobs.optimalWorkers - beResult.jobs.filledJobs
    );
    const employmentPct =
        beResult.jobs.optimalWorkers > 0
            ? (beResult.jobs.filledJobs / beResult.jobs.optimalWorkers) * 100
            : 100;

    // Base construction and raze cost formulas (no mods)
    const baseBuildCostPerAcre = 0.05 * (prov.acres + 10000);
    const baseRazeCostPerAcre = 300 + 0.05 * prov.acres;

    return {
        beResult,
        incomeResult,
        wagesResult,
        netIncome,
        foodResult,
        militaryResult,
        maxPopulation,
        totalPop,
        armyPop,
        thiefPop,
        wizardPop,
        jobsUnfilled,
        employmentPct,
        baseBuildCostPerAcre,
        baseRazeCostPerAcre,
    };
}

function App() {
    const [province, setProvince] = useState<Province>(initialProvince);
    const [baselineProvince, setBaselineProvince] =
        useState<Province>(initialProvince);
    const [intelProvinces, setIntelProvinces] = useState<Province[]>([]);
    const [selectedIntelIndex, setSelectedIntelIndex] = useState<number | null>(
        null
    );

    const [manualOverrides, setManualOverrides] = useState<ManualOverrides>({});

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

    type ProvinceWithIntel = Province & { rawIntel?: SnapshotIntelRow };

    const provinceWithIntel = province as ProvinceWithIntel;
    const snapshotIntelRow: SnapshotIntelRow | null =
        provinceWithIntel.rawIntel ?? null;

    const baselineMetrics = computeProvinceMetrics(baselineProvince);
    const currentMetrics = computeProvinceMetrics(province);

// Shorthand for current metrics
    const {
        beResult,
        incomeResult,
        wagesResult,
        netIncome,
        foodResult,
        militaryResult,
        maxPopulation,
        totalPop,
        armyPop,
        thiefPop,
        wizardPop,
        jobsUnfilled,
        employmentPct,
        baseBuildCostPerAcre,
        baseBuildCostPerAcre: _ignoredBuild, // just to avoid TS unused import if needed
        baseRazeCostPerAcre,
    } = currentMetrics;

    const netIncomeClass = netIncome < 0 ? "value-bad" : "value-good";
    const employmentClass =
        employmentPct < 80 ? "value-bad" : employmentPct < 95 ? "value-warn" : "value-good";


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

                const first = provinces[0];

                setProvince(first);
                setBaselineProvince({
                    ...first,
                    buildings: { ...first.buildings },
                });

                setBuildPlan(null);
                setManualOverrides({});
            } else {
                alert("No valid provinces found in intel file.");
            }
        };
        reader.readAsText(file);
    };

    const handleSaveSnapshot = () => {
        // Clone so future edits to `province` don’t mutate the baseline object
        setBaselineProvince({
            ...province,
            buildings: { ...province.buildings },
        });
    };


    return (
        <div className="page">
            {/* Workflow strip */}
            <div className="workflow-strip">
                <span className="step active">1. Load intel</span>
                <span className="step">2. Review snapshot</span>
                <span className="step">3. Set goals</span>
                <span className="step">4. Tweak overrides</span>
            </div>

            {/* Intel loader at top */}
            <div className="card">
                <div className="card-title">Load intel</div>
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
                                        setBaselineProvince({
                                            ...chosen,
                                            buildings: { ...chosen.buildings },
                                        });
                                        setBuildPlan(null);
                                        setManualOverrides({});
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
                </div>
            </div>

            <h2 className="section-title">Current Snapshot</h2>

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

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <button type="button" onClick={handleSaveSnapshot}>
                            Save snapshot as baseline
                        </button>
                        <span style={{ fontSize: "0.7rem", color: "#cbd5f5" }}>
                Saves the <strong>New</strong> values as the new
                comparison baseline.
            </span>
                    </div>
                </div>

                {/* Snapshot comparison table */}
                <table className="buildings-table">
                    <thead>
                    <tr>
                        <th>Metric</th>
                        <th style={{ textAlign: "right" }}>Current</th>
                        <th style={{ textAlign: "right" }}>New</th>
                    </tr>
                    </thead>
                    <tbody>
                    {/* Throne / basics */}
                    <tr>
                        <td>Networth</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineProvince.networth.toLocaleString()} nw
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {province.networth.toLocaleString()} nw
                        </td>
                    </tr>
                    <tr>
                        <td>Trade balance</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineProvince.tradeBalance.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {province.tradeBalance.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td>Gold</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineProvince.gold.toLocaleString()} gc
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {province.gold.toLocaleString()} gc
                        </td>
                    </tr>
                    <tr>
                        <td>Food stock</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineProvince.food.toLocaleString()} bushels
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {province.food.toLocaleString()} bushels
                        </td>
                    </tr>
                    <tr>
                        <td>Runes</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineProvince.runes.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {province.runes.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td>Horses / Prisoners</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineProvince.horses.toLocaleString()} /{" "}
                            {baselineProvince.prisoners.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {province.horses.toLocaleString()} /{" "}
                            {province.prisoners.toLocaleString()}
                        </td>
                    </tr>

                    {/* State & population */}
                    <tr>
                        <td>Total population</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.totalPop.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {totalPop.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td>Max population</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.maxPopulation.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {maxPopulation.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td>Peasants</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineProvince.peasants.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {province.peasants.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td>Army population</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.armyPop.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {armyPop.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td>Thieves</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.thiefPop.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {thiefPop.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td>Wizards</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.wizardPop.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {wizardPop.toLocaleString()}
                        </td>
                    </tr>

                    {/* Employment & BE */}
                    <tr>
                        <td>Available jobs</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.beResult.jobs.totalJobs.toFixed(0)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {beResult.jobs.totalJobs.toFixed(0)}
                        </td>
                    </tr>
                    <tr>
                        <td>Workers at work</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.beResult.jobs.filledJobs.toFixed(0)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {beResult.jobs.filledJobs.toFixed(0)}
                        </td>
                    </tr>
                    <tr>
                        <td>Unfilled jobs</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.jobsUnfilled.toFixed(0)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {jobsUnfilled.toFixed(0)}
                        </td>
                    </tr>
                    <tr>
                        <td>Employment</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.employmentPct.toFixed(1)}%
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {employmentPct.toFixed(1)}%
                        </td>
                    </tr>
                    <tr>
                        <td>Building efficiency</td>
                        <td style={{ textAlign: "right" }}>
                            {(baselineMetrics.beResult.be * 100).toFixed(2)}%
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {(beResult.be * 100).toFixed(2)}%
                        </td>
                    </tr>

                    {/* Economy */}
                    <tr>
                        <td>Income / tick</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.incomeResult.finalIncome.toFixed(0)} gc
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {incomeResult.finalIncome.toFixed(0)} gc
                        </td>
                    </tr>
                    <tr>
                        <td>Wages / tick</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.wagesResult.totalWages.toFixed(0)} gc
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {wagesResult.totalWages.toFixed(0)} gc
                        </td>
                    </tr>
                    <tr>
                        <td>Net income / tick</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.netIncome.toFixed(0)} gc
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {netIncome.toFixed(0)} gc
                        </td>
                    </tr>

                    {/* Military */}
                    <tr>
                        <td>Raw offense</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.militaryResult.rawOffense.toFixed(0)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {militaryResult.rawOffense.toFixed(0)}
                        </td>
                    </tr>
                    <tr>
                        <td>Raw defense</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.militaryResult.rawDefense.toFixed(0)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {militaryResult.rawDefense.toFixed(0)}
                        </td>
                    </tr>
                    <tr>
                        <td>OME (total)</td>
                        <td style={{ textAlign: "right" }}>
                            {(baselineMetrics.militaryResult.ome * 100).toFixed(1)}%
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {(militaryResult.ome * 100).toFixed(1)}%
                        </td>
                    </tr>
                    <tr>
                        <td>DME (from forts)</td>
                        <td style={{ textAlign: "right" }}>
                            {(baselineMetrics.militaryResult.dme * 100).toFixed(1)}%
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {(militaryResult.dme * 100).toFixed(1)}%
                        </td>
                    </tr>
                    <tr>
                        <td>Mod offense</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.militaryResult.modOffense.toFixed(0)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {militaryResult.modOffense.toFixed(0)}
                        </td>
                    </tr>
                    <tr>
                        <td>Mod defense</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.militaryResult.modDefense.toFixed(0)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {militaryResult.modDefense.toFixed(0)}
                        </td>
                    </tr>

                    {/* Food */}
                    <tr>
                        <td>Food production</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.foodResult.production.total.toFixed(1)} /tick
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {foodResult.production.total.toFixed(1)} /tick
                        </td>
                    </tr>
                    <tr>
                        <td>Food consumption</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.foodResult.consumption.populationConsumption.toFixed(
                                1
                            )}{" "}
                            /tick
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {foodResult.consumption.populationConsumption.toFixed(1)} /tick
                        </td>
                    </tr>
                    <tr>
                        <td>Net food / tick</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.foodResult.netPerTick.toFixed(1)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {foodResult.netPerTick.toFixed(1)}
                        </td>
                    </tr>
                    <tr>
                        <td>Projected stock (1 tick)</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.foodResult.projectedNextStock.toFixed(0)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {foodResult.projectedNextStock.toFixed(0)}
                        </td>
                    </tr>

                    {/* Buildings high-level */}
                    <tr>
                        <td>Total land</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineProvince.acres.toLocaleString()} acres
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {province.acres.toLocaleString()} acres
                        </td>
                    </tr>
                    <tr>
                        <td>Built acres</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineProvince.builtAcres.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {province.builtAcres.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td>Barren acres</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineProvince.barrenAcres.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {province.barrenAcres.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td>Building credits</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineProvince.buildingCredits.toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {province.buildingCredits.toLocaleString()}
                        </td>
                    </tr>
                    <tr>
                        <td>Construction cost / acre (base)</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.baseBuildCostPerAcre.toFixed(0)} gc
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {baseBuildCostPerAcre.toFixed(0)} gc
                        </td>
                    </tr>
                    <tr>
                        <td>Raze cost / acre (base)</td>
                        <td style={{ textAlign: "right" }}>
                            {baselineMetrics.baseRazeCostPerAcre.toFixed(0)} gc
                        </td>
                        <td style={{ textAlign: "right" }}>
                            {baseRazeCostPerAcre.toFixed(0)} gc
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>

            {/* GOALS & OPTIMIZER */}
            <h2 className="section-title">Planning & Optimization</h2>
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
            <h2 className="section-title">Detailed Breakdown</h2>
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
                        <strong className={employmentClass}>{employmentPct.toFixed(1)}%</strong>
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
                        <strong className={netIncomeClass}>{netIncome.toFixed(0)} gc</strong>
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

            {/* PROVINCE INPUTS (Intel + manual) */}
            <h2 className="section-title">Inputs & Overrides</h2>
            <div className="card">
                <div className="card-title">Province inputs</div>

                {/* 2️⃣ Manual inputs / overrides live here */}
                <details style={{ marginTop: "0.75rem" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                        Manual Inputs / Overrides
                    </summary>

                    <div style={{ marginTop: "0.75rem" }}>
                        <p className="help-text">
                            Values here override intel for calculations. Leave a field blank to keep the
                            intel value.
                        </p>

                        {/* Identity */}
                        <div className="manual-section">
                            <h4 className="manual-section-title">Identity</h4>
                            <div className="control-grid">
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
                            </div>
                        </div>

                        {/* Population & Military */}
                        <div className="manual-section">
                            <h4 className="manual-section-title">Population & Military</h4>
                            <div className="control-grid">
                                {/* peasants / soldiers / off / def / elites / thieves / wizards */}
                                {/* this is the same content you already have, just grouped */}
                                {/* copy your existing divs for these fields into here */}
                            </div>
                        </div>

                        {/* Economy & Resources */}
                        <div className="manual-section">
                            <h4 className="manual-section-title">Economy & Resources</h4>
                            <div className="control-grid">
                                {/* gold, food, runes, horses, prisoners, wageRate */}
                                {/* copy those input blocks here */}
                            </div>
                        </div>

                        {/* Intel-only fields */}
                        <div className="manual-section">
                            <h4 className="manual-section-title">Intel-only fields</h4>
                            <div className="control-grid">
                                {/* intelOffenseHome, intelDefenseHome, intelWagePercent, draftTargetPercent */}
                                {/* copy those input blocks here */}
                            </div>
                        </div>

                        {/* Snapshot-based manual overrides */}
                        <div className="manual-section">
                            <h4 className="manual-section-title">Snapshot overrides</h4>
                            <ManualInputsPanel
                                intelRow={snapshotIntelRow}
                                manualOverrides={manualOverrides}
                                onChange={(key, value) =>
                                    setManualOverrides((prev) => ({
                                        ...prev,
                                        [key]: value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                </details>


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
        </div>
    );
}

export default App;