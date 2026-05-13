import Link from "next/link";
import { ListPlus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookCard } from "@/components/books/BookCard";
import { StatusMenu } from "@/components/books/StatusMenu";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import type { BookRow, CustomList } from "@/types/types";

type BookshelfBooksListProps = {
    books: BookRow[];
    customLists: CustomList[];
    selectedList: string;
    selectedListName: string;
    selectedListIsEmpty: boolean;
    currentPage: number;
    totalPages: number;
    paginationItems: readonly (number | "ellipsis")[] | (number | "ellipsis")[];
    membershipPending: Record<string, boolean>;
    onPageChange: (page: number) => void;
    onStatusChange: (bookId: string, next: BookRow["derived_status"]) => void;
    onBookInList: (bookId: string, listId: string) => boolean;
    onAddBookToList: (bookId: string, listId: string) => void;
    onRemoveBookFromList: (bookId: string, listId: string) => void;
    onBrowseAllBooks: () => void;
};

export function BookshelfBooksList({
    books,
    customLists,
    selectedList,
    selectedListName,
    selectedListIsEmpty,
    currentPage,
    totalPages,
    paginationItems,
    membershipPending,
    onPageChange,
    onStatusChange,
    onBookInList,
    onAddBookToList,
    onRemoveBookFromList,
    onBrowseAllBooks,
}: BookshelfBooksListProps) {
    if (selectedListIsEmpty) {
        return (
            <div className="rounded-3xl border border-dashed p-8 text-center">
                <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                    <div className="rounded-full bg-muted p-3">
                        <ListPlus className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-base font-medium">
                            This list is empty
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Add books directly from the cards below while
                            browsing All books, or clear your filters to find
                            books faster.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onBrowseAllBooks}>
                        Browse all books
                    </Button>
                </div>
            </div>
        );
    }

    if (!books.length) {
        return (
            <p className="text-sm text-muted-foreground">
                No books match this filter.
            </p>
        );
    }

    return (
        <div className="grid gap-3">
            {books.map((book) => {
                const inSelectedList =
                    selectedList !== "all"
                        ? onBookInList(book.id, selectedList)
                        : false;

                return (
                    <BookCard
                        key={book.id}
                        book={book}
                        showOwnership
                        actionArea={
                            <>
                                <Button asChild variant="secondary">
                                    <Link href={`/books/${book.id}/edit`}>
                                        Edit
                                    </Link>
                                </Button>

                                <StatusMenu
                                    bookId={book.id}
                                    status={book.derived_status}
                                    onStatusChange={(next) =>
                                        onStatusChange(book.id, next)
                                    }
                                />
                            </>
                        }
                        listArea={
                            selectedList === "all" ? (
                                <div className="rounded-2xl border bg-background/70 p-3">
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                                        Add to list
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {customLists.length ? (
                                            customLists.map((list) => {
                                                const included = onBookInList(
                                                    book.id,
                                                    list.id,
                                                );
                                                const pending =
                                                    membershipPending[
                                                        `${list.id}:${book.id}`
                                                    ];

                                                return (
                                                    <Button
                                                        key={list.id}
                                                        type="button"
                                                        size="sm"
                                                        variant={
                                                            included
                                                                ? "secondary"
                                                                : "outline"
                                                        }
                                                        disabled={
                                                            included || pending
                                                        }
                                                        onClick={() =>
                                                            onAddBookToList(
                                                                book.id,
                                                                list.id,
                                                            )
                                                        }
                                                        className="rounded-full">
                                                        {included
                                                            ? `${list.name} added`
                                                            : `Add to ${list.name}`}
                                                    </Button>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                Create a custom list to start
                                                organising books.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border bg-background/70 p-3">
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                                        List actions
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {inSelectedList ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    onRemoveBookFromList(
                                                        book.id,
                                                        selectedList,
                                                    )
                                                }
                                                disabled={
                                                    membershipPending[
                                                        `${selectedList}:${book.id}`
                                                    ]
                                                }>
                                                <X className="mr-2 h-4 w-4" />
                                                Remove from {selectedListName}
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    onAddBookToList(
                                                        book.id,
                                                        selectedList,
                                                    )
                                                }
                                                disabled={
                                                    membershipPending[
                                                        `${selectedList}:${book.id}`
                                                    ]
                                                }>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add to {selectedListName}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        }
                    />
                );
            })}

            <div className="mt-6 border-t pt-4">
                <p className="mb-3 text-sm text-muted-foreground">
                    Showing {books.length}{" "}
                    {books.length === 1 ? "book" : "books"}
                </p>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onPageChange(Math.max(1, currentPage - 1));
                                }}
                                className={
                                    currentPage <= 1
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                }
                            />
                        </PaginationItem>

                        {paginationItems.map((item, index) => {
                            if (item === "ellipsis") {
                                return (
                                    <PaginationItem key={`ellipsis-${index}`}>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                );
                            }

                            return (
                                <PaginationItem key={item}>
                                    <PaginationLink
                                        href="#"
                                        isActive={currentPage === item}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onPageChange(item);
                                        }}>
                                        {item}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        })}

                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onPageChange(
                                        Math.min(totalPages, currentPage + 1),
                                    );
                                }}
                                className={
                                    currentPage >= totalPages
                                        ? "pointer-events-none opacity-50"
                                        : "cursor-pointer"
                                }
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}
