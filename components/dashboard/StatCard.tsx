import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatCardProps = {
    label: string;
    value: string;
};

export function StatCard({ label, value }: StatCardProps) {
    return (
        <Card className="rounded-3xl shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-medium text-muted-foreground">
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-6xl font-semibold tracking-tight">{value}</p>
            </CardContent>
        </Card>
    );
}
