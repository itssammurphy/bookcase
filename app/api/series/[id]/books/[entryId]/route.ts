import { NextResponse } from "next/server";
import { jsonError, requireApiUser } from "@/lib/api/route";

export async function DELETE(
    _request: Request,
    {
        params,
    }: {
        params: Promise<{ id: string; entryId: string }>;
    },
) {
    const { id: seriesId, entryId } = await params;

    const auth = await requireApiUser();
    if (auth.response) return auth.response;

    const { supabase, user } = auth;

    const { error } = await supabase
        .from("series_books")
        .delete()
        .eq("id", entryId)
        .eq("series_id", seriesId)
        .eq("user_id", user.id);

    if (error) {
        return jsonError(error.message, 400);
    }

    return NextResponse.json({ ok: true });
}
