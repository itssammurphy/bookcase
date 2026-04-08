import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Tag } from "@/types/types";
import type { SortKey } from "@/components/bookshelf/bookshelfUtils";

type BookshelfFiltersCardProps = {
    q: string;
    author: string;
    series: string;
    status: string;
    ownership: string;
    selectedTag: string;
    sortKey: SortKey;
    allTags: Tag[];
    onQChange: (value: string) => void;
    onAuthorChange: (value: string) => void;
    onSeriesChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onOwnershipChange: (value: string) => void;
    onTagChange: (value: string) => void;
    onSortChange: (value: SortKey) => void;
    onClear: () => void;
};

export function BookshelfFiltersCard({
    q,
    author,
    series,
    status,
    ownership,
    selectedTag,
    sortKey,
    allTags,
    onQChange,
    onAuthorChange,
    onSeriesChange,
    onStatusChange,
    onOwnershipChange,
    onTagChange,
    onSortChange,
    onClear,
}: BookshelfFiltersCardProps) {
    return (
        <Card className="rounded-3xl shadow-sm">
            <CardHeader>
                <CardTitle>Search and filters</CardTitle>
            </CardHeader>

            <CardContent>
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[260px] flex-[2_1_420px]">
                        <Input
                            placeholder="Search title or author"
                            value={q}
                            onChange={(e) => onQChange(e.target.value)}
                        />
                    </div>

                    <div className="min-w-[180px] flex-[1_1_220px]">
                        <Input
                            placeholder="Filter author"
                            value={author}
                            onChange={(e) => onAuthorChange(e.target.value)}
                        />
                    </div>

                    <div className="min-w-[180px] flex-[1_1_220px]">
                        <Input
                            placeholder="Filter series"
                            value={series}
                            onChange={(e) => onSeriesChange(e.target.value)}
                        />
                    </div>

                    <div className="min-w-[160px] flex-[1_1_180px]">
                        <select
                            value={status}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Any status</option>
                            <option value="unread">Unread</option>
                            <option value="reading">Reading</option>
                            <option value="read">Read</option>
                        </select>
                    </div>

                    <div className="min-w-[160px] flex-[1_1_180px]">
                        <select
                            value={ownership}
                            onChange={(e) => onOwnershipChange(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Any ownership</option>
                            <option value="owned">Owned</option>
                            <option value="not_owned">Not owned</option>
                        </select>
                    </div>

                    <div className="min-w-[160px] flex-[1_1_180px]">
                        <select
                            value={selectedTag}
                            onChange={(e) => onTagChange(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Any tag</option>
                            {allTags.map((tag) => (
                                <option key={tag.id} value={tag.name}>
                                    {tag.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="min-w-[180px] flex-[1_1_220px]">
                        <select
                            value={sortKey}
                            onChange={(e) => onSortChange(e.target.value as SortKey)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="updated_desc">Recently updated</option>
                            <option value="title_asc">Title A–Z</option>
                            <option value="title_desc">Title Z–A</option>
                            <option value="author_asc">Author A–Z</option>
                            <option value="rating_desc">Highest rated</option>
                            <option value="year_desc">Newest publication year</option>
                            <option value="year_asc">Oldest publication year</option>
                            <option value="status">Status</option>
                        </select>
                    </div>

                    <div className="flex-[0_0_auto]">
                        <Button type="button" variant="secondary" onClick={onClear}>
                            Clear
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
