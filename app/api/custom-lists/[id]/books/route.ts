import { jsonError, requireApiUser } from "@/lib/api/route";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { id: listId } = await context.params;
        const auth = await requireApiUser();
        if (auth.response) return auth.response;

        const { supabase, user } = auth;

        const body = await request.json();
        const bookId = String(body?.bookId ?? "").trim();

        if (!bookId) {
            return jsonError("bookId is required.", 400);
        }

        const [{ data: list, error: listError }, { data: book, error: bookError }] =
            await Promise.all([
                supabase
                    .from("custom_lists")
                    .select("id")
                    .eq("id", listId)
                    .eq("user_id", user.id)
                    .maybeSingle(),
                supabase
                    .from("books")
                    .select("id")
                    .eq("id", bookId)
                    .eq("user_id", user.id)
                    .maybeSingle(),
            ]);

        if (listError) {
            return jsonError(listError.message, 500);
        }

        if (bookError) {
            return jsonError(bookError.message, 500);
        }

        if (!book) {
            return jsonError("Book not found.", 404);
        }

        if (!list) {
            return jsonError("List not found.", 404);
        }

        const { error: insertError } = await supabase
            .from("custom_list_books")
            .upsert(
                {
                    custom_list_id: listId,
                    book_id: bookId,
                },
                {
                    onConflict: "custom_list_id,book_id",
                    ignoreDuplicates: true,
                },
            );

        if (insertError) {
            return jsonError(insertError.message, 500);
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unexpected server error.";
        return jsonError(message, 500);
    }
}
