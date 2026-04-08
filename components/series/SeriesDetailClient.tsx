"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReadStatus, SeriesEntry } from "@/types/types";

type Props = {
    seriesId: string;
    initialEntries: SeriesEntry[];
    addableBooks: any[];
};

const statusStyles: Record<
    ReadStatus,
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

function getStatusCopy(book: {
    derived_status: ReadStatus;
    reread_count: number;
}) {
    const base = statusStyles[book.derived_status].label;

    if (book.derived_status === "read" && book.reread_count > 0) {
        return `${base} • ${book.reread_count} reread${
            book.reread_count === 1 ? "" : "s"
        }`;
    }

    return base;
}

export function SeriesDetailClient({
    seriesId,
    initialEntries,
    addableBooks,
}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [query, setQuery] = useState("");
    const [entries, setEntries] = useState(initialEntries);

    const filteredBooks = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const alreadyInSeries = new Set(entries.map((entry) => entry.book_id));

        const candidates = addableBooks.filter(
            (book) => !alreadyInSeries.has(book.id),
        );

        if (!needle) {
            return candidates.slice(0, 8);
        }

        return candidates
            .filter((book) => {
                const title = book.title.toLowerCase();
                const author = (book.author_names ?? "").toLowerCase();
                return title.includes(needle) || author.includes(needle);
            })
            .slice(0, 8);
    }, [query, addableBooks, entries]);

    async function addBook(bookId: string) {
        startTransition(async () => {
            const res = await fetch(`/api/series/${seriesId}/books`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ bookId }),
            });

            if (!res.ok) return;

            setQuery("");
            router.refresh();
        });
    }

    async function removeBook(entryId: string) {
        startTransition(async () => {
            const res = await fetch(
                `/api/series/${seriesId}/books/${entryId}`,
                {
                    method: "DELETE",
                },
            );

            if (!res.ok) return;

            setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
            router.refresh();
        });
    }

    async function move(entryId: string, direction: "up" | "down") {
        startTransition(async () => {
            const index = entries.findIndex((entry) => entry.id === entryId);
            if (index === -1) return;
            if (direction === "up" && index === 0) return;
            if (direction === "down" && index === entries.length - 1) return;

            const swapIndex = direction === "up" ? index - 1 : index + 1;
            const next = [...entries];
            [next[index], next[swapIndex]] = [next[swapIndex], next[index]];

            setEntries(
                next.map((entry, i) => ({
                    ...entry,
                    chronology_index: i + 1,
                })),
            );

            const res = await fetch(`/api/series/${seriesId}/reorder`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entries: next.map((entry, i) => ({
                        id: entry.id,
                        chronology_index: i + 1,
                    })),
                }),
            });

            if (!res.ok) {
                router.refresh();
                return;
            }

            router.refresh();
        });
    }

    return (
        <div className="grid gap-6">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle>Add book to series</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                    <Input
                        placeholder="Search for a book to add"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    {query.trim() ? (
                        filteredBooks.length ? (
                            <div className="grid gap-2">
                                {filteredBooks.map((book) => (
                                    <button
                                        key={book.id}
                                        type="button"
                                        onClick={() => addBook(book.id)}
                                        className="flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition hover:bg-muted"
                                        disabled={isPending}>
                                        <div>
                                            <p className="font-medium">
                                                {book.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {book.author_names ||
                                                    "Unknown author"}
                                                {book.publication_year
                                                    ? `, ${book.publication_year}`
                                                    : ""}
                                            </p>
                                        </div>

                                        <span className="text-xs text-muted-foreground">
                                            Add
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No matching books.
                            </p>
                        )
                    ) : null}
                </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle>Series order</CardTitle>
                </CardHeader>
                <CardContent>
                    {entries.length ? (
                        <div className="grid gap-3">
                            {entries.map((entry, index) => {
                                const book = entry.book;
                                if (!book) return null;

                                const style = statusStyles[book.derived_status];
                                const statusCopy = getStatusCopy(book);

                                return (
                                    <div
                                        key={entry.id}
                                        className={`flex overflow-hidden rounded-2xl border ${style.bg}`}>
                                        <div
                                            className={`w-1.5 shrink-0 ${style.bar}`}
                                            aria-hidden="true"
                                        />

                                        <div className="flex flex-1 items-center justify-between gap-4 p-4">
                                            <Link
                                                href={`/books/${book.id}/edit`}
                                                className="min-w-0 flex-1">
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        {index + 1}.{" "}
                                                        {book.title}
                                                    </p>
                                                    <p
                                                        className={`text-xs font-medium ${style.text}`}>
                                                        {statusCopy}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {book.author_names ||
                                                            "Unknown author"}
                                                        {book.publication_year
                                                            ? `, ${book.publication_year}`
                                                            : ""}
                                                    </p>
                                                </div>
                                            </Link>

                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() =>
                                                        move(entry.id, "up")
                                                    }
                                                    disabled={
                                                        index === 0 || isPending
                                                    }>
                                                    Up
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() =>
                                                        move(entry.id, "down")
                                                    }
                                                    disabled={
                                                        index ===
                                                            entries.length -
                                                                1 || isPending
                                                    }>
                                                    Down
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        removeBook(entry.id)
                                                    }
                                                    disabled={isPending}>
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No books in this series yet.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
