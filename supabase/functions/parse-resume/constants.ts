/**
 * CORS headers for cross-origin requests
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-requested-with, accept, accept-language, origin, referer, cache-control, pragma',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Text validation thresholds
 */
export const TEXT_VALIDATION = {
  MIN_LENGTH: 10,
  MIN_CONTENT_LENGTH: 50,
};
