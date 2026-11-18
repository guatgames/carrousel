export const TOKEN_META = import.meta.env.TOKEN_META;
export const ID_BUSSINESS = import.meta.env.ID_BUSSINESS;

// "BASE_URL" está reservado por Astro para la ruta base del sitio,
// por eso la URL de Graph API usa su propia variable.
export const GRAPH_API_URL = import.meta.env.GRAPH_API_URL ?? "https://graph.facebook.com";
export const GRAPH_API_VERSION = import.meta.env.GRAPH_API_VERSION ?? "v23.0";

export const TIKTOK_ACCESS_TOKEN = import.meta.env.TIKTOK_ACCESS_TOKEN;
export const TIKTOK_API_URL = import.meta.env.TIKTOK_API_URL ?? "https://open.tiktokapis.com";
