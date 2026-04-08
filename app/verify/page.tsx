"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function VerifyPage() {
    const supabase = createBrowserSupabaseClient();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleVerify() {
        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: "email",
        });

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        router.push("/dashboard");
    }

    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
            <div className="w-full max-w-md space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
                <h1 className="text-2xl font-semibold">Enter your code</h1>

                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="token">Code</Label>
                    <Input
                        id="token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />
                </div>

                <Button
                    className="w-full"
                    onClick={handleVerify}
                    disabled={loading}>
                    {loading ? "Verifying..." : "Verify code"}
                </Button>

                {message ? (
                    <p className="text-sm text-muted-foreground">{message}</p>
                ) : null}
            </div>
        </main>
    );
}
