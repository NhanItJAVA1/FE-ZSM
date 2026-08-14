import StarRating from "../../../components/ui/StarRating.js";
import FilterPickerTrigger from "../../../components/ui/FilterPickerTrigger.js";
import VehicleRankPicker from "../../../components/ui/VehicleRankPicker.js";
import VehicleTypePicker from "../../../components/ui/VehicleTypePicker.js";
import NavIcon from "../../../components/ui/NavIcon.js";
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
            <div className="filter-group">
                <span className="filter-group-label">Tìm kiếm</span>
                <div className="filter-bar-row filter-bar-row-main">
                    <label className="filter-search">
                        <span className="filter-search-caption">Tìm map</span>
                        <span className="filter-search-field">
                            <NavIcon name="search" className="filter-search-icon" />
                            <input
                                type="search"
                                placeholder="Nhập tên map..."
                                value={filters.search}
                                onChange={(event) =>
                                    onFiltersChange({ search: event.target.value })
                                }
                            />
                            {filters.search && (
                                <button
                                    type="button"
                                    className="filter-search-clear"
                                    onClick={() => onFiltersChange({ search: "" })}
                                    aria-label="Xóa tìm kiếm"
                                >
                                    <NavIcon name="close" />
                                </button>
                            )}
                        </span>
                    </label>

                    <FilterPickerTrigger
                        label="Map"
                        icon="map"
                        selection={selectedMap}
                        fallback="Tất cả map"
                        onClick={onOpenMapPicker}
                        onClear={() => onFiltersChange({ mapId: null })}
                    />

                    <FilterPickerTrigger
                        label="Xe đua"
                        icon="car"
                        selection={selectedVehicle}
                        fallback="Tất cả xe"
                        onClick={onOpenVehiclePicker}
                        onClear={() => onFiltersChange({ vehicleId: null })}
                    />
                </div>
            </div>

            <div className="filter-group">
                <span className="filter-group-label">Lọc nâng cao</span>
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

                    <button
                        type="button"
                        className="ghost-btn filter-reset-btn"
                        onClick={onReset}
                    >
                        Reset filter
                    </button>
                </div>
            </div>
        </section>
    );
}
