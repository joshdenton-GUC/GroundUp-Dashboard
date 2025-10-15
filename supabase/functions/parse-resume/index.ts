import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleResumeParseRequest } from './request-handler.ts';
import { CORS_HEADERS } from './constants.ts';

/**
 * Main entry point for the resume parsing function
 * Handles CORS preflight requests and routes to the main handler
 */
serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    // Ensure 200 OK on preflight and include Vary header for caching correctness
    return new Response('ok', { headers: { ...CORS_HEADERS, Vary: 'Origin' } });
  }

  // Route to main request handler
  return await handleResumeParseRequest(req);
});
