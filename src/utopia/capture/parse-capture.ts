import type { Province } from "../types";
import type { IntelCapture } from "./types";
import { mergeCaptureIntoProvince } from "./merge-capture";
import { parseThroneCapture } from "./parsers/parse-throne";

export function parseCaptureJson(text: string): IntelCapture {
    return JSON.parse(text) as IntelCapture;
}

export function applyCaptureToProvince(
    province: Province,
    capture: IntelCapture
): Province {
    if (capture.url.includes("/wol/game/throne")) {
        return mergeCaptureIntoProvince(province, parseThroneCapture(capture));
    }

    return province;
}

export function applyCapturesToProvince(
    province: Province,
    captures: IntelCapture[]
): Province {
    return captures.reduce(applyCaptureToProvince, province);
}