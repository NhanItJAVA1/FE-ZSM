interface CatalogGridItem {
    id: number;
    name: string;
    imageUrl: string | null;
    subtitle?: string;
}

interface CatalogItemGridProps {
    title: string;
    emptyText: string;
    isLoading: boolean;
    items: CatalogGridItem[];
    editingId?: number | null;
    deletingId?: number | null;
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
}

export default function CatalogItemGrid({
    title,
    emptyText,
    isLoading,
    items,
    editingId = null,
    deletingId = null,
    onEdit,
    onDelete,
}: CatalogItemGridProps) {
    return (
        <section className="catalog-grid-section">
            <div className="catalog-grid-header">
                <h2>{title}</h2>
                <span>{items.length} mục</span>
            </div>

            {isLoading ? (
                <p className="form-status">Đang tải danh sách...</p>
            ) : items.length === 0 ? (
                <div className="empty-state admin-empty">{emptyText}</div>
            ) : (
                <div className="catalog-grid">
                    {items.map((item) => (
                        <article
                            key={item.id}
                            className={`catalog-grid-card${editingId === item.id ? " active" : ""}`}
                        >
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} />
                            ) : (
                                <div className="picker-placeholder">
                                    {item.name.slice(0, 1)}
                                </div>
                            )}
                            <strong>{item.name}</strong>
                            {item.subtitle && <span>{item.subtitle}</span>}

                            {(onEdit || onDelete) && (
                                <div className="catalog-grid-actions">
                                    {onEdit && (
                                        <button
                                            type="button"
                                            className="ghost-btn"
                                            onClick={() => onEdit(item.id)}
                                        >
                                            Sửa
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            type="button"
                                            className="ghost-btn danger"
                                            disabled={deletingId === item.id}
                                            onClick={() => onDelete(item.id)}
                                        >
                                            {deletingId === item.id ? "Đang xóa..." : "Xóa"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
