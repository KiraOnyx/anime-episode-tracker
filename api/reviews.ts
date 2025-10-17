/// <reference types="@cloudflare/workers-types" />

/*
 * Cloudflare Worker endpoint to fetch and cache Chrome Web Store reviews.
 *
 * Bindings expected:
 * - env.ReviewsCache: KVNamespace (configure in wrangler.toml)
 */

interface Env {
  ReviewsCache: KVNamespace;
}

interface Metrics {
  avg: number;
  count: number;
  users: number;
}

interface Review {
  stars: number;
  date: string;
  text: string;
  lang?: string;
  source: "cws";
}

interface ReviewsPayload {
  extensionId: string;
  storeUrl: string;
  fetchedAt: string;
  rating: Metrics;
  reviews: Review[];
}

const EXTENSION_ID = "abcdefghijklmnopabcdefghijklmn";
const EXTENSION_SLUG = "anime-episode-tracker";
const STORE_URL = `https://chromewebstore.google.com/detail/${EXTENSION_SLUG}/${EXTENSION_ID}`;
const CACHE_TTL_HOURS = 12;
const TOP_REVIEWS_WINDOW_DAYS = 7;
const TOP_REVIEWS_COUNT = 3;

const CACHE_KEY = `reviews:${EXTENSION_ID}`;
const CACHE_TTL_SECONDS = CACHE_TTL_HOURS * 60 * 60;
const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: HEADERS });
    }

    if (request.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: HEADERS,
      });
    }

    let cached: ReviewsPayload | null = null;
    try {
      cached = await env.ReviewsCache.get<ReviewsPayload>(CACHE_KEY, "json");
    } catch (error) {
      console.warn("reviews-cache-read-error", error);
    }

    try {
      const html = await fetchStorePage();
      const { metrics, reviews: allReviews } = parseStorePage(html);
      if (!metrics || !Number.isFinite(metrics.avg)) {
        throw new Error("metrics-missing");
      }

      const reviews = pickTopReviews(allReviews, TOP_REVIEWS_WINDOW_DAYS, TOP_REVIEWS_COUNT);
      const payload: ReviewsPayload = {
        extensionId: EXTENSION_ID,
        storeUrl: STORE_URL,
        fetchedAt: new Date().toISOString(),
        rating: metrics,
        reviews,
      };

      await env.ReviewsCache.put(CACHE_KEY, JSON.stringify(payload), {
        expirationTtl: CACHE_TTL_SECONDS,
      });

      return new Response(JSON.stringify(payload), { status: 200, headers: HEADERS });
    } catch (error) {
      console.error("reviews-fetch-error", error);
      if (cached) {
        return new Response(JSON.stringify({ ...cached, stale: true }), {
          status: 200,
          headers: HEADERS,
        });
      }

      return new Response(JSON.stringify({ error: "Unable to load reviews" }), {
        status: 502,
        headers: HEADERS,
      });
    }
  },
};

