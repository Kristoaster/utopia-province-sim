// src/features/snapshot/ManualInputsPanel.tsx
import React from "react";
import type {
    ProvinceSectionId,
    SnapshotField,
    IntelRow,
    ManualOverrides,
} from "./snapshotModel";
import {
    getManualInputFields as getManualInputFieldsFromModel,
    getBaseFieldValue as getBaseFieldValueFromModel,
} from "./snapshotModel";
import { SNAPSHOT_FIELDS } from "./snapshotFields.generated";

type ManualInputsPanelProps = {
    intelRow: IntelRow | null;
    manualOverrides: ManualOverrides;
    onChange: (key: string, value: string | number | null) => void;
};

type ScienceRow = {
    name: string;
    booksField?: SnapshotField;
    effectField?: SnapshotField;
};

const SECTION_LABELS: Record<ProvinceSectionId, string> = {
    throne: "Throne / Basics",
    state: "State",
    population: "Population",
    economy: "Economy",
    netChanges: "Net Changes",
    military: "Military",
    buildingsGrowth: "Buildings / Growth",
    science: "Science",
};

// Sections we actually show manual inputs for
const SECTIONS: ProvinceSectionId[] = [
    "throne",
    "population",
    "economy",
    "military",
    "buildingsGrowth",
    "science",
    // add "state" or "netChanges" here later if needed
];

export const ManualInputsPanel: React.FC<ManualInputsPanelProps> = ({
                                                                        intelRow,
                                                                        manualOverrides,
                                                                        onChange,
                                                                    }) => {
    const handleInputChange = (field: SnapshotField, raw: string) => {
        const trimmed = raw.trim();
        if (trimmed === "") {
            onChange(field.key, null);
            return;
        }
        const asNumber = Number(trimmed);
        if (!Number.isNaN(asNumber)) {
            onChange(field.key, asNumber);
        } else {
            onChange(field.key, trimmed);
        }
    };

    // If absolutely no fields allow manual input, hide the panel entirely.
    const anyFields = SECTIONS.some(
        (sectionId) =>
            getManualInputFieldsFromModel(SNAPSHOT_FIELDS, sectionId).length > 0
    );
    if (!anyFields) {
        return null;
    }

    // Track which snapshot keys we've already rendered,
    // so we only show the first occurrence (per key).
    const seenKeys = new Set<string>();


    // 🔽 THIS is the new return block
    return (
        <div className="manual-panel rounded-md border border-slate-600 bg-slate-900/40 p-3">
            <div className="mb-2 text-xs text-slate-300">
                These fields come from intel, but you can override any value. Leave
                blank to keep the intel number.
            </div>

            <div className="space-y-4">
                {SECTIONS.map((sectionId) => {
                    // 1️⃣ Get all fields for this section
                    const allFields = getManualInputFieldsFromModel(
                        SNAPSHOT_FIELDS,
                        sectionId
                    );

                    // 2️⃣ De-dupe by key: only keep the first occurrence of each key
                    const fields = allFields.filter((field) => {
                        if (seenKeys.has(field.key)) {
                            return false; // already rendered in a previous section
                        }
                        seenKeys.add(field.key);
                        return true;
                    });

                    // If this section has no *new* fields, skip it entirely
                    if (!fields.length) return null;

                    // 🔬 Special layout for SCIENCE: table with Category / # books / Effect
                    if (sectionId === "science") {
                        const rowsByName: Record<string, ScienceRow> = {};

                        for (const field of fields) {
                            const label = field.label;
                            const booksSuffix = " # of books";
                            const effectSuffix = " Effect";

                            let baseName = label;
                            let kind: "books" | "effect" | "other" = "other";

                            if (label.endsWith(booksSuffix)) {
                                baseName = label.slice(0, -booksSuffix.length);
                                kind = "books";
                            } else if (label.endsWith(effectSuffix)) {
                                baseName = label.slice(0, -effectSuffix.length);
                                kind = "effect";
                            }

                            const key = baseName;
                            if (!rowsByName[key]) {
                                rowsByName[key] = { name: baseName };
                            }

                            if (kind === "books") {
                                rowsByName[key].booksField = field;
                            } else if (kind === "effect") {
                                rowsByName[key].effectField = field;
                            } else {
                                // fallback – treat as a books-style field if we somehow don’t match
                                rowsByName[key].booksField ??= field;
                            }
                        }

                        const rows = Object.values(rowsByName);

                        const getFieldValue = (field?: SnapshotField) => {
                            if (!field) {
                                return {
                                    value: "",
                                    placeholder: undefined as string | undefined,
                                };
                            }

                            const overrideValue =
                                manualOverrides[field.key as keyof ManualOverrides];

                            const baseFromIntel =
                                intelRow != null
                                    ? getBaseFieldValueFromModel(field, intelRow, {})
                                    : null;

                            const value =
                                overrideValue !== undefined && overrideValue !== null
                                    ? String(overrideValue)
                                    : baseFromIntel != null
                                        ? String(baseFromIntel)
                                        : "";

                            const placeholder =
                                baseFromIntel != null ? String(baseFromIntel) : undefined;

                            return { value, placeholder };
                        };

                        return (
                            <section key={sectionId}>
                                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    {SECTION_LABELS[sectionId]}
                                </h3>

                                <table className="buildings-table science-table">
                                    <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th style={{ textAlign: "right" }}># books</th>
                                        <th style={{ textAlign: "right" }}>Effect</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {rows.map((row) => {
                                        const booksState = getFieldValue(row.booksField);
                                        const effectState = getFieldValue(row.effectField);

                                        return (
                                            <tr key={row.name}>
                                                <td>{row.name}</td>
                                                <td style={{ textAlign: "right" }}>
                                                    {row.booksField && (
                                                        <input
                                                            className="snapshot-input"
                                                            type="text"
                                                            value={booksState.value}
                                                            onChange={(e) =>
                                                                handleInputChange(row.booksField!, e.target.value)
                                                            }
                                                            placeholder={booksState.placeholder}
                                                        />
                                                    )}
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    {row.effectField && (
                                                        <input
                                                            className="snapshot-input"
                                                            type="text"
                                                            value={effectState.value}
                                                            onChange={(e) =>
                                                                handleInputChange(row.effectField!, e.target.value)
                                                            }
                                                            placeholder={effectState.placeholder}
                                                        />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </section>
                        );
                    }

                    // 🧩 Default layout for all other sections
                    return (
                        <section key={sectionId}>
                            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                {SECTION_LABELS[sectionId]}
                            </h3>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                {fields.map((field) => {
                                    const overrideValue =
                                        manualOverrides[field.key as keyof ManualOverrides];

                                    const baseFromIntel =
                                        intelRow != null
                                            ? getBaseFieldValueFromModel(field, intelRow, {})
                                            : null;

                                    const value =
                                        overrideValue !== undefined && overrideValue !== null
                                            ? String(overrideValue)
                                            : baseFromIntel != null
                                                ? String(baseFromIntel)
                                                : "";

                                    return (
                                        <label
                                            key={field.key}
                                            className="flex flex-col gap-1 text-xs"
                                        >
              <span className="font-medium text-[11px] tracking-wide">
                {field.label}
              </span>
                                            <input
                                                className="snapshot-input"
                                                type="text"
                                                value={value}
                                                onChange={(e) =>
                                                    handleInputChange(field, e.target.value)
                                                }
                                                placeholder={
                                                    baseFromIntel != null
                                                        ? String(baseFromIntel)
                                                        : undefined
                                                }
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

            </div>
        </div>
    );
};
