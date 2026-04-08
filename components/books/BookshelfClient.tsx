"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ListPlus, Plus, Share2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/books/StarRating";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookRow, CustomList, Membership, Tag } from "@/types/types";

type Props = {
    initialBooks: BookRow[];
    lists: CustomList[];
    memberships: Membership[];
};

type SortKey =
    | "updated_desc"
    | "title_asc"
    | "title_desc"
    | "author_asc"
    | "rating_desc"
    | "year_desc"
    | "year_asc"
    | "status";

const PAGE_SIZE_OPTIONS = [12, 24, 48];

const statusStyles: Record<
    BookRow["derived_status"],
    { bar: string; bg: string; label: string; text: string }
> = {
    read: {
        bar: "bg-emerald-500",
        bg: "bg-emerald-50/50",
        label: "Read",
        text: "text-emerald-700",
    },
    reading: {
        bar: "bg-amber-500",
        bg: "bg-amber-50/50",
        label: "Reading",
        text: "text-amber-700",
    },
    unread: {
        bar: "bg-slate-300",
        bg: "bg-background",
        label: "Unread",
        text: "text-slate-500",
    },
};

const statusSortValue: Record<BookRow["derived_status"], number> = {
    reading: 0,
    unread: 1,
    read: 2,
};

function getStatusCopy(book: BookRow) {
    const base = statusStyles[book.derived_status].label;

    if (book.reread_count > 0) {
        return `${base} • ${book.reread_count} reread${
            book.reread_count === 1 ? "" : "s"
        }`;
    }

    return base;
}

