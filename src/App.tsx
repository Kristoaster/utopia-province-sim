// src/App.tsx
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
import { calculateMilitary } from "./utopia/calc/military.ts";
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

type SnapshotMetricProps = {
    label: string;
    baselineValue?: number | null;
    currentValue: number;
    /** Format a raw number for display (e.g. add units) */
    format?: (value: number) => string;
    /** Optionally format the delta differently, otherwise raw number is shown */
    formatDelta?: (delta: number) => string;
    /** Whether to also show % delta when baseline != 0 */
    showPercentDelta?: boolean;
    /** Extra class to apply to current value (for warn/ok/bad coloring) */
    currentClassNameOverride?: string;
};

const SnapshotMetric: React.FC<SnapshotMetricProps> = ({
                                                           label,
                                                           baselineValue,
                                                           currentValue,
                                                           format = (v) => v.toFixed(2),
                                                           formatDelta,
                                                           showPercentDelta = true,
                                                           currentClassNameOverride,
                                                       }) => {
    const hasBaseline =
        baselineValue !== undefined && baselineValue !== null;

    const baselineDisplay = hasBaseline
        ? format(baselineValue as number)
        : "—";

    const currentDisplay = format(currentValue);

    let deltaContent: React.ReactNode = null;
    let currentClassName = "snapshot-metric-value";

    if (hasBaseline) {
        const baseline = baselineValue as number;
        const diff = currentValue - baseline;

        if (Math.abs(diff) > 1e-6) {
            const isPositive = diff > 0;
            const deltaText = formatDelta
                ? formatDelta(diff)
                : diff.toFixed(2);

            const pct =
                baseline !== 0
                    ? ((diff / baseline) * 100).toFixed(1)
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
        <div className="snapshot-metric-row">
            <div className="snapshot-metric-label">{label}</div>
            <div className="snapshot-metric-value baseline">
                {baselineDisplay}
            </div>
            <div className={currentClassName}>{currentDisplay}</div>
            <div className="snapshot-metric-delta">{deltaContent}</div>
        </div>
    );
};

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
        baseRazeCostPerAcre,
        dailyIncome,
        dailyWages,
        dailyNetIncome,
        dailyFoodProduced,
        dailyFoodConsumed,
        dailyFoodNet,
    } = currentMetrics;

    const netIncomeClass = netIncome < 0 ? "value-bad" : "value-good";
    const employmentClass =
        employmentPct < 80 ? "value-bad" : employmentPct < 95 ? "value-warn" : "value-good";

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
                <div className="snapshot-sections">

                    {/* ECONOMY */}
                    <section className="snapshot-section snapshot-section--economy">
                        <h3 className="snapshot-section-title-small">Economy</h3>

                        <div className="snapshot-metric-grid">
                            <div className="snapshot-metric-header">
                                <div>Metric</div>
                                <div>Baseline</div>
                                <div>Current</div>
                                <div>Δ</div>
                            </div>

                            <SnapshotMetric
                                label="Land"
                                baselineValue={baselineProvince.acres}
                                currentValue={province.acres}
                                format={(v) => `${v.toLocaleString()} acres`}
                                showPercentDelta={false}
                            />

                            <SnapshotMetric
                                label="Peasants"
                                baselineValue={baselineProvince.peasants}
                                currentValue={province.peasants}
                                format={(v) => v.toLocaleString()}
                                showPercentDelta={true}
                            />

                            <SnapshotMetric
                                label="Building Efficiency"
                                baselineValue={baselineMetrics.beResult.be * 100}
                                currentValue={beResult.be * 100}
                                format={(v) => `${v.toFixed(2)}%`}
                            />

                            <SnapshotMetric
                                label="Total population"
                                baselineValue={baselineMetrics.totalPop}
                                currentValue={totalPop}
                                format={(v) => v.toLocaleString()}
                            />

                            <SnapshotMetric
                                label="Max population"
                                baselineValue={baselineMetrics.maxPopulation}
                                currentValue={maxPopulation}
                                format={(v) => v.toLocaleString()}
                            />

                            <SnapshotMetric
                                label="Available jobs"
                                baselineValue={baselineMetrics.beResult.jobs.totalJobs}
                                currentValue={beResult.jobs.totalJobs}
                                format={(v) => v.toFixed(0)}
                            />

                            <SnapshotMetric
                                label="Workers needed for max efficiency"
                                baselineValue={baselineMetrics.beResult.jobs.optimalWorkers}
                                currentValue={beResult.jobs.optimalWorkers}
                                format={(v) => v.toFixed(0)}
                            />

                            <SnapshotMetric
                                label="Daily income"
                                baselineValue={baselineMetrics.dailyIncome}
                                currentValue={dailyIncome}
                                format={(v) => `${v.toFixed(0)} gc/day`}
                                formatDelta={(d) => `${d.toFixed(0)} gc/day`}
                            />

                            <SnapshotMetric
                                label="Daily wages"
                                baselineValue={baselineMetrics.dailyWages}
                                currentValue={dailyWages}
                                format={(v) => `${v.toFixed(0)} gc/day`}
                                formatDelta={(d) => `${d.toFixed(0)} gc/day`}
                            />

                            <SnapshotMetric
                                label="Net gc (daily)"
                                baselineValue={baselineMetrics.dailyNetIncome}
                                currentValue={dailyNetIncome}
                                format={(v) => `${v.toFixed(0)} gc/day`}
                                formatDelta={(d) => `${d.toFixed(0)} gc/day`}
                            />

                            <SnapshotMetric
                                label="Daily food produced"
                                baselineValue={baselineMetrics.dailyFoodProduced}
                                currentValue={dailyFoodProduced}
                                format={(v) => v.toFixed(1)}
                            />

                            <SnapshotMetric
                                label="Daily food consumed"
                                baselineValue={baselineMetrics.dailyFoodConsumed}
                                currentValue={dailyFoodConsumed}
                                format={(v) => v.toFixed(1)}
                            />

                            <SnapshotMetric
                                label="Net food (daily)"
                                baselineValue={baselineMetrics.dailyFoodNet}
                                currentValue={dailyFoodNet}
                                format={(v) => v.toFixed(1)}
                                formatDelta={(d) => d.toFixed(1)}
                            />

                            <SnapshotMetric
                                label="Daily runes produced"
                                baselineValue={null}
                                currentValue={0}
                                format={() => "— (TODO)"}
                                showPercentDelta={false}
                            />
                            <SnapshotMetric
                                label="Daily runes decayed"
                                baselineValue={null}
                                currentValue={0}
                                format={() => "— (TODO)"}
                                showPercentDelta={false}
                            />
                            <SnapshotMetric
                                label="Net runes (daily)"
                                baselineValue={null}
                                currentValue={0}
                                format={() => "— (TODO)"}
                                showPercentDelta={false}
                            />
                        </div>
                    </section>

                    {/* MILITARY */}
                    <section className="snapshot-section snapshot-section--military">
                        <h3 className="snapshot-section-title-small">Military</h3>

                        <div className="snapshot-metric-grid">
                            <div className="snapshot-metric-header">
                                <div>Metric</div>
                                <div>Baseline</div>
                                <div>Current</div>
                                <div>Δ</div>
                            </div>

                            <SnapshotMetric
                                label="Draft target"
                                baselineValue={baselineProvince.draftTargetPercent}
                                currentValue={province.draftTargetPercent}
                                format={(v) => `${v.toFixed(1)}%`}
                            />

                            <SnapshotMetric
                                label="Wage rate"
                                baselineValue={baselineProvince.wageRate * 100}
                                currentValue={province.wageRate * 100}
                                format={(v) => `${v.toFixed(0)}%`}
                            />

                            <SnapshotMetric
                                label="Offensive military efficiency"
                                baselineValue={baselineMetrics.militaryResult.ome * 100}
                                currentValue={militaryResult.ome * 100}
                                format={(v) => `${v.toFixed(1)}%`}
                            />

                            <SnapshotMetric
                                label="Defensive military efficiency"
                                baselineValue={baselineMetrics.militaryResult.dme * 100}
                                currentValue={militaryResult.dme * 100}
                                format={(v) => `${v.toFixed(1)}%`}
                            />

                            <SnapshotMetric
                                label="Off specs"
                                baselineValue={baselineProvince.offSpecs}
                                currentValue={province.offSpecs}
                                format={(v) => v.toLocaleString()}
                            />

                            <SnapshotMetric
                                label="Def specs"
                                baselineValue={baselineProvince.defSpecs}
                                currentValue={province.defSpecs}
                                format={(v) => v.toLocaleString()}
                            />

                            <SnapshotMetric
                                label="Elites"
                                baselineValue={baselineProvince.elites}
                                currentValue={province.elites}
                                format={(v) => v.toLocaleString()}
                            />

                            <SnapshotMetric
                                label="War horses"
                                baselineValue={baselineProvince.horses}
                                currentValue={province.horses}
                                format={(v) => v.toLocaleString()}
                            />

                            <SnapshotMetric
                                label="Prisoners"
                                baselineValue={baselineProvince.prisoners}
                                currentValue={province.prisoners}
                                format={(v) => v.toLocaleString()}
                            />

                            <SnapshotMetric
                                label="Total mod offense"
                                baselineValue={baselineMetrics.militaryResult.modOffense}
                                currentValue={militaryResult.modOffense}
                                format={(v) => v.toFixed(0)}
                            />

                            <SnapshotMetric
                                label="Total mod defense"
                                baselineValue={baselineMetrics.militaryResult.modDefense}
                                currentValue={militaryResult.modDefense}
                                format={(v) => v.toFixed(0)}
                            />

                            <SnapshotMetric
                                label="Base attack time"
                                baselineValue={null}
                                currentValue={0}
                                format={() => "— (TODO)"}
                            />
                            <SnapshotMetric
                                label="War attack time"
                                baselineValue={null}
                                currentValue={0}
                                format={() => "— (TODO)"}
                            />
                            <SnapshotMetric
                                label="Thieves (#)"
                                baselineValue={baselineProvince.thieves}
                                currentValue={province.thieves}
                                format={(v) => v.toLocaleString()}
                            />
                            <SnapshotMetric
                                label="Thieves per acre"
                                baselineValue={
                                    baselineProvince.acres
                                        ? baselineProvince.thieves / baselineProvince.acres
                                        : null
                                }
                                currentValue={
                                    province.acres ? province.thieves / province.acres : 0
                                }
                                format={(v) => v.toFixed(2)}
                            />
                        </div>
                    </section>

                    {/* BUILDINGS / GROWTH */}
                    <section className="snapshot-section snapshot-section--buildings">
                        <h3 className="snapshot-section-title-small">Buildings</h3>
                        <table className="buildings-table">
                            <thead>
                            <tr>
                                <th>Building type</th>
                                <th style={{ textAlign: "right" }}>Base %</th>
                                <th style={{ textAlign: "right" }}>Base qty</th>
                                <th style={{ textAlign: "right" }}>Curr %</th>
                                <th style={{ textAlign: "right" }}>Curr qty</th>
                                <th style={{ textAlign: "right" }}>Δ %</th>
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
                                        <td style={{ textAlign: "right" }}>
                                            {basePct.toFixed(1)}%
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            {baseQty.toLocaleString()}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            {currPct.toFixed(1)}%
                                        </td>
                                        <td style={{ textAlign: "right" }}>
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
                        <table className="buildings-table science-table">
                            <thead>
                            <tr>
                                <th>Science type</th>
                                <th style={{ textAlign: "right" }}>Base books</th>
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
                        <table className="buildings-table">
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
                    <div className="card-columns">
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
                </div>

                {/* Military */}
                <div className="card">
                    <div className="card-title">Military</div>
                    <div className="card-columns">
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
                </div>

                {/* Food & Production */}
                <div className="card">
                    <div className="card-title">Food & Production</div>
                    <div className="card-columns">
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
                </div>

                {/* Buildings */}
                <div className="card">
                    <div className="card-title">Buildings</div>
                    <div className="card-columns">
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
                                {/* TODO: wire your existing numeric inputs for peasants/soldiers/etc here */}
                            </div>
                        </div>

                        {/* Economy & Resources */}
                        <div className="manual-section">
                            <h4 className="manual-section-title">Economy & Resources</h4>
                            <div className="control-grid">
                                {/* TODO: wire gold, food, runes, horses, prisoners, wageRate */}
                            </div>
                        </div>

                        {/* Intel-only fields */}
                        <div className="manual-section">
                            <h4 className="manual-section-title">Intel-only fields</h4>
                            <div className="control-grid">
                                {/* TODO: intelOffenseHome, intelDefenseHome, intelWagePercent, draftTargetPercent */}
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
