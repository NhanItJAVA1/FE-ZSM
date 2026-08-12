import { formatDate, formatTime } from "../../../utils/format.js";
import type { PendingRecord } from "../../records/types.js";

interface PendingRecordCardProps {
    record: PendingRecord;
    isProcessing: boolean;
    onApprove: () => void;
    onReject: () => void;
}

export default function PendingRecordCard({
    record,
    isProcessing,
    onApprove,
    onReject,
}: PendingRecordCardProps) {
    return (
        <article className="admin-card">
            <div className="admin-card-body">
                <div>
                    <p className="eyebrow">Chờ duyệt</p>
                    <h2>{record.title}</h2>
                    <dl className="admin-meta">
                        <div>
                            <dt>Map</dt>
                            <dd>{record.mapName ?? `#${record.mapId}`}</dd>
                        </div>
                        <div>
                            <dt>Xe</dt>
                            <dd>{record.vehicleName ?? `#${record.vehicleId}`}</dd>
                        </div>
                        <div>
                            <dt>Người đua</dt>
                            <dd>{record.racerName}</dd>
                        </div>
                        <div>
                            <dt>Thời gian</dt>
                            <dd>{formatTime(record.finishTimeSeconds)}</dd>
                        </div>
                        <div>
                            <dt>Gửi lúc</dt>
                            <dd>{formatDate(record.submittedAt)}</dd>
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

            <div className="admin-actions">
                <button
                    type="button"
                    className="ghost-btn danger"
                    onClick={onReject}
                    disabled={isProcessing}
                >
                    Từ chối
                </button>
                <button type="button" onClick={onApprove} disabled={isProcessing}>
                    {isProcessing ? "Đang duyệt..." : "Duyệt & đăng"}
                </button>
            </div>
        </article>
    );
}
