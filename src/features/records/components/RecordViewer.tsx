import RecordChipList from "./RecordChipList.js";
import type { RecordDto } from "../types.js";

interface RecordViewerProps {
    isLoading: boolean;
    records: RecordDto[];
    selectedRecord: RecordDto | null;
    selectedRecordId: number | null;
    onSelectRecord: (id: number) => void;
}

export default function RecordViewer({
    isLoading,
    records,
    selectedRecord,
    selectedRecordId,
    onSelectRecord,
}: RecordViewerProps) {
    if (isLoading) {
        return <div className="empty-state">Đang tải dữ liệu...</div>;
    }

    if (!selectedRecord) {
        return (
            <div className="empty-state">
                Không có video phù hợp bộ lọc hiện tại.
            </div>
        );
    }

    return (
        <>
            <video
                key={selectedRecord.videoUrl}
                controls
                poster={selectedRecord.thumbnailUrl ?? undefined}
            >
                <source src={selectedRecord.videoUrl} />
            </video>

            <RecordChipList
                records={records}
                selectedRecordId={selectedRecordId ?? selectedRecord.id}
                onSelect={onSelectRecord}
            />
        </>
    );
}
