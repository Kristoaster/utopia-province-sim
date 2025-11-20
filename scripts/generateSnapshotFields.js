// scripts/generateSnapshotFields.js
// Run with: node scripts/generateSnapshotFields.js

import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TODO: adjust this to wherever your Excel spec lives in the repo
const workbookPath = path.join(
    __dirname,
    "..",
    "Province snapshot info.xlsx"
);

// Where to write the generated TS file
const outputPath = path.join(
    __dirname,
    "..",
    "src",
    "features",
    "snapshot",
    "snapshotFields.generated.ts"
);

// Map Excel section headers -> section IDs we defined in snapshotModel.ts
const sectionMap = {
    Throne: "throne",
    State: "state",
    Population: "population",
    Economy: "economy",
    "Net Changes": "netChanges",
    Military: "military",
    "Buildings / Growth": "buildingsGrowth",
    Science: "science",
};

/**
 * Turn a "Data" label into a reasonably nice camelCase key.
 * Examples:
 *   "Province Name" -> "provinceName"
 *   "Thieves' Dens % of total land" -> "thievesDensPercentOfTotalLand"
 */
function makeKey(label) {
    let text = label.trim();
    text = text.replace(/%/g, " Percent ");
    text = text.replace(/'/g, "");
    text = text.replace(/\//g, " ");

    const parts = text.split(/[^A-Za-z0-9]+/).filter(Boolean);
    if (!parts.length) return "field";

    return (
        parts[0].toLowerCase() +
        parts
            .slice(1)
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join("")
    );
}

function main() {
    if (!fs.existsSync(workbookPath)) {
        console.error("Could not find Excel file at:", workbookPath);
        console.error(
            "Make sure 'Province snapshot info.xlsx' is in the project root."
        );
        process.exit(1);
    }

    const workbook = XLSX.readFile(workbookPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    let currentSection = null;
    const fields = [];

    for (const row of rows) {
        const data = String(row["Data"] || "").trim();
        const source = String(row["Source"] || "").trim();

        if (!data) continue;

        // If Source is blank, and Data matches a section header, update current section
        if (!source) {
            const maybeSection = sectionMap[data];
            if (maybeSection) {
                currentSection = maybeSection;
            }
            continue;
        }

        if (!currentSection) {
            // row before any section header; just skip
            continue;
        }

        const key = makeKey(data);
        const cleanedSource = source.replace(/\s+/g, " ").trim();

        fields.push({
            key,
            label: data,
            section: currentSection,
            rawSource: cleanedSource,
        });
    }

    const header =
        "// AUTO-GENERATED from Province snapshot info.xlsx. Do not edit by hand.\n" +
        "// Run: node scripts/generateSnapshotFields.js\n\n" +
        "import type { SnapshotField } from './snapshotModel';\n\n" +
        "export const SNAPSHOT_FIELDS: SnapshotField[] = [\n";

    const body = fields
        .map((f) => {
            return (
                "  {\n" +
                `    key: ${JSON.stringify(f.key)},\n` +
                `    label: ${JSON.stringify(f.label)},\n` +
                `    section: ${JSON.stringify(f.section)},\n` +
                `    rawSource: ${JSON.stringify(f.rawSource)},\n` +
                "  },"
            );
        })
        .join("\n");

    const footer = "\n];\n";

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, header + body + footer, "utf8");

    console.log(
        `Wrote ${outputPath} with ${fields.length} fields across all sections.`
    );
}

main();
