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
    return [...new Set(raw.split(",").map(normaliseTagName).filter(Boolean))];
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

    for (const name of tagNames) {
        const { data: existing } = await supabase
            .from("tags")
            .select("id")
            .eq("user_id", userId)
            .eq("name", name)
            .maybeSingle();

        if (!existing) {
            const { error } = await supabase.from("tags").insert({
                user_id: userId,
                name,
                color: getAutoTagColour(name),
            });

            if (error) throw new Error(error.message);
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
