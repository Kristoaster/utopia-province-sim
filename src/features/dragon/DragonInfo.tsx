import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getDragon } from "../../utopia/data/dragons";
import type { DragonId } from "../../utopia/types";

type DragonInfoProps = {
    dragonId: DragonId;
};

type PopoverPosition = {
    top: number;
    left: number;
};

export function DragonInfo({ dragonId }: DragonInfoProps) {
    const dragon = getDragon(dragonId);

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
    }, [open, dragonId, updatePosition]);

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

    if (!dragon) return null;

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
                aria-label={`Show info for ${dragon.display} Dragon`}
                title={`Show info for ${dragon.display} Dragon`}
                onClick={() => setOpen((prev) => !prev)}
            >
                ?
            </button>

            {open && (
                <div
                    ref={popoverRef}
                    className="entity-info-popover"
                    style={{ top: `${position.top}px`, left: `${position.left}px` }}
                >
                    <div className="entity-info-title">{dragon.display} Dragon</div>

                    <div className="entity-info-section">
                        <div className="entity-info-section-label">Effects</div>
                        <ul className="entity-info-list">
                            {dragon.effects.map((effect) => (
                                <li key={effect}>{effect}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </span>
    );
}