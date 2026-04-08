import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ id: string; bookId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const { id: listId, bookId } = await context.params;
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

        const { data: list, error: listError } = await supabase
            .from("custom_lists")
            .select("id")
            .eq("id", listId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (listError) {
            return NextResponse.json(
                { error: listError.message },
                { status: 500 },
            );
        }

        if (!list) {
            return NextResponse.json(
                { error: "List not found." },
                { status: 404 },
            );
        }

        const { error: deleteError } = await supabase
            .from("custom_list_books")
            .delete()
            .eq("custom_list_id", listId)
            .eq("book_id", bookId);

        if (deleteError) {
            return NextResponse.json(
                { error: deleteError.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unexpected server error.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
