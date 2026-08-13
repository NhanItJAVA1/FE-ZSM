import Skeleton from "../../../components/ui/Skeleton.js";

export default function RecordViewerSkeleton() {
    return (
        <div className="viewer-skeleton" aria-busy="true" aria-label="Đang tải video">
            <div className="video-shell">
                <div className="video-shell-inner">
                    <Skeleton className="skeleton-video" />
                </div>
            </div>
            <div className="viewer-meta viewer-meta--skeleton">
                <Skeleton className="skeleton-meta-item" style={{ width: "22%" }} />
                <Skeleton className="skeleton-meta-item" style={{ width: "14%" }} />
                <Skeleton className="skeleton-meta-item" style={{ width: "18%" }} />
                <Skeleton className="skeleton-meta-item" style={{ width: "12%" }} />
                <Skeleton className="skeleton-meta-item" style={{ width: "16%" }} />
            </div>
        </div>
    );
}
