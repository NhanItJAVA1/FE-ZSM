import { useCallback } from "react";
import type { RecordDto } from "../records/types.js";
import { DEFAULT_RECORD_FILTERS } from "../records/types.js";
import { useBaseRecordFilters } from "./useBaseRecordFilters.js";

export function useRecordFilters(records: RecordDto[]) {
    const customPredicate = useCallback(
        (record: RecordDto, filters: typeof DEFAULT_RECORD_FILTERS) => {
            if (filters.search.trim()) {
                const keyword = filters.search.trim().toLowerCase();
                const mapName = record.map?.name?.toLowerCase() ?? "";
                return mapName.includes(keyword);
            }
            return true;
        },
        []
    );

    return useBaseRecordFilters(records, DEFAULT_RECORD_FILTERS, customPredicate);
}
