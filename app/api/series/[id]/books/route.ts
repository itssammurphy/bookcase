import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: seriesId } = await params;
    const { bookId } = await request.json();

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existing } = await supabase
        .from("series_books")
        .select("chronology_index")
        .eq("user_id", user.id)
        .eq("series_id", seriesId)
        .order("chronology_index", { ascending: false })
        .limit(1);

    const nextIndex = (existing?.[0]?.chronology_index ?? 0) + 1;

    const { error } = await supabase.from("series_books").insert({
        user_id: user.id,
        series_id: seriesId,
        book_id: bookId,
        chronology_index: nextIndex,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase
        .from("books")
        .update({ series_id: seriesId })
        .eq("id", bookId)
        .eq("user_id", user.id);

    return NextResponse.json({ ok: true });
}
