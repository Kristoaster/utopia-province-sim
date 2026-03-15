// src/App.tsx
import React, { useMemo, useState } from "react";
import "./App.css";
import type { Province, ProvinceSpell, ScienceCategoryId } from "./utopia/types";
import { RACE_LIST, getRace } from "./utopia/current/races";
import { PERSONALITY_LIST, getPersonality } from "./utopia/current/personalities";
import { BUILDING_LIST } from "./utopia/data/buildings";
import { RITUAL_LIST, getRitual } from "./utopia/data/rituals";
import { DRAGON_LIST, getDragon } from "./utopia/data/dragons";
import {
    getActiveSpells,
    previewActiveSpellNames,
    summarizeActiveSpells,
} from "./utopia/data/spells";
import { parseIntelCsv } from "./utopia/intel-parse";
import {
    resolveBuildingEfficiency,
    resolveNwpa,
    resolveRawTpa,
    resolveRawWpa,
    toMetricCell,
    simpleMetricCell,
} from "./features/snapshot/snapshotDisplay";
import { SnapshotMetric } from "./features/snapshot/SnapshotMetric";
import {
    SCIENCE_CATEGORIES,
    estimateScienceBooksFromEffect,
} from "./utopia/data/science";
import {
    HONOR_RANKS,
    getHonorRankLabel,
} from "./utopia/data/honor";
import { HonorInfo } from "./features/honor/HonorInfo";
import { initialProvince, cloneProvince } from "./utopia/province-state";
import { computeProvinceMetrics } from "./utopia/province-metrics";
import { RaceInfo } from "./features/race/RaceInfo";
import { PersonalityInfo } from "./features/personality/PersonalityInfo";
import { RitualInfo } from "./features/ritual/RitualInfo";
import { DragonInfo } from "./features/dragon/DragonInfo";
import { SpellInfo } from "./features/spells/SpellInfo";

type IntelSource = "CSV" | "MANUAL";

