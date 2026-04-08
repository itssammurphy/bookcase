import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function DELETE(
    _request: Request,
    {
        params,
    }: {
        params: Promise<{ id: string; entryId: string }>;
    },
) {
    const { id: seriesId, entryId } = await params;

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
        .from("series_books")
        .delete()
        .eq("id", entryId)
        .eq("series_id", seriesId)
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}
