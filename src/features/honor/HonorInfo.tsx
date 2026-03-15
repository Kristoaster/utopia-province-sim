import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    getHonorRank,
    formatHonorRange,
} from "../../utopia/data/honor";

type HonorInfoProps = {
    honorLevel: number;
};

type HonorPopoverPosition = {
    top: number;
    left: number;
};

export function HonorInfo({ honorLevel }: HonorInfoProps) {
    const rank = getHonorRank(honorLevel);

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<HonorPopoverPosition>({
        top: 0,
        left: 0,
    });

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
    }, [open, honorLevel, updatePosition]);

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

    return (
        <span
            className="honor-info"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                ref={triggerRef}
                type="button"
                className="honor-info-trigger"
                aria-label={`Show bonuses for ${rank.rank}`}
                title={`Show bonuses for ${rank.rank}`}
                onClick={() => setOpen((prev) => !prev)}
            >
                ?
            </button>

            {open && (
                <div
                    ref={popoverRef}
                    className="honor-info-popover"
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                    }}
                >
                    <table className="buildings-table snapshot-metrics-table">
                        <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Honor Range</th>
                            <th>Population mod</th>
                            <th>OME mod</th>
                            <th>Income mod</th>
                            <th>Food mod</th>
                            <th>Rune mod</th>
                            <th>WPA mod</th>
                            <th>TPA mod</th>
                            <th>Votes</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{rank.rank}</td>
                            <td>{formatHonorRange(rank)}</td>
                            <td>{rank.populationMod.toFixed(2)}</td>
                            <td>{rank.omeMod.toFixed(2)}</td>
                            <td>{rank.incomeMod.toFixed(2)}</td>
                            <td>{rank.foodMod.toFixed(2)}</td>
                            <td>{rank.runeMod.toFixed(2)}</td>
                            <td>{rank.wpaMod.toFixed(2)}</td>
                            <td>{rank.tpaMod.toFixed(2)}</td>
                            <td>{rank.votes}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </span>
    );
}