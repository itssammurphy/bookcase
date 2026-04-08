"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm() {
    const supabase = createBrowserSupabaseClient();

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
            },
        });

        if (error) {
            setMessage(error.message);
            setLoading(false);
            return;
        }

        setMessage("Check your email for the magic link.");
        setLoading(false);
    }

    return (
        <div className="space-y-5">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </div>

            <Button
                type="button"
                className="w-full"
                disabled={!email || loading}
                onClick={handleSubmit}>
                {loading ? "Sending..." : "Send magic link"}
            </Button>

            {message ? (
                <p className="text-sm leading-6 text-muted-foreground">
                    {message}
                </p>
            ) : null}
        </div>
    );
}
