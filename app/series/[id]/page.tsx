import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { SeriesDetailClient } from "@/components/series/SeriesDetailClient";
import { DeleteSeriesButton } from "@/components/series/DeleteSeriesButton";
import { SeriesDetailPageProps, BookStatus } from "@/types/types";

export default async function SeriesDetailPage({
    params,
}: SeriesDetailPageProps) {
    const { id } = await params;

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    async function deleteSeries() {
        "use server";

        const actionSupabase = await createServerSupabaseClient();
        const {
            data: { user: actionUser },
        } = await actionSupabase.auth.getUser();

        if (!actionUser) redirect("/");

        const { error: linkError } = await actionSupabase
            .from("series_books")
            .delete()
            .eq("user_id", actionUser.id)
            .eq("series_id", id);

        if (linkError) {
            throw new Error(linkError.message);
        }

        const { error: seriesError } = await actionSupabase
            .from("series")
            .delete()
            .eq("user_id", actionUser.id)
            .eq("id", id);

        if (seriesError) {
            throw new Error(seriesError.message);
        }

        revalidatePath("/series");
        redirect("/series");
    }

    const [
        { data: series, error: seriesError },
        { data: seriesEntries, error: entriesError },
        { data: books, error: booksError },
        { data: bookAuthors, error: bookAuthorsError },
        { data: bookReads, error: bookReadsError },
    ] = await Promise.all([
        supabase
            .from("series")
            .select("id, name, description")
            .eq("id", id)
            .eq("user_id", user.id)
            .single(),

        supabase
            .from("series_books")
            .select("id, chronology_index, book_id")
            .eq("user_id", user.id)
            .eq("series_id", id)
            .order("chronology_index", { ascending: true }),

        supabase
            .from("books")
            .select("id, title, publication_year")
            .eq("user_id", user.id)
            .order("title", { ascending: true }),

        supabase
            .from("book_authors")
            .select(
                `
                book_id,
                author_order,
                authors (
                    name
                )
            `,
            )
            .eq("user_id", user.id)
            .order("author_order", { ascending: true }),

        supabase
            .from("book_reads")
            .select("book_id, started_at, finished_at")
            .eq("user_id", user.id),
    ]);

    if (seriesError || !series) notFound();

    if (entriesError) console.error("entriesError", entriesError);
    if (booksError) console.error("booksError", booksError);
    if (bookAuthorsError) console.error("bookAuthorsError", bookAuthorsError);
    if (bookReadsError) console.error("bookReadsError", bookReadsError);

    const authorNamesByBook = new Map<string, string>();

    const authorsGrouped = new Map<string, string[]>();
    for (const row of bookAuthors ?? []) {
        const author = Array.isArray(row.authors)
            ? row.authors[0]
            : row.authors;
        const authorName = author?.name?.trim();

        if (!authorName) continue;

        const existing = authorsGrouped.get(row.book_id) ?? [];
        existing.push(authorName);
        authorsGrouped.set(row.book_id, existing);
    }

    for (const [bookId, names] of authorsGrouped.entries()) {
        authorNamesByBook.set(bookId, names.join(", "));
    }

    const readStatsByBook = new Map<
        string,
        { derived_status: BookStatus; reread_count: number }
    >();

    const readsGrouped = new Map<
        string,
        Array<{ started_at: string | null; finished_at: string | null }>
    >();

    for (const row of bookReads ?? []) {
        const existing = readsGrouped.get(row.book_id) ?? [];
        existing.push({
            started_at: row.started_at,
            finished_at: row.finished_at,
        });
        readsGrouped.set(row.book_id, existing);
    }

    for (const book of books ?? []) {
        const reads = readsGrouped.get(book.id) ?? [];
        const finishedCount = reads.filter((r) => !!r.finished_at).length;
        const hasActiveRead = reads.some(
            (r) => !!r.started_at && !r.finished_at,
        );

        let derived_status: BookStatus = "unread";
        if (hasActiveRead) {
            derived_status = "reading";
        } else if (finishedCount > 0) {
            derived_status = "read";
        }

        readStatsByBook.set(book.id, {
            derived_status,
            reread_count: Math.max(finishedCount - 1, 0),
        });
    }

    const hydratedBooks =
        books?.map((book) => {
            const stats = readStatsByBook.get(book.id) ?? {
                derived_status: "unread" as BookStatus,
                reread_count: 0,
            };

            return {
                id: book.id,
                title: book.title,
                publication_year: book.publication_year,
                author_names: authorNamesByBook.get(book.id) ?? "",
                derived_status: stats.derived_status,
                reread_count: stats.reread_count,
            };
        }) ?? [];

    const booksById = new Map(hydratedBooks.map((book) => [book.id, book]));

    const normalisedEntries =
        seriesEntries?.map((entry) => ({
            id: entry.id,
            chronology_index: entry.chronology_index,
            book_id: entry.book_id,
            book: booksById.get(entry.book_id) ?? null,
        })) ?? [];

    const existingBookIds = new Set(
        normalisedEntries.map((entry) => entry.book_id),
    );

    const addableBooks = hydratedBooks.filter(
        (book) => !existingBookIds.has(book.id),
    );

    return (
        <AppShell
            title={series.name}
            subtitle={series.description ?? "Series detail"}>
            <Card className="rounded-3xl shadow-sm border-destructive/20">
                <CardHeader>
                    <CardTitle>Series actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Deleting a series removes the series itself and its
                        ordering only. Your books remain in the library.
                    </p>

                    <DeleteSeriesButton
                        seriesName={series.name}
                        deleteAction={deleteSeries}
                        triggerLabel="Delete this series"
                        triggerVariant="destructive"
                    />
                </CardContent>
            </Card>

            <SeriesDetailClient
                seriesId={series.id}
                initialEntries={normalisedEntries}
                addableBooks={addableBooks}
            />

            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle>How this works</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Add books from the search box, then reorder them underneath.
                    Click any book entry to open its edit screen.
                </CardContent>
            </Card>
        </AppShell>
    );
}
