import { useEffect, useMemo, useState } from "react";

type PixelAnimationProps = {
    folder?: string;
    frameCount?: number;
    frames?: readonly string[];
    intervalMs?: number;
    className?: string;
};

export default function PixelAnimation({
    folder = "Idle",
    frameCount = 4,
    frames: customFrames,
    intervalMs = 120,
    className = "h-[52px] w-auto object-contain",
}: PixelAnimationProps) {
    const frames = useMemo(() => {
        if (customFrames?.length) {
            return [...customFrames];
        }

        return Array.from(
            { length: frameCount },
            (_, index) => `/animations/${folder}/${index + 1}.png`
        );
    }, [customFrames, folder, frameCount]);

    const [currentFrame, setCurrentFrame] = useState(0);

    useEffect(() => {
        setCurrentFrame(0);
    }, [frames]);

    useEffect(() => {
        if (frames.length === 0) {
            return;
        }

        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % frames.length);
        }, intervalMs);

        return () => clearInterval(interval);
    }, [frames, intervalMs]);

    if (frames.length === 0) {
        return null;
    }

    return (
        <img
            src={frames[currentFrame]}
            alt=""
            aria-hidden="true"
            className={className}
        />
    );
}
