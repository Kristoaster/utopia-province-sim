import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getPersonality } from "../../utopia/current/personalities";
import type { Personality } from "../../utopia/current/personalities";
import type { PersonalityId } from "../../utopia/types";

type PersonalityInfoProps = {
    personalityId: PersonalityId;
};

type PopoverPosition = {
    top: number;
    left: number;
};

const MOD_LABELS: Partial<Record<keyof Personality["mods"], string>> = {
    buildingCapacity: "Building capacity",
    buildingProduction: "Building production",
    buildingCreditsGain: "Building credits gain",
    espionageSuccess: "Espionage success",
    espionageStealthCost: "Espionage stealth cost",
    econSciEff: "Economic science effectiveness",
    eliteDefBonus: "Elite defense bonus",
    defSpecDefBonus: "Def spec defense bonus",
    selfSpellManaCost: "Self-spell mana cost",
    hospitalEff: "Hospital effectiveness",
    wizardProduction: "Wizard production",
    thiefLosses: "Thief losses",
    spellDamage: "Spell damage",
    sabotageDamage: "Sabotage damage",
    arcaneSciEff: "Arcane science effectiveness",
    guildEff: "Guild effectiveness",
    channelingSciEff: "Channeling science effectiveness",
    tdEff: "Thieves' Dens effectiveness",
    crimeSciEff: "Crime science effectiveness",
    stealthRecovery: "Stealth recovery",
    attackTime: "Attack time",
    siegeSciEff: "Siege science effectiveness",
    ome: "OME",
    mercStrength: "Mercenary strength",
    mercCost: "Mercenary cost",
    tacticsSciEff: "Tactics science effectiveness",
    valorSciEff: "Valor science effectiveness",
    wpa: "WPA",
    resilienceSciEff: "Resilience science effectiveness",
    trainingTime: "Training time",
    specCreditsGain: "Spec credits gain",
};

const STARTING_LABELS: Partial<Record<keyof Personality["starting"], string>> = {
    soldiers: "Soldiers",
    specCredits: "Spec credits",
    buildingCredits: "Building credits",
    wizards: "Wizards",
    thieves: "Thieves",
};

function formatPercent(value: number): string {
    const pct = value * 100;
    return `${pct > 0 ? "+" : ""}${pct.toFixed(0)}%`;
}

function formatSignedNumber(value: number, suffix = ""): string {
    return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

function formatMod(key: keyof Personality["mods"], value: number): string {
    switch (key) {
        case "eliteDefBonus":
        case "defSpecDefBonus":
            return formatSignedNumber(value);

        case "selfSpellManaCost":
            return formatSignedNumber(value, " mana");

        case "stealthRecovery":
            return `${value > 0 ? "+" : ""}${value} / tick`;

        case "mercStrength":
            return formatSignedNumber(value);

        default:
            return formatPercent(value);
    }
}

export function PersonalityInfo({ personalityId }: PersonalityInfoProps) {
    const personality = getPersonality(personalityId);

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<PopoverPosition>({
        top: 0,
        left: 0,
    });

    const mods = useMemo(() => {
        if (!personality) return [];

        return Object.entries(personality.mods)
            .filter(([, value]) => value != null && value !== 0)
            .map(([key, value]) => ({
                key: key as keyof Personality["mods"],
                label: MOD_LABELS[key as keyof Personality["mods"]] ?? key,
                value: formatMod(key as keyof Personality["mods"], value as number),
            }));
    }, [personality]);

    const starting = useMemo(() => {
        if (!personality) return [];

        return Object.entries(personality.starting)
            .filter(([, value]) => value != null && value !== 0)
            .map(([key, value]) => ({
                key: key as keyof Personality["starting"],
                label: STARTING_LABELS[key as keyof Personality["starting"]] ?? key,
                value: (value as number).toLocaleString(),
            }));
    }, [personality]);

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
    }, [open, personalityId, updatePosition]);

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

    if (!personality) return null;

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
                aria-label={`Show info for ${personality.display}`}
                title={`Show info for ${personality.display}`}
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
                    <div className="entity-info-title">{personality.display}</div>

                    <div className="entity-info-section">
                        <div className="entity-info-section-label">Unique ability</div>
                        <div>{personality.uniqueAbility}</div>
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

                    {starting.length > 0 && (
                        <div className="entity-info-section">
                            <div className="entity-info-section-label">Starting bonuses</div>
                            <ul className="entity-info-list">
                                {starting.map((entry) => (
                                    <li key={String(entry.key)}>
                                        <strong>{entry.label}:</strong> {entry.value}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {personality.spellbook.length > 0 && (
                        <div className="entity-info-section">
                            <div className="entity-info-section-label">Spellbook</div>
                            <ul className="entity-info-list">
                                {personality.spellbook.map((spell) => (
                                    <li key={spell}>{spell}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {personality.notes && personality.notes.length > 0 && (
                        <div className="entity-info-section">
                            <div className="entity-info-section-label">Notes</div>
                            <ul className="entity-info-list">
                                {personality.notes.map((note) => (
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