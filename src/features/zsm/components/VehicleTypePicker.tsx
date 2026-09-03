import "../style/IconPicker.css";

interface VehicleTypePickerProps {
    value: number | null;
    onChange: (value: number | null) => void;
    clearable?: boolean;
    compact?: boolean;
}

function CarIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="currentColor"
                d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11v7a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7zm2.2-4 1 3h7.6l1-3H7.2zM7 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm10 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
            />
        </svg>
    );
}

function MotoIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="currentColor"
                d="M17 7.5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0zM5 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8.5 11h2.2l1.3-2.6h3.4l1.2 2.6H19l-1.1 2H16l-1.2-2.4H9.2L8 13H5.8L7 11h1.5z"
            />
        </svg>
    );
}

const OPTIONS = [
    { value: 0, label: "Ô tô", icon: <CarIcon /> },
    { value: 1, label: "Xe máy", icon: <MotoIcon /> },
] as const;

export default function VehicleTypePicker({
    value,
    onChange,
    clearable = false,
    compact = false,
}: VehicleTypePickerProps) {
    return (
        <div className={`icon-picker${compact ? " icon-picker-compact" : ""}`}>
            {OPTIONS.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    title={option.label}
                    aria-label={option.label}
                    className={
                        value === option.value ? "icon-picker-btn active" : "icon-picker-btn"
                    }
                    onClick={() => {
                        if (clearable && value === option.value) {
                            onChange(null);
                            return;
                        }

                        onChange(option.value);
                    }}
                >
                    {option.icon}
                </button>
            ))}
        </div>
    );
}
