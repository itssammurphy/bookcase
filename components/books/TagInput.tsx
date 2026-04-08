"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getTagColour } from "@/lib/tagColours";

type InitialTag = {
    name: string;
    color?: string | null;
};

type TagInputProps = {
    name?: string;
    initialTags?: InitialTag[] | null;
    placeholder?: string;
};

function normalise(value: string) {
    return value.trim().replace(/\s+/g, " ");
}

export function TagInput({
    name = "tags",
    initialTags = [],
    placeholder = "Type a tag and press comma",
}: TagInputProps) {
    const [tags, setTags] = useState<InitialTag[]>([]);
    const [draft, setDraft] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const safeInitialTags = Array.isArray(initialTags) ? initialTags : [];

        const next = [
            ...new Map(
                safeInitialTags
                    .map((tag) => {
                        const clean = normalise(tag?.name ?? "");
                        if (!clean) return null;

                        return [
                            clean.toLowerCase(),
                            {
                                name: clean,
                                color: getTagColour(clean, tag?.color),
                            },
                        ] as const;
                    })
                    .filter(Boolean) as Array<
                    readonly [string, { name: string; color: string }]
                >,
            ).values(),
        ];

        setTags(next);
    }, [initialTags]);

    const hiddenValue = useMemo(
        () => tags.map((t) => t.name).join(", "),
        [tags],
    );

    function commitDraft() {
        const value = normalise(draft);
        if (!value) return;

        setTags((prev) => {
            if (
                prev.some((t) => t.name.toLowerCase() === value.toLowerCase())
            ) {
                return prev;
            }

            return [
                ...prev,
                {
                    name: value,
                    color: getTagColour(value),
                },
            ];
        });

        setDraft("");
    }

    function removeTag(tagName: string) {
        setTags((prev) => prev.filter((tag) => tag.name !== tagName));
        inputRef.current?.focus();
    }

    return (
        <div className="grid gap-2">
            <div className="flex min-h-10 w-full flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2">
                {tags.map((tag) => (
                    <Badge
                        key={tag.name}
                        className="h-full text-base cursor-pointer rounded-full border-0"
                        style={{
                            backgroundColor:
                                tag.color ?? getTagColour(tag.name),
                            color: "#111827",
                        }}
                        onClick={() => removeTag(tag.name)}
                        title="Click to remove">
                        {tag.name} ×
                    </Badge>
                ))}

                <Input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "," || e.key === "Enter") {
                            e.preventDefault();
                            commitDraft();
                        }

                        if (
                            e.key === "Backspace" &&
                            draft === "" &&
                            tags.length > 0
                        ) {
                            e.preventDefault();
                            setTags((prev) => prev.slice(0, -1));
                        }
                    }}
                    onBlur={commitDraft}
                    placeholder={tags.length === 0 ? placeholder : ""}
                    className="h-7 flex-1 border-0 p-4 shadow-none focus-visible:ring-0"
                />
            </div>

            <input type="hidden" name={name} value={hiddenValue} readOnly />
            <p className="text-xs text-muted-foreground">
                Separate tags with commas. Backspace removes the last tag.
            </p>
        </div>
    );
}
