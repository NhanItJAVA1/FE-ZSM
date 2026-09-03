import Skeleton from "../../components/Skeleton.js";

const PLACEHOLDER_COUNT = 5;

export default function RecordSidebarSkeleton() {
    return (
        <div className="record-sidebar-skeleton" aria-busy="true" aria-label="Đang tải danh sách">
            {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
                <div key={index} className="record-chip record-chip--sidebar record-chip--skeleton">
                    <Skeleton className="skeleton-rank" />
                    <div className="record-chip-body">
                        <Skeleton className="skeleton-line" style={{ width: "72%" }} />
                        <Skeleton className="skeleton-line skeleton-line--sm" style={{ width: "48%" }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
