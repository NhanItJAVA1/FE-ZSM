import type { PendingRecord } from "../../features/zsm/records/types.js";

const STORAGE_KEY = "zsm_pending_records";

function readAll(): PendingRecord[] {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw) as PendingRecord[];

        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeAll(records: PendingRecord[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export const pendingRecordStorage = {
    getPending(): PendingRecord[] {
        return readAll().filter((record) => record.status === "pending");
    },

    add(record: PendingRecord): void {
        const all = readAll();
        all.unshift(record);
        writeAll(all);
    },

    approve(id: string): PendingRecord | null {
        const all = readAll();
        const index = all.findIndex((record) => record.id === id);

        if (index === -1) {
            return null;
        }

        const target = all[index];

        if (!target) {
            return null;
        }

        target.status = "approved";
        writeAll(all);

        return target;
    },

    reject(id: string): void {
        const all = readAll();
        const index = all.findIndex((record) => record.id === id);

        if (index === -1) {
            return;
        }

        const target = all[index];

        if (!target) {
            return;
        }

        target.status = "rejected";
        writeAll(all);
    },

    remove(id: string): void {
        writeAll(readAll().filter((record) => record.id !== id));
    },
};
