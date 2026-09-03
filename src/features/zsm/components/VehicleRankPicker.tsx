import { getRanksForVehicleType } from "../../../constants/catalog.js";
import "../style/IconPicker.css";

interface VehicleRankPickerProps {
    vehicleType: number;
    value: number | null;
    onChange: (value: number | null) => void;
    clearable?: boolean;
    compact?: boolean;
}

export default function VehicleRankPicker({
    vehicleType,
    value,
    onChange,
    clearable = false,
    compact = false,
}: VehicleRankPickerProps) {
    const ranks = getRanksForVehicleType(vehicleType);

    return (
        <div className={`icon-picker${compact ? " icon-picker-compact" : ""}`}>
            {ranks.map((rank) => (
                <button
                    key={rank.value}
                    type="button"
                    title={rank.label}
                    aria-label={rank.label}
                    className={
                        value === rank.value ? "icon-picker-btn active" : "icon-picker-btn"
                    }
                    onClick={() => {
                        if (clearable && value === rank.value) {
                            onChange(null);
                            return;
                        }

                        onChange(rank.value);
                    }}
                >
                    {rank.label}
                </button>
            ))}
        </div>
    );
}
