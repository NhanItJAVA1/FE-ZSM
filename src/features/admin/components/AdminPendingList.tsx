import PendingRecordCard from "./PendingRecordCard.js";
import type { RecordDto } from "../../records/types.js";

interface AdminPendingListProps {
    pending: RecordDto[];
    isLoading: boolean;
    isFetching: boolean;
    error: Error | null;
    processingId: number | null;
    onApprove: (record: RecordDto) => void;
    onReject: (record: RecordDto, reason?: string) => void;
    onRefresh: () => void;
}

export default function AdminPendingList({
    pending,
    isLoading,
    isFetching,
    error,
    processingId,
    onApprove,
    onReject,
    onRefresh,
}: AdminPendingListProps) {
    if (isLoading) {
        return (
            <div className="empty-state admin-empty">
                Đang tải danh sách chờ duyệt...
            </div>
        );
    }

    if (error) {
        return (
            <div className="empty-state admin-empty">
                <p>Không tải được danh sách chờ duyệt.</p>
                <p className="form-status">{error.message}</p>
                <button type="button" onClick={onRefresh}>
                    Thử lại
                </button>
            </div>
        );
    }

    if (pending.length === 0) {
        return (
            <div className="empty-state admin-empty">
                <p>Không có kỷ lục nào đang chờ duyệt.</p>
                <button type="button" className="ghost-btn" onClick={onRefresh}>
                    {isFetching ? "Đang tải lại..." : "Tải lại"}
                </button>
            </div>
        );
    }

    return (
        <div className="admin-list">
            {pending.map((record) => (
                <PendingRecordCard
                    key={record.id}
                    record={record}
                    isProcessing={processingId === record.id}
                    onApprove={() => onApprove(record)}
                    onReject={(reason) => onReject(record, reason)}
                />
            ))}
        </div>
    );
}
