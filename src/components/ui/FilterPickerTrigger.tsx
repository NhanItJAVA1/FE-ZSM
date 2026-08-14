import NavIcon from "./NavIcon.js";
import type { NavIconName } from "./NavIcon.js";

interface FilterPickerSelection {
    name: string;
    imageUrl?: string | null;
}

interface FilterPickerTriggerProps {
    label: string;
    selection: FilterPickerSelection | null | undefined;
    fallback: string;
    onClick: () => void;
    icon?: NavIconName;
    onClear?: () => void;
    clearLabel?: string;
}

export default function FilterPickerTrigger({
    label,
    selection,
    fallback,
    onClick,
    icon,
    onClear,
    clearLabel,
}: FilterPickerTriggerProps) {
    const displayName = selection?.name ?? fallback;
    const showClear = Boolean(selection && onClear);

    return (
        <div
            className={`filter-picker${selection ? " has-selection" : ""}${
                showClear ? " is-clearable" : ""
            }`}
        >
            <button
                type="button"
                className="filter-trigger filter-picker-trigger"
                onClick={onClick}
            >
                <span className="filter-trigger-label">
                    {icon && <NavIcon name={icon} className="filter-trigger-icon" />}
                    {label}
                </span>
                <div className="filter-picker-value">
                    {selection && (
                        selection.imageUrl ? (
                            <img
                                src={selection.imageUrl}
                                alt=""
                                className="filter-picker-thumb"
                                loading="lazy"
                            />
                        ) : (
                            <span className="filter-picker-thumb placeholder">
                                {selection.name.slice(0, 2).toUpperCase()}
                            </span>
                        )
                    )}
                    <strong>{displayName}</strong>
                </div>
            </button>

            {showClear && (
                <button
                    type="button"
                    className="filter-picker-clear"
                    onClick={onClear}
                    aria-label={clearLabel ?? `Bỏ chọn ${label.toLowerCase()}`}
                >
                    <NavIcon name="close" />
                </button>
            )}
        </div>
    );
}
