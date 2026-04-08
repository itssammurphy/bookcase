import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { requireAppContext } from "@/lib/supabase/appContext";
import { replaceBookTags } from "@/lib/books/saveTags";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { replaceBookAuthors } from "@/lib/books/saveAuthors";
import { parseBookFormData } from "@/lib/books/formData";
import { BookDetailsFields } from "@/components/books/BookDetailsFields";

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    result.push(current.trim());
    return result;
}

function splitMultiValue(value: string): string[] {
    return value
        .split(/[;,|]/g)
        .map((item) => item.trim())
        .filter(Boolean);
}

function parseOwned(value: string): boolean {
    const normalised = value.trim().toLowerCase();
    return ["owned", "yes", "true", "1", "y"].includes(normalised);
}

function parseRead(value: string): boolean {
    const normalised = value.trim().toLowerCase();
    return ["read", "yes", "true", "1", "y"].includes(normalised);
}

async function createBook(formData: FormData) {
    "use server";

    const { supabase, user } = await requireAppContext();

    const {
        title,
        publicationYear,
        personalRating,
        privateNotes,
        rawTags,
        rawAuthors,
    } = parseBookFormData(formData);

    if (!title) return;

    const { data: insertedBook, error } = await supabase
        .from("books")
        .insert({
            user_id: user.id,
            title,
            publication_year: publicationYear,
            personal_rating: personalRating,
            private_notes: privateNotes,
        })
        .select("id")
        .single();

    if (error || !insertedBook) {
        throw new Error(error?.message ?? "Failed to create book");
    }

    await replaceBookTags({
        supabase,
        userId: user.id,
        bookId: insertedBook.id,
        rawTags,
    });

    await replaceBookAuthors({
        supabase,
        userId: user.id,
        bookId: insertedBook.id,
        rawAuthors,
    });

    redirect("/bookshelf");
}

async function uploadBooksCsv(formData: FormData) {
    "use server";

    const { supabase, user } = await requireAppContext();

    const file = formData.get("csv_file");
    if (!(file instanceof File) || file.size === 0) {
        throw new Error("Please upload a CSV file.");
    }

    const text = await file.text();
    const lines = text
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        throw new Error(
            "CSV must include a header row and at least one data row.",
        );
    }

    const headers = parseCsvLine(lines[0]).map((header) =>
        header.trim().toLowerCase(),
    );
    const expectedHeaders = [
        "title",
        "year",
        "author",
        "tags",
        "owned/not owned",
        "read/unread",
        "rating",
    ];

    const missingHeaders = expectedHeaders.filter(
        (header) => !headers.includes(header),
    );
    if (missingHeaders.length > 0) {
        throw new Error(`Missing CSV columns: ${missingHeaders.join(", ")}`);
    }

    const headerIndex = Object.fromEntries(
        headers.map((header, index) => [header, index]),
    );

    for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
        const values = parseCsvLine(lines[lineIndex]);
        const getValue = (name: string) =>
            values[headerIndex[name]]?.trim() ?? "";

        const title = getValue("title");
        if (!title) {
            continue;
        }

        const publicationYearRaw = getValue("year");
        const rawAuthors = getValue("author");
        const rawTags = getValue("tags");
        const owned = parseOwned(getValue("owned/not owned"));
        const isRead = parseRead(getValue("read/unread"));
        const ratingRaw = getValue("rating");
        const rating = ratingRaw ? Number(ratingRaw) : null;

        const { data: existingBook } = await supabase
            .from("books")
            .select("id")
            .eq("user_id", user.id)
            .eq("title", title)
            .eq(
                "publication_year",
                publicationYearRaw ? Number(publicationYearRaw) : null,
            )
            .maybeSingle();

        if (existingBook) {
            continue;
        }

        const { data: insertedBook, error: insertBookError } = await supabase
            .from("books")
            .insert({
                user_id: user.id,
                title,
                publication_year: publicationYearRaw
                    ? Number(publicationYearRaw)
                    : null,
                personal_rating: rating,
                favourite: false,
                owned,
            })
            .select("id")
            .single();

        if (insertBookError || !insertedBook) {
            throw new Error(
                `Failed to import \"${title}\": ${insertBookError?.message ?? "unknown error"}`,
            );
        }

        await replaceBookAuthors({
            supabase,
            userId: user.id,
            bookId: insertedBook.id,
            rawAuthors: splitMultiValue(rawAuthors).join(", "),
        });

        await replaceBookTags({
            supabase,
            userId: user.id,
            bookId: insertedBook.id,
            rawTags: splitMultiValue(rawTags).join(", "),
        });

        if (isRead) {
            const today = new Date().toISOString().slice(0, 10);

            await supabase.from("book_reads").insert({
                user_id: user.id,
                book_id: insertedBook.id,
                finished_at: today,
                rating,
            });
        }
    }

    redirect("/bookshelf");
}

export default async function NewBookPage() {
    await requireAppContext();

    return (
        <AppShell
            title="Add book"
            subtitle="Create a new library entry or import a CSV batch">
            <div className="grid gap-6">
                <Card className="rounded-3xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Book details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={createBook} className="grid gap-5">
                            <BookDetailsFields ratingVariant="select" />

                            <Button type="submit" className="w-full sm:w-fit">
                                Save book
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm">
                    <CardHeader>
                        <CardTitle>CSV upload</CardTitle>
                        <CardDescription>
                            Upload multiple books at once. Expected columns:
                            title, year, author, tags, owned/not owned,
                            read/unread, rating.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={uploadBooksCsv} className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="csv_file">CSV file</Label>
                                <Input
                                    id="csv_file"
                                    name="csv_file"
                                    type="file"
                                    accept=".csv,text/csv"
                                    required
                                />
                            </div>

                            <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                                <p className="font-medium text-foreground">
                                    Expected format
                                </p>
                                <code className="mt-2 block whitespace-pre-wrap rounded-xl bg-background p-3 text-xs">
                                    title,year,author,tags,owned/not
                                    owned,read/unread,rating
                                </code>
                                <code className="mt-2 block whitespace-pre-wrap rounded-xl bg-background p-3 text-xs">
                                    The Hobbit,1937,J.R.R. Tolkien,&quot;Fantasy;
                                    Classics&quot;,owned,read,5
                                </code>
                            </div>

                            <Button
                                type="submit"
                                variant="secondary"
                                className="w-full sm:w-fit">
                                Import CSV
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}
