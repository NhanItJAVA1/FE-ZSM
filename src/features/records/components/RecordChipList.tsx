import { formatTime } from "../../../utils/format.js";
import type { RecordDto } from "../types.js";

interface RecordChipListProps {
    records: RecordDto[];
    selectedRecordId: number | null;
    onSelect: (id: number) => void;
}

export default function RecordChipList({
    records,
    selectedRecordId,
    onSelect,
}: RecordChipListProps) {
    return (
        <div className="record-strip">
            {records.map((record, index) => (
                <button
                    key={record.id}
                    type="button"
                    className={
                        selectedRecordId === record.id
                            ? "record-chip active"
                            : "record-chip"
                    }
                    onClick={() => onSelect(record.id)}
                >
                    <span>#{index + 1}</span>
                    <strong>{record.map?.name}</strong>
                    <b>{formatTime(record.finishTime)}</b>
                </button>
            ))}
        </div>
    );
}
