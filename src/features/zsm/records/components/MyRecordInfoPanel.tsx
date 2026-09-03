import { formatDate, formatTime } from "../../../../utils/format.js";
import type { RecordDto } from "../types.js";
import {
    RECORD_STATUS_LABELS,
    normalizeRecordStatus,
} from "../types.js";

interface MyRecordInfoPanelProps {
    record: RecordDto | null;
}

export default function MyRecordInfoPanel({ record }: MyRecordInfoPanelProps) {
    const status = record ? normalizeRecordStatus(record.status) : null;

    return (
        <aside className="info-panel">
            <div className="section-heading">
                <p className="eyebrow">Kỷ lục của bạn</p>
                <h2>{record?.title ?? "Chưa chọn video"}</h2>
            </div>

            {record ? (
                <>
                    {status && (
                        <span className={`status-badge status-${status}`}>
                            {RECORD_STATUS_LABELS[status]}
                        </span>
                    )}

                    <div className="time-badge large">
                        {formatTime(record.finishTime)}
                    </div>

                    <dl className="info-list">
                        <div>
                            <dt>Tên map</dt>
                            <dd>{record.map?.name ?? "—"}</dd>
                        </div>
                        <div>
                            <dt>Rate map</dt>
                            <dd>{record.map?.rate ?? "—"}</dd>
                        </div>
                        <div>
                            <dt>Thời gian hoàn thành</dt>
                            <dd>{formatTime(record.finishTime)}</dd>
                        </div>
                        <div>
                            <dt>Ngày gửi</dt>
                            <dd>{formatDate(record.createdAt)}</dd>
                        </div>
                        <div>
                            <dt>Xe</dt>
                            <dd>{record.vehicle?.name ?? "—"}</dd>
                        </div>
                        <div>
                            <dt>Chế độ</dt>
                            <dd>{record.gameMode?.name ?? "—"}</dd>
                        </div>
                    </dl>

                    {status === "pending" && (
                        <p className="info-desc">
                            Video đang chờ admin duyệt. Sau khi duyệt mới hiện
                            trên trang chủ.
                        </p>
                    )}

                    {status === "rejected" &&
                        (record.rejectionReason || record.rejectReason) && (
                        <div className="rejection-reason">
                            <p className="eyebrow">Lý do từ chối</p>
                            <p>{record.rejectionReason ?? record.rejectReason}</p>
                        </div>
                    )}

                    {record.description && (
                        <p className="info-desc">{record.description}</p>
                    )}
                </>
            ) : (
                <p className="info-desc">
                    Chọn một video hoặc điều chỉnh bộ lọc để xem chi tiết.
                </p>
            )}
        </aside>
    );
}
