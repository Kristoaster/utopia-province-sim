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

    return (
        <div className="rounded-md border border-slate-600 bg-slate-900/40 p-3">
            <h3 className="text-sm font-semibold text-slate-100">
                Manual Inputs / Overrides
            </h3>

            <div className="mt-3 space-y-4">
                {SECTIONS.map((sectionId) => {
                    const fields = getManualInputFieldsFromModel(
                        SNAPSHOT_FIELDS,
                        sectionId
                    );
                    if (!fields.length) return null;

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

                                    const isNumeric =
                                        typeof overrideValue === "number" ||
                                        typeof baseFromIntel === "number";

                                    return (
                                        <label
                                            key={field.key}
                                            className="flex flex-col gap-1 text-xs"
                                        >
            <span className="font-medium text-[11px] tracking-wide">
                {field.label}
            </span>
                                            <input
                                                className="rounded border border-slate-600 bg-slate-950/60 px-2 py-1 text-xs text-slate-100"
                                                type={isNumeric ? "number" : "text"}
                                                value={value}
                                                onChange={(e) => handleInputChange(field, e.target.value)}
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
