"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { ReadStatus } from "@/types/types";

type StatusMenuProps = {
    bookId: string;
    status: ReadStatus;
    onStatusChange: (next: ReadStatus, rereadCount?: number) => void;
};

export function StatusMenu({
    bookId,
    status,
    onStatusChange,
}: StatusMenuProps) {
    const supabase = createBrowserSupabaseClient();
    const [loading, setLoading] = useState(false);

    async function setUnread() {
        setLoading(true);

        const { error } = await supabase
            .from("book_reads")
            .delete()
            .eq("book_id", bookId);

        setLoading(false);

        if (!error) {
            onStatusChange("unread", 0);
        }
    }

    async function setReading() {
        setLoading(true);
        const today = new Date().toISOString().slice(0, 10);

        if (status === "reading") {
            setLoading(false);
            return;
        }

        // already read, start a reread.
        const { error } = await supabase.from("book_reads").insert({
            book_id: bookId,
            started_at: today,
            finished_at: null,
        });

        setLoading(false);

        if (!error) {
            onStatusChange("reading");
        }
    }

    async function setRead() {
        setLoading(true);
        const today = new Date().toISOString().slice(0, 10);

        if (status === "reading") {
            const { data: openReads, error: fetchError } = await supabase
                .from("book_reads")
                .select("id")
                .eq("book_id", bookId)
                .is("finished_at", null)
                .order("created_at", { ascending: false })
                .limit(1);

            if (fetchError) {
                setLoading(false);
                return;
            }

            if (openReads?.[0]?.id) {
                const { error } = await supabase
                    .from("book_reads")
                    .update({ finished_at: today })
                    .eq("id", openReads[0].id);

                setLoading(false);

                if (!error) {
                    onStatusChange("read");
                }
                return;
            }
        }

        const { error } = await supabase.from("book_reads").insert({
            book_id: bookId,
            started_at: today,
            finished_at: today,
        });

        setLoading(false);

        if (!error) {
            onStatusChange("read");
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={loading}>
                    {loading ? "Saving..." : "Set Reading Status"}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={setUnread}>Unread</DropdownMenuItem>
                <DropdownMenuItem onClick={setReading}>
                    Reading
                </DropdownMenuItem>
                <DropdownMenuItem onClick={setRead}>Read</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
