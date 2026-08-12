import AppLayout from "../../layouts/AppLayout.js";
import PageHeading from "../../layouts/PageHeading.js";
import { useGameModesQuery, useMapsQuery, useVehiclesQuery } from "../../features/catalog/hooks/useCatalogQueries.js";
import SubmitRecordForm from "../../features/records/components/SubmitRecordForm.js";
import { useAppSelector } from "../../stores/hook.js";

export default function SubmitRecordPage() {
    const { user } = useAppSelector((state) => state.auth);

    const mapsQuery = useMapsQuery();
    const vehiclesQuery = useVehiclesQuery();
    const gameModesQuery = useGameModesQuery();

    if (!user) {
        return null;
    }

    return (
        <AppLayout>
            <PageHeading
                eyebrow="Gửi kỷ lục"
                title="Đăng video kỷ lục mới"
                description="Video sẽ được admin duyệt trước khi xuất hiện trên trang chủ."
            />

            <SubmitRecordForm
                maps={mapsQuery.data ?? []}
                vehicles={vehiclesQuery.data ?? []}
                gameModes={gameModesQuery.data ?? []}
                userId={user.id}
                defaultRacerName={user.displayName || user.username}
            />
        </AppLayout>
    );
}
