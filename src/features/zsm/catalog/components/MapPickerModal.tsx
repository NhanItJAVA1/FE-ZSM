import { useEffect, useMemo, useState } from "react";
import ImagePickerModal from "../../components/ImagePickerModal.js";
import StarRating from "../../components/StarRating.js";
import { mapsToPickerItems, sortMapsByRate } from "../../../../utils/catalog.js";
import type { MapDto } from "../types.js";

interface MapPickerModalProps {
    open: boolean;
    maps: MapDto[];
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    onClose: () => void;
    allowClear?: boolean;
    enableRateFilter?: boolean;
}

export default function MapPickerModal({
    open,
    maps,
    selectedId,
    onSelect,
    onClose,
    allowClear = true,
    enableRateFilter = false,
}: MapPickerModalProps) {
    const [rateFilter, setRateFilter] = useState<number | null>(null);

    useEffect(() => {
        if (!open) {
            setRateFilter(null);
        }
    }, [open]);

    const filteredMaps = useMemo(() => {
        const sortedMaps = sortMapsByRate(maps);

        if (!enableRateFilter || rateFilter === null) {
            return sortedMaps;
        }

        return sortedMaps.filter((map) => Number(map.rate) === rateFilter);
    }, [enableRateFilter, maps, rateFilter]);

    return (
        <ImagePickerModal
            open={open}
            title="Chọn map"
            items={mapsToPickerItems(filteredMaps)}
            selectedId={selectedId}
            onSelect={onSelect}
            onClose={onClose}
            allowClear={allowClear}
            emptyText="Không có map nào phù hợp rate đã chọn."
            toolbar={
                enableRateFilter ? (
                    <div className="picker-filter-bar">
                        <label className="picker-filter-field">
                            Lọc theo rate
                            <StarRating
                                clearable
                                value={rateFilter ?? 0}
                                onChange={(star) =>
                                    setRateFilter(star > 0 ? star : null)
                                }
                            />
                        </label>
                    </div>
                ) : undefined
            }
        />
    );
}
