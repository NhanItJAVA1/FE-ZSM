import { useMemo, useState } from "react";
import { parseVehicleRank } from "../../../constants/catalog.js";
import type { MyRecordFilters, RecordDto } from "../types.js";
import {
    DEFAULT_MY_RECORD_FILTERS,
    normalizeRecordStatus,
} from "../types.js";

export function useMyRecordFilters(records: RecordDto[]) {
    const [filters, setFilters] = useState<MyRecordFilters>(
        DEFAULT_MY_RECORD_FILTERS
    );
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

    const filteredRecords = useMemo(() => {
        return records
            .filter((record) => {
                const status = normalizeRecordStatus(record.status);

                if (filters.status !== "all" && status !== filters.status) {
                    return false;
                }

                if (filters.mapId !== null && record.map?.id !== filters.mapId) {
                    return false;
                }

                if (
                    filters.vehicleId !== null &&
                    record.vehicle?.id !== filters.vehicleId
                ) {
                    return false;
                }

                if (filters.rate && String(record.map?.rate) !== filters.rate) {
                    return false;
                }

                if (
                    filters.vehicleType !== null &&
                    record.vehicle?.type !== filters.vehicleType
                ) {
                    return false;
                }

                if (filters.vehicleRank !== null) {
                    const recordRank = record.vehicle
                        ? parseVehicleRank(record.vehicle.rank)
                        : null;

                    if (recordRank !== filters.vehicleRank) {
                        return false;
                    }
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
            })
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            );
    }, [records, filters]);

    const selectedRecord = useMemo(() => {
        if (selectedRecordId !== null) {
            return (
                filteredRecords.find((record) => record.id === selectedRecordId) ??
                filteredRecords[0] ??
                null
            );
        }

        return filteredRecords[0] ?? null;
    }, [filteredRecords, selectedRecordId]);

    function resetFilters() {
        setFilters(DEFAULT_MY_RECORD_FILTERS);
        setSelectedRecordId(null);
    }

    return {
        filters,
        setFilters,
        selectedRecordId,
        setSelectedRecordId,
        filteredRecords,
        selectedRecord,
        resetFilters,
    };
}
