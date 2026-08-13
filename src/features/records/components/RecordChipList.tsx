import { formatTime } from "../../../utils/format.js";
import type { RecordDto } from "../types.js";

interface RecordChipListProps {
    records: RecordDto[];
    selectedRecordId: number | null;
    onSelect: (id: number) => void;
    variant?: "strip" | "sidebar";
}

export default function RecordChipList({
    records,
    selectedRecordId,
    onSelect,
    variant = "strip",
}: RecordChipListProps) {
    const isSidebar = variant === "sidebar";

    return (
        <div
            className={
                isSidebar
                    ? "record-strip record-strip--sidebar"
                    : "record-strip"
            }
        >
            {records.map((record, index) => {
                const isActive = selectedRecordId === record.id;

                if (isSidebar) {
                    return (
                        <button
                            key={record.id}
                            type="button"
                            className={
                                isActive
                                    ? "record-chip record-chip--sidebar active"
                                    : "record-chip record-chip--sidebar"
                            }
                            onClick={() => onSelect(record.id)}
                        >
                            <span className="record-chip-rank">
                                #{index + 1}
                            </span>
                            <span className="record-chip-body">
                                <strong>{record.map?.name ?? "—"}</strong>
                                <small>
                                    {record.user?.username ?? "Chưa rõ"} ·{" "}
                                    {formatTime(record.finishTime)}
                                </small>
                            </span>
                        </button>
                    );
                }

                return (
                    <button
                        key={record.id}
                        type="button"
                        className={isActive ? "record-chip active" : "record-chip"}
                        onClick={() => onSelect(record.id)}
                    >
                        <span>#{index + 1}</span>
                        <strong>{record.map?.name}</strong>
                        <b>{formatTime(record.finishTime)}</b>
                    </button>
                );
            })}
        </div>
    );
}