function sortBooks(books: BookRow[], sortKey: SortKey) {
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
                    statusSortValue[a.derived_status] -
                    statusSortValue[b.derived_status]
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

function buildPagination(currentPage: number, totalPages: number) {
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

export function BookshelfClient({ initialBooks, lists, memberships }: Props) {
    const [books, setBooks] = useState(initialBooks);
    const [customLists, setCustomLists] = useState(
        [...lists].sort((a, b) => a.sort_order - b.sort_order),
    );
    const [listMemberships, setListMemberships] = useState(memberships);

    const [q, setQ] = useState("");
    const [author, setAuthor] = useState("");
    const [series, setSeries] = useState("");
    const [status, setStatus] = useState("");
    const [selectedTag, setSelectedTag] = useState("");
    const [selectedList, setSelectedList] = useState<string>("all");
    const [sortKey, setSortKey] = useState<SortKey>("updated_desc");
    const [pageSize, setPageSize] = useState(24);
    const [page, setPage] = useState(1);
    const [ownership, setOwnership] = useState("");

    const [newListName, setNewListName] = useState("");
    const [showCreateList, setShowCreateList] = useState(false);
    const [listActionPending, setListActionPending] = useState(false);
    const [membershipPending, setMembershipPending] = useState<
        Record<string, boolean>
    >({});

    useEffect(() => {
        setPage(1);
    }, [
        q,
        author,
        series,
        status,
        selectedTag,
        selectedList,
        sortKey,
        pageSize,
    ]);

    const allTags = useMemo(() => {
        const seen = new Map<string, Tag>();

        for (const book of books) {
            for (const tag of book.tags ?? []) {
                seen.set(tag.id, tag);
            }
        }

        return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [books]);

    const selectedListMemberships = useMemo(() => {
        if (selectedList === "all") return [];
        return listMemberships.filter((m) => m.custom_list_id === selectedList);
    }, [listMemberships, selectedList]);

    const filtered = useMemo(() => {
        let next = [...books];

        if (selectedList !== "all") {
            const allowed = new Set(
                listMemberships
                    .filter((m) => m.custom_list_id === selectedList)
                    .map((m) => m.book_id),
            );
            next = next.filter((b) => allowed.has(b.id));
        }

        if (q) {
            const needle = q.toLowerCase();
            next = next.filter(
                (b) =>
                    b.title.toLowerCase().includes(needle) ||
                    b.author_names.toLowerCase().includes(needle),
            );
        }

        if (author) {
            const needle = author.toLowerCase();
            next = next.filter((b) =>
                b.author_names.toLowerCase().includes(needle),
            );
        }

        if (series) {
            const needle = series.toLowerCase();
            next = next.filter((b) =>
                (b.series_name ?? "").toLowerCase().includes(needle),
            );
        }

        if (status) {
            next = next.filter((b) => b.derived_status === status);
        }

        if (selectedTag) {
            next = next.filter((b) =>
                b.tags?.some((t: Tag) => t.name === selectedTag),
            );
        }

        if (ownership === "owned") {
            next = next.filter((b) => b.owned);
        }

        if (ownership === "not_owned") {
            next = next.filter((b) => !b.owned);
        }

        return sortBooks(next, sortKey);
    }, [
        books,
        listMemberships,
        selectedList,
        q,
        author,
        series,
        status,
        selectedTag,
        sortKey,
        ownership,
    ]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);
    const paginationItems = buildPagination(currentPage, totalPages);

    const selectedListName =
        selectedList === "all"
            ? "All books"
            : (customLists.find((list) => list.id === selectedList)?.name ??
              "Custom list");

    const selectedListIsEmpty =
        selectedList !== "all" && selectedListMemberships.length === 0;

    function bookInList(bookId: string, listId: string) {
        return listMemberships.some(
            (membership) =>
                membership.custom_list_id === listId &&
                membership.book_id === bookId,
        );
    }

    function buildExportText() {
        return `${selectedListName}\n\n${filtered
            .map(
                (book) =>
                    `'${book.title}' by ${book.author_names || "Unknown author"}`,
            )
            .join("\n")}`;
    }

    async function exportCurrentList() {
        if (filtered.length === 0) {
            toast.error("Nothing to export", {
                description: "There are no books in this view.",
            });
            return;
        }

        const text = buildExportText();

        const canUseNativeShare =
            typeof navigator !== "undefined" &&
            typeof navigator.share === "function" &&
            typeof window !== "undefined" &&
            window.matchMedia("(pointer: coarse)").matches;

        if (canUseNativeShare) {
            try {
                await navigator.share({
                    title: selectedListName,
                    text,
                });
                return;
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === "AbortError"
                ) {
                    return;
                }
            }
        }

        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard", {
                description: `${selectedListName} has been copied.`,
            });
        } catch {
            toast.error("Copy failed", {
                description: "Clipboard access was not available.",
            });
        }
    }

    async function createList() {
        const name = newListName.trim();
        if (!name || listActionPending) return;

        setListActionPending(true);

        try {
            const optimisticId = `temp-${crypto.randomUUID()}`;
            const optimisticList: CustomList = {
                id: optimisticId,
                name,
                sort_order: customLists.length + 1,
            };

            setCustomLists((prev) => [...prev, optimisticList]);
            setSelectedList(optimisticId);
            setNewListName("");
            setShowCreateList(false);

            const response = await fetch("/api/custom-lists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error("Failed to create list.");
            }

            const created = (await response.json()) as { list: CustomList };

            setCustomLists((prev) =>
                prev.map((list) =>
                    list.id === optimisticId ? created.list : list,
                ),
            );
            setSelectedList(created.list.id);
        } catch (error) {
            console.error(error);
            setCustomLists((prev) =>
                prev.filter((list) => !list.id.startsWith("temp-")),
            );
            setSelectedList("all");
            toast.error("Could not create list");
        } finally {
            setListActionPending(false);
        }
    }

    async function deleteSelectedList() {
        if (selectedList === "all" || listActionPending) return;

        const targetList = customLists.find((list) => list.id === selectedList);
        if (!targetList) return;

        const confirmed = window.confirm(
            `Delete the list “${targetList.name}”?`,
        );
        if (!confirmed) return;

        const priorLists = customLists;
        const priorMemberships = listMemberships;
        const deletingId = selectedList;

        setListActionPending(true);
        setCustomLists((prev) => prev.filter((list) => list.id !== deletingId));
        setListMemberships((prev) =>
            prev.filter((m) => m.custom_list_id !== deletingId),
        );
        setSelectedList("all");

        try {
            const response = await fetch(`/api/custom-lists/${deletingId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete list.");
            }

            toast.success("List deleted");
        } catch (error) {
            console.error(error);
            setCustomLists(priorLists);
            setListMemberships(priorMemberships);
            setSelectedList(deletingId);
            toast.error("Could not delete list");
        } finally {
            setListActionPending(false);
        }
    }

    async function addBookToList(bookId: string, listId: string) {
        const key = `${listId}:${bookId}`;
        if (membershipPending[key]) return;

        const exists = listMemberships.some(
            (m) => m.custom_list_id === listId && m.book_id === bookId,
        );
        if (exists) return;

        setMembershipPending((prev) => ({ ...prev, [key]: true }));
        setListMemberships((prev) => [
            ...prev,
            { custom_list_id: listId, book_id: bookId },
        ]);

        try {
            const response = await fetch(`/api/custom-lists/${listId}/books`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookId }),
            });

            if (!response.ok) {
                throw new Error("Failed to add book to list.");
            }
        } catch (error) {
            console.error(error);
            setListMemberships((prev) =>
                prev.filter(
                    (m) =>
                        !(m.custom_list_id === listId && m.book_id === bookId),
                ),
            );
            toast.error("Could not add book to list");
        } finally {
            setMembershipPending((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }

    async function removeBookFromList(bookId: string, listId: string) {
        const key = `${listId}:${bookId}`;
        if (membershipPending[key]) return;

        const priorMemberships = listMemberships;
        setMembershipPending((prev) => ({ ...prev, [key]: true }));
        setListMemberships((prev) =>
            prev.filter(
                (m) => !(m.custom_list_id === listId && m.book_id === bookId),
            ),
        );

        try {
            const response = await fetch(
                `/api/custom-lists/${listId}/books/${bookId}`,
                {
                    method: "DELETE",
                },
            );

            if (!response.ok) {
                throw new Error("Failed to remove book from list.");
            }
        } catch (error) {
            console.error(error);
            setListMemberships(priorMemberships);
            toast.error("Could not remove book from list");
        } finally {
            setMembershipPending((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }

    return (
        <div className="grid gap-6">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle>Search and filters</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[260px] flex-[2_1_420px]">
                            <Input
                                placeholder="Search title or author"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>

                        <div className="min-w-[180px] flex-[1_1_220px]">
                            <Input
                                placeholder="Filter author"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                            />
                        </div>

                        <div className="min-w-[180px] flex-[1_1_220px]">
                            <Input
                                placeholder="Filter series"
                                value={series}
                                onChange={(e) => setSeries(e.target.value)}
                            />
                        </div>

                        <div className="min-w-[160px] flex-[1_1_180px]">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Any status</option>
                                <option value="unread">Unread</option>
                                <option value="reading">Reading</option>
                                <option value="read">Read</option>
                            </select>
                        </div>

                        <div className="min-w-[160px] flex-[1_1_180px]">
                            <select
                                value={ownership}
                                onChange={(e) => setOwnership(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Any ownership</option>
                                <option value="owned">Owned</option>
                                <option value="not_owned">Not owned</option>
                            </select>
                        </div>

                        <div className="min-w-[160px] flex-[1_1_180px]">
                            <select
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Any tag</option>
                                {allTags.map((tag) => (
                                    <option key={tag.id} value={tag.name}>
                                        {tag.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="min-w-[180px] flex-[1_1_220px]">
                            <select
                                value={sortKey}
                                onChange={(e) =>
                                    setSortKey(e.target.value as SortKey)
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="updated_desc">
                                    Recently updated
                                </option>
                                <option value="title_asc">Title A–Z</option>
                                <option value="title_desc">Title Z–A</option>
                                <option value="author_asc">Author A–Z</option>
                                <option value="rating_desc">
                                    Highest rated
                                </option>
                                <option value="year_desc">
                                    Newest publication year
                                </option>
                                <option value="year_asc">
                                    Oldest publication year
                                </option>
                                <option value="status">Status</option>
                            </select>
                        </div>

                        <div className="flex-[0_0_auto]">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setQ("");
                                    setAuthor("");
                                    setSeries("");
                                    setStatus("");
                                    setSelectedTag("");
                                    setSelectedList("all");
                                    setSortKey("updated_desc");
                                    setPage(1);
                                    setOwnership("");
                                }}>
                                Clear
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
                <CardHeader className="gap-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <CardTitle>Books</CardTitle>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={exportCurrentList}
                                disabled={filtered.length === 0}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Export
                            </Button>

                            <select
                                value={pageSize}
                                onChange={(e) =>
                                    setPageSize(Number(e.target.value))
                                }
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size} per page
                                    </option>
                                ))}
                            </select>

                            {selectedList !== "all" ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={deleteSelectedList}
                                    disabled={listActionPending}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete list
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    <div className="rounded-3xl border bg-card/60 p-3 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1 overflow-hidden">
                                <Tabs
                                    value={selectedList}
                                    onValueChange={setSelectedList}>
                                    <div className="overflow-x-auto pb-1">
                                        <TabsList className="inline-flex h-auto min-w-max gap-2 rounded-2xl bg-transparent p-0">
                                            <TabsTrigger
                                                value="all"
                                                className="rounded-full border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                                All books
                                            </TabsTrigger>

                                            {customLists.map((list) => (
                                                <TabsTrigger
                                                    key={list.id}
                                                    value={list.id}
                                                    className="rounded-full border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                                    {list.name}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>
                                </Tabs>
                            </div>

                            <div className="shrink-0 pl-1">
                                <Button
                                    type="button"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={() =>
                                        setShowCreateList((prev) => !prev)
                                    }
                                    aria-label="Create list">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {showCreateList ? (
                            <div className="mt-3 flex flex-col gap-2 rounded-2xl border bg-background/70 p-3 sm:flex-row">
                                <Input
                                    value={newListName}
                                    onChange={(e) =>
                                        setNewListName(e.target.value)
                                    }
                                    placeholder="New list name"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            void createList();
                                        }
                                    }}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={() => void createList()}
                                        disabled={
                                            !newListName.trim() ||
                                            listActionPending
                                        }>
                                        Create list
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setShowCreateList(false);
                                            setNewListName("");
                                        }}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium">
                                    Current list: {selectedListName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {filtered.length} matching book
                                    {filtered.length === 1 ? "" : "s"}
                                    {selectedList !== "all"
                                        ? ` in ${selectedListName}`
                                        : ""}
                                </p>
                            </div>

                            {filtered.length > 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1}–
                                    {Math.min(
                                        startIndex + pageSize,
                                        filtered.length,
                                    )}{" "}
                                    of {filtered.length}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {selectedListIsEmpty ? (
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
                                        Add books directly from the cards below
                                        while browsing All books, or clear your
                                        filters to find books faster.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setSelectedList("all")}>
                                    Browse all books
                                </Button>
                            </div>
                        </div>
                    ) : paginated.length ? (
                        <div className="grid gap-3">
                            {paginated.map((book) => {
                                const style = statusStyles[book.derived_status];
                                const statusCopy = getStatusCopy(book);
                                const inSelectedList =
                                    selectedList !== "all"
                                        ? bookInList(book.id, selectedList)
                                        : false;

                                return (
                                    <div
                                        key={book.id}
                                        className={`flex overflow-hidden rounded-2xl border ${style.bg}`}>
                                        <div
                                            className={`w-1.5 shrink-0 ${style.bar}`}
                                            aria-hidden="true"
                                        />

                                        <div className="flex-1 p-4">
                                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                <div className="space-y-3">
                                                    <div className="space-y-1">
                                                        <p className="text-xl font-medium flex items-center">
                                                            {book.title}
                                                            <span
                                                                className={`rounded-full shadow ml-4 px-2.5 py-1 text-sm font-medium ${
                                                                    book.owned
                                                                        ? "bg-sky-100 text-sky-700"
                                                                        : "bg-slate-100 text-slate-600"
                                                                }`}>
                                                                {book.owned
                                                                    ? "Owned"
                                                                    : "Not owned"}
                                                            </span>
                                                        </p>
                                                        <p
                                                            className={`text-xs font-medium ${style.text}`}>
                                                            {statusCopy}
                                                        </p>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground">
                                                        {book.author_names ||
                                                            "Unknown author"}
                                                        {book.publication_year
                                                            ? `, ${book.publication_year}`
                                                            : ""}
                                                    </p>

                                                    {book.series_name ? (
                                                        <p className="text-sm text-muted-foreground">
                                                            Series:{" "}
                                                            {book.series_name}
                                                        </p>
                                                    ) : null}

                                                    <StarRating
                                                        rating={
                                                            book.personal_rating
                                                        }
                                                    />

                                                    {book.tags?.length ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {book.tags.map(
                                                                (tag: Tag) => (
                                                                    <span
                                                                        key={
                                                                            tag.id
                                                                        }
                                                                        className="rounded-full px-2.5 py-1 text-xs"
                                                                        style={{
                                                                            backgroundColor:
                                                                                tag.color,
                                                                            color: "#111827",
                                                                        }}>
                                                                        {
                                                                            tag.name
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <div className="flex w-full flex-col gap-2 xl:w-auto xl:min-w-[320px] xl:items-end">
                                                    <div className="flex flex-wrap gap-2 xl:justify-end">
                                                        <Button
                                                            asChild
                                                            variant="secondary">
                                                            <Link
                                                                href={`/books/${book.id}/edit`}>
                                                                Edit
                                                            </Link>
                                                        </Button>

                                                        <StatusMenu
                                                            bookId={book.id}
                                                            status={
                                                                book.derived_status
                                                            }
                                                            onStatusChange={(
                                                                next,
                                                            ) => {
                                                                setBooks(
                                                                    (prev) =>
                                                                        prev.map(
                                                                            (
                                                                                b,
                                                                            ) =>
                                                                                b.id ===
                                                                                book.id
                                                                                    ? {
                                                                                          ...b,
                                                                                          derived_status:
                                                                                              next,
                                                                                          reread_count:
                                                                                              next ===
                                                                                                  "read" &&
                                                                                              b.derived_status ===
                                                                                                  "read"
                                                                                                  ? b.reread_count +
                                                                                                    1
                                                                                                  : next ===
                                                                                                      "unread"
                                                                                                    ? 0
                                                                                                    : b.reread_count,
                                                                                      }
                                                                                    : b,
                                                                        ),
                                                                );
                                                            }}
                                                        />
                                                    </div>

                                                    {selectedList === "all" ? (
                                                        <div className="rounded-2xl border bg-background/70 p-3">
                                                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                                                Add to list
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {customLists.length ? (
                                                                    customLists.map(
                                                                        (
                                                                            list,
                                                                        ) => {
                                                                            const included =
                                                                                bookInList(
                                                                                    book.id,
                                                                                    list.id,
                                                                                );
                                                                            const pending =
                                                                                membershipPending[
                                                                                    `${list.id}:${book.id}`
                                                                                ];

                                                                            return (
                                                                                <Button
                                                                                    key={
                                                                                        list.id
                                                                                    }
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant={
                                                                                        included
                                                                                            ? "secondary"
                                                                                            : "outline"
                                                                                    }
                                                                                    disabled={
                                                                                        included ||
                                                                                        pending
                                                                                    }
                                                                                    onClick={() =>
                                                                                        void addBookToList(
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
                                                                        },
                                                                    )
                                                                ) : (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Create a
                                                                        custom
                                                                        list to
                                                                        start
                                                                        organising
                                                                        books.
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
                                                                            void removeBookFromList(
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
                                                                        Remove
                                                                        from{" "}
                                                                        {
                                                                            selectedListName
                                                                        }
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            void addBookToList(
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
                                                                        Add to{" "}
                                                                        {
                                                                            selectedListName
                                                                        }
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No books match this filter.
                        </p>
                    )}

                    {filtered.length > 0 ? (
                        <div className="mt-6 border-t pt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setPage((prev) =>
                                                    Math.max(1, prev - 1),
                                                );
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
                                                <PaginationItem
                                                    key={`ellipsis-${index}`}>
                                                    <PaginationEllipsis />
                                                </PaginationItem>
                                            );
                                        }

                                        return (
                                            <PaginationItem key={item}>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={
                                                        currentPage === item
                                                    }
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setPage(item);
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
                                                setPage((prev) =>
                                                    Math.min(
                                                        totalPages,
                                                        prev + 1,
                                                    ),
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
                    ) : null}
                </CardContent>
            </Card>
        </div>
    );
}
