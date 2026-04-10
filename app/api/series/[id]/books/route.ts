import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api/route";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: seriesId } = await params;
    const body = await request.json();
    const bookId = String(body?.bookId ?? "").trim();

    if (!bookId) {
        return jsonError("bookId is required.", 400);
    }

    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const { supabase, user } = auth;

    const [{ data: series, error: seriesError }, { data: book, error: bookError }] =
        await Promise.all([
            supabase
                .from("series")
                .select("id")
                .eq("id", seriesId)
                .eq("user_id", user.id)
                .maybeSingle(),
            supabase
                .from("books")
                .select("id")
                .eq("id", bookId)
                .eq("user_id", user.id)
                .maybeSingle(),
        ]);

    if (seriesError) {
        return jsonError(seriesError.message, 500);
    }

    if (bookError) {
        return jsonError(bookError.message, 500);
    }

    if (!series) {
        return jsonError("Series not found.", 404);
    }

    if (!book) {
        return jsonError("Book not found.", 404);
    }

    const { data: existing } = await supabase
        .from("series_books")
        .select("chronology_index")
        .eq("user_id", user.id)
        .eq("series_id", seriesId)
        .order("chronology_index", { ascending: false })
        .limit(1);

    const nextIndex = (existing?.[0]?.chronology_index ?? 0) + 1;

    const { data: insertedEntry, error } = await supabase
        .from("series_books")
        .insert({
            user_id: user.id,
            series_id: seriesId,
            book_id: bookId,
            chronology_index: nextIndex,
        })
        .select("id, book_id, chronology_index")
        .single();

    if (error) {
        return jsonError(error.message, 400);
    }

    await supabase
        .from("books")
        .update({ series_id: seriesId })
        .eq("id", bookId)
        .eq("user_id", user.id);

    return NextResponse.json({ ok: true, entry: insertedEntry });
}
