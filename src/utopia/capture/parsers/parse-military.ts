import type { PartialProvinceUpdate, IntelCapture } from "../types";

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

export function parseMilitaryCapture(
    capture: IntelCapture
): PartialProvinceUpdate {
    const doc = new DOMParser().parseFromString(capture.data_html, "text/html");

    const paragraphs = Array.from(doc.querySelectorAll("p")).map(textOf);
    const wageSummary =
        paragraphs.find((p) => p.includes("Our wage rate is")) ?? "";

    const wageMatch = wageSummary.match(
        /approximately\s+([\d.]+)%.*?wage rate is\s+([\d.]+)%.*?functioning at\s+([\d.]+)%/i
    );

    const twoColTable = doc.querySelector("table.two-column-stats");
    const rows = Array.from(twoColTable?.querySelectorAll("tr") ?? []);

    const values: Record<string, string> = {};

    for (const row of rows) {
        const ths = Array.from(row.querySelectorAll("th"));
        const tds = Array.from(row.querySelectorAll("td"));

        if (ths.length >= 2 && tds.length >= 2) {
            values[textOf(ths[0])] = textOf(tds[0]);
            values[textOf(ths[1])] = textOf(tds[1]);
        }
    }

    const armyTable = Array.from(doc.querySelectorAll("table.data")).find(
        (table) => textOf(table).includes("Standing Army")
    );

    let standingGenerals = 0;
    if (armyTable) {
        const generalRow = Array.from(armyTable.querySelectorAll("tr")).find(
            (row) => textOf(row.querySelector("th")) === "Generals"
        );

        if (generalRow) {
            const firstValueCell = generalRow.querySelector("td");
            standingGenerals = parseIntLoose(textOf(firstValueCell));
        }
    }

    const wagePercent = wageMatch ? Number(wageMatch[2]) : 0;
    const militaryEfficiency = wageMatch ? Number(wageMatch[3]) : 0;

    return {
        generals: standingGenerals || undefined,
        availableGenerals: standingGenerals || undefined,
        wageRate: wagePercent ? wagePercent / 100 : undefined,
        intelWagePercent: wagePercent || undefined,
        militaryEfficiency: militaryEfficiency || undefined,
        offenseEfficiency: parsePercentLoose(
            values["Offensive Military Effectiveness"] || "0"
        ),
        defenseEfficiency: parsePercentLoose(
            values["Defensive Military Effectiveness"] || "0"
        ),
        intelOffenseHome: parseIntLoose(
            values["Net Offensive Points at Home"] || "0"
        ),
        intelDefenseHome: parseIntLoose(
            values["Net Defensive Points at Home"] || "0"
        ),
        rawIntel: {
            militaryCaptureUrl: capture.url,
            militaryCaptureReceivedAt: capture.receivedAt,
            militaryAllocatedPct: wageMatch?.[1] ?? "",
        },
    };
}