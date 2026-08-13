interface FilterPickerSelection {
    name: string;
    imageUrl?: string | null;
}

interface FilterPickerTriggerProps {
    label: string;
    selection: FilterPickerSelection | null | undefined;
    fallback: string;
    onClick: () => void;
}

export default function FilterPickerTrigger({
    label,
    selection,
    fallback,
    onClick,
}: FilterPickerTriggerProps) {
    const displayName = selection?.name ?? fallback;

    return (
        <button
            type="button"
            className="filter-trigger filter-picker-trigger"
            onClick={onClick}
        >
            <span>{label}</span>
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
    );
}
