import type { Article } from "@/pages/api/article";
import type { Event } from "@/pages/api/event";

type ApiResponse<T> = {
  code?: number;
  message?: string;
  data?: T;
};

const HOME_PAGE_SIZE = 3;
const REQUEST_TIMEOUT_MS = 10000;

async function fetchPublicList<Item>(
  endpoint: string,
  dataKey: string,
  signal?: AbortSignal,
): Promise<Item[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("API URL is not defined");
  }

  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  const timeoutId = window.setTimeout(abortRequest, REQUEST_TIMEOUT_MS);

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener("abort", abortRequest, { once: true });
  }

  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as ApiResponse<
      Record<string, Item[] | undefined>
    >;

    if (typeof payload.code === "number" && payload.code !== 200) {
      throw new Error(payload.message || `API returned code ${payload.code}`);
    }

    const items = payload.data?.[dataKey];

    if (!Array.isArray(items)) {
      throw new Error(`API response does not contain ${dataKey}`);
    }

    return items;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortRequest);
  }
}

export function fetchHomeEvents(signal?: AbortSignal): Promise<Event[]> {
  const query = new URLSearchParams({
    publish_status: "2",
    order: "desc",
    page: "1",
    page_size: HOME_PAGE_SIZE.toString(),
  });

  return fetchPublicList<Event>(`/events?${query}`, "events", signal);
}

export function fetchHomeArticles(signal?: AbortSignal): Promise<Article[]> {
  const query = new URLSearchParams({
    publish_status: "2",
    category: "blog",
    order: "desc",
    page: "1",
    page_size: HOME_PAGE_SIZE.toString(),
  });

  return fetchPublicList<Article>(`/articles?${query}`, "articles", signal);
}
