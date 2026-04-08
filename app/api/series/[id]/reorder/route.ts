import { NextRequest, NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api/route";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: seriesId } = await params;
    const body = await request.json();
    const entries = body?.entries as
        | Array<{ id: string; chronology_index: number }>
        | undefined;

    if (!Array.isArray(entries)) {
        return jsonError("entries is required.", 400);
    }

    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const { supabase, user } = auth;

    const updates = await Promise.all(
        entries.map(async (entry) =>
            supabase
                .from("series_books")
                .update({ chronology_index: entry.chronology_index })
                .eq("id", entry.id)
                .eq("series_id", seriesId)
                .eq("user_id", user.id),
        ),
    );

    const failedUpdate = updates.find((update) => update.error);
    if (failedUpdate?.error) {
        return jsonError(failedUpdate.error.message, 400);
    }

    return NextResponse.json({ ok: true });
}
