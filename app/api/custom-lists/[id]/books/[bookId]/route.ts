import { jsonError, requireApiUser } from "@/lib/api/route";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ id: string; bookId: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
    try {
        const { id: listId, bookId } = await context.params;
        const auth = await requireApiUser();
        if (auth.response) return auth.response;

        const { supabase, user } = auth;

        const { data: list, error: listError } = await supabase
            .from("custom_lists")
            .select("id")
            .eq("id", listId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (listError) {
            return jsonError(listError.message, 500);
        }

        if (!list) {
            return jsonError("List not found.", 404);
        }

        const { error: deleteError } = await supabase
            .from("custom_list_books")
            .delete()
            .eq("custom_list_id", listId)
            .eq("book_id", bookId);

        if (deleteError) {
            return jsonError(deleteError.message, 500);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unexpected server error.";
        return jsonError(message, 500);
    }
}
