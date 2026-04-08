import type { SupabaseClient } from "@supabase/supabase-js";

function normaliseAuthorName(name: string) {
    return name.trim().replace(/\s+/g, " ");
}

export function parseAuthorInput(raw: string): string[] {
    return [
        ...new Set(raw.split(",").map(normaliseAuthorName).filter(Boolean)),
    ];
}

export async function replaceBookAuthors(params: {
    supabase: SupabaseClient;
    userId: string;
    bookId: string;
    rawAuthors: string;
}) {
    const { supabase, userId, bookId, rawAuthors } = params;

    const authorNames = parseAuthorInput(rawAuthors);

    const { error: deleteError } = await supabase
        .from("book_authors")
        .delete()
        .eq("user_id", userId)
        .eq("book_id", bookId);

    if (deleteError) throw new Error(deleteError.message);

    if (authorNames.length === 0) return;

    for (const name of authorNames) {
        const { data: existing } = await supabase
            .from("authors")
            .select("id")
            .eq("user_id", userId)
            .eq("name", name)
            .maybeSingle();

        if (!existing) {
            const { error } = await supabase.from("authors").insert({
                user_id: userId,
                name,
            });

            if (error) throw new Error(error.message);
        }
    }

    const { data: authors, error: fetchError } = await supabase
        .from("authors")
        .select("id, name")
        .eq("user_id", userId)
        .in("name", authorNames);

    if (fetchError) throw new Error(fetchError.message);

    if (!authors?.length) return;

    const authorIdByName = new Map(
        authors.map((author) => [author.name, author.id]),
    );

    const rows = authorNames
        .map((name, index) => {
            const authorId = authorIdByName.get(name);
            if (!authorId) return null;

            return {
                user_id: userId,
                book_id: bookId,
                author_id: authorId,
                author_order: index + 1,
            };
        })
        .filter(
            (
                row,
            ): row is {
                user_id: string;
                book_id: string;
                author_id: string;
                author_order: number;
            } => row !== null,
        );

    const { error: insertError } = await supabase
        .from("book_authors")
        .insert(rows);

    if (insertError) throw new Error(insertError.message);
}
