import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BookshelfClient } from "@/components/books/BookshelfClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BookRow, CustomList, Membership } from "@/types/types";

export default async function BookshelfPage() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const [{ data: books }, { data: lists }, { data: memberships }] =
        await Promise.all([
            supabase
                .from("bookshelf_books")
                .select("*")
                .eq("user_id", user.id)
                .order("updated_at", { ascending: false })
                .returns<BookRow[]>(),
            supabase
                .from("custom_lists")
                .select("id,name,sort_order")
                .eq("user_id", user.id)
                .order("sort_order", { ascending: true })
                .returns<CustomList[]>(),
            supabase
                .from("custom_list_books")
                .select("custom_list_id,book_id")
                .eq("user_id", user.id)
                .returns<Membership[]>(),
        ]);

    return (
        <AppShell
            title="Bookshelf"
            subtitle="Search, filter, and manage your library">
            <BookshelfClient
                initialBooks={books ?? []}
                lists={lists ?? []}
                memberships={memberships ?? []}
            />
        </AppShell>
    );
}
