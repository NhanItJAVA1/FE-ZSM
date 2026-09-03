import "../style/StarRating.css";

interface StarRatingProps {
    value: number;
    onChange?: (value: number) => void;
    clearable?: boolean;
    readOnly?: boolean;
}

export default function StarRating({
    value,
    onChange,
    clearable = false,
    readOnly = false,
}: StarRatingProps) {
    return (
        <div
            className={`star-rating${readOnly ? " read-only" : ""}`}
            data-no-particle
        >
            {Array.from({ length: 7 }, (_, index) => {
                const star = index + 1;
                const isActive = star <= value;

                if (readOnly) {
                    return (
                        <span
                            key={star}
                            className={isActive ? "star active" : "star"}
                            aria-hidden="true"
                        >
                            ★
                        </span>
                    );
                }

                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => {
                            if (clearable && star === value) {
                                onChange?.(0);
                                return;
                            }

                            onChange?.(star);
                        }}
                        className={isActive ? "star active" : "star"}
                    >
                        ★
                    </button>
                );
            })}
        </div>
    );
}