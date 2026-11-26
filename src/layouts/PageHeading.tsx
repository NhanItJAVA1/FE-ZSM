interface PageHeadingProps {
    eyebrow: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export default function PageHeading({
    eyebrow,
    title,
    description,
    action,
    className,
}: PageHeadingProps) {
    return (
        <section className={`page-heading${className ? ` ${className}` : ""}`}>
            <div>
                <p className="eyebrow">{eyebrow}</p>
                <h1>{title}</h1>
                {description && <p className="hero-copy">{description}</p>}
            </div>
            {action}
        </section>
    );
}
