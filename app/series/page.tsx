import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requireAppContext } from "@/lib/supabase/appContext";
import { AppShell } from "@/components/layout/AppShell";
import { DeleteSeriesButton } from "@/components/series/DeleteSeriesButton";
import { SeriesProgressStatus, SeriesProgressRow } from "@/types/types";

const progressStyles: Record<
    SeriesProgressStatus,
    { bar: string; bg: string; fill: string; label: string; text: string }
> = {
    completed: {
        bar: "bg-emerald-500",
        bg: "bg-emerald-50/50",
        fill: "bg-emerald-500",
        label: "Completed",
        text: "text-emerald-700",
    },
    partly_completed: {
        bar: "bg-amber-500",
        bg: "bg-amber-50/50",
        fill: "bg-amber-500",
        label: "Partly completed",
        text: "text-amber-700",
    },
    not_started: {
        bar: "bg-slate-300",
        bg: "bg-background",
        fill: "bg-slate-400",
        label: "Not started",
        text: "text-slate-500",
    },
};

function getProgressPercentage(series: SeriesProgressRow) {
    if (series.total_required_books <= 0) return 0;

    return Math.max(
        0,
        Math.min(
            100,
            (series.completed_required_books / series.total_required_books) *
                100,
        ),
    );
}

async function createSeries(formData: FormData) {
    "use server";

    const { supabase, user } = await requireAppContext();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!name) return;

    const { error } = await supabase.from("series").insert({
        user_id: user.id,
        name,
        description: description || null,
    });

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath("/series");
    redirect("/series");
}

async function deleteSeries(seriesId: string) {
    "use server";

    const { supabase, user } = await requireAppContext();

    const { error: linkError } = await supabase
        .from("series_books")
        .delete()
        .eq("user_id", user.id)
        .eq("series_id", seriesId);

    if (linkError) {
        throw new Error(linkError.message);
    }

    const { error: seriesError } = await supabase
        .from("series")
        .delete()
        .eq("user_id", user.id)
        .eq("id", seriesId);

    if (seriesError) {
        throw new Error(seriesError.message);
    }

    revalidatePath("/series");
}

export default async function SeriesPage() {
    const { supabase, user } = await requireAppContext();

    const { data: seriesProgress } = await supabase
        .from("series_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("series_name", { ascending: true })
        .returns<SeriesProgressRow[]>();

    return (
        <AppShell title="Series" subtitle="Track progress across every series">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle>Create series</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createSeries} className="grid gap-4">
                        <Input name="name" placeholder="Series name" />
                        <Textarea
                            name="description"
                            placeholder="Description (optional)"
                        />
                        <Button type="submit" className="w-full sm:w-fit">
                            Create series
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle>Your series</CardTitle>
                </CardHeader>
                <CardContent>
                    {seriesProgress && seriesProgress.length > 0 ? (
                        <div className="grid gap-3">
                            {seriesProgress.map((series) => {
                                const style =
                                    progressStyles[series.progress_status];
                                const progress = getProgressPercentage(series);

                                return (
                                    <div
                                        key={series.series_id}
                                        className={`flex overflow-hidden rounded-2xl border ${style.bg}`}>
                                        <div
                                            className={`w-1.5 shrink-0 ${style.bar}`}
                                            aria-hidden="true"
                                        />

                                        <div className="flex-1 p-4">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0 space-y-2">
                                                    <div className="space-y-1">
                                                        <p className="text-lg font-medium">
                                                            {series.series_name}
                                                        </p>
                                                        <p
                                                            className={`text-xs font-medium ${style.text}`}>
                                                            {style.label}
                                                        </p>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground">
                                                        {
                                                            series.completed_required_books
                                                        }
                                                        /
                                                        {
                                                            series.total_required_books
                                                        }{" "}
                                                        required books completed
                                                    </p>

                                                    <div className="space-y-1.5">
                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${style.fill}`}
                                                                style={{
                                                                    width: `${progress}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {Math.round(
                                                                progress,
                                                            )}
                                                            % complete
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        asChild
                                                        variant="secondary">
                                                        <Link
                                                            href={`/series/${series.series_id}`}>
                                                            Open
                                                        </Link>
                                                    </Button>

                                                    <DeleteSeriesButton
                                                        seriesName={
                                                            series.series_name
                                                        }
                                                        deleteAction={deleteSeries.bind(
                                                            null,
                                                            series.series_id,
                                                        )}
                                                        triggerLabel="Delete"
                                                        triggerVariant="outline"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No series yet.
                        </p>
                    )}
                </CardContent>
            </Card>
        </AppShell>
    );
}
