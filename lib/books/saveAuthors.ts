import type { SupabaseClient } from "@supabase/supabase-js";

function normaliseAuthorName(name: string) {
    return name.trim().replace(/\s+/g, " ");
}

export function parseAuthorInput(raw: string): string[] {
    const deduped = new Map<string, string>();

    for (const value of raw.split(",")) {
        const name = normaliseAuthorName(value);
        if (!name) continue;

        const key = name.toLowerCase();
        if (!deduped.has(key)) {
            deduped.set(key, name);
        }
    }

    return [...deduped.values()];
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

    const { data: existingAuthors, error: existingError } = await supabase
        .from("authors")
        .select("id, name")
        .eq("user_id", userId)
        .in("name", authorNames);

    if (existingError) throw new Error(existingError.message);

    const existingNames = new Set(
        (existingAuthors ?? []).map((author) => author.name.toLowerCase()),
    );

    const missingAuthorNames = authorNames.filter(
        (name) => !existingNames.has(name.toLowerCase()),
    );

    if (missingAuthorNames.length > 0) {
        const { error: insertMissingError } = await supabase.from("authors").insert(
            missingAuthorNames.map((name) => ({
                user_id: userId,
                name,
            })),
        );

        if (
            insertMissingError &&
            insertMissingError.code !== "23505"
        ) {
            throw new Error(insertMissingError.message);
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
