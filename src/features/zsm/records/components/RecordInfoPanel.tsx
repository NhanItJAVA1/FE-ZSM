import type { ReactNode } from "react";
import EmptyState from "../../components/EmptyState.js";
import RecordChipList from "./RecordChipList.js";
import RecordSidebarSkeleton from "./RecordSidebarSkeleton.js";
import type { RecordDto } from "../types.js";

interface RecordInfoPanelProps {
    isLoading: boolean;
    records: RecordDto[];
    selectedRecordId: number | null;
    onSelectRecord: (id: number) => void;
    emptyAction?: ReactNode;
}

export default function RecordInfoPanel({
    isLoading,
    records,
    selectedRecordId,
    onSelectRecord,
    emptyAction,
}: RecordInfoPanelProps) {
    return (
        <aside className="info-panel info-panel--home">
            <div className="section-heading">
                <p className="eyebrow">Danh sách video</p>
                <h2>
                    {isLoading ? "Đang tải..." : `${records.length} kỷ lục`}
                </h2>
            </div>

            {isLoading ? (
                <RecordSidebarSkeleton />
            ) : records.length === 0 ? (
                <EmptyState
                    title="Danh sách trống"
                    description="Không tìm thấy video với bộ lọc hiện tại."
                    action={emptyAction}
                />
            ) : (
                <RecordChipList
                    variant="sidebar"
                    records={records}
                    selectedRecordId={selectedRecordId}
                    onSelect={onSelectRecord}
                />
            )}
        </aside>
    );
}
