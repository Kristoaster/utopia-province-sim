import type { ReactNode } from "react";
import type { SnapshotMetricCell } from "./snapshotDisplay";

type SnapshotMetricProps = {
    label: string;
    baseline: SnapshotMetricCell;
    current: SnapshotMetricCell;
    editor?: ReactNode;
    formatDelta?: (delta: number) => string;
    showPercentDelta?: boolean;
};

export function SnapshotMetric({
                                   label,
                                   baseline,
                                   current,
                                   editor,
                                   formatDelta,
                                   showPercentDelta = true,
                               }: SnapshotMetricProps) {
    const baselineNumeric = baseline.numeric;
    const currentNumeric = current.numeric;

    const hasBothNumbers =
        baselineNumeric !== null && currentNumeric !== null;

    let deltaContent: ReactNode = null;
    let currentClassName = "snapshot-metric-value";

    if (hasBothNumbers) {
        const diff = currentNumeric - baselineNumeric;

        if (Math.abs(diff) > 1e-6) {
            const isPositive = diff > 0;
            const deltaText = formatDelta ? formatDelta(diff) : diff.toFixed(2);

            const pct =
                baselineNumeric !== 0
                    ? ((diff / baselineNumeric) * 100).toFixed(1)
                    : null;

            currentClassName += isPositive ? " value-good" : " value-bad";

            deltaContent = (
                <div className="snapshot-metric-delta-inner">
                    <span className={isPositive ? "value-good" : "value-bad"}>
                        {isPositive ? "+" : ""}
                        {deltaText}
                    </span>
                    {showPercentDelta && pct !== null && (
                        <span className="snapshot-metric-delta-percent">
                            ({Number(pct) > 0 ? "+" : ""}
                            {pct}%)
                        </span>
                    )}
                </div>
            );
        }
    }

    return (
        <tr>
            <td className="snapshot-metric-label">{label}</td>

            <td className="snapshot-metric-value baseline">
                <div className="snapshot-cell-stack">
                    <div>{baseline.primary}</div>
                    {baseline.secondary && (
                        <div className="snapshot-subvalue">{baseline.secondary}</div>
                    )}
                </div>
            </td>

            <td className={currentClassName}>
                <div className="snapshot-cell-stack">
                    <div>{current.primary}</div>
                    {current.secondary && (
                        <div className="snapshot-subvalue">{current.secondary}</div>
                    )}
                </div>
            </td>

            <td className="snapshot-metric-edit">{editor ?? "—"}</td>
            <td className="snapshot-metric-delta">{deltaContent}</td>
        </tr>
    );
}