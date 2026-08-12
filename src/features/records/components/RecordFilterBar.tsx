import StarRating from "../../../components/ui/StarRating.js";
import VehicleRankPicker from "../../../components/ui/VehicleRankPicker.js";
import VehicleTypePicker from "../../../components/ui/VehicleTypePicker.js";
import type { MapDto, VehicleDto } from "../../catalog/types.js";
import type { RecordFilters } from "../types.js";

interface RecordFilterBarProps {
    filters: RecordFilters;
    selectedMap?: MapDto | undefined;
    selectedVehicle?: VehicleDto | undefined;
    onFiltersChange: (patch: Partial<RecordFilters>) => void;
    onOpenMapPicker: () => void;
    onOpenVehiclePicker: () => void;
    onReset: () => void;
}

export default function RecordFilterBar({
    filters,
    selectedMap,
    selectedVehicle,
    onFiltersChange,
    onOpenMapPicker,
    onOpenVehiclePicker,
    onReset,
}: RecordFilterBarProps) {
    const rateValue = filters.rate ? Number(filters.rate) : 0;

    return (
        <section className="filter-bar">
            <div className="filter-bar-row filter-bar-row-main">
                <label className="filter-search">
                    Tìm map
                    <input
                        type="search"
                        placeholder="Nhập tên map..."
                        value={filters.search}
                        onChange={(event) =>
                            onFiltersChange({ search: event.target.value })
                        }
                    />
                </label>

                <button type="button" className="filter-trigger" onClick={onOpenMapPicker}>
                    Map
                    <span>{selectedMap?.name ?? "Tất cả map"}</span>
                </button>

                <button
                    type="button"
                    className="filter-trigger"
                    onClick={onOpenVehiclePicker}
                >
                    Xe đua
                    <span>{selectedVehicle?.name ?? "Tất cả xe"}</span>
                </button>

                <button type="button" className="ghost-btn" onClick={onReset}>
                    Reset filter
                </button>
            </div>

            <div className="filter-bar-row filter-bar-row-pickers">
                <label className="filter-field">
                    Rate map
                    <StarRating
                        clearable
                        value={rateValue}
                        onChange={(star) =>
                            onFiltersChange({ rate: star > 0 ? String(star) : "" })
                        }
                    />
                </label>

                <label className="filter-field">
                    Loại xe
                    <VehicleTypePicker
                        compact
                        clearable
                        value={filters.vehicleType}
                        onChange={(vehicleType) =>
                            onFiltersChange({
                                vehicleType,
                                vehicleRank: null,
                            })
                        }
                    />
                </label>

                {filters.vehicleType !== null && (
                    <label className="filter-field filter-field-rank">
                        Cấp bậc
                        <VehicleRankPicker
                            compact
                            clearable
                            vehicleType={filters.vehicleType}
                            value={filters.vehicleRank}
                            onChange={(vehicleRank) => onFiltersChange({ vehicleRank })}
                        />
                    </label>
                )}
            </div>
        </section>
    );
}
