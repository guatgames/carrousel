import type { MediaResponse, Reel, TikTokVideoResponse } from "../types/Reel";
import {
    GRAPH_API_URL,
    GRAPH_API_VERSION,
    ID_BUSSINESS,
    TIKTOK_ACCESS_TOKEN,
    TIKTOK_API_URL,
    TOKEN_META,
} from "./config";

const FIELDS = [
    "id",
    "media_type",
    "media_url",
    "permalink",
    "thumbnail_url",
    "caption",
].join(",");

const TIKTOK_FIELDS = [
    "id",
    "title",
    "video_description",
    "cover_image_url",
    "share_url",
    "embed_link",
].join(",");

export async function fetchMedia(): Promise<Reel[]> {
    if (!TOKEN_META || !ID_BUSSINESS) {
        throw new Error("Faltan TOKEN_META o ID_BUSSINESS en el archivo .env.");
    }

    const params = new URLSearchParams({
        fields: FIELDS,
        limit: "20",
    });

    const response = await fetch(
        `${GRAPH_API_URL}/${GRAPH_API_VERSION}/${ID_BUSSINESS}/media?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${TOKEN_META}`,
            },
        },
    );

    const payload = (await response.json().catch(() => ({}))) as MediaResponse & {
        error?: { message?: string; type?: string; code?: number };
    };

    if (!response.ok || payload.error) {
        throw new Error(
            payload.error?.message ?? `La API de Instagram respondió con estado ${response.status}.`,
        );
    }

    if (!Array.isArray(payload.data)) {
        return [];
    }

    return payload.data.filter((item) => Boolean(item.media_url || item.thumbnail_url));
}

export async function fetchTikTokVideos(): Promise<Reel[]> {
    if (!TIKTOK_ACCESS_TOKEN) {
        throw new Error("Falta TIKTOK_ACCESS_TOKEN en el archivo .env.");
    }

    const params = new URLSearchParams({
        fields: TIKTOK_FIELDS,
    });

    const response = await fetch(
        `${TIKTOK_API_URL}/v2/video/list/?${params.toString()}`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${TIKTOK_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ max_count: 20 }),
        },
    );

    const payload = (await response.json().catch(() => ({}))) as TikTokVideoResponse;
    const errorCode = payload.error?.code;
    const hasError = !response.ok || (errorCode && errorCode !== "ok");

    if (hasError) {
        const detail = [errorCode, payload.error?.message, payload.error?.log_id]
            .filter(Boolean)
            .join(" | ");
        throw new Error(
            detail || `La API de TikTok respondió con estado ${response.status}.`,
        );
    }

    const videos = payload.data?.videos ?? [];

    return videos
        .filter((video) => Boolean(video.cover_image_url))
        .map((video) => ({
            id: video.id,
            media_type: "VIDEO",
            media_url: video.cover_image_url ?? "",
            thumbnail_url: video.cover_image_url,
            permalink: video.share_url ?? video.embed_link ?? "https://www.tiktok.com/",
            caption: video.title || video.video_description,
        }));
}
