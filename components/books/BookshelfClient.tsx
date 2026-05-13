"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { BookshelfFiltersCard } from "@/components/bookshelf/BookshelfFiltersCard";
import { BookshelfListHeader } from "@/components/bookshelf/BookshelfListHeader";
import { BookshelfBooksList } from "@/components/bookshelf/BookshelfBooksList";
import {
    buildExportText,
    buildPagination,
    PAGE_SIZE_OPTIONS,
    sortBooks,
    type SortKey,
} from "@/components/bookshelf/bookshelfUtils";
import { BookRow, CustomList, Membership, Tag } from "@/types/types";

type RawTag = {
    id?: string;
    name?: string;
    color?: string;
    tag_id?: string;
    tag_name?: string;
    tag_color?: string;
    label?: string;
};

type RawBookTagLink = {
    tag_id?: string;
    tags?: unknown;
};

type BookWithTagVariants = BookRow & {
    tags?: unknown;
    book_tags?: unknown;
};

function normalizeBookTags(rawTags: unknown): Tag[] {
    const parsed =
        typeof rawTags === "string"
            ? (() => {
                  try {
                      return JSON.parse(rawTags) as unknown;
                  } catch {
                      return [];
                  }
              })()
            : rawTags;

    const candidates = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object"
          ? [parsed]
          : [];

    return candidates
        .map((raw): Tag | null => {
            if (typeof raw === "string") {
                const name = raw.trim();
                if (!name) return null;
                return {
                    id: `name:${name.toLowerCase()}`,
                    name,
                    color: "#e5e7eb",
                };
            }

            if (!raw || typeof raw !== "object") return null;

            const candidate = raw as RawTag;
            const name =
                candidate.name ?? candidate.tag_name ?? candidate.label;
            if (!name) return null;

            const id =
                candidate.id ??
                candidate.tag_id ??
                `name:${name.toLowerCase()}`;

            return {
                id,
                name,
                color: candidate.color ?? candidate.tag_color ?? "#e5e7eb",
            };
        })
        .filter((tag): tag is Tag => tag !== null);
}

function normalizeBooks(incoming: BookRow[]): BookRow[] {
    return incoming.map((book) => {
        const source = book as BookWithTagVariants;

        const tagsFromBookTags = Array.isArray(source.book_tags)
            ? source.book_tags
                  .map((entry) => {
                      if (!entry || typeof entry !== "object") return null;
                      const link = entry as RawBookTagLink;

                      if (link.tags !== undefined) return link.tags;
                      if (link.tag_id) return { id: link.tag_id };
                      return null;
                  })
                  .filter((value): value is unknown => value !== null)
            : [];

        const normalized = normalizeBookTags(
            tagsFromBookTags.length > 0 ? tagsFromBookTags : source.tags,
        );

        return {
            ...book,
            tags: normalized,
        };
    });
}

type Props = {
    initialBooks: BookRow[];
    lists: CustomList[];
    memberships: Membership[];
};

export function BookshelfClient({ initialBooks, lists, memberships }: Props) {
    const [books, setBooks] = useState(() => normalizeBooks(initialBooks));
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
        setBooks(normalizeBooks(initialBooks));
    }, [initialBooks]);

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
        ownership,
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

    async function exportCurrentList() {
        if (filtered.length === 0) {
            toast.error("Nothing to export", {
                description: "There are no books in this view.",
            });
            return;
        }

        const titles = filtered.map(
            (book) =>
                `'${book.title}' by ${book.author_names || "Unknown author"}`,
        );
        const text = buildExportText(selectedListName, titles);

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
            <BookshelfFiltersCard
                q={q}
                author={author}
                series={series}
                status={status}
                ownership={ownership}
                selectedTag={selectedTag}
                sortKey={sortKey}
                allTags={allTags}
                onQChange={setQ}
                onAuthorChange={setAuthor}
                onSeriesChange={setSeries}
                onStatusChange={setStatus}
                onOwnershipChange={setOwnership}
                onTagChange={setSelectedTag}
                onSortChange={setSortKey}
                onClear={() => {
                    setQ("");
                    setAuthor("");
                    setSeries("");
                    setStatus("");
                    setSelectedTag("");
                    setSelectedList("all");
                    setSortKey("updated_desc");
                    setPage(1);
                    setOwnership("");
                }}
            />

            <Card className="rounded-3xl shadow-sm">
                <BookshelfListHeader
                    filteredCount={filtered.length}
                    selectedList={selectedList}
                    selectedListName={selectedListName}
                    startIndex={startIndex}
                    pageSize={pageSize}
                    customLists={customLists}
                    showCreateList={showCreateList}
                    newListName={newListName}
                    listActionPending={listActionPending}
                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                    onExport={() => void exportCurrentList()}
                    onPageSizeChange={setPageSize}
                    onDeleteSelectedList={() => void deleteSelectedList()}
                    onSelectedListChange={setSelectedList}
                    onToggleCreateList={() =>
                        setShowCreateList((prev) => !prev)
                    }
                    onNewListNameChange={setNewListName}
                    onCreateList={() => void createList()}
                    onCancelCreateList={() => {
                        setShowCreateList(false);
                        setNewListName("");
                    }}
                />

                <CardContent>
                    <BookshelfBooksList
                        books={paginated}
                        customLists={customLists}
                        selectedList={selectedList}
                        selectedListName={selectedListName}
                        selectedListIsEmpty={selectedListIsEmpty}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        paginationItems={paginationItems}
                        membershipPending={membershipPending}
                        onPageChange={setPage}
                        onStatusChange={(bookId, next) => {
                            setBooks((prev) =>
                                prev.map((book) =>
                                    book.id === bookId
                                        ? {
                                              ...book,
                                              derived_status: next,
                                              read:
                                                  next === "unread"
                                                      ? false
                                                      : next === "read"
                                                        ? true
                                                        : book.read ||
                                                          book.derived_status ===
                                                              "read",
                                              reread_count:
                                                  next === "unread"
                                                      ? 0
                                                      : next === "read"
                                                        ? book.read ||
                                                          book.derived_status ===
                                                              "read" ||
                                                          book.reread_count > 0
                                                            ? book.reread_count +
                                                              1
                                                            : 0
                                                        : book.reread_count,
                                          }
                                        : book,
                                ),
                            );
                        }}
                        onBookInList={bookInList}
                        onAddBookToList={(bookId, listId) =>
                            void addBookToList(bookId, listId)
                        }
                        onRemoveBookFromList={(bookId, listId) =>
                            void removeBookFromList(bookId, listId)
                        }
                        onBrowseAllBooks={() => setSelectedList("all")}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