async function fetchStorePage(): Promise<string> {
  const response = await fetch(STORE_URL, {
    method: "GET",
    headers: {
      "user-agent": "AnimeEpisodeTracker/1.0 (+https://example.com)",
      accept: "text/html,application/xhtml+xml",
    },
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error(`store-fetch-failed:${response.status}`);
  }

  return response.text();
}

export function parseStorePage(html: string): { metrics: Metrics; reviews: Review[] } {
  const metrics: Metrics = {
    avg: 0,
    count: 0,
    users: 0,
  };

  const reviews: Review[] = [];

  extractFromJsonLd(html, metrics, reviews);
  extractFromHydratedState(html, metrics, reviews);
  extractMetricsFallback(html, metrics);
  extractReviewsFallback(html, reviews);

  const unique = new Map<string, Review>();
  for (const review of reviews) {
    const key = `${review.date}|${review.stars}|${hashText(review.text)}`;
    if (!unique.has(key)) {
      unique.set(key, review);
    }
  }

  const sanitizedReviews = Array.from(unique.values())
    .map((review) => ({
      ...review,
      text: sanitizeText(review.text),
      date: normalizeDate(review.date),
    }))
    .filter((review) => Boolean(review.text) && Boolean(review.date));

  metrics.avg = roundTo(metrics.avg, 1);
  metrics.count = Math.max(0, Math.round(metrics.count));
  metrics.users = Math.max(0, Math.round(metrics.users));

  return { metrics, reviews: sanitizedReviews };
}

export function pickTopReviews(allReviews: Review[], windowDays: number, count: number): Review[] {
  const now = new Date();
  const recentThreshold = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const scored = allReviews.map((review) => ({
    review,
    score: scoreReview(review),
    isRecent: new Date(review.date) >= recentThreshold,
  }));

  const recent = scored.filter((item) => item.isRecent);
  const sortedRecent = recent.sort((a, b) => b.score - a.score || b.review.stars - a.review.stars || compareDatesDesc(a.review.date, b.review.date));

  const selected: Review[] = sortedRecent.slice(0, count).map((item) => item.review);

  if (selected.length < count) {
    const remaining = scored
      .filter((item) => !item.isRecent)
      .sort((a, b) => b.score - a.score || b.review.stars - a.review.stars || compareDatesDesc(a.review.date, b.review.date));
    for (const item of remaining) {
      if (selected.length >= count) break;
      selected.push(item.review);
    }
  }

  return selected.slice(0, count);
}

function extractFromJsonLd(html: string, metrics: Metrics, reviews: Review[]) {
  const scriptRegex = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html))) {
    const json = match[1].trim();
    try {
      const data = JSON.parse(json);
      const node = Array.isArray(data) ? data.find((item) => item?.["@type"] === "Product") ?? data[0] : data;
      if (!node) continue;

      if (node.aggregateRating) {
        const { ratingValue, reviewCount, ratingCount } = node.aggregateRating;
        metrics.avg = metrics.avg || toNumber(ratingValue);
        metrics.count = metrics.count || toNumber(reviewCount || ratingCount);
      }

      if (node.offers && typeof node.offers === "object") {
        const users = node.offers.seller?.aggregateRating?.ratingCount || node.interactionCount;
        if (!metrics.users) {
          metrics.users = toNumber(users);
        }
      }

      if (!metrics.users && Array.isArray(node.interactionStatistic)) {
        for (const statistic of node.interactionStatistic) {
          if (statistic?.interactionType?.includes("User")) {
            metrics.users = toNumber(statistic.userInteractionCount);
            break;
          }
        }
      }

      const reviewNodes = Array.isArray(node.review) ? node.review : [];
      for (const reviewNode of reviewNodes) {
        const stars = toNumber(reviewNode.reviewRating?.ratingValue || reviewNode.starRating);
        const date = reviewNode.datePublished || reviewNode.dateCreated || "";
        const text = reviewNode.reviewBody || reviewNode.description || "";
        const lang = reviewNode.inLanguage || reviewNode.reviewBodyLanguage;
        if (!stars || !text) continue;
        reviews.push({
          stars: clampStars(stars),
          date,
          text,
          lang,
          source: "cws",
        });
      }
    } catch (error) {
      console.warn("jsonld-parse-error", error);
      continue;
    }
  }
}

function extractFromHydratedState(html: string, metrics: Metrics, reviews: Review[]) {
  const stateRegex = /AF_initDataCallback\((?<payload>{[\s\S]*?})\);?/g;
  let match: RegExpExecArray | null;
  while ((match = stateRegex.exec(html))) {
    const payload = match.groups?.payload;
    if (!payload) continue;
    try {
      const data = JSON.parse(payload);
      const arr = data?.data;
      if (!Array.isArray(arr)) continue;
      const flat = JSON.stringify(arr);
      if (!metrics.avg) {
        const avgMatch = flat.match(/"AVERAGE_RATING"\s*,\s*(\d+(?:\.\d+)?)/);
        if (avgMatch) {
          metrics.avg = toNumber(avgMatch[1]);
        }
      }
      if (!metrics.count) {
        const countMatch = flat.match(/"RATING_COUNT"\s*,\s*(\d+)/);
        if (countMatch) {
          metrics.count = toNumber(countMatch[1]);
        }
      }
      if (!metrics.users) {
        const userMatch = flat.match(/"USER_COUNT"\s*,\s*(\d+)/);
        if (userMatch) {
          metrics.users = toNumber(userMatch[1]);
        }
      }

      const reviewsMatches = flat.match(/\{"reviewTitle"[\s\S]*?"reviewText"\s*:\s*"([\s\S]*?)"[\s\S]*?"starRating"\s*:\s*(\d)/g);
      if (reviewsMatches) {
        for (const raw of reviewsMatches) {
          const textMatch = raw.match(/"reviewText"\s*:\s*"([\s\S]*?)"/);
          const starsMatch = raw.match(/"starRating"\s*:\s*(\d)/);
          const dateMatch = raw.match(/"lastModifiedDate"\s*:\s*"([^"]+)"/);
          if (!textMatch || !starsMatch) continue;
          reviews.push({
            stars: clampStars(toNumber(starsMatch[1])),
            text: decodeJsonString(textMatch[1]),
            date: dateMatch ? dateMatch[1] : "",
            source: "cws",
          });
        }
      }
    } catch (error) {
      console.warn("hydrated-parse-error", error);
      continue;
    }
  }
}

