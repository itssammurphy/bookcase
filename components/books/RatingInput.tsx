"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type RatingInputProps = {
    name?: string;
    initialValue?: number | null;
};

const VALUES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function RatingInput({
    name = "personal_rating",
    initialValue = null,
}: RatingInputProps) {
    const [value, setValue] = useState<number | null>(initialValue);
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const displayValue = hoverValue ?? value;

    function renderStar(index: number) {
        const starNumber = index + 1;
        const filled = displayValue !== null && displayValue >= starNumber;
        const halfFilled =
            displayValue !== null &&
            displayValue >= starNumber - 0.5 &&
            displayValue < starNumber;

        return (
            <button
                key={starNumber}
                type="button"
                className="relative h-8 w-8"
                onMouseLeave={() => setHoverValue(null)}
                onClick={() => setValue(starNumber)}
                aria-label={`Set rating to ${starNumber}`}>
                <Star
                    className={cn(
                        "h-8 w-8",
                        filled
                            ? "fill-amber-500 text-amber-500"
                            : "text-muted-foreground",
                    )}
                />

                {halfFilled ? (
                    <span className="absolute inset-0 overflow-hidden w-1/2">
                        <Star className="h-8 w-8 fill-amber-500 text-amber-500" />
                    </span>
                ) : null}
            </button>
        );
    }

    return (
        <div className="grid gap-2">
            <input
                type="hidden"
                name={name}
                value={value === null ? "" : value.toString()}
                readOnly
            />

            <div className="flex flex-wrap items-center gap-3">
                <div
                    className="flex items-center gap-1"
                    onMouseLeave={() => setHoverValue(null)}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex"
                            onMouseEnter={() => setHoverValue(i + 0.5)}>
                            <button
                                type="button"
                                className="relative -mr-4 h-8 w-4 z-10"
                                onClick={() => setValue(i + 0.5)}
                                aria-label={`Set rating to ${i + 0.5}`}
                            />
                            <div onMouseEnter={() => setHoverValue(i + 1)}>
                                {renderStar(i)}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setValue(null)}
                    className="text-sm text-muted-foreground underline underline-offset-4">
                    Clear
                </button>
            </div>

            <p className="text-xs text-muted-foreground">
                {value === null ? "No rating" : `${value} / 5`}
            </p>
        </div>
    );
}
