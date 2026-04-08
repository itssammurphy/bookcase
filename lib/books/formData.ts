type ParseBookFormDataOptions = {
    includeOwned?: boolean;
};

function parseOptionalNumber(rawValue: FormDataEntryValue | null) {
    const value = String(rawValue ?? "").trim();

    if (!value) {
        return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

export type ParsedBookFormData = {
    title: string;
    publicationYear: number | null;
    personalRating: number | null;
    privateNotes: string | null;
    rawTags: string;
    rawAuthors: string;
    owned?: boolean;
};

export function parseBookFormData(
    formData: FormData,
    options: ParseBookFormDataOptions = {},
): ParsedBookFormData {
    const title = String(formData.get("title") ?? "").trim();
    const privateNotesValue = String(formData.get("private_notes") ?? "").trim();

    const payload: ParsedBookFormData = {
        title,
        publicationYear: parseOptionalNumber(formData.get("publication_year")),
        personalRating: parseOptionalNumber(formData.get("personal_rating")),
        privateNotes: privateNotesValue || null,
        rawTags: String(formData.get("tags") ?? "").trim(),
        rawAuthors: String(formData.get("authors") ?? "").trim(),
    };

    if (options.includeOwned) {
        payload.owned = String(formData.get("owned") ?? "false") === "true";
    }

    return payload;
}
