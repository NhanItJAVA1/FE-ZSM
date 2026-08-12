import { useMemo, useState } from "react";
import { parseVehicleRank } from "../../../constants/catalog.js";
import type { RecordDto, RecordFilters } from "../types.js";
import { DEFAULT_RECORD_FILTERS } from "../types.js";

export function useRecordFilters(records: RecordDto[]) {
    const [filters, setFilters] = useState<RecordFilters>(DEFAULT_RECORD_FILTERS);
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

    const filteredRecords = useMemo(() => {
        return records
            .filter((record) => {
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
                    const mapName = record.map?.name?.toLowerCase() ?? "";

                    if (!mapName.includes(keyword)) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => a.finishTime - b.finishTime);
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
        setFilters(DEFAULT_RECORD_FILTERS);
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
