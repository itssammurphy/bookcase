import { Plus, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CustomList } from "@/types/types";

type BookshelfListHeaderProps = {
    filteredCount: number;
    selectedList: string;
    selectedListName: string;
    startIndex: number;
    pageSize: number;
    customLists: CustomList[];
    showCreateList: boolean;
    newListName: string;
    listActionPending: boolean;
    pageSizeOptions: readonly number[];
    onExport: () => void;
    onPageSizeChange: (size: number) => void;
    onDeleteSelectedList: () => void;
    onSelectedListChange: (id: string) => void;
    onToggleCreateList: () => void;
    onNewListNameChange: (value: string) => void;
    onCreateList: () => void;
    onCancelCreateList: () => void;
};

export function BookshelfListHeader({
    filteredCount,
    selectedList,
    selectedListName,
    startIndex,
    pageSize,
    customLists,
    showCreateList,
    newListName,
    listActionPending,
    pageSizeOptions,
    onExport,
    onPageSizeChange,
    onDeleteSelectedList,
    onSelectedListChange,
    onToggleCreateList,
    onNewListNameChange,
    onCreateList,
    onCancelCreateList,
}: BookshelfListHeaderProps) {
    return (
        <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle>Books</CardTitle>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onExport}
                        disabled={filteredCount === 0}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Export
                    </Button>

                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                                {size} per page
                            </option>
                        ))}
                    </select>

                    {selectedList !== "all" ? (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onDeleteSelectedList}
                            disabled={listActionPending}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete list
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="rounded-3xl border bg-card/60 p-3 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <Tabs value={selectedList} onValueChange={onSelectedListChange}>
                            <div className="overflow-x-auto pb-1">
                                <TabsList className="inline-flex h-auto min-w-max gap-2 rounded-2xl bg-transparent p-0">
                                    <TabsTrigger
                                        value="all"
                                        className="rounded-full border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        All books
                                    </TabsTrigger>

                                    {customLists.map((list) => (
                                        <TabsTrigger
                                            key={list.id}
                                            value={list.id}
                                            className="rounded-full border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                            {list.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>
                        </Tabs>
                    </div>

                    <div className="shrink-0 pl-1">
                        <Button
                            type="button"
                            size="icon"
                            className="rounded-full"
                            onClick={onToggleCreateList}
                            aria-label="Create list">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {showCreateList ? (
                    <div className="mt-3 flex flex-col gap-2 rounded-2xl border bg-background/70 p-3 sm:flex-row">
                        <Input
                            value={newListName}
                            onChange={(e) => onNewListNameChange(e.target.value)}
                            placeholder="New list name"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    onCreateList();
                                }
                            }}
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={onCreateList}
                                disabled={!newListName.trim() || listActionPending}>
                                Create list
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onCancelCreateList}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : null}

                <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm font-medium">
                            Current list: {selectedListName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {filteredCount} matching book
                            {filteredCount === 1 ? "" : "s"}
                            {selectedList !== "all" ? ` in ${selectedListName}` : ""}
                        </p>
                    </div>

                    {filteredCount > 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Showing {startIndex + 1}–
                            {Math.min(startIndex + pageSize, filteredCount)} of{" "}
                            {filteredCount}
                        </p>
                    ) : null}
                </div>
            </div>
        </CardHeader>
    );
}
