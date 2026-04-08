import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { requireAppContext } from "@/lib/supabase/appContext";
import { replaceBookTags } from "@/lib/books/saveTags";
import { replaceBookAuthors } from "@/lib/books/saveAuthors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditBookPageProps, ReadStatus } from "@/types/types";
import { parseBookFormData } from "@/lib/books/formData";
import { BookDetailsFields } from "@/components/books/BookDetailsFields";
import {
    markBookRead,
    markBookReading,
    markBookUnread,
} from "@/app/books/actions";

async function updateBook(bookId: string, formData: FormData) {
    "use server";

    const { supabase, user } = await requireAppContext();

    const {
        title,
        publicationYear,
        personalRating,
        privateNotes,
        rawTags,
        rawAuthors,
        owned,
    } = parseBookFormData(formData, { includeOwned: true });

    if (!title) return;

    const { error } = await supabase
        .from("books")
        .update({
            title,
            publication_year: publicationYear,
            personal_rating: personalRating,
            private_notes: privateNotes,
            owned,
        })
        .eq("id", bookId)
        .eq("user_id", user.id);

    if (error) {
        throw new Error(error.message);
    }

    await replaceBookTags({
        supabase,
        userId: user.id,
        bookId,
        rawTags,
    });

    await replaceBookAuthors({
        supabase,
        userId: user.id,
        bookId,
        rawAuthors,
    });

    redirect("/bookshelf");
}

async function deleteBook(bookId: string) {
    "use server";

    const { supabase, user } = await requireAppContext();

    const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId)
        .eq("user_id", user.id);

    if (error) {
        throw new Error(error.message);
    }

    redirect("/bookshelf");
}

export default async function EditBookPage({ params }: EditBookPageProps) {
    const { id } = await params;

    const { supabase, user } = await requireAppContext();

    const [{ data: book, error }, { data: reads, error: readsError }] =
        await Promise.all([
            supabase
                .from("books")
                .select(
                    `
                    id,
                    title,
                    publication_year,
                    personal_rating,
                    private_notes,
                    favourite,
                    owned,
                    book_tags (
                        tag_id,
                        tags (
                            name,
                            color
                        )
                    ),
                    book_authors (
                        author_order,
                        authors (
                            name
                        )
                    )
                    `,
                )
                .eq("id", id)
                .eq("user_id", user.id)
                .single(),
            supabase
                .from("book_reads")
                .select("id, started_at, finished_at")
                .eq("book_id", id)
                .eq("user_id", user.id)
                .order("created_at", { ascending: true }),
        ]);

    if (error || !book) {
        notFound();
    }

    if (readsError) {
        throw new Error(readsError.message);
    }

    const existingTags: { name: string; color?: string | null }[] =
        Array.isArray(book.book_tags)
            ? book.book_tags
                  .map((row) => {
                      const tag = Array.isArray(row.tags)
                          ? row.tags[0]
                          : row.tags;
                      if (!tag || typeof tag.name !== "string") return null;

                      return {
                          name: tag.name,
                          color: tag.color ?? null,
                      };
                  })
                  .filter(
                      (tag): tag is { name: string; color: string | null } =>
                          tag !== null,
                  )
            : [];

    const existingAuthors: { name: string }[] = Array.isArray(book.book_authors)
        ? [...book.book_authors]
              .sort(
                  (a, b) => (a.author_order ?? 9999) - (b.author_order ?? 9999),
              )
              .map((row) => {
                  const author = Array.isArray(row.authors)
                      ? row.authors[0]
                      : row.authors;
                  if (!author || typeof author.name !== "string") return null;

                  return {
                      name: author.name,
                  };
              })
              .filter((author): author is { name: string } => author !== null)
        : [];

    const finishedReadCount =
        reads?.filter((read) => Boolean(read.finished_at)).length ?? 0;
    const hasActiveRead =
        reads?.some((read) => Boolean(read.started_at) && !read.finished_at) ??
        false;

    const currentStatus: ReadStatus = hasActiveRead
        ? "reading"
        : finishedReadCount > 0
          ? "read"
          : "unread";

    const rereadCount = Math.max(finishedReadCount - 1, 0);

    const statusStyles: Record<
        ReadStatus,
        { bar: string; bg: string; text: string; label: string }
    > = {
        unread: {
            bar: "bg-slate-300",
            bg: "bg-background",
            text: "text-slate-500",
            label: "Unread",
        },
        reading: {
            bar: "bg-amber-500",
            bg: "bg-amber-50/50",
            text: "text-amber-700",
            label: "Reading",
        },
        read: {
            bar: "bg-emerald-500",
            bg: "bg-emerald-50/50",
            text: "text-emerald-700",
            label: "Read",
        },
    };

    const currentStyle = statusStyles[currentStatus];

    const statusCopy =
        currentStatus === "read" && rereadCount > 0
            ? `Read • ${rereadCount} reread${rereadCount === 1 ? "" : "s"}`
            : statusStyles[currentStatus].label;

    const updateBookWithId = updateBook.bind(null, id);
    const deleteBookWithId = deleteBook.bind(null, id);
    const markUnreadWithId = markBookUnread.bind(null, id, `/books/${id}/edit`);
    const markReadingWithId = markBookReading.bind(
        null,
        id,
        `/books/${id}/edit`,
    );
    const markReadWithId = markBookRead.bind(null, id, `/books/${id}/edit`);

    return (
        <AppShell title="Edit book" subtitle="Update this library entry">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle>Reading status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        className={`flex overflow-hidden rounded-2xl border ${currentStyle.bg}`}>
                        <div
                            className={`w-1.5 shrink-0 ${currentStyle.bar}`}
                            aria-hidden="true"
                        />
                        <div className="flex-1 p-4">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-lg font-medium">
                                        {book.title}
                                    </p>
                                    <p
                                        className={`text-xs font-medium ${currentStyle.text}`}>
                                        {statusCopy}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {finishedReadCount} completed read
                                        {finishedReadCount === 1 ? "" : "s"}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <form action={markUnreadWithId}>
                                        <Button
                                            type="submit"
                                            variant={
                                                currentStatus === "unread"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                            disabled={
                                                currentStatus === "unread"
                                            }>
                                            Unread
                                        </Button>
                                    </form>

                                    <form action={markReadingWithId}>
                                        <Button
                                            type="submit"
                                            variant={
                                                currentStatus === "reading"
                                                    ? "default"
                                                    : "secondary"
                                            }
                                            disabled={
                                                currentStatus === "reading"
                                            }>
                                            Reading
                                        </Button>
                                    </form>

                                    <form action={markReadWithId}>
                                        <Button
                                            type="submit"
                                            variant={
                                                currentStatus === "read"
                                                    ? "default"
                                                    : "secondary"
                                            }>
                                            Read
                                        </Button>
                                    </form>

                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Use{" "}
                                    <span className="font-medium">Read</span> to
                                    finish a current read or mark the book as
                                    completed.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle>Book details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={updateBookWithId} className="grid gap-6">
                        <BookDetailsFields
                            initialTitle={book.title}
                            initialAuthors={existingAuthors}
                            initialPublicationYear={book.publication_year}
                            initialRating={book.personal_rating}
                            initialTags={existingTags}
                            initialPrivateNotes={book.private_notes}
                            showOwnership
                            isOwned={book.owned === true}
                        />

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button type="submit">Save changes</Button>
                        </div>
                    </form>

                    <form action={deleteBookWithId} className="mt-6 grid">
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button type="submit" variant="destructive">
                                Delete book
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppShell>
    );
}
