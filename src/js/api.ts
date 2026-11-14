import type { MediaResponse, Reel } from "../types/Reel";
import { GRAPH_API_URL, GRAPH_API_VERSION, ID_BUSSINESS, TOKEN_META } from "./config";

const FIELDS = [
    "id",
    "media_type",
    "media_url",
    "permalink",
    "thumbnail_url",
    "caption",
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
