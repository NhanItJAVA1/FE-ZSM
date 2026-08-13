import type { ReactNode } from "react";

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export default function EmptyState({
    title,
    description,
    action,
    className = "",
}: EmptyStateProps) {
    return (
        <div className={`empty-state empty-state--composed ${className}`.trim()}>
            <p className="empty-state-title">{title}</p>
            {description && <p className="empty-state-desc">{description}</p>}
            {action}
        </div>
    );
}
