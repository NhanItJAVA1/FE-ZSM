import StarRating from "../../../components/ui/StarRating.js";
import FilterPickerTrigger from "../../../components/ui/FilterPickerTrigger.js";
import VehicleRankPicker from "../../../components/ui/VehicleRankPicker.js";
import VehicleTypePicker from "../../../components/ui/VehicleTypePicker.js";
import type { MapDto, VehicleDto } from "../../catalog/types.js";
import type { MyRecordFilters, MyRecordStatusFilter } from "../types.js";
import { RECORD_STATUS_LABELS } from "../types.js";

const STATUS_OPTIONS: Array<{ value: MyRecordStatusFilter; label: string }> = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: RECORD_STATUS_LABELS.pending },
    { value: "approved", label: RECORD_STATUS_LABELS.approved },
    { value: "rejected", label: RECORD_STATUS_LABELS.rejected },
];

interface MyRecordFilterBarProps {
    filters: MyRecordFilters;
    selectedMap?: MapDto | undefined;
    selectedVehicle?: VehicleDto | undefined;
    onFiltersChange: (patch: Partial<MyRecordFilters>) => void;
    onOpenMapPicker: () => void;
    onOpenVehiclePicker: () => void;
    onReset: () => void;
}

export default function MyRecordFilterBar({
    filters,
    selectedMap,
    selectedVehicle,
    onFiltersChange,
    onOpenMapPicker,
    onOpenVehiclePicker,
    onReset,
}: MyRecordFilterBarProps) {
    const rateValue = filters.rate ? Number(filters.rate) : 0;

    return (
        <section className="filter-bar">
            <div className="status-filter-row">
                {STATUS_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        className={`status-filter-btn${
                            filters.status === option.value ? " active" : ""
                        }`}
                        onClick={() => onFiltersChange({ status: option.value })}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div className="filter-bar-row filter-bar-row-main">
                <label className="filter-search">
                    Tìm kiếm
                    <input
                        type="search"
                        placeholder="Tên map, xe, tiêu đề..."
                        value={filters.search}
                        onChange={(event) =>
                            onFiltersChange({ search: event.target.value })
                        }
                    />
                </label>

                <FilterPickerTrigger
                    label="Map"
                    selection={selectedMap}
                    fallback="Tất cả map"
                    onClick={onOpenMapPicker}
                />

                <FilterPickerTrigger
                    label="Xe đua"
                    selection={selectedVehicle}
                    fallback="Tất cả xe"
                    onClick={onOpenVehiclePicker}
                />

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
