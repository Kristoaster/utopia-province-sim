import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ProvinceSpell } from "../../utopia/types";
import { getActiveSpells, getSpellEffect } from "../../utopia/data/spells";

type SpellInfoProps = {
    spells: ProvinceSpell[];
};

type PopoverPosition = {
    top: number;
    left: number;
};

export function SpellInfo({ spells }: SpellInfoProps) {
    const activeSpells = useMemo(() => getActiveSpells(spells), [spells]);

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<PopoverPosition>({ top: 0, left: 0 });

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
            top = aboveTop >= padding
                ? aboveTop
                : Math.max(padding, window.innerHeight - popoverRect.height - padding);
        }

        if (left < padding) left = padding;
        if (left + popoverRect.width > window.innerWidth - padding) {
            left = window.innerWidth - popoverRect.width - padding;
        }

        setPosition({ top: Math.max(padding, top), left: Math.max(padding, left) });
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        updatePosition();
    }, [open, spells, updatePosition]);

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
            if (event.key === "Escape") setOpen(false);
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
                aria-label="Show active spell effects"
                title="Show active spell effects"
                disabled={activeSpells.length === 0}
                onClick={() => setOpen((prev) => !prev)}
            >
                ?
            </button>

            {open && activeSpells.length > 0 && (
                <div
                    ref={popoverRef}
                    className="entity-info-popover"
                    style={{ top: `${position.top}px`, left: `${position.left}px` }}
                >
                    <div className="entity-info-title">Active Spells</div>

                    <div className="entity-info-section">
                        <ul className="entity-info-list">
                            {activeSpells.map((spell) => (
                                <li key={`${spell.name}-${spell.source}`}>
                                    <strong>{spell.name}</strong>{" "}
                                    <span className={`spell-source-badge ${spell.source}`}>
                                        {spell.source === "good" ? "Good" : "Bad"}
                                    </span>
                                    <div className="spell-effect-line">
                                        {getSpellEffect(spell.name) ?? "Effect not yet mapped in local spell data."}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </span>
    );
}