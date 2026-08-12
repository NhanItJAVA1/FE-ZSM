export function formatTime(seconds: number | null | undefined): string {
    const value = Number(seconds);

    if (!Number.isFinite(value)) {
        return "--:--.---";
    }

    const minutes = Math.floor(value / 60);
    const remaining = value - minutes * 60;

    return `${minutes}:${remaining.toFixed(3).padStart(6, "0")}`;
}

export function formatDate(value: string | null | undefined): string {
    if (!value) {
        return "Chưa rõ";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

export function formatToday(): string {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date());
}

export function secondsToTimeSpan(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const wholeSeconds = Math.floor(seconds);
    const millis = Math.round((seconds - wholeSeconds) * 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export function parseFinishTimeInput(input: string): number | null {
    const trimmed = input.trim();

    if (!trimmed) {
        return null;
    }

    if (trimmed.includes(":")) {
        const [minPart, secPart] = trimmed.split(":");
        const minutes = Number(minPart);
        const seconds = Number(secPart);

        if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
            return null;
        }

        return minutes * 60 + seconds;
    }

    const value = Number(trimmed);

    return Number.isFinite(value) ? value : null;
}
