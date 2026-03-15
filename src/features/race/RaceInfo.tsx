import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getRace } from "../../utopia/current/races";
import type { Race } from "../../utopia/current/races";
import type { RaceId } from "../../utopia/types";

type RaceInfoProps = {
    raceId: RaceId;
};

type PopoverPosition = {
    top: number;
    left: number;
};

const MOD_LABELS: Partial<Record<keyof Race["mods"], string>> = {
    income: "Income",
    be: "Building efficiency",
    pop: "Population",
    birthRate: "Birth rate",
    foodConsumption: "Food consumption",
    wpa: "WPA",
    tpa: "TPA",
    runeProduction: "Rune production",
    runeCost: "Rune cost",
    attackTime: "Attack time",
    militaryCasualties: "Military casualties",
    draftCost: "Draft cost",
    trainingCost: "Training cost",
    trainingTime: "Training time",
    bookProduction: "Book production",
    thieveryEffectiveness: "Thievery effectiveness",
    horseOffenseBonus: "Horse offense bonus",
    mercCost: "Mercenary cost",
    exploreCost: "Explore cost",
    buildCost: "Build cost",
    gains: "Gains",
    gainsWar: "War gains",
    ome: "OME",
    dme: "DME",
    wages: "Wages",
    thiefCost: "Thief cost",
    spellDamage: "Spell damage",
    buildingCreditsGain: "Building credits gain",
    scienceEff: "Science effectiveness",
    stealthRecovery: "Stealth recovery",
    manaRecovery: "Mana recovery",
    offensiveSpellDuration: "Offensive spell duration",
    selfSpellDuration: "Self spell duration",
    prisonerCapacityPerAcre: "Prisoner capacity",
    libraryEffectiveness: "Library effectiveness",
};

const RESTRICTION_LABELS: Partial<Record<keyof Race["restrictions"], string>> = {
    noBarracks: "Cannot build Barracks",
    noStables: "Cannot build Stables",
    noWarHorses: "Cannot use war horses",
    noTrainingGrounds: "Cannot build Training Grounds",
    noDungeons: "Cannot build Dungeons",
    onlyThieveryIntel: "Only thievery intel available",
    cannotAmbush: "Cannot Ambush",
    cannotAccelerateConstruction: "Cannot accelerate construction",
};

function formatPercent(value: number): string {
    const pct = value * 100;
    return `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`;
}

function formatMod(key: keyof Race["mods"], value: number): string {
    switch (key) {
        case "foodConsumption":
            return value === -1 ? "No food required" : formatPercent(value);
        case "horseOffenseBonus":
            return `${value > 0 ? "+" : ""}${value} offense / horse`;
        case "stealthRecovery":
        case "manaRecovery":
            return `${value > 0 ? "+" : ""}${value} / tick`;
        case "prisonerCapacityPerAcre":
            return `${value > 0 ? "+" : ""}${value} / acre`;
        default:
            return formatPercent(value);
    }
}

