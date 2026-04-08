"use server";

import { requireAppContext } from "@/lib/supabase/appContext";
import { redirect } from "next/navigation";

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

async function requireAuthenticatedUser() {
    return requireAppContext();
}

export async function markBookRead(bookId: string, redirectTo?: string) {
    const { supabase, user } = await requireAuthenticatedUser();
    const today = todayIsoDate();

    const { data: activeRead, error: activeReadError } = await supabase
        .from("book_reads")
        .select("id")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .is("finished_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (activeReadError) throw new Error(activeReadError.message);

    if (activeRead) {
        const { error: updateError } = await supabase
            .from("book_reads")
            .update({ finished_at: today })
            .eq("id", activeRead.id)
            .eq("user_id", user.id);

        if (updateError) throw new Error(updateError.message);
    } else {
        const { error } = await supabase.from("book_reads").insert({
            user_id: user.id,
            book_id: bookId,
            started_at: today,
            finished_at: today,
        });

        if (error) throw new Error(error.message);
    }

    if (redirectTo) redirect(redirectTo);
}

export async function markBookUnread(bookId: string, redirectTo?: string) {
    const { supabase, user } = await requireAuthenticatedUser();

    const { error } = await supabase
        .from("book_reads")
        .delete()
        .eq("user_id", user.id)
        .eq("book_id", bookId);

    if (error) throw new Error(error.message);

    if (redirectTo) redirect(redirectTo);
}

export async function markBookReading(bookId: string, redirectTo?: string) {
    const { supabase, user } = await requireAuthenticatedUser();

    const { data: activeRead, error: activeReadError } = await supabase
        .from("book_reads")
        .select("id")
        .eq("book_id", bookId)
        .eq("user_id", user.id)
        .is("finished_at", null)
        .limit(1)
        .maybeSingle();

    if (activeReadError) throw new Error(activeReadError.message);

    if (!activeRead) {
        const { error } = await supabase.from("book_reads").insert({
            user_id: user.id,
            book_id: bookId,
            started_at: todayIsoDate(),
            finished_at: null,
        });

        if (error) throw new Error(error.message);
    }

    if (redirectTo) redirect(redirectTo);
}

export async function markBookReread(bookId: string, redirectTo?: string) {
    const { supabase, user } = await requireAuthenticatedUser();
    const today = todayIsoDate();

    const { error } = await supabase.from("book_reads").insert({
        user_id: user.id,
        book_id: bookId,
        started_at: today,
        finished_at: today,
    });

    if (error) throw new Error(error.message);

    if (redirectTo) redirect(redirectTo);
}
