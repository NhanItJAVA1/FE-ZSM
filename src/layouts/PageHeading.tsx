interface PageHeadingProps {
    eyebrow: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function PageHeading({
    eyebrow,
    title,
    description,
    action,
}: PageHeadingProps) {
    return (
        <section className="page-heading">
            <div>
                <p className="eyebrow">{eyebrow}</p>
                <h1>{title}</h1>
                {description && <p className="hero-copy">{description}</p>}
            </div>
            {action}
        </section>
    );
}
