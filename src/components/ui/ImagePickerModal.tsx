import { useEffect } from "react";

export interface PickerItem {
    id: number;
    name: string;
    imageUrl?: string | null;
    subtitle?: string;
}

interface ImagePickerModalProps {
    open: boolean;
    title: string;
    items: PickerItem[];
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    onClose: () => void;
    allowClear?: boolean;
    clearLabel?: string;
    toolbar?: React.ReactNode;
    emptyText?: string;
}

export default function ImagePickerModal({
    open,
    title,
    items,
    selectedId,
    onSelect,
    onClose,
    allowClear = true,
    clearLabel = "Tất cả",
    toolbar,
    emptyText = "Không có mục nào phù hợp.",
}: ImagePickerModalProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div className="modal-backdrop" role="presentation" onClick={onClose}>
            <div
                className="modal-panel"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(event) => event.stopPropagation()}
            >
                <header className="modal-header">
                    <div>
                        <p className="eyebrow">Chọn</p>
                        <h2>{title}</h2>
                    </div>
                    <button type="button" className="ghost-btn" onClick={onClose}>
                        Đóng
                    </button>
                </header>

                {toolbar}

                {items.length === 0 ? (
                    <div className="empty-state picker-empty">{emptyText}</div>
                ) : (
                <div className="picker-grid">
                    {allowClear && (
                        <button
                            type="button"
                            className={
                                selectedId === null
                                    ? "picker-card active"
                                    : "picker-card"
                            }
                            onClick={() => {
                                onSelect(null);
                                onClose();
                            }}
                        >
                            <span className="picker-placeholder">{clearLabel}</span>
                            <span className="picker-label">{clearLabel}</span>
                        </button>
                    )}

                    {items.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={
                                selectedId === item.id
                                    ? "picker-card active"
                                    : "picker-card"
                            }
                            onClick={() => {
                                onSelect(item.id);
                                onClose();
                            }}
                        >
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} loading="lazy" />
                            ) : (
                                <span className="picker-placeholder">
                                    {item.name.slice(0, 2).toUpperCase()}
                                </span>
                            )}
                            <span className="picker-label">{item.name}</span>
                            {item.subtitle && (
                                <span className="picker-sub">{item.subtitle}</span>
                            )}
                        </button>
                    ))}
                </div>
                )}
            </div>
        </div>
    );
}
