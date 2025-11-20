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

const SECTIONS: ProvinceSectionId[] = [
    "throne",
    "population",
    "economy",
    "military",
    "buildingsGrowth",
    "science",
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

    const anyFields = SECTIONS.some(
        (sectionId) =>
            getManualInputFieldsFromModel(SNAPSHOT_FIELDS, sectionId).length > 0
    );
    if (!anyFields) {
        return null;
    }

    return (
        <div className="manual-panel rounded-md border border-slate-600 bg-slate-900/40 p-3">
            <div className="mb-2 text-xs text-slate-300">
                These fields come from intel, but you can override any value. Leave
                blank to keep the intel number.
            </div>

            <div className="space-y-4">
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

