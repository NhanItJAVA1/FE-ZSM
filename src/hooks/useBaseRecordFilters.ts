import { useMemo, useState } from "react";
import { parseVehicleRank } from "../constants/catalog.js";
import type { RecordDto, RecordFilters } from "../features/records/types.js";

export function useBaseRecordFilters<TFilters extends RecordFilters>(
    records: RecordDto[],
    initialFilters: TFilters,
    customPredicate?: (record: RecordDto, filters: TFilters) => boolean,
    sortFn?: (a: RecordDto, b: RecordDto) => number
) {
    const [filters, setFilters] = useState<TFilters>(initialFilters);
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

                if (customPredicate && !customPredicate(record, filters)) {
                    return false;
                }

                return true;
            })
            .sort(sortFn ?? ((a, b) => a.finishTime - b.finishTime));
    }, [records, filters, customPredicate, sortFn]);

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
        setFilters(initialFilters);
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
