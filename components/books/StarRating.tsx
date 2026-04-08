import { Star } from "lucide-react";

type StarRatingProps = {
    rating: number | null;
};

export function StarRating({ rating }: StarRatingProps) {
    if (rating === null || rating === undefined) {
        return <span className="text-sm text-muted-foreground">No rating</span>;
    }

    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;

    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => {
                if (i < full) {
                    return (
                        <Star
                            key={i}
                            className="h-6 w-6 fill-amber-500 text-amber-500"
                        />
                    );
                }

                if (i === full && half) {
                    return (
                        <div key={i} className="relative h-6 w-6">
                            {/* empty star */}
                            <Star className="h-6 w-6 text-muted-foreground" />

                            {/* half fill */}
                            <div className="absolute inset-0 overflow-hidden w-1/2">
                                <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                            </div>
                        </div>
                    );
                }

                return (
                    <Star key={i} className="h-6 w-6 text-muted-foreground" />
                );
            })}
        </div>
    );
}
