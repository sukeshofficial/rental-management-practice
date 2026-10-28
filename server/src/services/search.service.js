/**
 * Product Search Service — F02
 *
 * Search engine: MongoDB Text Index + prefix regex augmentation.
 * This is a self-managed MongoDB instance (not Atlas), so Atlas Search
 * and its fuzzy/autocomplete capabilities are NOT available.
 *
 * Search levels implemented:
 *   Level 1 — Text index (multi-word, multi-field token matching)
 *   Level 2 — Prefix regex for short queries (1-2 chars) and augmentation
 *   Level 3 — Lightweight typo tolerance via keyword list comparison
 *   Level 4 — Synonyms via explicit product keywords[] field
 *
 * Limitations:
 *   - No native fuzzy matching (typo tolerance is approximate, client-side only)
 *   - No semantic/vector search
 *   - No soundex or phonetic matching
 *
 * Performance:
 *   - Text index prevents full collection scans for common queries
 *   - Prefix regex is bounded with start anchor (^) and only used as augmentation
 *   - Query length is validated and capped
 */

import Product from "../models/product.model.js";

/** Maximum number of characters accepted in a search query */
const MAX_QUERY_LENGTH = 200;

/** Minimum query length for fuzzy matching (avoid noise) */
const MIN_FUZZY_LENGTH = 4;

/**
 * Escape a string for safe use in a MongoDB regex.
 * Prevents ReDoS attacks.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitize and validate a search query string.
 * Returns null if the query should be treated as empty.
 * @param {string | undefined} raw
 * @returns {string | null}
 */
export function sanitizeQuery(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_QUERY_LENGTH) {
    const err = new Error(
      `Search query cannot exceed ${MAX_QUERY_LENGTH} characters`
    );
    err.statusCode = 400;
    throw err;
  }
  return trimmed;
}

/**
 * Build the primary search stage using MongoDB's $text operator.
 * Supports multi-word token matching across indexed fields.
 * Returns a query filter object and a projection for score sorting.
 *
 * @param {string} query
 * @returns {{ filter: object, scoreProjection: object }}
 */
function buildTextSearchStage(query) {
  return {
    filter: { $text: { $search: query } },
    scoreProjection: { score: { $meta: "textScore" } },
  };
}

/**
 * Build a bounded prefix regex query for augmentation.
 * Only anchored at the start (^) to prevent ReDoS.
 * Searches name and SKU fields.
 *
 * @param {string} query
 * @returns {object} MongoDB filter
 */
function buildPrefixFilter(query) {
  const escaped = escapeRegex(query);
  const regex = new RegExp(`^${escaped}`, "i");
  return {
    $or: [{ name: { $regex: regex } }, { sku: { $regex: regex } }],
  };
}

/**
 * Calculate approximate Levenshtein edit distance between two strings.
 * Used for lightweight typo tolerance against keyword candidates.
 * Only computed for short strings (≤ 25 chars) to bound cost.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshtein(a, b) {
  if (a.length > 25 || b.length > 25) return Infinity;
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Build a fuzzy augmentation query from a single query token.
 * Compares the token against a static keyword vocabulary and returns
 * a regex OR filter for any vocabulary word within edit distance ≤ 2.
 *
 * NOTE: This is an approximate, not guaranteed, implementation.
 * It operates against a static vocabulary list, not the index.
 *
 * @param {string} token  Single word from the search query
 * @returns {object | null} MongoDB filter or null if no fuzzy matches
 */
function buildFuzzyFilter(token) {
  if (token.length < MIN_FUZZY_LENGTH) return null;

  // Common rental product vocabulary for fuzzy expansion.
  // Extend this list as the product catalog grows.
  const vocabulary = [
    "camera",
    "cameras",
    "photography",
    "photo",
    "mirrorless",
    "video",
    "recording",
    "canon",
    "drill",
    "drilling",
    "power",
    "tool",
    "tools",
    "bosch",
    "projector",
    "epson",
    "audio",
    "speaker",
    "speakers",
    "music",
    "dj",
    "sound",
    "jbl",
    "camping",
    "tent",
    "adventure",
    "outdoor",
    "shelter",
    "sleeping",
    "furniture",
    "chair",
    "table",
    "folding",
    "event",
    "cleaning",
    "pressure",
    "washer",
    "wash",
    "equipment",
    "accessory",
    "accessories",
    "lens",
    "tripod",
    "flash",
    "lighting",
    "av",
    "presentation",
    "screen",
    "stage",
  ];

  const tokenLower = token.toLowerCase();
  const matches = vocabulary.filter(
    (word) => levenshtein(tokenLower, word) <= 2
  );

  if (matches.length === 0) return null;

  // Build a regex OR across matched vocabulary words
  const regexParts = matches.map(
    (word) => new RegExp(escapeRegex(word), "i")
  );

  return {
    $or: [
      { name: { $in: regexParts } },
      { keywords: { $in: regexParts } },
      { category: { $in: regexParts } },
      { description: { $in: regexParts } },
    ],
  };
}

