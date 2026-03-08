// src/App.tsx
import React, { useState } from "react";
import "./App.css";
// import type { BuildGoals, BuildPlan } from "./utopia/calc/build-planner.ts";
// import { generateSuggestedBuild } from "./utopia/calc/build-planner.ts";
import type { Province } from "./utopia/types";
import { RACE_LIST } from "./utopia/age113/races";
import { PERSONALITY_LIST } from "./utopia/age113/personalities";
import { BUILDING_LIST } from "./utopia/data/buildings";
import { calculateBE } from "./utopia/calc/be.ts";
import { calculateIncome } from "./utopia/calc/income.ts";
import { calculateMilitary } from "./utopia/calc/military.ts";
import { calculateWages } from "./utopia/calc/wages.ts";
import { calculateFood } from "./utopia/calc/food.ts";
import { parseIntelCsv } from "./utopia/intel-parse";
import { calculateMaxPopulation } from "./utopia/calc/population.ts";
import {
    resolveNwpa,
    resolvePpa,
    resolveGcpa,
    resolveRawTpa,
    resolveRawWpa,
    toMetricCell,
    simpleMetricCell,
} from "./features/snapshot/snapshotDisplay";
// import { ManualInputsPanel } from "./features/snapshot/ManualInputsPanel";
// import type {
//     ManualOverrides,
//     IntelRow as SnapshotIntelRow,
// } from "./features/snapshot/snapshotModel";

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

    const baseBuildCostPerAcre = 0.05 * (prov.acres + 10000);
    const baseRazeCostPerAcre = 300 + 0.05 * prov.acres;

    const TICKS_PER_DAY = 24;

    const dailyIncome = incomeResult.finalIncome * TICKS_PER_DAY;
    const dailyWages = wagesResult.totalWages * TICKS_PER_DAY;
    const dailyNetIncome = netIncome * TICKS_PER_DAY;

    const dailyFoodProduced = foodResult.production.total * TICKS_PER_DAY;
    const dailyFoodConsumed =
        foodResult.consumption.populationConsumption * TICKS_PER_DAY;
    const dailyFoodNet = foodResult.netPerTick * TICKS_PER_DAY;

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
        dailyIncome,
        dailyWages,
        dailyNetIncome,
        dailyFoodProduced,
        dailyFoodConsumed,
        dailyFoodNet,
    };
}

type SnapshotMetricCell = {
    primary: string;
    secondary?: string | null;
    numeric: number | null;
};

type SnapshotMetricProps = {
    label: string;
    baseline: SnapshotMetricCell;
    current: SnapshotMetricCell;
    formatDelta?: (delta: number) => string;
    showPercentDelta?: boolean;
    currentClassNameOverride?: string;
};

const SnapshotMetric: React.FC<SnapshotMetricProps> = ({
                                                           label,
                                                           baseline,
                                                           current,
                                                           formatDelta,
                                                           showPercentDelta = true,
                                                           currentClassNameOverride,
                                                       }) => {
    const hasBothNumbers =
        baseline.numeric !== null && current.numeric !== null;

    let deltaContent: React.ReactNode = null;
    let currentClassName = "snapshot-metric-value";

    if (hasBothNumbers) {
        const diff = (current.numeric as number) - (baseline.numeric as number);

        if (Math.abs(diff) > 1e-6) {
            const isPositive = diff > 0;
            const deltaText = formatDelta
                ? formatDelta(diff)
                : diff.toFixed(2);

            const pct =
                baseline.numeric !== 0
                    ? ((diff / (baseline.numeric as number)) * 100).toFixed(1)
                    : null;

            currentClassName += isPositive ? " value-good" : " value-bad";

            deltaContent = (
                <div className="snapshot-metric-delta-inner">
          <span className={isPositive ? "value-good" : "value-bad"}>
            {isPositive ? "+" : ""}
              {deltaText}
          </span>
                    {showPercentDelta && pct !== null && (
                        <span className="snapshot-metric-delta-percent">
              ({parseFloat(pct) > 0 ? "+" : ""}
                            {pct}%)
            </span>
                    )}
                </div>
            );
        }
    }

    if (currentClassNameOverride) {
        currentClassName += " " + currentClassNameOverride;
    }

    return (
        <tr>
            <td className="snapshot-metric-label">{label}</td>

            <td className="snapshot-metric-value baseline">
                <div className="snapshot-cell-stack">
                    <div>{baseline.primary}</div>
                    {baseline.secondary && (
                        <div className="snapshot-subvalue">{baseline.secondary}</div>
                    )}
                </div>
            </td>

            <td className={currentClassName}>
                <div className="snapshot-cell-stack">
                    <div>{current.primary}</div>
                    {current.secondary && (
                        <div className="snapshot-subvalue">{current.secondary}</div>
                    )}
                </div>
            </td>

            <td className="snapshot-metric-delta">{deltaContent}</td>
        </tr>
    );
};

type IntelSource = "CSV" | "MANUAL";

