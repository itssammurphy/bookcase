import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/books/StarRating";
import { AuthorProgressStatus } from "@/types/types";

type Props = {
    id: string;
    name: string;
    totalBooks: number;
    averageRating: number | null;
    booksRead: number;
};

const progressStyles: Record<
    AuthorProgressStatus,
    { bar: string; bg: string; text: string; label: string; fill: string }
> = {
    all_read: {
        bar: "bg-emerald-500",
        bg: "bg-emerald-50/50",
        text: "text-emerald-700",
        label: "All read",
        fill: "bg-emerald-500",
    },
    some_read: {
        bar: "bg-amber-500",
        bg: "bg-amber-50/50",
        text: "text-amber-700",
        label: "Some read",
        fill: "bg-amber-500",
    },
    none_read: {
        bar: "bg-slate-300",
        bg: "bg-background",
        text: "text-slate-500",
        label: "None read",
        fill: "bg-slate-400",
    },
};

function getProgressStatus(
    booksRead: number,
    totalBooks: number,
): AuthorProgressStatus {
    if (totalBooks > 0 && booksRead >= totalBooks) {
        return "all_read";
    }

    if (booksRead > 0) {
        return "some_read";
    }

    return "none_read";
}

function getProgressPercent(booksRead: number, totalBooks: number) {
    if (totalBooks <= 0) return 0;
    return Math.max(0, Math.min(100, (booksRead / totalBooks) * 100));
}

export function AuthorCard({
    id,
    name,
    totalBooks,
    averageRating,
    booksRead,
}: Props) {
    const status = getProgressStatus(booksRead, totalBooks);
    const style = progressStyles[status];
    const progress = getProgressPercent(booksRead, totalBooks);

    return (
        <div className={`flex overflow-hidden rounded-2xl border ${style.bg}`}>
            <div className={`w-1.5 shrink-0 ${style.bar}`} aria-hidden="true" />

            <div className="flex-1 p-4">
                <div className="flex h-full flex-col gap-4">
                    <div className="space-y-2">
                        <div className="space-y-1">
                            <p className="text-lg font-medium">{name}</p>
                            <p className={`text-xs font-medium ${style.text}`}>
                                {style.label}
                            </p>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {booksRead}/{totalBooks} books read
                        </p>

                        <div className="space-y-1.5">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className={`h-full rounded-full transition-all ${style.fill}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {Math.round(progress)}% complete
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                                Average rating
                            </p>
                            <StarRating rating={averageRating} />
                        </div>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2">
                        <Button asChild variant="secondary">
                            <Link href={`/authors/${id}`}>Open</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
