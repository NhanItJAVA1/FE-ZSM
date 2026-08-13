import type { ReactNode } from "react";
import StarRating from "../../../components/ui/StarRating.js";
import EmptyState from "../../../components/ui/EmptyState.js";
import { formatTime } from "../../../utils/format.js";
import type { RecordDto } from "../types.js";
import RecordViewerSkeleton from "./RecordViewerSkeleton.js";

interface RecordViewerProps {
    isLoading: boolean;
    selectedRecord: RecordDto | null;
    emptyAction?: ReactNode;
}

function parseMapRate(rate: string | undefined): number {
    const parsed = Number.parseInt(rate ?? "", 10);

    return Number.isFinite(parsed) ? parsed : 0;
}

export default function RecordViewer({
    isLoading,
    selectedRecord,
    emptyAction,
}: RecordViewerProps) {
    if (isLoading) {
        return <RecordViewerSkeleton />;
    }

    if (!selectedRecord) {
        return (
            <EmptyState
                title="Chưa có video phù hợp"
                description="Thử đổi map, xe hoặc bộ lọc rate để xem thêm kỷ lục."
                action={emptyAction}
            />
        );
    }

    return (
        <>
            <div className="video-shell">
                <div className="video-shell-inner">
                    <video
                        key={selectedRecord.videoUrl}
                        controls
                        preload="metadata"
                        playsInline
                        poster={selectedRecord.thumbnailUrl ?? undefined}
                        src={selectedRecord.videoUrl}
                    />
                </div>
            </div>

            <div className="viewer-meta">
                <span>{selectedRecord.map?.name ?? "—"}</span>
                <span className="viewer-meta-sep" aria-hidden="true">
                    |
                </span>
                <span>{selectedRecord.user?.username ?? "Chưa rõ"}</span>
                <span className="viewer-meta-sep" aria-hidden="true">
                    |
                </span>
                <StarRating
                    readOnly
                    value={parseMapRate(selectedRecord.map?.rate)}
                />
                <span className="viewer-meta-sep" aria-hidden="true">
                    |
                </span>
                <span className="viewer-meta-time">
                    {formatTime(selectedRecord.finishTime)}
                </span>
                <span className="viewer-meta-sep" aria-hidden="true">
                    |
                </span>
                <span>{selectedRecord.vehicle?.name ?? "—"}</span>
            </div>
        </>
    );
}
