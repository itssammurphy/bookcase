export type TagMeta = {
    name: string;
    color: string;
};

const STORAGE_KEY = "bookcase-tag-colors";

const DEFAULT_PALETTE = [
    "#FCA5A5",
    "#FDBA74",
    "#FDE68A",
    "#86EFAC",
    "#93C5FD",
    "#A5B4FC",
    "#D8B4FE",
    "#F9A8D4",
    "#C4B5FD",
    "#67E8F9",
];

function normaliseTagName(tag: string) {
    return tag.trim().replace(/\s+/g, " ").toLowerCase();
}

function hashString(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function getAutoTagColour(tagName: string) {
    const key = normaliseTagName(tagName);
    return DEFAULT_PALETTE[hashString(key) % DEFAULT_PALETTE.length];
}

export function readTagColours(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as Record<string, string>;
        return parsed ?? {};
    } catch {
        return {};
    }
}

export function writeTagColours(map: Record<string, string>) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getTagColour(tagName: string, dbColour?: string | null) {
    const key = normaliseTagName(tagName);
    const local = readTagColours();

    if (dbColour) {
        if (local[key] !== dbColour) {
            local[key] = dbColour;
            writeTagColours(local);
        }
        return dbColour;
    }

    if (local[key]) return local[key];

    const generated = getAutoTagColour(tagName);
    local[key] = generated;
    writeTagColours(local);
    return generated;
}

export function setTagColour(tagName: string, color: string) {
    const key = normaliseTagName(tagName);
    const local = readTagColours();
    local[key] = color;
    writeTagColours(local);
}
