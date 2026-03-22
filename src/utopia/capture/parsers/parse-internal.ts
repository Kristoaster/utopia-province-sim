import { BUILDING_LIST } from "../../data/buildings";
import type { BuildingId } from "../../types";
import type { IntelCapture, PartialProvinceUpdate } from "../types";

function textOf(el: Element | null | undefined): string {
    return el?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function parseIntLoose(value: string): number {
    const cleaned = value.replace(/[^0-9-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
}

function parsePercentLoose(value: string): number {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
}

function normalizeLabel(value: string): string {
    return value
        .replace(/[’']/g, "'")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

const buildingNameToId = new Map<string, BuildingId>(
    BUILDING_LIST.map((building) => [
        normalizeLabel(building.display),
        building.id,
    ])
);

export function parseInternalCapture(
    capture: IntelCapture
): PartialProvinceUpdate {
    const doc = new DOMParser().parseFromString(capture.data_html, "text/html");

    const statsTable = doc.querySelector("table.two-column-stats");
    const statRows = Array.from(statsTable?.querySelectorAll("tr") ?? []);

    const stats: Record<string, string> = {};

    for (const row of statRows) {
        const ths = Array.from(row.querySelectorAll("th"));
        const tds = Array.from(row.querySelectorAll("td"));

        if (ths.length >= 2 && tds.length >= 2) {
            stats[textOf(ths[0])] = textOf(tds[0]);
            stats[textOf(ths[1])] = textOf(tds[1]);
        }
    }

    const effectsTable = doc.querySelector("#council-internal-build-effects");
    const buildingRows = Array.from(
        effectsTable?.querySelectorAll("tbody tr") ?? []
    );

    const buildings: Partial<Record<BuildingId, number>> = {};
    let barrenAcres = 0;

    for (const row of buildingRows) {
        const header = textOf(row.querySelector("th"));
        const cells = Array.from(row.querySelectorAll("td"));

        if (cells.length < 1) continue;

        const quantity = parseIntLoose(textOf(cells[0]));
        const normalized = normalizeLabel(header);

        if (normalized === "barren land") {
            barrenAcres = quantity;
            continue;
        }

        const id = buildingNameToId.get(normalized);
        if (!id) continue;

        buildings[id] = quantity;
    }

    const builtAcres = Object.values(buildings).reduce(
        (sum, count) => sum + (count ?? 0),
        0
    );

    const bePercent = parsePercentLoose(stats["Building Efficiency"] || "0");

    return {
        buildings,
        builtAcres,
        barrenAcres,
        buildingEfficiencyReported: bePercent || undefined,
        availableWorkers: parseIntLoose(stats["Available Workers"] || "0"),
        availableJobs: parseIntLoose(stats["Available Jobs"] || "0"),
        workersNeededForMaxBE: parseIntLoose(
            stats["Workers Needed for Max. Efficiency"] || "0"
        ),
        rawIntel: {
            BE: bePercent ? `${bePercent}%` : "",
            internalCaptureUrl: capture.url,
            internalCaptureReceivedAt: capture.receivedAt,
        },
    };
}