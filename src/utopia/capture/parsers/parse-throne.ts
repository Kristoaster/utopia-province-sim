import type { IntelCapture, PartialProvinceUpdate } from "../types";

function textOf(el: Element | null | undefined): string {
    return el?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function parseIntLoose(value: string): number {
    const cleaned = value.replace(/[^0-9-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
}

function extractProvinceNameAndLocation(heading: string): {
    name?: string;
    location?: string;
} {
    const match = heading.match(/The Province of (.+?) \((\d+:\d+)\)/i);
    if (!match) return {};
    return {
        name: match[1].trim(),
        location: match[2].trim(),
    };
}

export function parseThroneCapture(capture: IntelCapture): PartialProvinceUpdate {
    const doc = new DOMParser().parseFromString(capture.data_html, "text/html");

    const heading = textOf(doc.querySelector("h2"));
    const provinceInfo = extractProvinceNameAndLocation(heading);

    const table = doc.querySelector("table.two-column-stats");
    const rows = Array.from(table?.querySelectorAll("tr") ?? []);

    const values: Record<string, string> = {};

    for (const row of rows) {
        const ths = Array.from(row.querySelectorAll("th"));
        const tds = Array.from(row.querySelectorAll("td"));

        if (ths.length >= 2 && tds.length >= 2) {
            values[textOf(ths[0])] = textOf(tds[0]);
            values[textOf(ths[1])] = textOf(tds[1]);
        }
    }

    const spellText = textOf(
        Array.from(doc.querySelectorAll("h2"))
            .find((el) => textOf(el) === "Info")
            ?.nextElementSibling
    );

    const activeSpells = Array.from(
        spellText.matchAll(/([A-Za-z' ]+)\s*\(\s*(\d+\s+days|-)\s*\)/g)
    ).map((m) => m[1].trim());

    return {
        ...provinceInfo,
        rulerName: values["Ruler"] || undefined,
        acres: parseIntLoose(values["Land"] || "0"),
        peasants: parseIntLoose(values["Peasants"] || "0"),
        soldiers: parseIntLoose(values["Soldiers"] || "0"),
        thieves: parseIntLoose(values["Thieves"] || "0"),
        wizards: parseIntLoose(values["Wizards"] || "0"),
        gold: parseIntLoose(values["Money"] || "0"),
        food: parseIntLoose(values["Food"] || "0"),
        runes: parseIntLoose(values["Runes"] || "0"),
        horses: parseIntLoose(values["War Horses"] || "0"),
        prisoners: parseIntLoose(values["Prisoners"] || "0"),
        networth: parseIntLoose(values["Networth"] || "0"),
        tradeBalance: parseIntLoose(values["Trade Balance"] || "0"),
        rawIntel: {
            captureUrl: capture.url,
            captureReceivedAt: capture.receivedAt,
        },
    };
}