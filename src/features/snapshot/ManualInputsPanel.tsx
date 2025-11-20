// src/features/snapshot/ManualInputsPanel.tsx
import React from "react";
import type {
    ProvinceSectionId,
    SnapshotField,
    IntelRow,
    ManualOverrides,
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

// Helper: filter to fields that belong to a section and are marked as
// manually editable in the spreadsheet config.
function getManualInputFields(
    allFields: SnapshotField[],
    sectionId: ProvinceSectionId
): SnapshotField[] {
    return allFields.filter((field) => {
        const f = field as SnapshotField & {
            section?: ProvinceSectionId;
            manualInput?: boolean;
        };

        const inSection = f.section === sectionId;
        const isManual = f.manualInput === true;

        return inSection && isManual;
    });
}

// Helper: best-effort base value for a field from the intel row
function getBaseFieldValue(
    field: SnapshotField,
    intelRow: IntelRow
): string | number | null {
    const rowAsRecord = intelRow as IntelRow & Record<string, unknown>;
    const value = rowAsRecord[field.key];

    if (value == null) return null;

    if (typeof value === "number" || typeof value === "string") {
        return value;
    }

    return String(value);
}

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

    return (
        <details className="rounded-md border border-slate-600 bg-slate-900/40 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-100">
                Manual Inputs / Overrides
            </summary>

            <div className="mt-3 space-y-4">
                {SECTIONS.map((sectionId) => {
                    const fields = getManualInputFields(SNAPSHOT_FIELDS, sectionId);
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
                                            ? getBaseFieldValue(field, intelRow)
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
                                            className="flex flex-col gap-1 text-xs text-slate-100"
                                        >
                      <span className="flex items-center justify-between">
                        <span>{field.label}</span>
                        <span className="text-[10px] text-slate-500">
                          {field.key}
                        </span>
                      </span>
                                            <input
                                                className="rounded border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-slate-100 outline-none focus:border-emerald-400"
                                                value={value}
                                                onChange={(e) =>
                                                    handleInputChange(field, e.target.value)
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
        </details>
    );
};
