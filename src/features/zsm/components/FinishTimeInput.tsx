import { useRef } from "react";

interface FinishTimeInputProps {
    minutes: string;
    seconds: string;
    millis: string;
    onMinutesChange: (value: string) => void;
    onSecondsChange: (value: string) => void;
    onMillisChange: (value: string) => void;
}

function digitsOnly(value: string, maxLen: number): string {
    return value.replace(/\D/g, "").slice(0, maxLen);
}

function normalizeSeconds(value: string): string {
    const digits = digitsOnly(value, 2);

    if (digits === "" || Number(digits) <= 59) {
        return digits;
    }

    return digits.slice(0, 1);
}

export default function FinishTimeInput({
    minutes,
    seconds,
    millis,
    onMinutesChange,
    onSecondsChange,
    onMillisChange,
}: FinishTimeInputProps) {
    const secRef = useRef<HTMLInputElement>(null);
    const msRef = useRef<HTMLInputElement>(null);

    function handleMinutes(value: string) {
        const cleaned = digitsOnly(value, 3);
        onMinutesChange(cleaned);

        if (cleaned.length >= 3) {
            secRef.current?.focus();
        }
    }

    function handleSeconds(value: string) {
        const cleaned = normalizeSeconds(value);
        onSecondsChange(cleaned);

        if (cleaned.length >= 2) {
            msRef.current?.focus();
        }
    }

    function handleMillis(value: string) {
        const cleaned = digitsOnly(value, 3);
        onMillisChange(cleaned);
    }

    return (
        <div className="finish-time-input">
            <span className="finish-time-label">Thời gian hoàn thành</span>
            <div className="finish-time-fields">
                <div className="finish-time-segment">
                    <input
                        type="text"
                        inputMode="numeric"
                        value={minutes}
                        onChange={(e) => handleMinutes(e.target.value)}
                        placeholder="0"
                        maxLength={3}
                        className="finish-time-field finish-time-min"
                        aria-label="Phút"
                    />
                    <span className="finish-time-unit">phút</span>
                </div>
                <span className="finish-time-sep" aria-hidden="true">:</span>
                <div className="finish-time-segment">
                    <input
                        ref={secRef}
                        type="text"
                        inputMode="numeric"
                        value={seconds}
                        onChange={(e) => handleSeconds(e.target.value)}
                        placeholder="00"
                        maxLength={2}
                        className="finish-time-field finish-time-sec"
                        aria-label="Giây"
                    />
                    <span className="finish-time-unit">giây</span>
                </div>
                <span className="finish-time-sep finish-time-dot" aria-hidden="true">.</span>
                <div className="finish-time-segment">
                    <input
                        ref={msRef}
                        type="text"
                        inputMode="numeric"
                        value={millis}
                        onChange={(e) => handleMillis(e.target.value)}
                        placeholder="000"
                        maxLength={3}
                        className="finish-time-field finish-time-ms"
                        aria-label="Mili giây"
                    />
                    <span className="finish-time-unit">ms</span>
                </div>
            </div>
        </div>
    );
}
