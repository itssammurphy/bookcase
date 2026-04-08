import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { replaceBookTags } from "@/lib/books/saveTags";
import { replaceBookAuthors } from "@/lib/books/saveAuthors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TagInput } from "@/components/books/TagInput";
import { RatingInput } from "@/components/books/RatingInput";
import { EditBookPageProps, ReadStatus } from "@/types/types";

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

async function updateBook(bookId: string, formData: FormData) {
    "use server";

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const title = String(formData.get("title") ?? "").trim();
    const publicationYearRaw = String(
        formData.get("publication_year") ?? "",
    ).trim();
    const personalRatingRaw = String(
        formData.get("personal_rating") ?? "",
    ).trim();
    const privateNotes = String(formData.get("private_notes") ?? "").trim();
    const rawTags = String(formData.get("tags") ?? "").trim();
    const rawAuthors = String(formData.get("authors") ?? "").trim();
    const ownedRaw = String(formData.get("owned") ?? "false");
    const owned = ownedRaw === "true";

    if (!title) return;

    const { error } = await supabase
        .from("books")
        .update({
            title,
            publication_year: publicationYearRaw
                ? Number(publicationYearRaw)
                : null,
            personal_rating: personalRatingRaw
                ? Number(personalRatingRaw)
                : null,
            private_notes: privateNotes || null,
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

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

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

async function markUnread(bookId: string) {
    "use server";

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const { error } = await supabase
        .from("book_reads")
        .delete()
        .eq("book_id", bookId)
        .eq("user_id", user.id);

    if (error) {
        throw new Error(error.message);
    }

    redirect(`/books/${bookId}/edit`);
}

async function markReading(bookId: string) {
    "use server";

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const { data: activeRead, error: activeReadError } = await supabase
        .from("book_reads")
        .select("id")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .is("finished_at", null)
        .limit(1)
        .maybeSingle();

    if (activeReadError) {
        throw new Error(activeReadError.message);
    }

    if (!activeRead) {
        const { error } = await supabase.from("book_reads").insert({
            user_id: user.id,
            book_id: bookId,
            started_at: todayIsoDate(),
            finished_at: null,
        });

        if (error) {
            throw new Error(error.message);
        }
    }

    redirect(`/books/${bookId}/edit`);
}

async function markRead(bookId: string) {
    "use server";

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const { data: activeRead, error: activeReadError } = await supabase
        .from("book_reads")
        .select("id")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .is("finished_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (activeReadError) {
        throw new Error(activeReadError.message);
    }

    if (activeRead) {
        const { error } = await supabase
            .from("book_reads")
            .update({
                finished_at: todayIsoDate(),
            })
            .eq("id", activeRead.id)
            .eq("user_id", user.id);

        if (error) {
            throw new Error(error.message);
        }
    } else {
        const { error } = await supabase.from("book_reads").insert({
            user_id: user.id,
            book_id: bookId,
            started_at: todayIsoDate(),
            finished_at: todayIsoDate(),
        });

        if (error) {
            throw new Error(error.message);
        }
    }

    redirect(`/books/${bookId}/edit`);
}

async function markReread(bookId: string) {
    "use server";

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const { error } = await supabase.from("book_reads").insert({
        user_id: user.id,
        book_id: bookId,
        started_at: todayIsoDate(),
        finished_at: todayIsoDate(),
    });

    if (error) {
        throw new Error(error.message);
    }

    redirect(`/books/${bookId}/edit`);
}

export default async function EditBookPage({ params }: EditBookPageProps) {
    const { id } = await params;

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

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
    const markUnreadWithId = markUnread.bind(null, id);
    const markReadingWithId = markReading.bind(null, id);
    const markReadWithId = markRead.bind(null, id);
    const markRereadWithId = markReread.bind(null, id);

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

                                    <form action={markRereadWithId}>
                                        <Button type="submit" variant="outline">
                                            Reread
                                        </Button>
                                    </form>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Use{" "}
                                    <span className="font-medium">Read</span> to
                                    finish a current read or mark the book as
                                    completed. Use{" "}
                                    <span className="font-medium">Reread</span>{" "}
                                    to add another completed read.
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
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                name="title"
                                required
                                defaultValue={book.title}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="authors">Authors</Label>
                            <TagInput
                                name="authors"
                                initialTags={existingAuthors}
                                placeholder="Type an author and press comma"
                            />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Ownership</Label>
                                <div className="flex flex-wrap gap-2">
                                    <label className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm">
                                        <input
                                            type="radio"
                                            name="owned"
                                            value="true"
                                            defaultChecked={book.owned === true}
                                        />
                                        Owned
                                    </label>

                                    <label className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm">
                                        <input
                                            type="radio"
                                            name="owned"
                                            value="false"
                                            defaultChecked={
                                                book.owned === false
                                            }
                                        />
                                        Not owned
                                    </label>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="publication_year">
                                    Publication year
                                </Label>
                                <Input
                                    id="publication_year"
                                    name="publication_year"
                                    inputMode="numeric"
                                    defaultValue={book.publication_year ?? ""}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="personal_rating">Rating</Label>
                            <RatingInput initialValue={book.personal_rating} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tags">Tags</Label>
                            <TagInput name="tags" initialTags={existingTags} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="private_notes">Private notes</Label>
                            <Textarea
                                id="private_notes"
                                name="private_notes"
                                rows={6}
                                defaultValue={book.private_notes ?? ""}
                            />
                        </div>

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
