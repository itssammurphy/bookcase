"use client";

import {
    setTagColour,
    readTagColours,
    writeTagColours,
} from "@/lib/tagColours";
import { Button } from "@/components/ui/button";

type TagColorRowProps = {
    tagId: string;
    name: string;
    color: string;
    updateAction: (formData: FormData) => void;
    deleteAction: (formData: FormData) => void;
};

function removeFromLocalStorage(tagName: string) {
    const map = readTagColours();
    const key = tagName.trim().toLowerCase();
    delete map[key];
    writeTagColours(map);
}

export function TagColourRow({
    tagId,
    name,
    color,
    updateAction,
    deleteAction,
}: TagColorRowProps) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <span
                    className="h-4 w-4 rounded-full border"
                    style={{ backgroundColor: color }}
                />
                <span className="font-medium">{name}</span>
            </div>

            <div className="flex items-center gap-2">
                {/* UPDATE COLOR */}
                <form
                    action={(formData) => {
                        const nextColor = String(
                            formData.get("color") ?? color,
                        );
                        setTagColour(name, nextColor);
                        updateAction(formData);
                    }}
                    className="flex items-center gap-2">
                    <input type="hidden" name="tag_id" value={tagId} />
                    <input type="color" name="color" defaultValue={color} />
                    <Button type="submit" variant="secondary">
                        Save
                    </Button>
                </form>

                {/* DELETE TAG */}
                <form
                    action={(formData) => {
                        removeFromLocalStorage(name);
                        deleteAction(formData);
                    }}>
                    <input type="hidden" name="tag_id" value={tagId} />
                    <Button type="submit" variant="destructive">
                        Delete
                    </Button>
                </form>
            </div>
        </div>
    );
}
