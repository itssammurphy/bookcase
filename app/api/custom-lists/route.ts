import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const name = String(body?.name ?? "").trim();

        if (!name) {
            return NextResponse.json(
                { error: "List name is required." },
                { status: 400 },
            );
        }

        const { data: existingLists, error: countError } = await supabase
            .from("custom_lists")
            .select("sort_order")
            .eq("user_id", user.id)
            .order("sort_order", { ascending: false })
            .limit(1);

        if (countError) {
            return NextResponse.json(
                { error: countError.message },
                { status: 500 },
            );
        }

        const nextSortOrder =
            existingLists && existingLists.length > 0
                ? (existingLists[0].sort_order ?? 0) + 1
                : 1;

        const { data: list, error: insertError } = await supabase
            .from("custom_lists")
            .insert({
                user_id: user.id,
                name,
                sort_order: nextSortOrder,
            })
            .select("id, name, sort_order")
            .single();

        if (insertError) {
            return NextResponse.json(
                { error: insertError.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ list }, { status: 201 });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unexpected server error.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
