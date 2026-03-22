import type { Province } from "../types";
import type { PartialProvinceUpdate } from "./types";

export function mergeCaptureIntoProvince(
    base: Province,
    update: PartialProvinceUpdate
): Province {
    return {
        ...base,
        ...update,
        rawIntel: {
            ...(base.rawIntel ?? {}),
            ...(update.rawIntel ?? {}),
        },
    };
}