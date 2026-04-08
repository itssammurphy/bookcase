import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type ApiUserContext =
    | {
          supabase: ServerSupabaseClient;
          user: User;
          response: null;
      }
    | {
          supabase: null;
          user: null;
          response: NextResponse;
      };

export function jsonError(message: string, status: number) {
    return NextResponse.json({ error: message }, { status });
}

export async function requireApiUser(): Promise<ApiUserContext> {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return {
            supabase: null,
            user: null,
            response: jsonError("Unauthorized", 401),
        };
    }

    return { supabase, user, response: null };
}
