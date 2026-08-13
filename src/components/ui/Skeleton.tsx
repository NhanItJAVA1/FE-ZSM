import type { CSSProperties } from "react";

interface SkeletonProps {
    className?: string;
    style?: CSSProperties;
}

export default function Skeleton({ className = "", style }: SkeletonProps) {
    return (
        <span
            className={`skeleton ${className}`.trim()}
            aria-hidden="true"
            style={style}
        />
    );
}
