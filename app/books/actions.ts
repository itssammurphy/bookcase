"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function markBookRead(bookId: string, redirectTo?: string) {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase.from("book_reads").insert({
        user_id: user.id,
        book_id: bookId,
        started_at: today,
        finished_at: today,
    });

    if (error) throw new Error(error.message);

    if (redirectTo) redirect(redirectTo);
}

export async function markBookUnread(bookId: string, redirectTo?: string) {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const { error } = await supabase
        .from("book_reads")
        .delete()
        .eq("user_id", user.id)
        .eq("book_id", bookId);

    if (error) throw new Error(error.message);

    if (redirectTo) redirect(redirectTo);
}
