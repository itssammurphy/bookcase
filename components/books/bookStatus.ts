export type BookReadStatus = "read" | "reading" | "unread";

export const bookStatusStyles: Record<
    BookReadStatus,
    { bar: string; bg: string; label: string; text: string; color: string }
> = {
    read: {
        bar: "bg-emerald-500",
        bg: "bg-emerald-50/50",
        label: "Read",
        text: "text-emerald-700",
        color: "#10b981",
    },
    reading: {
        bar: "bg-amber-500",
        bg: "bg-amber-50/50",
        label: "Reading",
        text: "text-amber-700",
        color: "#f59e0b",
    },
    unread: {
        bar: "bg-slate-300",
        bg: "bg-background",
        label: "Unread",
        text: "text-slate-500",
        color: "#cbd5e1",
    },
};

export const bookStatusSortValue: Record<BookReadStatus, number> = {
    reading: 0,
    unread: 1,
    read: 2,
};

export function getBookStatusCopy(book: {
    derived_status: BookReadStatus;
    reread_count: number;
}) {
    const base = bookStatusStyles[book.derived_status].label;

    if (book.reread_count > 0) {
        return `${base} • ${book.reread_count} reread${
            book.reread_count === 1 ? "" : "s"
        }`;
    }

    return base;
}

export function getCompletedReadCount(book: {
    read?: boolean;
    reread_count: number;
}) {
    if (!book.read) return 0;
    return book.reread_count + 1;
}
