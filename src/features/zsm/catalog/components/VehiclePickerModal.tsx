import ImagePickerModal from "../../components/ImagePickerModal.js";
import { vehiclesToPickerItems } from "../../../../utils/catalog.js";
import type { VehicleDto } from "../types.js";

interface VehiclePickerModalProps {
    open: boolean;
    vehicles: VehicleDto[];
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    onClose: () => void;
    allowClear?: boolean;
}

export default function VehiclePickerModal({
    open,
    vehicles,
    selectedId,
    onSelect,
    onClose,
    allowClear = true,
}: VehiclePickerModalProps) {
    return (
        <ImagePickerModal
            open={open}
            title="Chọn xe đua"
            items={vehiclesToPickerItems(vehicles)}
            selectedId={selectedId}
            onSelect={onSelect}
            onClose={onClose}
            allowClear={allowClear}
        />
    );
}
