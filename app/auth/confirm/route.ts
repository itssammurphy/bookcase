import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const origin = requestUrl.origin;

    if (!code) {
        return NextResponse.redirect(new URL("/", origin));
    }

    const response = NextResponse.redirect(new URL("/dashboard", origin));

    const supabase = await createServerSupabaseClient();

    await supabase.auth.exchangeCodeForSession(code);

    return response;
}
