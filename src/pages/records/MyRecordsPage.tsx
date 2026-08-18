import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout.js";
import PageHeading from "../../layouts/PageHeading.js";
import MapPickerModal from "../../features/catalog/components/MapPickerModal.js";
import VehiclePickerModal from "../../features/catalog/components/VehiclePickerModal.js";
import {
    useMapsQuery,
    useVehiclesQuery,
} from "../../hooks/useCatalogQueries.js";
import MyRecordFilterBar from "../../features/records/components/MyRecordFilterBar.js";
import MyRecordInfoPanel from "../../features/records/components/MyRecordInfoPanel.js";
import RecordChipList from "../../features/records/components/RecordChipList.js";
import RecordViewer from "../../features/records/components/RecordViewer.js";
import { useMyRecordFilters } from "../../hooks/useMyRecordFilters.js";
import { useMyRecordsQuery } from "../../hooks/useMyRecordsQuery.js";
import { ROUTES } from "../../constants/routes.js";
import { parseVehicleRank } from "../../constants/catalog.js";
import { useAppSelector } from "../../stores/hook.js";

export default function MyRecordsPage() {
    const { user } = useAppSelector((state) => state.auth);
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

    const mapsQuery = useMapsQuery();
    const vehiclesQuery = useVehiclesQuery();
    const myRecordsQuery = useMyRecordsQuery(user?.id);

    const maps = mapsQuery.data ?? [];
    const vehicles = vehiclesQuery.data ?? [];
    const records = myRecordsQuery.data ?? [];

    const {
        filters,
        setFilters,
        selectedRecordId,
        setSelectedRecordId,
        filteredRecords,
        selectedRecord,
        resetFilters,
    } = useMyRecordFilters(records);

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
        myRecordsQuery.isLoading;

    if (!user) {
        return null;
    }

    return (
        <AppLayout>
            <PageHeading
                eyebrow="Tài khoản"
                title="Kỷ lục của tôi"
                description="Theo dõi trạng thái các bản ghi bạn đã gửi: chờ duyệt, đã duyệt hoặc bị từ chối."
                action={
                    <Link to={ROUTES.submit} className="primary-link">
                        Gửi kỷ lục mới
                    </Link>
                }
            />

            <MyRecordFilterBar
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
                    />

                    {!isLoading && filteredRecords.length > 0 && (
                        <RecordChipList
                            records={filteredRecords}
                            selectedRecordId={selectedRecordId}
                            onSelect={setSelectedRecordId}
                        />
                    )}
                </div>

                <MyRecordInfoPanel record={selectedRecord} />
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
