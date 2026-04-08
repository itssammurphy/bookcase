import { jsonError, requireApiUser } from "@/lib/api/route";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const auth = await requireApiUser();
        if (auth.response) return auth.response;

        const { supabase, user } = auth;

        const body = await request.json();
        const name = String(body?.name ?? "").trim();

        if (!name) {
            return jsonError("List name is required.", 400);
        }

        const { data: existingLists, error: countError } = await supabase
            .from("custom_lists")
            .select("sort_order")
            .eq("user_id", user.id)
            .order("sort_order", { ascending: false })
            .limit(1);

        if (countError) {
            return jsonError(countError.message, 500);
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
            return jsonError(insertError.message, 500);
        }

        return NextResponse.json({ list }, { status: 201 });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unexpected server error.";
        return jsonError(message, 500);
    }
}
