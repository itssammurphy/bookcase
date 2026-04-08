import Link from "next/link";
import { redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { StarRating } from "@/components/books/StarRating";
import { DashboardBookRow, HomeStatsRow, TopTagRow } from "@/types/types";

const statusStyles: Record<
    DashboardBookRow["derived_status"],
    { bar: string; bg: string; label: string; text: string; color: string }
> = {
    read: {
        bar: "bg-emerald-500",
        bg: "bg-emerald-50/50",
        label: "Read",
        text: "text-emerald-700",
        color: "#10b981",
    },
    reading: {
        bar: "bg-amber-500",
        bg: "bg-amber-50/50",
        label: "In progress",
        text: "text-amber-700",
        color: "#f59e0b",
    },
    unread: {
        bar: "bg-slate-300",
        bg: "bg-background",
        label: "Unread",
        text: "text-slate-500",
        color: "#cbd5e1",
    },
};

function getStatusCopy(book: DashboardBookRow) {
    const base = statusStyles[book.derived_status].label;

    if (book.derived_status === "read") {
        if (book.reread_count > 0) {
            return `${base} • ${book.reread_count} reread${
                book.reread_count === 1 ? "" : "s"
            }`;
        }
        return base;
    }

    return base;
}

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
            label: statusStyles.read.label,
            value: books.filter((book) => book.derived_status === "read")
                .length,
            color: statusStyles.read.color,
        },
        {
            key: "reading",
            label: statusStyles.reading.label,
            value: books.filter((book) => book.derived_status === "reading")
                .length,
            color: statusStyles.reading.color,
        },
        {
            key: "unread",
            label: statusStyles.unread.label,
            value: books.filter((book) => book.derived_status === "unread")
                .length,
            color: statusStyles.unread.color,
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
    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

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
                                    const style =
                                        statusStyles[book.derived_status];
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
                                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                    <div className="space-y-3">
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
                                                            {book.author_names ||
                                                                "Unknown author"}
                                                            {book.publication_year
                                                                ? `, ${book.publication_year}`
                                                                : ""}
                                                        </p>

                                                        {book.series_name ? (
                                                            <p className="text-sm text-muted-foreground">
                                                                Series:{" "}
                                                                {
                                                                    book.series_name
                                                                }
                                                            </p>
                                                        ) : null}

                                                        <StarRating
                                                            rating={
                                                                book.personal_rating
                                                            }
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            asChild
                                                            variant="secondary">
                                                            <Link
                                                                href={`/books/${book.id}/edit`}>
                                                                Continue
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
                                No books currently in progress.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>
        </AppShell>
    );
}
