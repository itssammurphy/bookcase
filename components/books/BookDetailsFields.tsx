import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/books/TagInput";
import { RatingInput } from "@/components/books/RatingInput";

const RATING_OPTIONS = ["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"];

type NamedOption = {
    name: string;
};

type TagOption = {
    name: string;
    color?: string | null;
};

type BookDetailsFieldsProps = {
    initialTitle?: string;
    initialAuthors?: NamedOption[] | null;
    initialPublicationYear?: number | null;
    initialRating?: number | null;
    initialTags?: TagOption[] | null;
    initialPrivateNotes?: string | null;
    showOwnership?: boolean;
    isOwned?: boolean;
    ratingVariant?: "select" | "stars";
};

export function BookDetailsFields({
    initialTitle = "",
    initialAuthors = [],
    initialPublicationYear = null,
    initialRating = null,
    initialTags = [],
    initialPrivateNotes = "",
    showOwnership = false,
    isOwned = false,
    ratingVariant = "stars",
}: BookDetailsFieldsProps) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required defaultValue={initialTitle} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="authors">Authors</Label>
                <TagInput
                    name="authors"
                    initialTags={initialAuthors}
                    placeholder="Type an author and press comma"
                />
            </div>

            <div className={`grid gap-2 ${showOwnership ? "sm:grid-cols-2" : ""}`}>
                {showOwnership ? (
                    <div className="grid gap-2">
                        <Label>Ownership</Label>
                        <div className="flex flex-wrap gap-2">
                            <label className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm">
                                <input
                                    type="radio"
                                    name="owned"
                                    value="true"
                                    defaultChecked={isOwned}
                                />
                                Owned
                            </label>

                            <label className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm">
                                <input
                                    type="radio"
                                    name="owned"
                                    value="false"
                                    defaultChecked={!isOwned}
                                />
                                Not owned
                            </label>
                        </div>
                    </div>
                ) : null}

                <div className="grid gap-2">
                    <Label htmlFor="publication_year">Publication year</Label>
                    <Input
                        id="publication_year"
                        name="publication_year"
                        inputMode="numeric"
                        defaultValue={initialPublicationYear ?? ""}
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="personal_rating">Rating</Label>
                {ratingVariant === "select" ? (
                    <select
                        id="personal_rating"
                        name="personal_rating"
                        defaultValue={initialRating?.toString() ?? ""}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="">No rating</option>
                        {RATING_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                ) : (
                    <RatingInput initialValue={initialRating} />
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <TagInput name="tags" initialTags={initialTags} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="private_notes">Private notes</Label>
                <Textarea
                    id="private_notes"
                    name="private_notes"
                    rows={6}
                    defaultValue={initialPrivateNotes ?? ""}
                />
            </div>
        </>
    );
}
