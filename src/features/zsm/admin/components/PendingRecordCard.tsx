import { useState } from "react";
import { formatDate, formatTime } from "../../../../utils/format.js";
import type { RecordDto } from "../../records/types.js";

interface PendingRecordCardProps {
    record: RecordDto;
    isProcessing: boolean;
    onApprove: () => void;
    onReject: (reason?: string) => void;
}

export default function PendingRecordCard({
    record,
    isProcessing,
    onApprove,
    onReject,
}: PendingRecordCardProps) {
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    function handleRejectSubmit() {
        onReject(rejectReason.trim() || undefined);
        setShowRejectForm(false);
        setRejectReason("");
    }

    function handleCancelReject() {
        setShowRejectForm(false);
        setRejectReason("");
    }

    return (
        <article className="admin-card">
            <div className="admin-card-body">
                <div>
                    <p className="eyebrow">Chờ duyệt</p>
                    <h2>{record.title}</h2>
                    <dl className="admin-meta">
                        <div>
                            <dt>Map</dt>
                            <dd>{record.map?.name ?? `#${record.map?.id ?? "—"}`}</dd>
                        </div>
                        <div>
                            <dt>Xe</dt>
                            <dd>{record.vehicle?.name ?? `#${record.vehicle?.id ?? "—"}`}</dd>
                        </div>
                        <div>
                            <dt>Người gửi</dt>
                            <dd>{record.user?.username ?? "Chưa rõ"}</dd>
                        </div>
                        <div>
                            <dt>Thời gian</dt>
                            <dd>{formatTime(record.finishTime)}</dd>
                        </div>
                        <div>
                            <dt>Gửi lúc</dt>
                            <dd>{formatDate(record.createdAt)}</dd>
                        </div>
                    </dl>
                    {record.description && (
                        <p className="info-desc">{record.description}</p>
                    )}
                </div>

                <div className="admin-video">
                    <video controls src={record.videoUrl} />
                </div>
            </div>

            {showRejectForm && (
                <div className="reject-form">
                    <label>
                        Lý do từ chối (tuỳ chọn)
                        <textarea
                            rows={3}
                            placeholder="Nhập lý do để người dùng biết..."
                            value={rejectReason}
                            onChange={(event) => setRejectReason(event.target.value)}
                            disabled={isProcessing}
                        />
                    </label>
                    <div className="admin-actions">
                        <button
                            type="button"
                            className="ghost-btn"
                            onClick={handleCancelReject}
                            disabled={isProcessing}
                        >
                            Huỷ
                        </button>
                        <button
                            type="button"
                            className="ghost-btn danger"
                            onClick={handleRejectSubmit}
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Đang xử lý..." : "Xác nhận từ chối"}
                        </button>
                    </div>
                </div>
            )}

            {!showRejectForm && (
                <div className="admin-actions">
                    <button
                        type="button"
                        className="ghost-btn danger"
                        onClick={() => setShowRejectForm(true)}
                        disabled={isProcessing}
                    >
                        Từ chối
                    </button>
                    <button type="button" onClick={onApprove} disabled={isProcessing}>
                        {isProcessing ? "Đang duyệt..." : "Duyệt & đăng"}
                    </button>
                </div>
            )}
        </article>
    );
}
