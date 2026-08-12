import PendingRecordCard from "./PendingRecordCard.js";
import type { PendingRecord } from "../../records/types.js";

interface AdminPendingListProps {
    pending: PendingRecord[];
    processingId: string | null;
    onApprove: (record: PendingRecord) => void;
    onReject: (record: PendingRecord) => void;
}

export default function AdminPendingList({
    pending,
    processingId,
    onApprove,
    onReject,
}: AdminPendingListProps) {
    if (pending.length === 0) {
        return (
            <div className="empty-state admin-empty">
                Không có kỷ lục nào đang chờ duyệt.
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
                    onReject={() => onReject(record)}
                />
            ))}
        </div>
    );
}
