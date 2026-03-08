import type { Province } from "../../utopia/types";
import type { SnapshotResolvedValue } from "./snapshotDisplay";
import {
    resolveNwpa,
    resolvePpa,
    resolveGcpa,
    resolveRawTpa,
    resolveRawWpa,
} from "./snapshotDisplay";

export type FieldResolver = (prov: Province) => SnapshotResolvedValue;

export const SNAPSHOT_FIELD_BEHAVIORS: Partial<Record<string, FieldResolver>> = {
    nwpa: resolveNwpa,
    ppa: resolvePpa,
    gcpa: resolveGcpa,
    rawTpa: resolveRawTpa,
    rawWpa: resolveRawWpa,
};