/**
 * Build a combined search filter that merges text search, prefix matching,
 * and optional fuzzy augmentation.
 *
 * Strategy:
 *   1. Always try $text search for multi-word and token matching.
 *   2. Augment with prefix regex for names/SKUs.
 *   3. For single-word queries ≥ MIN_FUZZY_LENGTH, add fuzzy filter as $or branch.
 *
 * @param {string} query  Sanitized search query
 * @returns {{ filter: object, useTextScore: boolean }}
 */
export function buildSearchFilter(query) {
  const textStage = buildTextSearchStage(query);
  const prefixFilter = buildPrefixFilter(query);

  // Determine fuzzy augmentation for single-word queries
  const tokens = query.trim().split(/\s+/);
  const fuzzyFilter =
    tokens.length === 1 && query.length >= MIN_FUZZY_LENGTH
      ? buildFuzzyFilter(tokens[0])
      : null;

  // Combine: text OR prefix OR fuzzy
  const searchBranches = [textStage.filter, prefixFilter];
  if (fuzzyFilter) {
    searchBranches.push(fuzzyFilter);
  }

  return {
    filter: { $or: searchBranches },
    useTextScore: true,
    scoreProjection: textStage.scoreProjection,
  };
}

/**
 * Execute an intelligent product search with all configured levels.
 *
 * Approach:
 *   - Run text search first (primary, uses index)
 *   - If results are sparse (< 3), run prefix/fuzzy augmentation separately
 *     and merge (deduplicate by _id)
 *
 * @param {object} params
 * @param {string} params.query         Sanitized search query string
 * @param {object} params.baseFilter    Additional filter (category, status, etc.)
 * @param {object} params.sortOverride  If user explicitly chose a sort field
 * @param {number} params.page
 * @param {number} params.limit
 * @returns {Promise<{ products: object[], total: number }>}
 */
export async function executeProductSearch({
  query,
  baseFilter = {},
  sortOverride = null,
  page = 1,
  limit = 12,
}) {
  const skip = (page - 1) * limit;

  // ── Phase 1: MongoDB text search ─────────────────────────────────────────
  const textFilter = {
    $text: { $search: query },
    ...baseFilter,
  };

  const textSort = sortOverride
    ? sortOverride
    : { score: { $meta: "textScore" } };

  const textProjection = { score: { $meta: "textScore" } };

  let textResults = [];
  let textTotal = 0;

  try {
    textTotal = await Product.countDocuments(textFilter);
    textResults = await Product.find(textFilter, textProjection)
      .sort(textSort)
      .skip(skip)
      .limit(limit)
      .lean();
  } catch (err) {
    // Text index may not be ready yet (e.g., fresh instance) — degrade gracefully
    console.warn(
      "[search] Text index unavailable, falling back to prefix search:",
      err.message
    );
  }

  // If text search returned enough results, return them directly
  if (textResults.length >= 3 || textTotal > 0) {
    return {
      products: textResults,
      total: textTotal,
      searchStrategy: "text",
    };
  }

  // ── Phase 2: Prefix + fuzzy augmentation ─────────────────────────────────
  const prefixFilter = buildPrefixFilter(query);
  const tokens = query.trim().split(/\s+/);
  const fuzzyFilter =
    tokens.length === 1 && query.length >= MIN_FUZZY_LENGTH
      ? buildFuzzyFilter(tokens[0])
      : null;

  const augmentBranches = [prefixFilter];
  if (fuzzyFilter) augmentBranches.push(fuzzyFilter);

  const augmentFilter = {
    $or: augmentBranches,
    ...baseFilter,
  };

  // Merge text result IDs into augment to union both sets
  const textResultIds = textResults.map((p) => p._id);
  const mergedFilter =
    textResultIds.length > 0
      ? {
          $or: [{ _id: { $in: textResultIds } }, augmentFilter],
        }
      : augmentFilter;

  const augmentSort = sortOverride || { name: 1 };

  const augmentTotal = await Product.countDocuments(mergedFilter);
  const augmentResults = await Product.find(mergedFilter)
    .sort(augmentSort)
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    products: augmentResults,
    total: augmentTotal,
    searchStrategy: "augmented",
  };
}
