import { useCallback } from "react";
import type { MyRecordFilters, RecordDto } from "../records/types.js";
import {
    DEFAULT_MY_RECORD_FILTERS,
    normalizeRecordStatus,
} from "../records/types.js";
import { useBaseRecordFilters } from "./useBaseRecordFilters.js";

export function useMyRecordFilters(records: RecordDto[]) {
    const customPredicate = useCallback(
        (record: RecordDto, filters: MyRecordFilters) => {
            const status = normalizeRecordStatus(record.status);

            if (filters.status !== "all" && status !== filters.status) {
                return false;
            }

            if (filters.search.trim()) {
                const keyword = filters.search.trim().toLowerCase();
                const haystack = [
                    record.title,
                    record.map?.name,
                    record.vehicle?.name,
                    record.description,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                if (!haystack.includes(keyword)) {
                    return false;
                }
            }

            return true;
        },
        []
    );

    const sortFn = useCallback(
        (a: RecordDto, b: RecordDto) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        []
    );

    return useBaseRecordFilters(
        records,
        DEFAULT_MY_RECORD_FILTERS,
        customPredicate,
        sortFn
    );
}