function extractMetricsFallback(html: string, metrics: Metrics) {
  if (!metrics.avg) {
    const avgMatch = html.match(/([0-5](?:[\.,]\d)?)\s*(?:stars?|étoiles?)/i);
    if (avgMatch) {
      metrics.avg = toNumber(avgMatch[1]);
    }
  }
  if (!metrics.count) {
    const countMatch = html.match(/(\d[\d\s\.,]*)\s*(?:reviews?|avis)/i);
    if (countMatch) {
      metrics.count = toNumber(countMatch[1]);
    }
  }
  if (!metrics.users) {
    const usersMatch = html.match(/(\d[\d\s\.,]*)\s*(?:users?|utilisateurs)/i);
    if (usersMatch) {
      metrics.users = toNumber(usersMatch[1]);
    }
  }
}

function extractReviewsFallback(html: string, reviews: Review[]) {
  const reviewBlockRegex = /<div[^>]*class="[^"]*WCpQbe[^"]*"[\s\S]*?<span[^>]*aria-label="([^"]*?)"[\s\S]*?<span[^>]*class="[^"]*QJHSge[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span[^>]*class="[^"]*dehysf[^"]*"[^>]*>([\s\S]*?)<\/span>/g;
  let match: RegExpExecArray | null;
  while ((match = reviewBlockRegex.exec(html))) {
    const starsLabel = match[1];
    const textHtml = match[2];
    const dateHtml = match[3];
    const stars = extractStarsFromLabel(starsLabel);
    if (!stars) continue;
    const text = sanitizeText(textHtml);
    const date = sanitizeText(dateHtml);
    if (!text) continue;
    reviews.push({
      stars,
      text,
      date,
      source: "cws",
    });
  }
}

function scoreReview(review: Review): number {
  const base = review.stars * 10;
  const lengthWeight = Math.min(review.text.length / 80, 3);
  const keywords = ["excellent", "utile", "génial", "amazing", "love", "helpful", "parfait", "recommande", "recommend"];
  const keywordBonus = keywords.some((word) => review.text.toLowerCase().includes(word)) ? 2 : 0;
  return base + lengthWeight + keywordBonus;
}

function compareDatesDesc(a: string, b: string): number {
  const dateA = new Date(a).getTime();
  const dateB = new Date(b).getTime();
  return dateB - dateA;
}

function sanitizeText(input: string): string {
  const withoutHtml = input
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
  return withoutHtml.slice(0, 600);
}

function normalizeDate(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return new Date().toISOString().slice(0, 10);

  const isoCandidate = new Date(trimmed);
  if (!Number.isNaN(isoCandidate.getTime())) {
    return isoCandidate.toISOString().slice(0, 10);
  }

  const europeanMatch = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (europeanMatch) {
    const [_, d, m, y] = europeanMatch;
    const year = y.length === 2 ? `20${y}` : y;
    const date = new Date(Number(year), Number(m) - 1, Number(d));
    return date.toISOString().slice(0, 10);
  }

  const isoMatch = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d,\.]/g, "").replace(/,(?=\d{3}\b)/g, "").replace(/\s+/g, "");
    const commaCount = (normalized.match(/,/g) || []).length;
    if (commaCount === 1 && normalized.indexOf(",") > normalized.indexOf(".")) {
      return Number(normalized.replace(/,/g, "."));
    }
    return Number(normalized.replace(/,/g, ""));
  }
  return 0;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clampStars(stars: number): number {
  if (!Number.isFinite(stars)) return 0;
  return Math.min(5, Math.max(1, Math.round(stars)));
}

function extractStarsFromLabel(label: string): number {
  if (!label) return 0;
  const match = label.match(/(\d(?:[\.,]\d)?)\s*\/?\s*5/);
  if (match) {
    return clampStars(toNumber(match[1]));
  }
  const altMatch = label.match(/(\d)/);
  return altMatch ? clampStars(toNumber(altMatch[1])) : 0;
}

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

function decodeJsonString(value: string): string {
  try {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return JSON.parse(`"${escaped}"`);
  } catch {
    return value;
  }
}
