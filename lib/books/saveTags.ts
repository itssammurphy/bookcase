import type { SupabaseClient } from "@supabase/supabase-js";

function normaliseTagName(tag: string) {
    return tag.trim().replace(/\s+/g, " ");
}

function hashString(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

const DEFAULT_PALETTE = [
    "#FCA5A5",
    "#FDBA74",
    "#FDE68A",
    "#86EFAC",
    "#93C5FD",
    "#A5B4FC",
    "#D8B4FE",
    "#F9A8D4",
    "#C4B5FD",
    "#67E8F9",
];

function getAutoTagColour(tagName: string) {
    return DEFAULT_PALETTE[
        hashString(tagName.toLowerCase()) % DEFAULT_PALETTE.length
    ];
}

export function parseTagInput(raw: string): string[] {
    const deduped = new Map<string, string>();

    for (const value of raw.split(",")) {
        const tagName = normaliseTagName(value);
        if (!tagName) continue;

        const key = tagName.toLowerCase();
        if (!deduped.has(key)) {
            deduped.set(key, tagName);
        }
    }

    return [...deduped.values()];
}

export async function replaceBookTags(params: {
    supabase: SupabaseClient;
    userId: string;
    bookId: string;
    rawTags: string;
}) {
    const { supabase, userId, bookId, rawTags } = params;

    const tagNames = parseTagInput(rawTags);

    const { error: deleteError } = await supabase
        .from("book_tags")
        .delete()
        .eq("user_id", userId)
        .eq("book_id", bookId);

    if (deleteError) throw new Error(deleteError.message);

    if (tagNames.length === 0) return;

    const { data: existingTags, error: existingError } = await supabase
        .from("tags")
        .select("id,name")
        .eq("user_id", userId)
        .in("name", tagNames);

    if (existingError) throw new Error(existingError.message);

    const existingNames = new Set(
        (existingTags ?? []).map((tag) => tag.name.toLowerCase()),
    );

    const missingTagNames = tagNames.filter(
        (name) => !existingNames.has(name.toLowerCase()),
    );

    if (missingTagNames.length > 0) {
        const { error: insertMissingError } = await supabase.from("tags").insert(
            missingTagNames.map((name) => ({
                user_id: userId,
                name,
                color: getAutoTagColour(name),
            })),
        );

        if (
            insertMissingError &&
            insertMissingError.code !== "23505"
        ) {
            throw new Error(insertMissingError.message);
        }
    }

    const { data: tags, error: fetchError } = await supabase
        .from("tags")
        .select("id,name")
        .eq("user_id", userId)
        .in("name", tagNames);

    if (fetchError) throw new Error(fetchError.message);

    if (!tags?.length) return;

    const { error: insertError } = await supabase.from("book_tags").insert(
        tags.map((tag) => ({
            user_id: userId,
            book_id: bookId,
            tag_id: tag.id,
        })),
    );

    if (insertError) throw new Error(insertError.message);
}
