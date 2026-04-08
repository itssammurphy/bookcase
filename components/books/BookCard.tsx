import type { ReactNode } from "react";
import { StarRating } from "@/components/books/StarRating";
import {
    bookStatusStyles,
    getBookStatusCopy,
    getCompletedReadCount,
} from "@/components/books/bookStatus";
import type { Tag } from "@/types/types";

type BookCardBook = {
    id: string;
    title: string;
    author_names: string;
    publication_year: number | null;
    series_name: string | null;
    personal_rating: number | null;
    derived_status: "read" | "reading" | "unread";
    reread_count: number;
    read?: boolean;
    owned?: boolean;
    tags?: Tag[];
};

type BookCardProps = {
    book: BookCardBook;
    actionArea?: ReactNode;
    listArea?: ReactNode;
    showOwnership?: boolean;
    showTags?: boolean;
    showCompletedReads?: boolean;
    titleClassName?: string;
};

export function BookCard({
    book,
    actionArea,
    listArea,
    showOwnership = false,
    showTags = true,
    showCompletedReads = false,
    titleClassName = "text-xl font-medium flex items-center",
}: BookCardProps) {
    const style = bookStatusStyles[book.derived_status];
    const statusCopy = getBookStatusCopy(book);
    const completedReads = getCompletedReadCount(book);

    return (
        <div className={`flex overflow-hidden rounded-2xl border ${style.bg}`}>
            <div className={`w-1.5 shrink-0 ${style.bar}`} aria-hidden="true" />

            <div className="flex-1 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <p className={titleClassName}>
                                {book.title}
                                {showOwnership ? (
                                    <span
                                        className={`rounded-full shadow ml-4 px-2.5 py-1 text-sm font-medium ${
                                            book.owned
                                                ? "bg-sky-100 text-sky-700"
                                                : "bg-slate-100 text-slate-600"
                                        }`}>
                                        {book.owned ? "Owned" : "Not owned"}
                                    </span>
                                ) : null}
                            </p>
                            <p className={`text-xs font-medium ${style.text}`}>
                                {statusCopy}
                            </p>
                            {showCompletedReads && completedReads > 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    {completedReads} completed read
                                    {completedReads === 1 ? "" : "s"}
                                </p>
                            ) : null}
                        </div>

                        <p className="text-sm text-muted-foreground">
                            {book.author_names || "Unknown author"}
                            {book.publication_year
                                ? `, ${book.publication_year}`
                                : ""}
                        </p>

                        {book.series_name ? (
                            <p className="text-sm text-muted-foreground">
                                Series: {book.series_name}
                            </p>
                        ) : null}

                        <StarRating rating={book.personal_rating} />

                        {showTags && book.tags?.length ? (
                            <div className="flex flex-wrap gap-2">
                                {book.tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="rounded-full px-2.5 py-1 text-xs"
                                        style={{
                                            backgroundColor: tag.color,
                                            color: "#111827",
                                        }}>
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {actionArea || listArea ? (
                        <div className="flex w-full flex-col gap-2 xl:w-auto xl:min-w-[320px] xl:items-end">
                            {actionArea ? (
                                <div className="flex flex-wrap gap-2 xl:justify-end">
                                    {actionArea}
                                </div>
                            ) : null}
                            {listArea}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