export function RaceInfo({ raceId }: RaceInfoProps) {
    const race = getRace(raceId);

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<PopoverPosition>({
        top: 0,
        left: 0,
    });

    const mods = useMemo(() => {
        if (!race) return [];
        return Object.entries(race.mods)
            .filter(([, value]) => value != null && value !== 0)
            .map(([key, value]) => ({
                key: key as keyof Race["mods"],
                label: MOD_LABELS[key as keyof Race["mods"]] ?? key,
                value: formatMod(key as keyof Race["mods"], value as number),
            }));
    }, [race]);

    const restrictions = useMemo(() => {
        if (!race) return [];
        return Object.entries(race.restrictions)
            .filter(([, enabled]) => Boolean(enabled))
            .map(([key]) => RESTRICTION_LABELS[key as keyof Race["restrictions"]] ?? key);
    }, [race]);

    const updatePosition = useCallback(() => {
        const trigger = triggerRef.current;
        const popover = popoverRef.current;

        if (!trigger || !popover) return;

        const triggerRect = trigger.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();

        const gap = 8;
        const padding = 8;

        let top = triggerRect.bottom + gap;
        let left = triggerRect.right - popoverRect.width;

        if (top + popoverRect.height > window.innerHeight - padding) {
            const aboveTop = triggerRect.top - gap - popoverRect.height;
            if (aboveTop >= padding) {
                top = aboveTop;
            } else {
                top = Math.max(
                    padding,
                    window.innerHeight - popoverRect.height - padding
                );
            }
        }

        if (left < padding) {
            left = padding;
        }

        if (left + popoverRect.width > window.innerWidth - padding) {
            left = window.innerWidth - popoverRect.width - padding;
        }

        setPosition({
            top: Math.max(padding, top),
            left: Math.max(padding, left),
        });
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
    }, [open, raceId, updatePosition]);

    useEffect(() => {
        if (!open) return;

        const handleResize = () => updatePosition();
        const handleScroll = () => updatePosition();

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) return;

            if (triggerRef.current?.contains(target)) return;
            if (popoverRef.current?.contains(target)) return;

            setOpen(false);
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleScroll, true);
        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleScroll, true);
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open, updatePosition]);

    if (!race) return null;

    return (
        <span
            className="entity-info"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                ref={triggerRef}
                type="button"
                className="entity-info-trigger"
                aria-label={`Show info for ${race.display}`}
                title={`Show info for ${race.display}`}
                onClick={() => setOpen((prev) => !prev)}
            >
                ?
            </button>

            {open && (
                <div
                    ref={popoverRef}
                    className="entity-info-popover"
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                    }}
                >
                    <div className="entity-info-title">{race.display}</div>

                    <div className="entity-info-section">
                        <div className="entity-info-section-label">Unique ability</div>
                        <div>{race.uniqueAbility}</div>
                    </div>

                    {mods.length > 0 && (
                        <div className="entity-info-section">
                            <div className="entity-info-section-label">Modifiers</div>
                            <ul className="entity-info-list">
                                {mods.map((mod) => (
                                    <li key={String(mod.key)}>
                                        <strong>{mod.label}:</strong> {mod.value}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {restrictions.length > 0 && (
                        <div className="entity-info-section">
                            <div className="entity-info-section-label">Restrictions</div>
                            <ul className="entity-info-list">
                                {restrictions.map((restriction) => (
                                    <li key={restriction}>{restriction}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="entity-info-section">
                        <div className="entity-info-section-label">Units</div>
                        <table className="buildings-table snapshot-metrics-table entity-info-table">
                            <thead>
                            <tr>
                                <th>Unit</th>
                                <th>Off</th>
                                <th>Def</th>
                                <th>Cost</th>
                                <th>NW</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td>Soldier</td>
                                <td>{race.units.soldier.off}</td>
                                <td>{race.units.soldier.def}</td>
                                <td>—</td>
                                <td>—</td>
                            </tr>
                            <tr>
                                <td>Off spec</td>
                                <td>{race.units.offSpec.off}</td>
                                <td>{race.units.offSpec.def}</td>
                                <td>{race.units.offSpec.cost ?? "—"}</td>
                                <td>{race.units.offSpec.nw ?? "—"}</td>
                            </tr>
                            <tr>
                                <td>Def spec</td>
                                <td>{race.units.defSpec.off}</td>
                                <td>{race.units.defSpec.def}</td>
                                <td>{race.units.defSpec.cost ?? "—"}</td>
                                <td>{race.units.defSpec.nw ?? "—"}</td>
                            </tr>
                            <tr>
                                <td>Elite</td>
                                <td>{race.units.elite.off}</td>
                                <td>{race.units.elite.def}</td>
                                <td>{race.units.elite.cost}</td>
                                <td>{race.units.elite.nw}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    {race.spellbook.length > 0 && (
                        <div className="entity-info-section">
                            <div className="entity-info-section-label">Spellbook</div>
                            <div>{race.spellbook.join(", ")}</div>
                        </div>
                    )}

                    {race.notes && race.notes.length > 0 && (
                        <div className="entity-info-section">
                            <div className="entity-info-section-label">Notes</div>
                            <ul className="entity-info-list">
                                {race.notes.map((note) => (
                                    <li key={note}>{note}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </span>
    );
}