import "../style/StarRating.css";

interface StarRatingProps {
    value: number;
    onChange: (value: number) => void;
    clearable?: boolean;
}

export default function StarRating({
    value,
    onChange,
    clearable = false,
}: StarRatingProps) {
    return (
        <div className="star-rating">
            {Array.from({ length: 7 }, (_, index) => {
                const star = index + 1;

                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => {
                            if (clearable && star === value) {
                                onChange(0);
                                return;
                            }

                            onChange(star);
                        }}
                        className={star <= value ? "star active" : "star"}
                    >
                        ★
                    </button>
                );
            })}
        </div>
    );
}