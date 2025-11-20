// src/features/snapshot/snapshotModel.ts

// Keep section IDs aligned with your Excel headers.
export type ProvinceSectionId =
    | "throne"
    | "state"
    | "population"
    | "economy"
    | "netChanges"
    | "military"
    | "buildingsGrowth"
    | "science";

export interface SnapshotField {
    key: string;            // stable programmatic key
    label: string;          // display label (Excel "Data" column)
    section: ProvinceSectionId;
    rawSource: string;      // original "Source" note from your Excel spec
}

export type FieldSourceKind = "intel" | "manual" | "intelOrManual" | "derived";

export interface ParsedFieldSource {
    kind: FieldSourceKind;
    intelColumns: string[];    // columns to read from IS export, if any
    allowsManualInput: boolean;
}

/**
 * Parse the rawSource string from the spec into something structured.
 * This looks for:
 *   - occurrences of IS Export "ColName"
 *   - the words "manual input" and "calculated"
 */
export function parseFieldSource(rawSource: string): ParsedFieldSource {
    const raw = rawSource.toLowerCase();
    const allowsManualInput = raw.includes("manual input");
    const isCalculated = raw.includes("calculated");
    const hasIntel = raw.includes("is export");

    // grab everything inside double quotes as candidate intel columns
    const intelColumns = Array.from(rawSource.matchAll(/"([^"]+)"/g)).map((m) =>
        m[1].trim()
    );

    let kind: FieldSourceKind;
    if (isCalculated && !hasIntel) {
        kind = "derived";
    } else if (hasIntel && allowsManualInput) {
        kind = "intelOrManual";
    } else if (hasIntel) {
        kind = "intel";
    } else if (allowsManualInput) {
        kind = "manual";
    } else {
        // default fall-back; treat as derived if nothing else matches
        kind = isCalculated ? "derived" : "manual";
    }

    return {
        kind,
        intelColumns,
        allowsManualInput,
    };
}

/**
 * Some spec column names don't exactly match the CSV headers; this
 * function normalizes them.
 */
export function normalizeIntelColumn(column: string): string {
    const trimmed = column.trim();
    switch (trimmed) {
        case " Prisoners":
            return "Prisoners";
        case "T-credits":
        case "T-Credits":
            return "T-Credits";
        default:
            return trimmed;
    }
}

// Shape of a row from your Utopia Intel Site CSV.
// If you already have a type for that, you can swap this out.
export type IntelRow = Record<string, any>;

// Manual overrides keyed by SnapshotField.key
export type ManualOverrides = Record<string, string | number | null>;

/**
 * Get the best-available value for a field:
 *   1. If there's a manual override, use that.
 *   2. Otherwise, if the field is wired to an intel column and we have a row, use that.
 *   3. Derived fields are intentionally left for a separate derived-calculation layer.
 */
export function getBaseFieldValue(
    field: SnapshotField,
    intelRow: IntelRow | null,
    manualOverrides: ManualOverrides
): any {
    const parsed = parseFieldSource(field.rawSource);
    const override = manualOverrides[field.key];

    if (override !== undefined && override !== null && override !== "") {
        return override;
    }

    if (parsed.intelColumns.length > 0 && intelRow) {
        // for now, just use the first intel column; more complex cases (like spells)
        // can be handled in a custom derived layer.
        const col = normalizeIntelColumn(parsed.intelColumns[0]);
        return (intelRow as any)[col];
    }

    // nothing available yet
    return null;
}

/**
 * Convenience: filter any SnapshotField list down to only those
 * that allow manual input, optionally for a single section.
 */
export function getManualInputFields(
    fields: SnapshotField[],
    section?: ProvinceSectionId
): SnapshotField[] {
    return fields.filter((field) => {
        const { allowsManualInput } = parseFieldSource(field.rawSource);
        if (!allowsManualInput) return false;
        if (section && field.section !== section) return false;
        return true;
    });
}
