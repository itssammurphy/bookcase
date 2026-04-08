import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const getAppContext = cache(async () => {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return { supabase, user };
});

export async function requireAppContext() {
    const { supabase, user } = await getAppContext();

    if (!user) {
        redirect("/");
    }

    return { supabase, user };
}

