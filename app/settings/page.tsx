import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TagColourRow } from "@/components/settings/TagColourRow";

async function updateProfile(formData: FormData) {
    "use server";

    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const displayName = String(formData.get("display_name") ?? "").trim();

    await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName,
    });

    redirect("/settings");
}

async function deleteTag(formData: FormData) {
    "use server";

    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const tagId = String(formData.get("tag_id") ?? "");

    if (!tagId) return;

    const { error: joinError } = await supabase
        .from("book_tags")
        .delete()
        .eq("user_id", user.id)
        .eq("tag_id", tagId);

    if (joinError) throw new Error(joinError.message);

    const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagId)
        .eq("user_id", user.id);

    if (error) throw new Error(error.message);

    redirect("/settings");
}

async function updateTagColour(formData: FormData) {
    "use server";

    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const tagId = String(formData.get("tag_id") ?? "");
    const color = String(formData.get("color") ?? "").trim();

    if (!tagId || !color) return;

    const { error } = await supabase
        .from("tags")
        .update({ color })
        .eq("id", tagId)
        .eq("user_id", user.id);

    if (error) {
        throw new Error(error.message);
    }

    redirect("/settings");
}

export default async function SettingsPage() {
    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/");

    const [{ data: profile }, { data: tags }] = await Promise.all([
        supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .single(),
        supabase
            .from("tags")
            .select("id, name, color")
            .eq("user_id", user.id)
            .order("name", { ascending: true }),
    ]);

    return (
        <AppShell title="Settings" subtitle="Profile and tag preferences">
            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={updateProfile} className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="display_name">Name</Label>
                            <Input
                                id="display_name"
                                name="display_name"
                                defaultValue={profile?.display_name ?? ""}
                            />
                        </div>

                        <Button type="submit" className="w-full sm:w-fit">
                            Save settings
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                    <CardTitle>Tag colours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {tags?.length ? (
                        tags.map((tag) => (
                            <TagColourRow
                                key={tag.id}
                                tagId={tag.id}
                                name={tag.name}
                                color={tag.color}
                                updateAction={updateTagColour}
                                deleteAction={deleteTag}
                            />
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No tags yet. Add tags to books and they will appear
                            here.
                        </p>
                    )}
                </CardContent>
            </Card>
        </AppShell>
    );
}