function App() {
    const [province, setProvince] = useState<Province>(initialProvince);
    const [baselineProvince, setBaselineProvince] =
        useState<Province>(initialProvince);
    const [intelProvinces, setIntelProvinces] = useState<Province[]>([]);
    const [selectedIntelIndex, setSelectedIntelIndex] = useState<number | null>(
        null
    );

    const [intelSource, setIntelSource] = useState<IntelSource>("CSV");

    const baselineMetrics = useMemo(
        () => computeProvinceMetrics(baselineProvince),
        [baselineProvince]
    );

    const currentMetrics = useMemo(
        () => computeProvinceMetrics(province),
        [province]
    );

    const baselineBe = useMemo(
        () => resolveBuildingEfficiency(baselineProvince),
        [baselineProvince]
    );
    const currentBe = useMemo(
        () => resolveBuildingEfficiency(province),
        [province]
    );
    const updateBeOverridePercent = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.trim();

        setProvince((prev) => {
            if (raw === "") {
                return {
                    ...prev,
                    beOverride: null,
                };
            }

            const value = Number(raw);
            if (!Number.isFinite(value)) return prev;

            return {
                ...prev,
                beOverride: value / 100,
            };
        });
    };

    const baselineNwpa = useMemo(() => toMetricCell(resolveNwpa(baselineProvince)), [baselineProvince]);
    const currentNwpa = useMemo(() => toMetricCell(resolveNwpa(province)), [province]);

    const baselineRawTpa = useMemo(() => toMetricCell(resolveRawTpa(baselineProvince)), [baselineProvince]);
    const currentRawTpa = useMemo(() => toMetricCell(resolveRawTpa(province)), [province]);

    const baselineRawWpa = useMemo(() => toMetricCell(resolveRawWpa(baselineProvince)), [baselineProvince]);
    const currentRawWpa = useMemo(() => toMetricCell(resolveRawWpa(province)), [province]);

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

    const loadProvince = (prov: Province) => {
        const cloned = cloneProvince(prov);
        setProvince(cloned);
        setBaselineProvince(cloneProvince(cloned));
    };

    const [spellsExpanded, setSpellsExpanded] = useState(false);

    const getRitualDisplay = (ritualId: Province["ritual"]) =>
        getRitual(ritualId)?.display ?? "None";

    const getDragonDisplay = (dragonId: Province["dragon"]) =>
        getDragon(dragonId)?.display ?? "None";

    const toSpellMetricCell = (spells: Province["activeSpells"]) => ({
        primary: summarizeActiveSpells(spells),
        secondary: previewActiveSpellNames(spells),
        numeric: getActiveSpells(spells).length,
    });

    const baselineSpellCell = useMemo(
        () => toSpellMetricCell(baselineProvince.activeSpells),
        [baselineProvince]
    );

    const currentSpellCell = useMemo(
        () => toSpellMetricCell(province.activeSpells),
        [province]
    );

    const toggleSpellActive = (target: ProvinceSpell) => {
        setProvince((prev) => ({
            ...prev,
            activeSpells: prev.activeSpells.map((spell) =>
                spell.name === target.name && spell.source === target.source
                    ? { ...spell, active: !spell.active }
                    : spell
            ),
        }));
    };

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
                loadProvince(provinces[0]);
            } else {
                alert("No valid provinces found in intel file.");
            }
        };
        reader.readAsText(file);
    };

    const handleSaveSnapshot = () => {
        // Clone so future edits to `province` don’t mutate the baseline object
        setBaselineProvince(cloneProvince(province));
    };

    const handleStartManual = () => {
        const fresh = cloneProvince(initialProvince);
        setProvince(fresh);
        setBaselineProvince(cloneProvince(fresh));
        setIntelProvinces([]);
        setSelectedIntelIndex(null);
    };

    const updateProvinceText =
        (key: keyof Province) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setProvince((prev) => ({
                    ...prev,
                    [key]: value,
                }));
            };

    const updateProvinceNumber =
        (key: keyof Province) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = Number(e.target.value);
                setProvince((prev) => ({
                    ...prev,
                    [key]: Number.isFinite(value) ? value : prev[key],
                }));
            };

    const updateBuilding =
        (buildingId: keyof Province["buildings"]) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = Number(e.target.value) || 0;

                setProvince((prev) => {
                    const buildings = {
                        ...prev.buildings,
                        [buildingId]: value,
                    };

                    const builtAcres = Object.values(buildings).reduce(
                        (sum, v) => sum + (v || 0),
                        0
                    );

                    return {
                        ...prev,
                        buildings,
                        builtAcres,
                        barrenAcres: Math.max(prev.acres - builtAcres, 0),
                    };
                });
            };

    const updateScienceEffect =
        (categoryId: ScienceCategoryId) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const value = Number(e.target.value);

                setProvince((prev) => {
                    const nextEffect = Number.isFinite(value)
                        ? value
                        : prev.science[categoryId].effect;

                    return {
                        ...prev,
                        science: {
                            ...prev.science,
                            [categoryId]: {
                                effect: nextEffect,
                                books: estimateScienceBooksFromEffect(nextEffect, prev.acres),
                            },
                        },
                    };
                });
            };

    const updateAcres = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);

        setProvince((prev) => {
            const acres = Number.isFinite(value) ? value : prev.acres;
            const builtAcres = Object.values(prev.buildings).reduce(
                (sum, v) => sum + (v || 0),
                0
            );

            return {
                ...prev,
                acres,
                builtAcres,
                barrenAcres: Math.max(acres - builtAcres, 0),
                science: SCIENCE_CATEGORIES.reduce((acc, category) => {
                    const effect = prev.science[category.id].effect;
                    acc[category.id] = {
                        effect,
                        books: estimateScienceBooksFromEffect(effect, acres),
                    };
                    return acc;
                }, {} as Province["science"]),
            };
        });
    };

    const updateWageRatePercent = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);

        setProvince((prev) => ({
            ...prev,
            wageRate: Number.isFinite(value) ? value / 100 : prev.wageRate,
            intelWagePercent: Number.isFinite(value) ? value : prev.intelWagePercent,
        }));
    };

    const getRaceDisplay = (raceId: Province["race"]) =>
        getRace(raceId)?.display ?? raceId;

    const getPersonalityDisplay = (personalityId: Province["personality"]) =>
        getPersonality(personalityId)?.display ?? personalityId;

    return (
        <>
            <div className="alpha-banner">
                🚧 Utopia Province Sim – <strong>alpha build</strong>. Some calculations and outputs are still incomplete.
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
                        style={{marginBottom: "0.5rem"}}
                    >
                        <div>
                            <label>Intel source</label>
                            <select
                                value={intelSource}
                                onChange={(e) => {
                                    const next = e.target.value as IntelSource;
                                    setIntelSource(next);

                                    if (next === "MANUAL") {
                                        handleStartManual();
                                    }
                                }}
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
                                                    loadProvince(chosen);
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
                    </div>
                </div>

                <h2 className="section-title">Current Snapshot</h2>

                <div className="card throne-card">
                    <div className="throne-header">
                        <div>
                            <div className="throne-name">{province.name}</div>
                            <div className="throne-pills">
                            <span className="pill">
                                Ruler: {province.rulerName} • Honor: {getHonorRankLabel(province.honorLevel)}
                            </span>
                                <span className="pill">
                                    {getRaceDisplay(province.race)} / {getPersonalityDisplay(province.personality)}
                                </span>
                                <span className="pill">
                                KD {province.location}
                            </span>
                            </div>
                        </div>

                        <div style={{display: "flex", flexDirection: "column", gap: "0.35rem"}}>
                            <button type="button" onClick={handleSaveSnapshot}>
                                Save snapshot as baseline
                            </button>
                            <span style={{fontSize: "0.7rem", color: "#cbd5f5"}}>
                            Saves the <strong>New</strong> values as the new
                            comparison baseline.
                        </span>
                        </div>
                    </div>

                    {/* Snapshot comparison table */}
                    <div className="card-columns snapshot-sections">

                        <section className="snapshot-section snapshot-section--throne">
                            <h3 className="snapshot-section-title-small">Basics</h3>

                            <table className="buildings-table snapshot-metrics-table">
                                <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th style={{textAlign: "right"}}>Baseline</th>
                                    <th style={{textAlign: "right"}}>Current</th>
                                    <th style={{textAlign: "right"}}>Edit</th>
                                    <th style={{textAlign: "right"}}>Δ</th>
                                </tr>
                                </thead>
                                <tbody>
                                <SnapshotMetric
                                    label="Province name"
                                    baseline={{primary: baselineProvince.name, numeric: null}}
                                    current={{primary: province.name, numeric: null}}
                                    editor={
                                        <input
                                            className="snapshot-inline-input wide"
                                            type="text"
                                            value={province.name}
                                            onChange={updateProvinceText("name")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Ruler name"
                                    baseline={{primary: baselineProvince.rulerName, numeric: null}}
                                    current={{primary: province.rulerName, numeric: null}}
                                    editor={
                                        <input
                                            className="snapshot-inline-input wide"
                                            type="text"
                                            value={province.rulerName}
                                            onChange={updateProvinceText("rulerName")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Honor"
                                    baseline={{
                                        primary: getHonorRankLabel(baselineProvince.honorLevel),
                                        numeric: baselineProvince.honorLevel,
                                    }}
                                    current={{
                                        primary: getHonorRankLabel(province.honorLevel),
                                        numeric: province.honorLevel,
                                    }}
                                    editor={
                                        <div className="honor-edit-cell">
                                            <select
                                                className="snapshot-inline-select wide"
                                                value={province.honorLevel}
                                                onChange={(e) =>
                                                    setProvince((prev) => ({
                                                        ...prev,
                                                        honorLevel: Number(e.target.value),
                                                    }))
                                                }
                                            >
                                                {HONOR_RANKS.map((rank) => (
                                                    <option key={rank.level} value={rank.level}>
                                                        {rank.rank}
                                                    </option>
                                                ))}
                                            </select>

                                            <HonorInfo honorLevel={province.honorLevel}/>
                                        </div>
                                    }
                                    formatDelta={(d) => `${Math.abs(d)} rank${Math.abs(d) === 1 ? "" : "s"}`}
                                    showPercentDelta={false}
                                />

                                <SnapshotMetric
                                    label="Race"
                                    baseline={{primary: getRaceDisplay(baselineProvince.race), numeric: null}}
                                    current={{primary: getRaceDisplay(province.race), numeric: null}}
                                    editor={
                                        <div className="entity-edit-cell">
                                            <select
                                                className="snapshot-inline-select wide"
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

                                            <RaceInfo raceId={province.race}/>
                                        </div>
                                    }
                                />

                                <SnapshotMetric
                                    label="Personality"
                                    baseline={{
                                        primary: getPersonalityDisplay(baselineProvince.personality),
                                        numeric: null
                                    }}
                                    current={{primary: getPersonalityDisplay(province.personality), numeric: null}}
                                    editor={
                                        <div className="entity-edit-cell">
                                            <select
                                                className="snapshot-inline-select wide"
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

                                            <PersonalityInfo personalityId={province.personality}/>
                                        </div>
                                    }
                                />

                                <SnapshotMetric
                                    label="Ritual"
                                    baseline={{primary: getRitualDisplay(baselineProvince.ritual), numeric: null}}
                                    current={{primary: getRitualDisplay(province.ritual), numeric: null}}
                                    editor={
                                        <div className="entity-edit-cell">
                                            <select
                                                className="snapshot-inline-select wide"
                                                value={province.ritual ?? ""}
                                                onChange={(e) =>
                                                    setProvince((prev) => ({
                                                        ...prev,
                                                        ritual: e.target.value
                                                            ? (e.target.value as Province["ritual"])
                                                            : null,
                                                        ritualEffectiveness: e.target.value
                                                            ? prev.ritualEffectiveness
                                                            : 100,
                                                    }))
                                                }
                                            >
                                                <option value="">None</option>
                                                {RITUAL_LIST.map((ritual) => (
                                                    <option key={ritual.id} value={ritual.id}>
                                                        {ritual.display}
                                                    </option>
                                                ))}
                                            </select>

                                            {province.ritual && <RitualInfo ritualId={province.ritual}/>}
                                        </div>
                                    }
                                />

                                <SnapshotMetric
                                    label="Ritual effectiveness"
                                    baseline={simpleMetricCell(
                                        baselineProvince.ritual ? baselineProvince.ritualEffectiveness : null,
                                        (v) => `${v.toFixed(2)}%`
                                    )}
                                    current={simpleMetricCell(
                                        province.ritual ? province.ritualEffectiveness : null,
                                        (v) => `${v.toFixed(2)}%`
                                    )}
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            step="0.01"
                                            disabled={!province.ritual}
                                            value={province.ritual ? province.ritualEffectiveness : ""}
                                            onChange={(e) =>
                                                setProvince((prev) => ({
                                                    ...prev,
                                                    ritualEffectiveness: Number.isFinite(Number(e.target.value))
                                                        ? Number(e.target.value)
                                                        : prev.ritualEffectiveness,
                                                }))
                                            }
                                        />
                                    }
                                    formatDelta={(d) => `${d.toFixed(2)}%`}
                                    showPercentDelta={false}
                                />

                                <SnapshotMetric
                                    label="Dragon"
                                    baseline={{primary: getDragonDisplay(baselineProvince.dragon), numeric: null}}
                                    current={{primary: getDragonDisplay(province.dragon), numeric: null}}
                                    editor={
                                        <div className="entity-edit-cell">
                                            <select
                                                className="snapshot-inline-select wide"
                                                value={province.dragon ?? ""}
                                                onChange={(e) =>
                                                    setProvince((prev) => ({
                                                        ...prev,
                                                        dragon: e.target.value
                                                            ? (e.target.value as Province["dragon"])
                                                            : null,
                                                    }))
                                                }
                                            >
                                                <option value="">None</option>
                                                {DRAGON_LIST.map((dragon) => (
                                                    <option key={dragon.id} value={dragon.id}>
                                                        {dragon.display}
                                                    </option>
                                                ))}
                                            </select>

                                            {province.dragon && <DragonInfo dragonId={province.dragon}/>}
                                        </div>
                                    }
                                />

                                <SnapshotMetric
                                    label="Current spells"
                                    baseline={baselineSpellCell}
                                    current={currentSpellCell}
                                    editor={
                                        <div className="entity-edit-cell">
                                            <button
                                                type="button"
                                                className="snapshot-inline-button"
                                                onClick={() => setSpellsExpanded((prev) => !prev)}
                                            >
                                                {spellsExpanded ? "Hide" : "Show"}
                                            </button>

                                            <SpellInfo spells={province.activeSpells}/>
                                        </div>
                                    }
                                    formatDelta={(d) =>
                                        `${Math.abs(d).toFixed(0)} spell${Math.abs(d) === 1 ? "" : "s"}`
                                    }
                                    showPercentDelta={false}
                                />

                                {spellsExpanded && (
                                    <tr>
                                        <td colSpan={5} className="spells-panel-cell">
                                            {province.activeSpells.length === 0 ? (
                                                <div className="spells-empty">
                                                    No spells loaded from GoodSpells / BadSpells.
                                                </div>
                                            ) : (
                                                <div className="spells-grid">
                                                    {province.activeSpells.map((spell) => (
                                                        <label
                                                            key={`${spell.name}-${spell.source}`}
                                                            className="spell-toggle"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={spell.active}
                                                                onChange={() => toggleSpellActive(spell)}
                                                            />
                                                            <span>{spell.name}</span>
                                                            <span className={`spell-source-badge ${spell.source}`}>
                                    {spell.source === "good" ? "Good" : "Bad"}
                                </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </section>

                        {/* ECONOMY */}
                        <section className="snapshot-section snapshot-section--economy">
                            <h3 className="snapshot-section-title-small">Economy</h3>

                            <table className="buildings-table snapshot-metrics-table">
                                <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th style={{textAlign: "right"}}>Baseline</th>
                                    <th style={{textAlign: "right"}}>Current</th>
                                    <th style={{textAlign: "right"}}>Edit</th>
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
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.acres}
                                            onChange={updateAcres}
                                        />
                                    }
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
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.peasants}
                                            onChange={updateProvinceNumber("peasants")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Gold"
                                    baseline={simpleMetricCell(
                                        baselineProvince.gold,
                                        (v) => v.toLocaleString()
                                    )}
                                    current={simpleMetricCell(
                                        province.gold,
                                        (v) => v.toLocaleString()
                                    )}
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.gold}
                                            onChange={updateProvinceNumber("gold")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Food"
                                    baseline={simpleMetricCell(
                                        baselineProvince.food,
                                        (v) => v.toLocaleString()
                                    )}
                                    current={simpleMetricCell(
                                        province.food,
                                        (v) => v.toLocaleString()
                                    )}
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.food}
                                            onChange={updateProvinceNumber("food")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Runes"
                                    baseline={simpleMetricCell(
                                        baselineProvince.runes,
                                        (v) => v.toLocaleString()
                                    )}
                                    current={simpleMetricCell(
                                        province.runes,
                                        (v) => v.toLocaleString()
                                    )}
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.runes}
                                            onChange={updateProvinceNumber("runes")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Trade balance"
                                    baseline={simpleMetricCell(
                                        baselineProvince.tradeBalance,
                                        (v) => v.toLocaleString()
                                    )}
                                    current={simpleMetricCell(
                                        province.tradeBalance,
                                        (v) => v.toLocaleString()
                                    )}
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.tradeBalance}
                                            onChange={updateProvinceNumber("tradeBalance")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Building credits"
                                    baseline={simpleMetricCell(
                                        baselineProvince.buildingCredits,
                                        (v) => v.toLocaleString()
                                    )}
                                    current={simpleMetricCell(
                                        province.buildingCredits,
                                        (v) => v.toLocaleString()
                                    )}
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.buildingCredits}
                                            onChange={updateProvinceNumber("buildingCredits")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Building Efficiency"
                                    baseline={baselineBe}
                                    current={currentBe}
                                    editor={
                                        <div className="be-edit-cell">
                                            <input
                                                className="snapshot-inline-input"
                                                type="number"
                                                step="0.01"
                                                value={province.beOverride != null ? province.beOverride * 100 : ""}
                                                onChange={updateBeOverridePercent}
                                                placeholder={(currentMetrics.beResult.be * 100).toFixed(2)}
                                                title="Optional manual BE override"
                                            />
                                            <button
                                                type="button"
                                                className="snapshot-inline-button"
                                                onClick={() =>
                                                    setProvince((prev) => ({
                                                        ...prev,
                                                        beOverride: null,
                                                    }))
                                                }
                                                disabled={province.beOverride == null}
                                                title="Clear override and use export/calculated BE"
                                            >
                                                Auto
                                            </button>
                                        </div>
                                    }
                                    formatDelta={(d) => `${d.toFixed(2)}%`}
                                    showPercentDelta={false}
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
                                    <td style={{textAlign: "right"}}>—</td>
                                    <td style={{textAlign: "right"}}></td>
                                </tr>
                                <tr>
                                    <td>Daily runes decayed</td>
                                    <td style={{textAlign: "right"}}>—</td>
                                    <td style={{textAlign: "right"}}>— (TODO)</td>
                                    <td style={{textAlign: "right"}}>—</td>
                                    <td style={{textAlign: "right"}}></td>
                                </tr>
                                <tr>
                                    <td>Net runes (daily)</td>
                                    <td style={{textAlign: "right"}}>—</td>
                                    <td style={{textAlign: "right"}}>— (TODO)</td>
                                    <td style={{textAlign: "right"}}>—</td>
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
                                    <th style={{textAlign: "right"}}>Edit</th>
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
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.draftTargetPercent}
                                            onChange={updateProvinceNumber("draftTargetPercent")}
                                        />
                                    }
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
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.wageRate * 100}
                                            onChange={updateWageRatePercent}
                                        />
                                    }
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
                                    label="Training credits"
                                    baseline={simpleMetricCell(
                                        baselineProvince.trainingCredits,
                                        (v) => v.toLocaleString()
                                    )}
                                    current={simpleMetricCell(
                                        province.trainingCredits,
                                        (v) => v.toLocaleString()
                                    )}
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.trainingCredits}
                                            onChange={updateProvinceNumber("trainingCredits")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Soldiers"
                                    baseline={simpleMetricCell(
                                        baselineProvince.soldiers,
                                        (v) => v.toLocaleString()
                                    )}
                                    current={simpleMetricCell(
                                        province.soldiers,
                                        (v) => v.toLocaleString()
                                    )}
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.soldiers}
                                            onChange={updateProvinceNumber("soldiers")}
                                        />
                                    }
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
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.offSpecs}
                                            onChange={updateProvinceNumber("offSpecs")}
                                        />
                                    }
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
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.defSpecs}
                                            onChange={updateProvinceNumber("defSpecs")}
                                        />
                                    }
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
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.elites}
                                            onChange={updateProvinceNumber("elites")}
                                        />
                                    }
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
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.horses}
                                            onChange={updateProvinceNumber("horses")}
                                        />
                                    }
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
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.prisoners}
                                            onChange={updateProvinceNumber("prisoners")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Soldier raw offense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.soldierRawOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.soldierRawOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Soldier raw defense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.soldierRawDefense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.soldierRawDefense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Off spec raw offense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.offSpecRawOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.offSpecRawOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Off spec mod offense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.offSpecModOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.offSpecModOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Def spec raw defense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.defSpecRawDefense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.defSpecRawDefense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Def spec mod defense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.defSpecModDefense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.defSpecModDefense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Elite raw offense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.eliteRawOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.eliteRawOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Elite mod offense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.eliteModOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.eliteModOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Elite raw defense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.eliteRawDefense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.eliteRawDefense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Elite mod defense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.eliteModDefense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.eliteModDefense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Horse offense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.rawHorseOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.rawHorseOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Prisoner offense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.rawPrisonerOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.rawPrisonerOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                />

                                <SnapshotMetric
                                    label="Horse capacity"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.horseCapacity,
                                        (v) => v.toLocaleString()
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.horseCapacity,
                                        (v) => v.toLocaleString()
                                    )}
                                    showPercentDelta={false}
                                />

                                <SnapshotMetric
                                    label="Total raw offense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.rawOffense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.rawOffense,
                                        (v) => v.toFixed(0)
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
                                    label="Total raw defense"
                                    baseline={simpleMetricCell(
                                        baselineMetrics.militaryResult.rawDefense,
                                        (v) => v.toFixed(0)
                                    )}
                                    current={simpleMetricCell(
                                        militaryResult.rawDefense,
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
                                    <td style={{textAlign: "right"}}>—</td>
                                    <td style={{textAlign: "right"}}></td>
                                </tr>
                                <tr>
                                    <td>War attack time</td>
                                    <td style={{textAlign: "right"}}>—</td>
                                    <td style={{textAlign: "right"}}>— (TODO)</td>
                                    <td style={{textAlign: "right"}}>—</td>
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
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.thieves}
                                            onChange={updateProvinceNumber("thieves")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Raw TPA"
                                    baseline={baselineRawTpa}
                                    current={currentRawTpa}
                                    formatDelta={(d) => d.toFixed(4)}
                                />

                                <SnapshotMetric
                                    label="Wizards (#)"
                                    baseline={simpleMetricCell(
                                        baselineProvince.wizards,
                                        (v) => v.toLocaleString()
                                    )}
                                    current={simpleMetricCell(
                                        province.wizards,
                                        (v) => v.toLocaleString()
                                    )}
                                    editor={
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.wizards}
                                            onChange={updateProvinceNumber("wizards")}
                                        />
                                    }
                                />

                                <SnapshotMetric
                                    label="Raw WPA"
                                    baseline={baselineRawWpa}
                                    current={currentRawWpa}
                                    formatDelta={(d) => d.toFixed(4)}
                                />
                                </tbody>
                            </table>

                            {militaryResult.notes.length > 0 && (
                                <div
                                    style={{
                                        marginTop: "0.5rem",
                                        fontSize: "0.72rem",
                                        color: "#facc15",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.2rem",
                                    }}
                                >
                                    {militaryResult.notes.map((note, index) => (
                                        <div key={index}>• {note}</div>
                                    ))}
                                </div>
                            )}

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
                                    <th style={{textAlign: "right"}}>Edit qty</th>
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
                                                <input
                                                    className="snapshot-inline-input"
                                                    type="number"
                                                    value={currQty}
                                                    onChange={updateBuilding(b.id)}
                                                />
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
                                    <th style={{textAlign: "right"}}>Base %</th>
                                    <th style={{textAlign: "right"}}>Curr books</th>
                                    <th style={{textAlign: "right"}}>Curr %</th>
                                    <th style={{textAlign: "right"}}>Edit %</th>
                                    <th style={{textAlign: "right"}}>Δ</th>
                                </tr>
                                </thead>
                                <tbody>
                                {SCIENCE_CATEGORIES.map((category) => {
                                    const baseEffect = baselineProvince.science[category.id].effect;
                                    const currEffect = province.science[category.id].effect;

                                    const baseBooks = estimateScienceBooksFromEffect(
                                        baseEffect,
                                        baselineProvince.acres
                                    );

                                    const currBooks = estimateScienceBooksFromEffect(
                                        currEffect,
                                        province.acres
                                    );

                                    const booksDiff = currBooks - baseBooks;
                                    const effectDiff = currEffect - baseEffect;

                                    const booksClass =
                                        booksDiff > 0 ? "value-good" : booksDiff < 0 ? "value-bad" : "";

                                    const effectClass =
                                        effectDiff > 0 ? "value-good" : effectDiff < 0 ? "value-bad" : "";

                                    return (
                                        <tr key={category.id}>
                                            <td>{category.label}</td>

                                            <td style={{textAlign: "right"}}>
                                                {baseBooks.toLocaleString()}
                                            </td>

                                            <td style={{textAlign: "right"}}>
                                                {baseEffect.toFixed(2)}%
                                            </td>

                                            <td style={{textAlign: "right"}}>
                                                {currBooks.toLocaleString()}
                                            </td>

                                            <td style={{textAlign: "right"}}>
                                                {currEffect.toFixed(2)}%
                                            </td>

                                            <td style={{textAlign: "right"}}>
                                                <input
                                                    className="snapshot-inline-input"
                                                    type="number"
                                                    step="0.01"
                                                    value={currEffect}
                                                    onChange={updateScienceEffect(category.id)}
                                                />
                                            </td>

                                            <td style={{textAlign: "right"}}>
                                                <div className="snapshot-cell-stack">
                                                    <div className={booksClass}>
                                                        {booksDiff === 0
                                                            ? "—"
                                                            : `${booksDiff > 0 ? "+" : ""}${booksDiff.toLocaleString()}`}
                                                    </div>
                                                    <div className={`snapshot-subvalue ${effectClass}`}>
                                                        {effectDiff === 0
                                                            ? ""
                                                            : `${effectDiff > 0 ? "+" : ""}${effectDiff.toFixed(2)}%`}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                                    <th style={{textAlign: "right"}}>Base NW</th>
                                    <th style={{textAlign: "right"}}>Curr NW</th>
                                    <th style={{textAlign: "right"}}>Edit</th>
                                    <th style={{textAlign: "right"}}>Δ NW</th>
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
                                        <td style={{textAlign: "right"}}>—</td>
                                        <td style={{textAlign: "right"}}>—</td>
                                        <td style={{textAlign: "right"}}>—</td>
                                        <td style={{textAlign: "right"}}>—</td>
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
                                    <td style={{textAlign: "right"}}>
                                        {baselineProvince.networth.toLocaleString()}
                                    </td>
                                    <td style={{textAlign: "right"}}>
                                        {province.networth.toLocaleString()}
                                    </td>
                                    <td style={{textAlign: "right"}}>
                                        <input
                                            className="snapshot-inline-input"
                                            type="number"
                                            value={province.networth}
                                            onChange={updateProvinceNumber("networth")}
                                        />
                                    </td>
                                    <td style={{textAlign: "right"}}>
                                        {(() => {
                                            const diff = province.networth - baselineProvince.networth;
                                            if (diff === 0) return "";
                                            return `${diff > 0 ? "+" : ""}${diff.toLocaleString()}`;
                                        })()}
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}

export default App;
