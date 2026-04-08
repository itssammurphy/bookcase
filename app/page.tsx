import { LoginForm } from "@/components/auth/LoginForm";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

export default function LandingPage() {
    return (
        <main className="flex min-h-screen items-center justify-center px-6 py-12">
            <Card className="w-full max-w-md rounded-3xl shadow-sm">
                <CardHeader className="space-y-3 text-center">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Bookcase
                    </p>
                    <CardTitle className="text-4xl leading-tight">
                        A private home for every book she loves
                    </CardTitle>
                    <CardDescription className="text-sm leading-6">
                        Log in with a magic link or one-time code and sync
                        everything across phone, laptop, and desktop.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm />
                </CardContent>
            </Card>
        </main>
    );
}