function App() {
    const [province, setProvince] = useState<Province>(initialProvince);
    const [baselineProvince, setBaselineProvince] =
        useState<Province>(initialProvince);
    const [intelProvinces, setIntelProvinces] = useState<Province[]>([]);
    const [selectedIntelIndex, setSelectedIntelIndex] = useState<number | null>(
        null
    );

    // const [manualOverrides, setManualOverrides] = useState<ManualOverrides>({});

    const [intelSource, setIntelSource] = useState<IntelSource>("CSV");

    // const [goals, setGoals] = useState<BuildGoals>({
    //     minNetIncome: 0,
    //     noStarvation: true,
    //     minTPA: 2,
    //     minWPA: 2,
    //     minGuildsPercent: 10,
    //     minTDsPercent: 10,
    //     maxRebuildPercent: 40,
    //     focus: "HYBRID",
    // });

    // const [, setBuildPlan] = useState<BuildPlan | null>(null);

    // const handleGenerateSuggestion = () => {
    //     const plan = generateSuggestedBuild(province, goals);
    //     setBuildPlan(plan);
    // };

    // type ProvinceWithIntel = Province & { rawIntel?: SnapshotIntelRow };

    // const provinceWithIntel = province as ProvinceWithIntel;
    // const snapshotIntelRow: SnapshotIntelRow | null =
    //     provinceWithIntel.rawIntel ?? null;

    const baselineMetrics = computeProvinceMetrics(baselineProvince);
    const currentMetrics = computeProvinceMetrics(province);

    const baselineNwpa = toMetricCell(resolveNwpa(baselineProvince));
    const currentNwpa = toMetricCell(resolveNwpa(province));

    const baselinePpa = toMetricCell(resolvePpa(baselineProvince));
    const currentPpa = toMetricCell(resolvePpa(province));

    const baselineGcpa = toMetricCell(resolveGcpa(baselineProvince));
    const currentGcpa = toMetricCell(resolveGcpa(province));

    const baselineRawTpa = toMetricCell(resolveRawTpa(baselineProvince));
    const currentRawTpa = toMetricCell(resolveRawTpa(province));

    const baselineRawWpa = toMetricCell(resolveRawWpa(baselineProvince));
    const currentRawWpa = toMetricCell(resolveRawWpa(province));

    const {
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
    } = currentMetrics;

    // --- Intel upload handler ---
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

                // setBuildPlan(null);
                // setManualOverrides({});
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
        <>
            <div className="alpha-banner">
                🚧 Utopia Province Sim – <strong>alpha build</strong>. Calculations not yet implemented.
                Need feedback on interface and UI
            </div>

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

                {/* Source Selector */}
                <div
                    className="control-grid"
                    style={{ marginBottom: "0.5rem" }}
                >
                    <div>
                        <label>Intel source</label>
                        <select
                            value={intelSource}
                            onChange={(e) =>
                                setIntelSource(e.target.value as IntelSource)
                            }
                        >
                            <option value="CSV">CSV export from Intel Site</option>
                            <option value="MANUAL">Manual entry</option>
                        </select>
                    </div>

                    {intelSource === "CSV" && (
                        <>
                            <div>
                                <label>Load intel CSV - New Intel site - ALL tab - download CSV</label>
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
                                                // setBuildPlan(null);
                                                // setManualOverrides({});
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
                        </>
                    )}

                    {intelSource === "MANUAL" && (
                        <>
                            {/* Basic identity */}
                            <div>
                                <label>Province name</label>
                                <input
                                    type="text"
                                    value={province.name}
                                    onChange={(e) =>
                                        setProvince((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div>
                                <label>Ruler name</label>
                                <input
                                    type="text"
                                    value={province.rulerName}
                                    onChange={(e) =>
                                        setProvince((prev) => ({
                                            ...prev,
                                            rulerName: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div>
                                <label>KD location (e.g. 4:11)</label>
                                <input
                                    type="text"
                                    value={province.location}
                                    onChange={(e) =>
                                        setProvince((prev) => ({
                                            ...prev,
                                            location: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div>
                                <label>Honor level</label>
                                <input
                                    type="number"
                                    value={province.honorLevel || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            honorLevel: Number.isFinite(v) ? v : prev.honorLevel,
                                        }));
                                    }}
                                />
                            </div>

                            {/* Race / Personality */}
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
                                    {PERSONALITY_LIST.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.display}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Land + peasants */}
                            <div>
                                <label>Land (acres)</label>
                                <input
                                    type="number"
                                    value={province.acres || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => {
                                            const acres = Number.isFinite(v) ? v : prev.acres;
                                            const next = { ...prev, acres };
                                            const builtFromBuildings = Object.values(
                                                next.buildings
                                            ).reduce(
                                                (sum, val) => sum + (val || 0),
                                                0
                                            );
                                            return {
                                                ...next,
                                                builtAcres: builtFromBuildings,
                                                barrenAcres: Math.max(
                                                    acres - builtFromBuildings,
                                                    0
                                                ),
                                            };
                                        });
                                    }}
                                />
                            </div>

                            <div>
                                <label>Peasants</label>
                                <input
                                    type="number"
                                    value={province.peasants || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            peasants: Number.isFinite(v) ? v : prev.peasants,
                                        }));
                                    }}
                                />
                            </div>

                            {/* Military units */}
                            <div>
                                <label>Soldiers</label>
                                <input
                                    type="number"
                                    value={province.soldiers || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            soldiers: Number.isFinite(v) ? v : prev.soldiers,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Off specs</label>
                                <input
                                    type="number"
                                    value={province.offSpecs || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            offSpecs: Number.isFinite(v) ? v : prev.offSpecs,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Def specs</label>
                                <input
                                    type="number"
                                    value={province.defSpecs || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            defSpecs: Number.isFinite(v) ? v : prev.defSpecs,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Elites</label>
                                <input
                                    type="number"
                                    value={province.elites || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            elites: Number.isFinite(v) ? v : prev.elites,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Thieves</label>
                                <input
                                    type="number"
                                    value={province.thieves || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            thieves: Number.isFinite(v) ? v : prev.thieves,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Wizards</label>
                                <input
                                    type="number"
                                    value={province.wizards || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            wizards: Number.isFinite(v) ? v : prev.wizards,
                                        }));
                                    }}
                                />
                            </div>

                            {/* Economy + misc */}
                            <div>
                                <label>Gold (gc)</label>
                                <input
                                    type="number"
                                    value={province.gold || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            gold: Number.isFinite(v) ? v : prev.gold,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Food (bushels)</label>
                                <input
                                    type="number"
                                    value={province.food || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            food: Number.isFinite(v) ? v : prev.food,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Wage rate (%)</label>
                                <input
                                    type="number"
                                    value={province.wageRate * 100}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            wageRate: Number.isFinite(v)
                                                ? v / 100
                                                : prev.wageRate,
                                            intelWagePercent: Number.isFinite(v)
                                                ? v
                                                : prev.intelWagePercent,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Draft target (%)</label>
                                <input
                                    type="number"
                                    value={province.draftTargetPercent}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            draftTargetPercent: Number.isFinite(v)
                                                ? v
                                                : prev.draftTargetPercent,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>War horses</label>
                                <input
                                    type="number"
                                    value={province.horses || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            horses: Number.isFinite(v) ? v : prev.horses,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Prisoners</label>
                                <input
                                    type="number"
                                    value={province.prisoners || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            prisoners: Number.isFinite(v) ? v : prev.prisoners,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Networth</label>
                                <input
                                    type="number"
                                    value={province.networth || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            networth: Number.isFinite(v) ? v : prev.networth,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Trade balance</label>
                                <input
                                    type="number"
                                    value={province.tradeBalance || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            tradeBalance: Number.isFinite(v)
                                                ? v
                                                : prev.tradeBalance,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Training credits</label>
                                <input
                                    type="number"
                                    value={province.trainingCredits || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            trainingCredits: Number.isFinite(v)
                                                ? v
                                                : prev.trainingCredits,
                                        }));
                                    }}
                                />
                            </div>

                            <div>
                                <label>Building credits</label>
                                <input
                                    type="number"
                                    value={province.buildingCredits || ""}
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        setProvince((prev) => ({
                                            ...prev,
                                            buildingCredits: Number.isFinite(v)
                                                ? v
                                                : prev.buildingCredits,
                                        }));
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <h2 className="section-title">Current Snapshot</h2>

            <div className="card throne-card">
                <div className="throne-header">
                    <div>
                        <div className="throne-name">{province.name}</div>
                        <div className="throne-sub">
                        </div>
                        <div className="throne-pills">
                            <span className="pill">
                                Ruler: {province.rulerName}
                                {province.honorLevel
                                    ? ` (Honor ${province.honorLevel})`
                                    : ""}
                            </span>
                            <span className={"pill"}>
                                {province.race} / {province.personality}
                            </span>
                            <span className="pill">
                                KD {province.location}
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
                <div className="card-columns snapshot-sections">

                    {/* ECONOMY */}
                    <section className="snapshot-section snapshot-section--economy">
                        <h3 className="snapshot-section-title-small">Economy</h3>

                        <table className="buildings-table snapshot-metrics-table">
                            <thead>
                            <tr>
                                <th>Metric</th>
                                <th style={{textAlign: "right"}}>Baseline</th>
                                <th style={{textAlign: "right"}}>Current</th>
                                <th style={{textAlign: "right"}}>Δ</th>
                            </tr>
                            </thead>
                            <tbody>
                            <SnapshotMetric
                                label="Land"
                                baseline={simpleMetricCell(
                                    baselineProvince.acres,
                                    (v) => v.toLocaleString()
                                )}
                                current={simpleMetricCell(
                                    province.acres,
                                    (v) => v.toLocaleString()
                                )}
                                formatDelta={(d) => d.toLocaleString()}
                                showPercentDelta={false}
                            />

                            <SnapshotMetric
                                label="Peasants"
                                baseline={simpleMetricCell(
                                    baselineProvince.peasants,
                                    (v) => v.toLocaleString()
                                )}
                                current={simpleMetricCell(
                                    province.peasants,
                                    (v) => v.toLocaleString()
                                )}
                            />

                            <SnapshotMetric
                                label="PPA"
                                baseline={baselinePpa}
                                current={currentPpa}
                                formatDelta={(d) => d.toFixed(4)}
                            />

                            <SnapshotMetric
                                label="GC / Acre"
                                baseline={baselineGcpa}
                                current={currentGcpa}
                                formatDelta={(d) => d.toFixed(4)}
                            />

                            <SnapshotMetric
                                label="Building Efficiency"
                                baseline={simpleMetricCell(
                                    baselineMetrics.beResult.be * 100,
                                    (v) => `${v.toFixed(2)}%`
                                )}
                                current={simpleMetricCell(
                                    currentMetrics.beResult.be * 100,
                                    (v) => `${v.toFixed(2)}%`
                                )}
                            />

                            <SnapshotMetric
                                label="Total population"
                                baseline={simpleMetricCell(
                                    baselineMetrics.totalPop,
                                    (v) => v.toLocaleString()
                                )}
                                current={simpleMetricCell(
                                    totalPop,
                                    (v) => v.toLocaleString()
                                )}
                            />

                            <SnapshotMetric
                                label="Max population"
                                baseline={simpleMetricCell(
                                    baselineMetrics.maxPopulation,
                                    (v) => v.toLocaleString()
                                )}
                                current={simpleMetricCell(
                                    maxPopulation,
                                    (v) => v.toLocaleString()
                                )}
                            />

                            <SnapshotMetric
                                label="Available jobs"
                                baseline={simpleMetricCell(
                                    baselineMetrics.beResult.jobs.totalJobs,
                                    (v) => v.toFixed(0)
                                )}
                                current={simpleMetricCell(
                                    beResult.jobs.totalJobs,
                                    (v) => v.toFixed(0)
                                )}
                            />

                            <SnapshotMetric
                                label="Workers needed for max efficiency"
                                baseline={simpleMetricCell(
                                    baselineMetrics.beResult.jobs.optimalWorkers,
                                    (v) => v.toFixed(0)
                                )}
                                current={simpleMetricCell(
                                    beResult.jobs.optimalWorkers,
                                    (v) => v.toFixed(0)
                                )}
                            />

                            <SnapshotMetric
                                label="Daily income"
                                baseline={simpleMetricCell(
                                    baselineMetrics.dailyIncome,
                                    (v) => `${v.toFixed(0)}`
                                )}
                                current={simpleMetricCell(
                                    dailyIncome,
                                    (v) => `${v.toFixed(0)}`
                                )}
                                formatDelta={(d) => `${d.toFixed(0)}`}
                            />

                            <SnapshotMetric
                                label="Daily wages"
                                baseline={simpleMetricCell(
                                    baselineMetrics.dailyWages,
                                    (v) => `${v.toFixed(0)}`
                                )}
                                current={simpleMetricCell(
                                    dailyWages,
                                    (v) => `${v.toFixed(0)}`
                                )}
                                formatDelta={(d) => `${d.toFixed(0)}`}
                            />

                            <SnapshotMetric
                                label="Net gc (daily)"
                                baseline={simpleMetricCell(
                                    baselineMetrics.dailyNetIncome,
                                    (v) => `${v.toFixed(0)}`
                                )}
                                current={simpleMetricCell(
                                    dailyNetIncome,
                                    (v) => `${v.toFixed(0)}`
                                )}
                                formatDelta={(d) => `${d.toFixed(0)}`}
                            />

                            <SnapshotMetric
                                label="Daily food produced"
                                baseline={simpleMetricCell(
                                    baselineMetrics.dailyFoodProduced,
                                    (v) => v.toFixed(1)
                                )}
                                current={simpleMetricCell(
                                    dailyFoodProduced,
                                    (v) => v.toFixed(1)
                                )}
                            />

                            <SnapshotMetric
                                label="Daily food consumed"
                                baseline={simpleMetricCell(
                                    baselineMetrics.dailyFoodConsumed,
                                    (v) => v.toFixed(1)
                                )}
                                current={simpleMetricCell(
                                    dailyFoodConsumed,
                                    (v) => v.toFixed(1)
                                )}
                            />

                            <SnapshotMetric
                                label="Net food (daily)"
                                baseline={simpleMetricCell(
                                    baselineMetrics.dailyFoodNet,
                                    (v) => v.toFixed(1)
                                )}
                                current={simpleMetricCell(
                                    dailyFoodNet,
                                    (v) => v.toFixed(1)
                                )}
                                formatDelta={(d) => d.toFixed(1)}
                            />

                            <tr>
                                <td>Daily runes produced</td>
                                <td style={{textAlign: "right"}}>—</td>
                                <td style={{textAlign: "right"}}>— (TODO)</td>
                                <td style={{textAlign: "right"}}></td>
                            </tr>
                            <tr>
                                <td>Daily runes decayed</td>
                                <td style={{textAlign: "right"}}>—</td>
                                <td style={{textAlign: "right"}}>— (TODO)</td>
                                <td style={{textAlign: "right"}}></td>
                            </tr>
                            <tr>
                                <td>Net runes (daily)</td>
                                <td style={{textAlign: "right"}}>—</td>
                                <td style={{textAlign: "right"}}>— (TODO)</td>
                                <td style={{textAlign: "right"}}></td>
                            </tr>
                            </tbody>
                        </table>
                    </section>

                    {/* MILITARY */}
                    <section className="snapshot-section snapshot-section--military">
                        <h3 className="snapshot-section-title-small">Military</h3>

                        <table className="buildings-table snapshot-metrics-table">
                            <thead>
                            <tr>
                                <th>Metric</th>
                                <th style={{textAlign: "right"}}>Baseline</th>
                                <th style={{textAlign: "right"}}>Current</th>
                                <th style={{textAlign: "right"}}>Δ</th>
                            </tr>
                            </thead>
                            <tbody>
                            <SnapshotMetric
                                label="Draft target"
                                baseline={simpleMetricCell(
                                    baselineProvince.draftTargetPercent,
                                    (v) => `${v.toFixed(1)}%`
                                )}
                                current={simpleMetricCell(
                                    province.draftTargetPercent,
                                    (v) => `${v.toFixed(1)}%`
                                )}
                            />

                            <SnapshotMetric
                                label="Wage rate"
                                baseline={simpleMetricCell(
                                    baselineProvince.wageRate * 100,
                                    (v) => `${v.toFixed(0)}%`
                                )}
                                current={simpleMetricCell(
                                    province.wageRate * 100,
                                    (v) => `${v.toFixed(0)}%`
                                )}
                            />

                            <SnapshotMetric
                                label="Offensive military efficiency"
                                baseline={simpleMetricCell(
                                    baselineMetrics.militaryResult.ome * 100,
                                    (v) => `${v.toFixed(1)}%`
                                )}
                                current={simpleMetricCell(
                                    militaryResult.ome * 100,
                                    (v) => `${v.toFixed(1)}%`
                                )}
                            />

                            <SnapshotMetric
                                label="Defensive military efficiency"
                                baseline={simpleMetricCell(
                                    baselineMetrics.militaryResult.dme * 100,
                                    (v) => `${v.toFixed(1)}%`
                                )}
                                current={simpleMetricCell(
                                    militaryResult.dme * 100,
                                    (v) => `${v.toFixed(1)}%`
                                )}
                            />

                            <SnapshotMetric
                                label="Off specs"
                                baseline={simpleMetricCell(
                                    baselineProvince.offSpecs,
                                    (v) => v.toLocaleString()
                                )}
                                current={simpleMetricCell(
                                    province.offSpecs,
                                    (v) => v.toLocaleString()
                                )}
                            />

                            <SnapshotMetric
                                label="Def specs"
                                baseline={simpleMetricCell(
                                    baselineProvince.defSpecs,
                                    (v) => v.toLocaleString()
                                )}
                                current={simpleMetricCell(
                                    province.defSpecs,
                                    (v) => v.toLocaleString()
                                )}
                            />

                            <SnapshotMetric
                                label="Elites"
                                baseline={simpleMetricCell(
                                    baselineProvince.elites,
                                    (v) => v.toLocaleString()
                                )}
                                current={simpleMetricCell(
                                    province.elites,
                                    (v) => v.toLocaleString()
                                )}
                            />

                            <SnapshotMetric
                                label="War horses"
                                baseline={simpleMetricCell(
                                    baselineProvince.horses,
                                    (v) => v.toLocaleString()
                                )}
                                current={simpleMetricCell(
                                    province.horses,
                                    (v) => v.toLocaleString()
                                )}
                            />

                            <SnapshotMetric
                                label="Prisoners"
                                baseline={simpleMetricCell(
                                    baselineProvince.prisoners,
                                    (v) => v.toLocaleString()
                                )}
                                current={simpleMetricCell(
                                    province.prisoners,
                                    (v) => v.toLocaleString()
                                )}
                            />

                            <SnapshotMetric
                                label="Total mod offense"
                                baseline={simpleMetricCell(
                                    baselineMetrics.militaryResult.modOffense,
                                    (v) => v.toFixed(0)
                                )}
                                current={simpleMetricCell(
                                    militaryResult.modOffense,
                                    (v) => v.toFixed(0)
                                )}
                            />

                            <SnapshotMetric
                                label="Total mod defense"
                                baseline={simpleMetricCell(
                                    baselineMetrics.militaryResult.modDefense,
                                    (v) => v.toFixed(0)
                                )}
                                current={simpleMetricCell(
                                    militaryResult.modDefense,
                                    (v) => v.toFixed(0)
                                )}
                            />

                            <tr>
                                <td>Base attack time</td>
                                <td style={{textAlign: "right"}}>—</td>
                                <td style={{textAlign: "right"}}>— (TODO)</td>
                                <td style={{textAlign: "right"}}></td>
                            </tr>
                            <tr>
                                <td>War attack time</td>
                                <td style={{textAlign: "right"}}>—</td>
                                <td style={{textAlign: "right"}}>— (TODO)</td>
                                <td style={{textAlign: "right"}}></td>
                            </tr>

                            <SnapshotMetric
                                label="Thieves (#)"
                                baseline={simpleMetricCell(
                                    baselineProvince.thieves,
                                    (v) => v.toLocaleString()
                                )}
                                current={simpleMetricCell(
                                    province.thieves,
                                    (v) => v.toLocaleString()
                                )}
                            />

                            <SnapshotMetric
                                label="Raw TPA"
                                baseline={baselineRawTpa}
                                current={currentRawTpa}
                                formatDelta={(d) => d.toFixed(4)}
                            />

                            <SnapshotMetric
                                label="Raw WPA"
                                baseline={baselineRawWpa}
                                current={currentRawWpa}
                                formatDelta={(d) => d.toFixed(4)}
                            />
                            </tbody>
                        </table>
                    </section>


                    {/* BUILDINGS / GROWTH */}
                    <section className="snapshot-section snapshot-section--buildings">
                        <h3 className="snapshot-section-title-small">Buildings</h3>
                        <table className="buildings-table snapshot-metrics-table">
                            <thead>
                            <tr>
                                <th>Building type</th>
                                <th style={{textAlign: "right"}}>Base %</th>
                                <th style={{textAlign: "right"}}>Base qty</th>
                                <th style={{textAlign: "right"}}>Curr %</th>
                                <th style={{textAlign: "right"}}>Curr qty</th>
                                <th style={{textAlign: "right"}}>Δ %</th>
                            </tr>
                            </thead>
                            <tbody>
                            {BUILDING_LIST.map((b) => {
                                const baseProv = baselineProvince;
                                const baseQty = baseProv.buildings[b.id] ?? 0;
                                const currQty = province.buildings[b.id] ?? 0;

                                const basePct =
                                    baseProv.acres
                                        ? (baseQty / baseProv.acres) * 100
                                        : 0;
                                const currPct =
                                    province.acres > 0
                                        ? (currQty / province.acres) * 100
                                        : 0;

                                const diffPct = currPct - basePct;
                                const showDiff = Math.abs(diffPct) > 1e-4;

                                return (
                                    <tr key={b.id}>
                                        <td>{b.display}</td>
                                        <td style={{textAlign: "right"}}>
                                            {basePct.toFixed(1)}%
                                        </td>
                                        <td style={{textAlign: "right"}}>
                                            {baseQty.toLocaleString()}
                                        </td>
                                        <td style={{textAlign: "right"}}>
                                            {currPct.toFixed(1)}%
                                        </td>
                                        <td style={{textAlign: "right"}}>
                                            {currQty.toLocaleString()}
                                        </td>
                                        <td
                                            style={{
                                                textAlign: "right",
                                                color: showDiff
                                                    ? diffPct > 0
                                                        ? "#4ade80"
                                                        : "#f97373"
                                                    : undefined,
                                            }}
                                        >
                                            {showDiff
                                                ? `${diffPct > 0 ? "+" : ""}${diffPct.toFixed(
                                                    1
                                                )}%`
                                                : ""}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </section>

                    {/* SCIENCE */}
                    <section className="snapshot-section snapshot-section--science">
                        <h3 className="snapshot-section-title-small">Science</h3>
                        <table className="buildings-table snapshot-metrics-table science-table">
                            <thead>
                            <tr>
                                <th>Science type</th>
                                <th style={{textAlign: "right"}}>Base books</th>
                                <th style={{ textAlign: "right" }}>Base %</th>
                                <th style={{ textAlign: "right" }}>Curr books</th>
                                <th style={{ textAlign: "right" }}>Curr %</th>
                                <th style={{ textAlign: "right" }}>Δ %</th>
                            </tr>
                            </thead>
                            <tbody>
                            {[
                                "Alchemy",
                                "Tools",
                                "Housing",
                                "Production",
                                "Bookkeeping",
                                "Artisan",
                                "Strategy",
                                "Siege",
                                "Tactics",
                                "Valor",
                                "Heroism",
                                "Resilience",
                                "Crime",
                                "Channeling",
                                "Shielding",
                                "Cunning",
                                "Sorcery",
                                "Finesse",
                            ].map((name) => (
                                <tr key={name}>
                                    <td>{name}</td>
                                    <td style={{ textAlign: "right" }}>—</td>
                                    <td style={{ textAlign: "right" }}>—</td>
                                    <td style={{ textAlign: "right" }}>—</td>
                                    <td style={{ textAlign: "right" }}>—</td>
                                    <td style={{ textAlign: "right" }}>—</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </section>

                    {/* NETWORTH BREAKDOWN (skeleton) */}
                    <section className="snapshot-section snapshot-section--net">
                        <h3 className="snapshot-section-title-small">Networth</h3>
                        <table className="buildings-table snapshot-metrics-table">
                            <thead>
                            <tr>
                                <th>Component</th>
                                <th style={{ textAlign: "right" }}>Base NW</th>
                                <th style={{ textAlign: "right" }}>Curr NW</th>
                                <th style={{ textAlign: "right" }}>Δ NW</th>
                            </tr>
                            </thead>
                            <tbody>
                            {[
                                "Peasants",
                                "Offspecs",
                                "Defspecs",
                                "Elites",
                                "War horses",
                                "Prisoners",
                                "Thieves",
                                "Wizards",
                                "Books",
                                "Buildings",
                                "Barren",
                            ].map((comp) => (
                                <tr key={comp}>
                                    <td>{comp} NW</td>
                                    <td style={{ textAlign: "right" }}>—</td>
                                    <td style={{ textAlign: "right" }}>—</td>
                                    <td style={{ textAlign: "right" }}>—</td>
                                </tr>
                            ))}

                            <SnapshotMetric
                                label="NW / Acre"
                                baseline={baselineNwpa}
                                current={currentNwpa}
                                formatDelta={(d) => d.toFixed(4)}
                            />

                            <tr>
                                <td>
                                    <strong>Total NW</strong>
                                </td>
                                <td style={{ textAlign: "right" }}>
                                    {baselineProvince.networth.toLocaleString()}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                    {province.networth.toLocaleString()}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                    {(() => {
                                        const diff =
                                            province.networth -
                                            baselineProvince.networth;
                                        if (diff === 0) return "";
                                        return `${
                                            diff > 0 ? "+" : ""
                                        }${diff.toLocaleString()}`;
                                    })()}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </section>
                </div>
            </div>

            {/*/!* GOALS & OPTIMIZER *!/*/}
            {/*<h2 className="section-title">Planning & Optimization</h2>*/}
            {/*<div className="card">*/}
            {/*    <div className="card-title">Goals & suggested build</div>*/}
            {/*    <div className="control-grid">*/}
            {/*        <div>*/}
            {/*            <label>Target TPA (min)</label>*/}
            {/*            <input*/}
            {/*                type="number"*/}
            {/*                step="0.1"*/}
            {/*                value={goals.minTPA ?? ""}*/}
            {/*                onChange={(e) =>*/}
            {/*                    setGoals((prev) => ({*/}
            {/*                        ...prev,*/}
            {/*                        minTPA:*/}
            {/*                            e.target.value === ""*/}
            {/*                                ? undefined*/}
            {/*                                : Number(e.target.value) || 0,*/}
            {/*                    }))*/}
            {/*                }*/}
            {/*            />*/}
            {/*        </div>*/}

            {/*        <div>*/}
            {/*            <label>Target WPA (min)</label>*/}
            {/*            <input*/}
            {/*                type="number"*/}
            {/*                step="0.1"*/}
            {/*                value={goals.minWPA ?? ""}*/}
            {/*                onChange={(e) =>*/}
            {/*                    setGoals((prev) => ({*/}
            {/*                        ...prev,*/}
            {/*                        minWPA:*/}
            {/*                            e.target.value === ""*/}
            {/*                                ? undefined*/}
            {/*                                : Number(e.target.value) || 0,*/}
            {/*                    }))*/}
            {/*                }*/}
            {/*            />*/}
            {/*        </div>*/}

            {/*        <div>*/}
            {/*            <label>Min net income / tick (gc)</label>*/}
            {/*            <input*/}
            {/*                type="number"*/}
            {/*                value={goals.minNetIncome ?? ""}*/}
            {/*                onChange={(e) =>*/}
            {/*                    setGoals((prev) => ({*/}
            {/*                        ...prev,*/}
            {/*                        minNetIncome:*/}
            {/*                            e.target.value === ""*/}
            {/*                                ? undefined*/}
            {/*                                : Number(e.target.value) || 0,*/}
            {/*                    }))*/}
            {/*                }*/}
            {/*            />*/}
            {/*        </div>*/}

            {/*        <div>*/}
            {/*            <label>Max land to rebuild (%)</label>*/}
            {/*            <input*/}
            {/*                type="number"*/}
            {/*                value={goals.maxRebuildPercent ?? ""}*/}
            {/*                onChange={(e) =>*/}
            {/*                    setGoals((prev) => ({*/}
            {/*                        ...prev,*/}
            {/*                        maxRebuildPercent:*/}
            {/*                            e.target.value === ""*/}
            {/*                                ? undefined*/}
            {/*                                : Number(e.target.value) || 0,*/}
            {/*                    }))*/}
            {/*                }*/}
            {/*            />*/}
            {/*        </div>*/}

            {/*        <div>*/}
            {/*            <label>Build focus</label>*/}
            {/*            <select*/}
            {/*                value={goals.focus}*/}
            {/*                onChange={(e) =>*/}
            {/*                    setGoals((prev) => ({*/}
            {/*                        ...prev,*/}
            {/*                        focus: e.target.value as BuildGoals["focus"],*/}
            {/*                    }))*/}
            {/*                }*/}
            {/*            >*/}
            {/*                <option value="HYBRID">Hybrid</option>*/}
            {/*                <option value="INCOME">Income</option>*/}
            {/*                <option value="OFFENSE">Attacker</option>*/}
            {/*                <option value="TM">T/M</option>*/}
            {/*            </select>*/}
            {/*        </div>*/}

            {/*        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>*/}
            {/*            <label>*/}
            {/*                <input*/}
            {/*                    type="checkbox"*/}
            {/*                    checked={goals.noStarvation ?? false}*/}
            {/*                    onChange={(e) =>*/}
            {/*                        setGoals((prev) => ({*/}
            {/*                            ...prev,*/}
            {/*                            noStarvation: e.target.checked,*/}
            {/*                        }))*/}
            {/*                    }*/}
            {/*                />{" "}*/}
            {/*                Avoid starvation*/}
            {/*            </label>*/}
            {/*        </div>*/}

            {/*        <div>*/}
            {/*            <label>&nbsp;</label>*/}
            {/*            <button type="button" onClick={handleGenerateSuggestion}>*/}
            {/*                Generate suggested build*/}
            {/*            </button>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</div>*/}


            {/*/!* PROVINCE INPUTS (Intel + manual) *!/*/}
            {/*<h2 className="section-title">Inputs & Overrides</h2>*/}
            {/*<div className="card">*/}
            {/*    <div className="card-title">Province inputs</div>*/}

            {/*    <details style={{ marginTop: "0.75rem" }}>*/}
            {/*        <summary style={{ cursor: "pointer", fontWeight: 600 }}>*/}
            {/*            Manual Inputs / Overrides*/}
            {/*        </summary>*/}

            {/*        <div style={{ marginTop: "0.75rem" }}>*/}
            {/*            <p className="help-text">*/}
            {/*                Values here override intel for calculations. Leave a field blank to keep the*/}
            {/*                intel value.*/}
            {/*            </p>*/}

            {/*            /!* Identity *!/*/}
            {/*            <div className="manual-section">*/}
            {/*                <h4 className="manual-section-title">Identity</h4>*/}
            {/*                <div className="control-grid">*/}
            {/*                    <div>*/}
            {/*                        <label>Province name</label>*/}
            {/*                        <input*/}
            {/*                            type="text"*/}
            {/*                            value={province.name}*/}
            {/*                            onChange={(e) =>*/}
            {/*                                setProvince((prev) => ({ ...prev, name: e.target.value }))*/}
            {/*                            }*/}
            {/*                        />*/}
            {/*                    </div>*/}

            {/*                    <div>*/}
            {/*                        <label>Race</label>*/}
            {/*                        <select*/}
            {/*                            value={province.race}*/}
            {/*                            onChange={(e) =>*/}
            {/*                                setProvince((prev) => ({*/}
            {/*                                    ...prev,*/}
            {/*                                    race: e.target.value as Province["race"],*/}
            {/*                                }))*/}
            {/*                            }*/}
            {/*                        >*/}
            {/*                            {RACE_LIST.map((race) => (*/}
            {/*                                <option key={race.id} value={race.id}>*/}
            {/*                                    {race.display}*/}
            {/*                                </option>*/}
            {/*                            ))}*/}
            {/*                        </select>*/}
            {/*                    </div>*/}

            {/*                    <div>*/}
            {/*                        <label>Personality</label>*/}
            {/*                        <select*/}
            {/*                            value={province.personality}*/}
            {/*                            onChange={(e) =>*/}
            {/*                                setProvince((prev) => ({*/}
            {/*                                    ...prev,*/}
            {/*                                    personality: e.target.value as Province["personality"],*/}
            {/*                                }))*/}
            {/*                            }*/}
            {/*                        >*/}
            {/*                            {PERSONALITY_LIST.map((pers) => (*/}
            {/*                                <option key={pers.id} value={pers.id}>*/}
            {/*                                    {pers.display}*/}
            {/*                                </option>*/}
            {/*                            ))}*/}
            {/*                        </select>*/}
            {/*                    </div>*/}

            {/*                    <div>*/}
            {/*                        <label>Kingdom location (x:y)</label>*/}
            {/*                        <input*/}
            {/*                            type="text"*/}
            {/*                            value={province.location}*/}
            {/*                            onChange={(e) =>*/}
            {/*                                setProvince((prev) => ({ ...prev, location: e.target.value }))*/}
            {/*                            }*/}
            {/*                        />*/}
            {/*                    </div>*/}

            {/*                    <div>*/}
            {/*                        <label>Ruler name</label>*/}
            {/*                        <input*/}
            {/*                            type="text"*/}
            {/*                            value={province.rulerName}*/}
            {/*                            onChange={(e) =>*/}
            {/*                                setProvince((prev) => ({ ...prev, rulerName: e.target.value }))*/}
            {/*                            }*/}
            {/*                        />*/}
            {/*                    </div>*/}

            {/*                    <div>*/}
            {/*                        <label>Honor level</label>*/}
            {/*                        <input*/}
            {/*                            type="number"*/}
            {/*                            value={province.honorLevel}*/}
            {/*                            onChange={(e) =>*/}
            {/*                                setProvince((prev) => ({*/}
            {/*                                    ...prev,*/}
            {/*                                    honorLevel: Number(e.target.value) || 0,*/}
            {/*                                }))*/}
            {/*                            }*/}
            {/*                        />*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            /!* Population & Military *!/*/}
            {/*            <div className="manual-section">*/}
            {/*                <h4 className="manual-section-title">Population & Military</h4>*/}
            {/*                <div className="control-grid">*/}
            {/*                    /!* TODO: wire your existing numeric inputs for peasants/soldiers/etc here *!/*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            /!* Economy & Resources *!/*/}
            {/*            <div className="manual-section">*/}
            {/*                <h4 className="manual-section-title">Economy & Resources</h4>*/}
            {/*                <div className="control-grid">*/}
            {/*                    /!* TODO: wire gold, food, runes, horses, prisoners, wageRate *!/*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            /!* Intel-only fields *!/*/}
            {/*            <div className="manual-section">*/}
            {/*                <h4 className="manual-section-title">Intel-only fields</h4>*/}
            {/*                <div className="control-grid">*/}
            {/*                    /!* TODO: intelOffenseHome, intelDefenseHome, intelWagePercent, draftTargetPercent *!/*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            /!* Snapshot-based manual overrides *!/*/}
            {/*            <div className="manual-section">*/}
            {/*                <h4 className="manual-section-title">Snapshot overrides</h4>*/}
            {/*                <ManualInputsPanel*/}
            {/*                    intelRow={snapshotIntelRow}*/}
            {/*                    manualOverrides={manualOverrides}*/}
            {/*                    onChange={(key, value) =>*/}
            {/*                        setManualOverrides((prev) => ({*/}
            {/*                            ...prev,*/}
            {/*                            [key]: value,*/}
            {/*                        }))*/}
            {/*                    }*/}
            {/*                />*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </details>*/}

            {/*    /!* Buildings manual entry *!/*/}
            {/*    <hr />*/}
            {/*    <div style={{ marginTop: "0.5rem" }}>*/}
            {/*        <div*/}
            {/*            className="card-title"*/}
            {/*            style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}*/}
            {/*        >*/}
            {/*            Buildings (acres)*/}
            {/*        </div>*/}
            {/*        <div className="buildings-input-grid">*/}
            {/*            {BUILDING_LIST.map((b) => (*/}
            {/*                <div key={b.id}>*/}
            {/*                    <label>{b.display}</label>*/}
            {/*                    <input*/}
            {/*                        type="number"*/}
            {/*                        value={province.buildings[b.id] ?? 0}*/}
            {/*                        onChange={(e) =>*/}
            {/*                            setProvince((prev) => ({*/}
            {/*                                ...prev,*/}
            {/*                                buildings: {*/}
            {/*                                    ...prev.buildings,*/}
            {/*                                    [b.id]: Number(e.target.value) || 0,*/}
            {/*                                },*/}
            {/*                            }))*/}
            {/*                        }*/}
            {/*                    />*/}
            {/*                </div>*/}
            {/*            ))}*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</div>*/}
        </div>
        </>
    );
}

export default App;
