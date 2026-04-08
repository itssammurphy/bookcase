import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AuthorCard } from "@/components/authors/AuthorCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthorsPageProps, AuthorStatsRow } from "@/types/types";

const PAGE_SIZE = 12;

export default async function AuthorsPage({ searchParams }: AuthorsPageProps) {
    const params = await searchParams;
    const sort = params.sort === "book_count" ? "book_count" : "name";
    const page = Math.max(Number(params.page ?? "1") || 1, 1);

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    let query = supabase
        .from("author_stats")
        .select("*")
        .eq("user_id", user.id);

    if (sort === "book_count") {
        query = query
            .order("total_books", { ascending: false })
            .order("name", { ascending: true });
    } else {
        query = query.order("name", { ascending: true });
    }

    const { data, error } = await query.returns<AuthorStatsRow[]>();

    if (error) {
        throw new Error(error.message);
    }

    const allAuthors = data ?? [];
    const totalPages = Math.max(Math.ceil(allAuthors.length / PAGE_SIZE), 1);
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const authors = allAuthors.slice(start, start + PAGE_SIZE);

    function buildHref(nextPage: number, nextSort = sort) {
        return `/authors?sort=${nextSort}&page=${nextPage}`;
    }

    return (
        <AppShell title="Authors" subtitle="Browse your author library">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle>Sort</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Button
                        asChild
                        variant={sort === "name" ? "default" : "secondary"}>
                        <Link href={buildHref(1, "name")}>Name</Link>
                    </Button>
                    <Button
                        asChild
                        variant={
                            sort === "book_count" ? "default" : "secondary"
                        }>
                        <Link href={buildHref(1, "book_count")}>
                            Book count
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <section className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {authors.length > 0 ? (
                    authors.map((author) => (
                        <AuthorCard
                            key={author.author_id}
                            id={author.author_id}
                            name={author.name}
                            totalBooks={author.total_books}
                            averageRating={author.average_rating}
                            booksRead={author.books_read}
                        />
                    ))
                ) : (
                    <Card className="rounded-3xl shadow-sm sm:col-span-2 lg:col-span-3 xl:col-span-4">
                        <CardContent className="pt-6 text-sm text-muted-foreground">
                            No authors yet. Add some books with authors first.
                        </CardContent>
                    </Card>
                )}
            </section>

            <Card className="rounded-3xl shadow-sm">
                <CardContent className="flex items-center justify-between pt-6">
                    <Button
                        asChild
                        variant="secondary"
                        disabled={safePage <= 1}>
                        <Link href={buildHref(Math.max(1, safePage - 1))}>
                            Previous
                        </Link>
                    </Button>

                    <p className="text-sm text-muted-foreground">
                        Page {safePage} of {totalPages}
                    </p>

                    <Button
                        asChild
                        variant="secondary"
                        disabled={safePage >= totalPages}>
                        <Link
                            href={buildHref(
                                Math.min(totalPages, safePage + 1),
                            )}>
                            Next
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </AppShell>
    );
}
