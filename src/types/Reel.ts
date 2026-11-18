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

export interface TikTokVideo {
    id: string;
    title?: string;
    video_description?: string;
    cover_image_url?: string;
    share_url?: string;
    embed_link?: string;
}

export interface TikTokVideoResponse {
    data?: {
        videos?: TikTokVideo[];
        cursor?: number;
        has_more?: boolean;
    };
    error?: {
        code?: string;
        message?: string;
        log_id?: string;
    };
}
