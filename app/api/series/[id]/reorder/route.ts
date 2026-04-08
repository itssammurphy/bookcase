import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: seriesId } = await params;
    const { entries } = await request.json();

    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    for (const entry of entries as Array<{
        id: string;
        chronology_index: number;
    }>) {
        const { error } = await supabase
            .from("series_books")
            .update({ chronology_index: entry.chronology_index })
            .eq("id", entry.id)
            .eq("series_id", seriesId)
            .eq("user_id", user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
    }

    return NextResponse.json({ ok: true });
}
