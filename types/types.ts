export type AuthorsPageProps = {
    searchParams: Promise<{
        sort?: string;
        page?: string;
    }>;
};
export type AuthorStatsRow = {
    author_id: string;
    user_id: string;
    name: string;
    total_books: number;
    average_rating: number | null;
    books_read: number;
};
export type AuthorIndividualPageProps = {
    params: Promise<{
        id: string;
    }>;
};
export type AuthorBookRow = {
    id: string;
    title: string;
    personal_rating: number | null;
    favourite: boolean;
    publication_year: number | null;
};
export type BookReadRow = {
    book_id: string;
    started_at: string | null;
    finished_at: string | null;
};
export type DerivedBookRow = AuthorBookRow & {
    derived_status: "unread" | "reading" | "read";
    reread_count: number;
};
export type EditBookPageProps = {
    params: Promise<{
        id: string;
    }>;
};
export type ReadStatus = "unread" | "reading" | "read";
export type Tag = {
    id: string;
    name: string;
    color: string;
};
export type BookRow = {
    id: string;
    title: string;
    personal_rating: number | null;
    favourite: boolean;
    owned: boolean;
    author_names: string;
    tags: Tag[];
    book_tags: Tag[];
    derived_status: "unread" | "reading" | "read";
    reread_count: number;
    series_id: string | null;
    series_name: string | null;
    updated_at: string;
    publication_year: number;
    read: boolean;
};
export type CustomList = {
    id: string;
    name: string;
    sort_order: number;
};
export type Membership = {
    custom_list_id: string;
    book_id: string;
};
export type HomeStatsRow = {
    user_id: string;
    total_books: number;
    total_books_read: number;
    average_rating: number | null;
};
export type TopTagRow = {
    tag_id: string;
    tag_name: string;
    book_count: number;
    tag_color: string | null;
};
export type DashboardBookRow = {
    id: string;
    title: string;
    personal_rating: number | null;
    favourite: boolean;
    author_names: string;
    tags: {
        id: string;
        name: string;
        color: string;
    }[];
    derived_status: "unread" | "reading" | "read";
    reread_count: number;
    series_id: string | null;
    series_name: string | null;
    updated_at: string;
    publication_year: number;
    read: boolean;
};
export type SeriesProgressStatus =
    | "completed"
    | "partly_completed"
    | "not_started";
export type SeriesProgressRow = {
    user_id: string;
    series_id: string;
    series_name: string;
    total_required_books: number;
    completed_required_books: number;
    progress_status: SeriesProgressStatus;
};
export type SeriesDetailPageProps = {
    params: Promise<{
        id: string;
    }>;
};
export type BookStatus = "unread" | "reading" | "read";
export type AuthorProgressStatus = "all_read" | "some_read" | "none_read";
export type SeriesEntry = {
    id: string;
    chronology_index: number;
    book_id: string;
    book: {
        id: string;
        title: string;
        author_names: string;
        publication_year: number | null;
        derived_status: ReadStatus;
        reread_count: number;
    } | null;
};
