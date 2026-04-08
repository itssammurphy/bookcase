import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StarRating } from "@/components/books/StarRating";
import {
    DerivedBookRow,
    AuthorIndividualPageProps,
    AuthorBookRow,
    BookReadRow,
    AuthorStatsRow,
} from "@/types/types";

const statusStyles: Record<
    DerivedBookRow["derived_status"],
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

function getStatusCopy(book: DerivedBookRow) {
    const base = statusStyles[book.derived_status].label;

    if (book.derived_status === "read" && book.reread_count > 0) {
        return `${base} • ${book.reread_count} reread${
            book.reread_count === 1 ? "" : "s"
        }`;
    }

    return base;
}

async function deleteAuthor(authorId: string) {
    "use server";

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const { error: linkError } = await supabase
        .from("book_authors")
        .delete()
        .eq("user_id", user.id)
        .eq("author_id", authorId);

    if (linkError) {
        throw new Error(linkError.message);
    }

    const { error: authorError } = await supabase
        .from("authors")
        .delete()
        .eq("user_id", user.id)
        .eq("id", authorId);

    if (authorError) {
        throw new Error(authorError.message);
    }

    redirect("/authors");
}

export default async function AuthorPage({
    params,
}: AuthorIndividualPageProps) {
    const { id } = await params;

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const [
        { data: author, error: authorError },
        { data: bookLinks, error: booksError },
    ] = await Promise.all([
        supabase
            .from("author_stats")
            .select("*")
            .eq("user_id", user.id)
            .eq("author_id", id)
            .single<AuthorStatsRow>(),
        supabase
            .from("book_authors")
            .select(
                `
                author_order,
                books (
                    id,
                    title,
                    personal_rating,
                    favourite,
                    publication_year
                )
                `,
            )
            .eq("user_id", user.id)
            .eq("author_id", id)
            .order("author_order", { ascending: true }),
    ]);

    if (authorError || !author) {
        notFound();
    }

    if (booksError) {
        throw new Error(booksError.message);
    }

    const baseBooks: AuthorBookRow[] = (bookLinks ?? [])
        .map((row) => {
            const book = Array.isArray(row.books) ? row.books[0] : row.books;
            return book as AuthorBookRow | null;
        })
        .filter((book): book is AuthorBookRow => book !== null)
        .sort((a, b) => a.title.localeCompare(b.title));

    const bookIds = baseBooks.map((book) => book.id);

    let reads: BookReadRow[] = [];
    if (bookIds.length > 0) {
        const { data: readsData, error: readsError } = await supabase
            .from("book_reads")
            .select("book_id, started_at, finished_at")
            .eq("user_id", user.id)
            .in("book_id", bookIds);

        if (readsError) {
            throw new Error(readsError.message);
        }

        reads = readsData ?? [];
    }

    const readsByBook = new Map<string, BookReadRow[]>();
    for (const read of reads) {
        const existing = readsByBook.get(read.book_id) ?? [];
        existing.push(read);
        readsByBook.set(read.book_id, existing);
    }

    const books: DerivedBookRow[] = baseBooks.map((book) => {
        const bookReads = readsByBook.get(book.id) ?? [];
        const finishedCount = bookReads.filter(
            (read) => !!read.finished_at,
        ).length;
        const hasActiveRead = bookReads.some(
            (read) => !!read.started_at && !read.finished_at,
        );

        const derived_status: DerivedBookRow["derived_status"] = hasActiveRead
            ? "reading"
            : finishedCount > 0
              ? "read"
              : "unread";

        return {
            ...book,
            derived_status,
            reread_count: Math.max(finishedCount - 1, 0),
        };
    });

    const deleteAuthorWithId = deleteAuthor.bind(null, id);

    return (
        <AppShell title={author.name} subtitle="Author details">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle>{author.name}</CardTitle>
                        <CardDescription>
                            {author.total_books} book
                            {author.total_books === 1 ? "" : "s"} ·{" "}
                            {author.books_read} read
                        </CardDescription>
                    </div>

                    <form action={deleteAuthorWithId}>
                        <Button type="submit" variant="destructive">
                            Delete author
                        </Button>
                    </form>
                </CardHeader>
            </Card>

            <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Books</CardTitle>
                    <Button asChild variant="secondary">
                        <Link href="/authors">Back to authors</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {books.length > 0 ? (
                        <div className="grid gap-3">
                            {books.map((book) => {
                                const style = statusStyles[book.derived_status];
                                const statusCopy = getStatusCopy(book);

                                return (
                                    <div
                                        key={book.id}
                                        className={`flex overflow-hidden rounded-2xl border ${style.bg}`}>
                                        <div
                                            className={`w-1.5 shrink-0 ${style.bar}`}
                                            aria-hidden="true"
                                        />

                                        <div className="flex-1 p-4">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="space-y-2">
                                                    <div className="space-y-1">
                                                        <p className="text-lg font-medium">
                                                            {book.title}
                                                        </p>
                                                        <p
                                                            className={`text-xs font-medium ${style.text}`}>
                                                            {statusCopy}
                                                        </p>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground">
                                                        {author.name}
                                                        {book.publication_year
                                                            ? `, ${book.publication_year}`
                                                            : ""}
                                                    </p>

                                                    <StarRating
                                                        rating={
                                                            book.personal_rating
                                                        }
                                                    />
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        asChild
                                                        variant="secondary">
                                                        <Link
                                                            href={`/books/${book.id}/edit`}>
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No books found for this author.
                        </p>
                    )}
                </CardContent>
            </Card>
        </AppShell>
    );
}
