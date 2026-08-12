import ImagePickerModal from "../../../components/ui/ImagePickerModal.js";
import { mapsToPickerItems } from "../../../utils/catalog.js";
import type { MapDto } from "../types.js";

interface MapPickerModalProps {
    open: boolean;
    maps: MapDto[];
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    onClose: () => void;
    allowClear?: boolean;
}

export default function MapPickerModal({
    open,
    maps,
    selectedId,
    onSelect,
    onClose,
    allowClear = true,
}: MapPickerModalProps) {
    return (
        <ImagePickerModal
            open={open}
            title="Chọn map"
            items={mapsToPickerItems(maps)}
            selectedId={selectedId}
            onSelect={onSelect}
            onClose={onClose}
            allowClear={allowClear}
        />
    );
}
