import StarRating from "../../../components/ui/StarRating.js";
import FilterPickerTrigger from "../../../components/ui/FilterPickerTrigger.js";
import VehicleRankPicker from "../../../components/ui/VehicleRankPicker.js";
import VehicleTypePicker from "../../../components/ui/VehicleTypePicker.js";
import NavIcon from "../../../components/ui/NavIcon.js";
import type { MapDto, VehicleDto } from "../../catalog/types.js";
import type { RecordFilters } from "../types.js";
import { Search } from "lucide-react";

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
        <section className="border border-[var(--border)] bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="filter-group" style={{ padding: "12px 16px" }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}>
                    <div style={{ width: "240px", flexShrink: 0 }}>
                        <div style={{ position: "relative" }}>
                            <Search
                                style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "16px",
                                    height: "16px",
                                    color: "#9ca3af",
                                    pointerEvents: "none",
                                }}
                            />
                            <input
                                type="search"
                                placeholder="Nhập tên map..."
                                value={filters.search}
                                onChange={(event) =>
                                    onFiltersChange({ search: event.target.value })
                                }
                                style={{
                                    height: "40px",
                                    width: "100%",
                                    borderRadius: "6px",
                                    border: "1px solid var(--border)",
                                    paddingLeft: "36px",
                                    paddingRight: "12px",
                                    fontSize: "14px",
                                    background: "var(--field)",
                                    color: "var(--text-h)",
                                    outline: "none",
                                }}
                            />
                        </div>
                    </div>

                    <FilterPickerTrigger
                        icon="map"
                        selection={selectedMap}
                        onClick={onOpenMapPicker}
                        onClear={() => onFiltersChange({ mapId: null })}
                    />

                    <FilterPickerTrigger
                        icon="car"
                        selection={selectedVehicle}
                        onClick={onOpenVehiclePicker}
                        onClear={() => onFiltersChange({ vehicleId: null })}
                    />

                    {/* Selected map display chip */}
                    <div className="selection-chip" style={{ opacity: selectedMap ? 1 : 0.4 }}>
                        <NavIcon name="map" style={{ width: 16, height: 16, flexShrink: 0 }} />
                        <span className="selection-chip-text">
                            {selectedMap ? selectedMap.name : "Chưa chọn map"}
                        </span>
                        {selectedMap && (
                            <button
                                type="button"
                                className="selection-chip-clear"
                                onClick={() => onFiltersChange({ mapId: null })}
                            >
                                <NavIcon name="close" style={{ width: 12, height: 12 }} />
                            </button>
                        )}
                    </div>

                    {/* Selected vehicle display chip */}
                    <div className="selection-chip" style={{ opacity: selectedVehicle ? 1 : 0.4 }}>
                        <NavIcon name="car" style={{ width: 16, height: 16, flexShrink: 0 }} />
                        <span className="selection-chip-text">
                            {selectedVehicle ? selectedVehicle.name : "Chưa chọn xe"}
                        </span>
                        {selectedVehicle && (
                            <button
                                type="button"
                                className="selection-chip-clear"
                                onClick={() => onFiltersChange({ vehicleId: null })}
                            >
                                <NavIcon name="close" style={{ width: 12, height: 12 }} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="filter-group" style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
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
