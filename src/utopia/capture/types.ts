import type { Province } from "../types";

export interface IntelCapture {
    receivedAt: string;
    url: string;
    prov: string;
    key?: string;
    data_simple: string;
    data_html: string;
}

export type PartialProvinceUpdate = Partial<Province>;