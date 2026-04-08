import {
    bookStatusSortValue,
    type BookReadStatus,
} from "@/components/books/bookStatus";
import type { BookRow } from "@/types/types";

export type SortKey =
    | "updated_desc"
    | "title_asc"
    | "title_desc"
    | "author_asc"
    | "rating_desc"
    | "year_desc"
    | "year_asc"
    | "status";

export const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export function sortBooks(books: BookRow[], sortKey: SortKey) {
    const next = [...books];

    next.sort((a, b) => {
        switch (sortKey) {
            case "title_asc":
                return a.title.localeCompare(b.title);
            case "title_desc":
                return b.title.localeCompare(a.title);
            case "author_asc":
                return a.author_names.localeCompare(b.author_names);
            case "rating_desc":
                return (b.personal_rating ?? -1) - (a.personal_rating ?? -1);
            case "year_desc":
                return (
                    (b.publication_year ?? -Infinity) -
                    (a.publication_year ?? -Infinity)
                );
            case "year_asc":
                return (
                    (a.publication_year ?? Infinity) -
                    (b.publication_year ?? Infinity)
                );
            case "status":
                return (
                    bookStatusSortValue[a.derived_status as BookReadStatus] -
                    bookStatusSortValue[b.derived_status as BookReadStatus]
                );
            case "updated_desc":
            default:
                return (
                    new Date(b.updated_at).getTime() -
                    new Date(a.updated_at).getTime()
                );
        }
    });

    return next;
}

export function buildPagination(currentPage: number, totalPages: number) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3, 4, "ellipsis", totalPages] as const;
    }

    if (currentPage >= totalPages - 2) {
        return [
            1,
            "ellipsis",
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages,
        ] as const;
    }

    return [
        1,
        "ellipsis",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "ellipsis",
        totalPages,
    ] as const;
}

export function buildExportText(selectedListName: string, titles: string[]) {
    return `${selectedListName}\n\n${titles.join("\n")}`;
}
