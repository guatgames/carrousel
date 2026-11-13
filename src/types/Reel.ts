export interface Reel {
    id: string;
    media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;
    media_url: string;
    permalink: string;
    thumbnail_url?: string;
    caption?: string;
}

export interface MediaResponse {
    data: Reel[];
    paging?: {
        cursors?: { before?: string; after?: string };
        next?: string;
        previous?: string;
    };
}
