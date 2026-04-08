"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

type AppShellProps = {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
};

export function AppShell({ title, subtitle, children }: AppShellProps) {
    const pathname = usePathname();

    function isActive(path: string) {
        return pathname === path || pathname.startsWith(path + "/");
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
                <header className="flex flex-col gap-4 rounded-3xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        {subtitle ? (
                            <p className="text-sm text-muted-foreground">
                                {subtitle}
                            </p>
                        ) : null}
                    </div>

                    <nav className="flex flex-wrap gap-2">
                        <Button
                            asChild
                            variant={
                                isActive("/dashboard") ? "default" : "secondary"
                            }>
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                        <Button
                            asChild
                            variant={
                                isActive("/bookshelf") ? "default" : "secondary"
                            }>
                            <Link href="/bookshelf">Bookshelf</Link>
                        </Button>
                        <Button
                            asChild
                            variant={
                                isActive("/series") ? "default" : "secondary"
                            }>
                            <Link href="/series">Series</Link>
                        </Button>
                        <Button
                            asChild
                            variant={
                                isActive("/authors") ? "default" : "secondary"
                            }>
                            <Link href="/authors">Authors</Link>
                        </Button>
                        <Button
                            asChild
                            variant={
                                isActive("/books/new") ? "default" : "secondary"
                            }>
                            <Link href="/books/new">Add book</Link>
                        </Button>
                        <Button
                            asChild
                            variant={
                                isActive("/settings") ? "default" : "secondary"
                            }>
                            <Link href="/settings">Settings</Link>
                        </Button>
                    </nav>
                </header>

                {children}
            </div>
        </main>
    );
}
