"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

function ConfirmDeleteButton({
    label,
    variant = "destructive",
}: {
    label?: string;
    variant?: "destructive" | "outline" | "secondary" | "ghost";
}) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" variant={variant} disabled={pending}>
            {pending ? "Deleting..." : (label ?? "Delete")}
        </Button>
    );
}

type DeleteSeriesButtonProps = {
    seriesName: string;
    deleteAction: () => Promise<void>;
    triggerLabel?: string;
    triggerVariant?: "destructive" | "outline" | "secondary" | "ghost";
};

export function DeleteSeriesButton({
    seriesName,
    deleteAction,
    triggerLabel = "Delete",
    triggerVariant = "outline",
}: DeleteSeriesButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant={triggerVariant}>{triggerLabel}</Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete series?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <span className="font-medium text-foreground">
                            {seriesName}
                        </span>{" "}
                        will be removed from your series list.
                        <br />
                        <br />
                        Its books will stay in your library. This only removes
                        the series record and the ordering/links inside it.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>

                    <form
                        action={async () => {
                            await deleteAction();
                            setOpen(false);
                        }}>
                        <ConfirmDeleteButton
                            label="Delete series"
                            variant="destructive"
                        />
                    </form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
