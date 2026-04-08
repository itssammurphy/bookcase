import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { id: listId } = await context.params;
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
        const bookId = String(body?.bookId ?? "").trim();

        if (!bookId) {
            return NextResponse.json(
                { error: "bookId is required." },
                { status: 400 },
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

        const { data: book, error: bookError } = await supabase
            .from("books")
            .select("id, user_id")
            .eq("id", bookId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (bookError) {
            return NextResponse.json(
                { error: bookError.message },
                { status: 500 },
            );
        }

        if (!book) {
            return NextResponse.json(
                { error: "Book not found." },
                { status: 404 },
            );
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
            return NextResponse.json(
                { error: insertError.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unexpected server error.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
