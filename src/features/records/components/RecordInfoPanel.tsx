import { formatDate, formatTime } from "../../../utils/format.js";
import type { RecordDto } from "../types.js";

interface RecordInfoPanelProps {
    record: RecordDto | null;
}

export default function RecordInfoPanel({ record }: RecordInfoPanelProps) {
    return (
        <aside className="info-panel">
            <div className="section-heading">
                <p className="eyebrow">Thông tin kỷ lục</p>
                <h2>{record?.title ?? "Chưa chọn video"}</h2>
            </div>

            {record ? (
                <>
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
                            <dt>Ngày đăng</dt>
                            <dd>{formatDate(record.createdAt)}</dd>
                        </div>
                        <div>
                            <dt>Người đua</dt>
                            <dd>{record.user?.username ?? "Chưa rõ"}</dd>
                        </div>
                        <div>
                            <dt>Xe</dt>
                            <dd>{record.vehicle?.name ?? "—"}</dd>
                        </div>
                    </dl>

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
