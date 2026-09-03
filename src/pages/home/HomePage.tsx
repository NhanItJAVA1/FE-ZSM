import { useMemo, useState } from "react";
import AppLayout from "../../layouts/AppLayout.js";
import MapPickerModal from "../../features/zsm/catalog/components/MapPickerModal.js";
import VehiclePickerModal from "../../features/zsm/catalog/components/VehiclePickerModal.js";
import {
    useGameModesQuery,
    useMapsQuery,
    useVehiclesQuery,
} from "../../features/zsm/hooks/useCatalogQueries.js";
import HomeHero from "../../features/zsm/records/components/HomeHero.js";
import RecordFilterBar from "../../features/zsm/records/components/RecordFilterBar.js";
import RecordInfoPanel from "../../features/zsm/records/components/RecordInfoPanel.js";
import RecordViewer from "../../features/zsm/records/components/RecordViewer.js";
import { useRecordFilters } from "../../features/zsm/hooks/useRecordFilters.js";
import { useRecordsQuery } from "../../features/zsm/hooks/useRecordsQuery.js";
import { parseVehicleRank } from "../../constants/catalog.js";

export default function HomePage() {
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

    const mapsQuery = useMapsQuery();
    const vehiclesQuery = useVehiclesQuery();
    const recordsQuery = useRecordsQuery();

    const maps = mapsQuery.data ?? [];
    const vehicles = vehiclesQuery.data ?? [];
    const records = recordsQuery.data ?? [];

    const {
        filters,
        setFilters,
        selectedRecordId,
        setSelectedRecordId,
        filteredRecords,
        selectedRecord,
        resetFilters,
    } = useRecordFilters(records);

    const filteredVehicles = useMemo(() => {
        return vehicles.filter((vehicle) => {
            if (filters.vehicleType !== null && vehicle.type !== filters.vehicleType) {
                return false;
            }

            if (
                filters.vehicleRank !== null &&
                parseVehicleRank(vehicle.rank) !== filters.vehicleRank
            ) {
                return false;
            }

            return true;
        });
    }, [vehicles, filters.vehicleType, filters.vehicleRank]);

    const selectedMap = maps.find((map) => map.id === filters.mapId);
    const selectedVehicle = vehicles.find(
        (vehicle) => vehicle.id === filters.vehicleId
    );

    const isLoading =
        mapsQuery.isLoading ||
        vehiclesQuery.isLoading ||
        recordsQuery.isLoading;

    return (
        <AppLayout>
            <HomeHero recordCount={records.length} isLoading={isLoading} />

            <RecordFilterBar
                filters={filters}
                selectedMap={selectedMap}
                selectedVehicle={selectedVehicle}
                onFiltersChange={(patch) =>
                    setFilters((current) => ({ ...current, ...patch }))
                }
                onOpenMapPicker={() => setMapModalOpen(true)}
                onOpenVehiclePicker={() => setVehicleModalOpen(true)}
                onReset={resetFilters}
            />

            <section className="content-grid">
                <div className="viewer">
                    <RecordViewer
                        isLoading={isLoading}
                        selectedRecord={selectedRecord}
                        emptyAction={
                            <button
                                type="button"
                                className="ghost-btn"
                                onClick={resetFilters}
                            >
                                Xóa bộ lọc
                            </button>
                        }
                    />
                </div>

                <RecordInfoPanel
                    isLoading={isLoading}
                    records={filteredRecords}
                    selectedRecordId={selectedRecordId}
                    onSelectRecord={setSelectedRecordId}
                    emptyAction={
                        <button
                            type="button"
                            className="ghost-btn"
                            onClick={resetFilters}
                        >
                            Xóa bộ lọc
                        </button>
                    }
                />
            </section>

            <MapPickerModal
                open={mapModalOpen}
                maps={maps}
                selectedId={filters.mapId}
                onSelect={(id) =>
                    setFilters((current) => ({ ...current, mapId: id }))
                }
                onClose={() => setMapModalOpen(false)}
            />

            <VehiclePickerModal
                open={vehicleModalOpen}
                vehicles={filteredVehicles}
                selectedId={filters.vehicleId}
                onSelect={(id) =>
                    setFilters((current) => ({ ...current, vehicleId: id }))
                }
                onClose={() => setVehicleModalOpen(false)}
            />
        </AppLayout>
    );
}
