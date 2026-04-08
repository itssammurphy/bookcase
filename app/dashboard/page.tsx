import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAppContext } from "@/lib/supabase/appContext";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { BookCard } from "@/components/books/BookCard";
import { bookStatusStyles } from "@/components/books/bookStatus";
import { DashboardBookRow, HomeStatsRow, TopTagRow } from "@/types/types";

function polarToCartesian(
    cx: number,
    cy: number,
    r: number,
    angleInDegrees: number,
) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(angleInRadians),
        y: cy + r * Math.sin(angleInRadians),
    };
}

function describeArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        `M ${cx} ${cy}`,
        `L ${start.x} ${start.y}`,
        `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
        "Z",
    ].join(" ");
}

function StatusPieChart({ books }: { books: DashboardBookRow[] }) {
    const total = books.length;

    const segments = [
        {
            key: "read",
            label: bookStatusStyles.read.label,
            value: books.filter((book) => book.derived_status === "read")
                .length,
            color: bookStatusStyles.read.color,
        },
        {
            key: "reading",
            label: "In progress",
            value: books.filter((book) => book.derived_status === "reading")
                .length,
            color: bookStatusStyles.reading.color,
        },
        {
            key: "unread",
            label: bookStatusStyles.unread.label,
            value: books.filter((book) => book.derived_status === "unread")
                .length,
            color: bookStatusStyles.unread.color,
        },
    ].filter((segment) => segment.value > 0);

    if (total === 0) {
        return (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed">
                <p className="text-sm text-muted-foreground">
                    Add some books to see your reading breakdown.
                </p>
            </div>
        );
    }

    let currentAngle = 0;

    return (
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="mx-auto w-full max-w-[250px] xl:max-w-[180px] shrink-0">
                <svg viewBox="0 0 220 220" className="h-auto w-full">
                    {segments.map((segment) => {
                        const angle = (segment.value / total) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        currentAngle += angle;

                        if (angle >= 360) {
                            return (
                                <circle
                                    key={segment.key}
                                    cx="110"
                                    cy="110"
                                    r="80"
                                    fill={segment.color}
                                />
                            );
                        }

                        return (
                            <path
                                key={segment.key}
                                d={describeArc(
                                    110,
                                    110,
                                    80,
                                    startAngle,
                                    endAngle,
                                )}
                                fill={segment.color}
                            />
                        );
                    })}

                    <circle cx="110" cy="110" r="48" fill="white" />
                    <text
                        x="110"
                        y="102"
                        textAnchor="middle"
                        className="fill-foreground text-[10px] font-medium">
                        Total
                    </text>
                    <text
                        x="110"
                        y="124"
                        textAnchor="middle"
                        className="fill-foreground text-xl font-semibold">
                        {total}
                    </text>
                </svg>
            </div>

            <div className="flex-1 space-y-3">
                {segments.map((segment) => {
                    const percentage = Math.round(
                        (segment.value / total) * 100,
                    );

                    return (
                        <div
                            key={segment.key}
                            className="flex items-center justify-between rounded-2xl border px-4 py-3">
                            <div className="flex items-center gap-3">
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: segment.color }}
                                    aria-hidden="true"
                                />
                                <span className="font-medium">
                                    {segment.label}
                                </span>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-semibold">
                                    {segment.value}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {percentage}%
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default async function DashboardPage() {
    const { supabase, user } = await requireAppContext();

    const [
        { data: profile },
        { data: stats },
        { data: topTags },
        { data: books },
    ] = await Promise.all([
        supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .single(),

        supabase
            .from("user_home_stats")
            .select("*")
            .eq("user_id", user.id)
            .single<HomeStatsRow>(),

        supabase
            .from("top_tags")
            .select("*")
            .eq("user_id", user.id)
            .order("book_count", { ascending: false })
            .limit(3)
            .returns<TopTagRow[]>(),

        supabase
            .from("bookshelf_books")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .returns<DashboardBookRow[]>(),
    ]);

    const allBooks = books ?? [];

    const readingBooks = allBooks
        .filter((book) => book.derived_status === "reading")
        .slice(0, 8);

    return (
        <AppShell
            title={`Hi${profile?.display_name ? `, ${profile.display_name}` : ""}`}
            subtitle="Your reading dashboard">
            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                        label="Books read"
                        value={String(stats?.total_books_read ?? 0)}
                    />
                    <StatCard
                        label="Average rating"
                        value={`${
                            stats?.average_rating === null ||
                            stats?.average_rating === undefined
                                ? "—"
                                : Number(stats.average_rating).toFixed(2)
                        }/5`}
                    />
                    <StatCard
                        label="Total books"
                        value={String(stats?.total_books ?? 0)}
                    />
                    <Card className="rounded-3xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl font-medium text-muted-foreground">
                                Top Tags
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            {topTags && topTags.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {topTags.map((tag) => (
                                        <div
                                            key={tag.tag_name}
                                            className="flex items-center gap-2 text-sm">
                                            <span
                                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        tag.tag_color ??
                                                        "#94a3b8",
                                                }}
                                                aria-hidden="true"
                                            />
                                            <span className="font-medium text-3xl">
                                                {tag.tag_name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No tags yet
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-4">
                    <Card className="rounded-3xl shadow-sm">
                        <CardHeader>
                            <CardTitle>Reading breakdown</CardTitle>
                            <CardDescription>
                                The proportion of books by reading status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StatusPieChart books={allBooks} />
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl shadow-sm">
                        <CardHeader>
                            <CardTitle>Quick actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            <Button asChild>
                                <Link href="/bookshelf">Open bookshelf</Link>
                            </Button>
                            <Button asChild variant="secondary">
                                <Link href="/books/new">Add a book</Link>
                            </Button>
                            <Button asChild variant="secondary">
                                <Link href="/settings">Settings</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section>
                <Card className="rounded-3xl shadow-sm">
                    <CardHeader>
                        <CardTitle>In progress</CardTitle>
                        <CardDescription>
                            Books you’re currently reading
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {readingBooks.length > 0 ? (
                            <div className="grid gap-3">
                                {readingBooks.map((book) => {
                                    return (
                                        <BookCard
                                            key={book.id}
                                            book={book}
                                            showTags={false}
                                            titleClassName="text-lg font-medium"
                                            actionArea={
                                                <Button asChild variant="secondary">
                                                    <Link href={`/books/${book.id}/edit`}>
                                                        Continue
                                                    </Link>
                                                </Button>
                                            }
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No books currently in progress.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>
        </AppShell>
    );
}
