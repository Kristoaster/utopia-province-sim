import type { Province } from "../../utopia/types";
import { calculateBE } from "../../utopia/calc/be";

export type SnapshotValueMode = "export-only" | "dual" | "calc-only";

export interface SnapshotResolvedValue {
    mode: SnapshotValueMode;
    exportDisplay: string | null;
    exportNumeric: number | null;
    calcDisplay: string | null;
    calcNumeric: number | null;
    preferredNumeric: number | null;
}

const INTEL_HEADER_ALIASES: Record<string, string[]> = {
    NWpa: ["NWpa", "Nwpa"],
    GCpa: ["GCpa", "Gcpa"],
    "Kd #": ["Kd #", "Kd#"],
    Prisoners: ["Prisoners", " Prisoners"],
};

function getIntelRaw(prov: Province, header: string): string | null {
    const headers = INTEL_HEADER_ALIASES[header] ?? [header];

    for (const h of headers) {
        const value = prov.rawIntel?.[h];
        if (value != null && String(value).trim() !== "") {
            return String(value).trim();
        }
    }

    return null;
}

function getIntelNumber(prov: Province, header: string): number | null {
    const raw = getIntelRaw(prov, header);
    if (raw == null) return null;

    const cleaned = raw.replace(/[,%'"]/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}

function safeDiv(a: number, b: number): number | null {
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return null;
    return a / b;
}

function resolveDualValue(params: {
    prov: Province;
    exportHeader: string;
    calcNumeric: number | null;
    formatCalc: (value: number) => string;
}): SnapshotResolvedValue {
    const exportDisplay = getIntelRaw(params.prov, params.exportHeader);
    const exportNumeric = getIntelNumber(params.prov, params.exportHeader);

    return {
        mode:
            exportDisplay != null && params.calcNumeric != null
                ? "dual"
                : exportDisplay != null
                    ? "export-only"
                    : "calc-only",
        exportDisplay,
        exportNumeric,
        calcDisplay:
            params.calcNumeric != null ? params.formatCalc(params.calcNumeric) : null,
        calcNumeric: params.calcNumeric,
        preferredNumeric: params.calcNumeric ?? exportNumeric,
    };
}

export function resolveNwpa(prov: Province): SnapshotResolvedValue {
    return resolveDualValue({
        prov,
        exportHeader: "NWpa",
        calcNumeric: safeDiv(prov.networth, prov.acres),
        formatCalc: (v) => v.toFixed(4),
    });
}

export function resolveRawTpa(prov: Province): SnapshotResolvedValue {
    return resolveDualValue({
        prov,
        exportHeader: "rTPA",
        calcNumeric: safeDiv(prov.thieves, prov.acres),
        formatCalc: (v) => v.toFixed(4),
    });
}

export function resolveRawWpa(prov: Province): SnapshotResolvedValue {
    return resolveDualValue({
        prov,
        exportHeader: "rWPA",
        calcNumeric: safeDiv(prov.wizards, prov.acres),
        formatCalc: (v) => v.toFixed(4),
    });
}

export interface SnapshotMetricCell {
    primary: string;
    secondary?: string | null;
    numeric: number | null;
}

export function toMetricCell(
    value: SnapshotResolvedValue,
    fallback = "—"
): SnapshotMetricCell {
    if (value.mode === "dual") {
        return {
            primary: value.exportDisplay ?? fallback,
            secondary: value.calcDisplay ? `calc: ${value.calcDisplay}` : null,
            numeric: value.preferredNumeric,
        };
    }

    if (value.mode === "calc-only") {
        return {
            primary: value.calcDisplay ?? fallback,
            numeric: value.preferredNumeric,
        };
    }

    return {
        primary: value.exportDisplay ?? fallback,
        numeric: value.preferredNumeric,
    };
}

export function simpleMetricCell(
    value: number | null,
    format: (n: number) => string
): SnapshotMetricCell {
    return {
        primary: value == null ? "—" : format(value),
        numeric: value,
    };
}

export function resolveBuildingEfficiency(prov: Province): SnapshotMetricCell {
    const result = calculateBE(prov);

    const secondaryParts: string[] = [];

    if (result.source === "override") {
        if (result.exportBe != null) {
            secondaryParts.push(`export: ${(result.exportBe * 100).toFixed(1)}%`);
        }
        secondaryParts.push(`calc: ${(result.targetBe * 100).toFixed(2)}%`);
    } else if (result.source === "export") {
        secondaryParts.push(`calc: ${(result.targetBe * 100).toFixed(2)}%`);
    }

    return {
        primary: `${(result.be * 100).toFixed(result.source === "export" ? 1 : 2)}%`,
        secondary: secondaryParts.length > 0 ? secondaryParts.join(" • ") : null,
        numeric: result.be * 100,
    };
}