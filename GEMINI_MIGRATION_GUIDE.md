# Migration from OpenAI to Google Gemini

## Overview

Successfully migrated the resume parsing functionality from OpenAI GPT-4o to Google Gemini 1.5 Flash to significantly reduce costs while maintaining high-quality resume parsing capabilities.

## Changes Made

### 1. New Gemini Analyzer (`supabase/functions/parse-resume/gemini-analyzer.ts`)

- Created a new analyzer using Google Gemini File API (following official SDK pattern)
- Simplified FormData-based file upload for efficient large file handling (up to 10MB)
- Uploads PDF to Gemini File API (v1beta), then references by URI in generation request
- Uses `gemini-2.5-flash` model for cost-effective processing with extended reasoning
- Uses Gemini API v1beta for both file upload and content generation
- Maintains the same schema and response format as the OpenAI version
- Includes both PDF and text-based analysis methods
- Clean implementation matching official Google Gemini SDK patterns

### 2. Updated Request Handler (`supabase/functions/parse-resume/request-handler.ts`)

- Replaced OpenAI API calls with Gemini API calls
- Updated environment variable from `OPENAI_API_KEY` to `GEMINI_API_KEY`
- Updated logging messages to reflect Gemini usage

### 3. Updated API Key Management (`supabase/functions/manage-api-keys/index.ts`)

- Changed API key references from `openaiKey` to `geminiKey`
- Updated environment variables from `OPENAI_API_KEY`/`ADMIN_OPENAI_API_KEY` to `GEMINI_API_KEY`/`ADMIN_GEMINI_API_KEY`
- Updated audit log references

### 4. Updated Documentation (`supabase/functions/parse-resume/README.md`)

- Updated all references from OpenAI to Google Gemini
- Corrected environment variable documentation

### 5. Frontend Updates

- **DocumentUploader.tsx**: Updated error messages from "OpenAI" to "Gemini"
- **vite-env.d.ts**: Updated TypeScript environment variable definitions

## Cost Savings

### OpenAI GPT-4o (Previous)

- **Model**: gpt-4o
- **Input**: $2.50 per 1M tokens
- **Output**: $10.00 per 1M tokens
- **Average cost per resume**: ~$0.015 - $0.025 (estimated)

### Google Gemini 2.5 Flash (Current)

- **Model**: gemini-2.5-flash (with extended reasoning)
- **Input**: $0.075 per 1M tokens (up to 128K context)
- **Output**: $0.30 per 1M tokens
- **Note**: Uses internal "thoughts" for reasoning (~2000 tokens per resume)
- **Average cost per resume**: ~$0.001 - $0.002 (estimated, includes reasoning tokens)

### 💰 Cost Reduction: ~90-95% savings per resume parse

For 1,000 resumes per month:

- **OpenAI**: ~$15 - $25/month
- **Gemini 2.5 Flash**: ~$1 - $2/month (includes extended reasoning)
- **Savings**: ~$13 - $23/month

**Note**: Gemini 2.5 Flash uses more tokens due to internal reasoning, but is still dramatically cheaper than OpenAI.

## Environment Setup Required

### Supabase Edge Functions

You need to set the following environment variables in your Supabase project:

1. **Get a Gemini API Key**

   - Visit: https://aistudio.google.com/app/apikey
   - Create a new API key

2. **Set the environment variable in Supabase**

   ```bash
   # Using Supabase CLI
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here

   # Or use the Supabase Dashboard
   # Project Settings > Edge Functions > Secrets
   # Add: GEMINI_API_KEY
   ```

3. **Optional: Set fallback key**
   ```bash
   supabase secrets set ADMIN_GEMINI_API_KEY=your_admin_gemini_api_key_here
   ```

### Local Development

If running locally, update your `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## API Compatibility

The Gemini implementation maintains 100% compatibility with the existing API:

- Same request format
- Same response format
- Same error handling
- Same validation logic

No changes are required to the frontend calling code.

## Features Maintained

✅ Multimodal PDF analysis (File API with URI references)
✅ Efficient handling of large files (up to 10MB without base64 bloat)
✅ Structured JSON output with schema validation
✅ Experience level mapping (0, 2, 4, 7, 10)
✅ Skills extraction
✅ Contact information extraction
✅ Education parsing
✅ Professional summary generation
✅ Error handling and fallback logic
✅ Reliable multipart file upload

## Testing Recommendations

1. **Test with various resume formats**

   - Simple text-based PDFs
   - Complex multi-column PDFs
   - Resumes with different layouts

2. **Verify output quality**

   - Check that all fields are extracted correctly
   - Verify experience level mapping is accurate
   - Ensure skills are properly parsed

3. **Monitor costs**

   - Track API usage in Google Cloud Console
   - Compare costs with previous OpenAI usage

4. **Error handling**
   - Test with invalid PDFs
   - Test with large files
   - Test with corrupted files

## Rollback Plan

If you need to rollback to OpenAI:

1. Rename `gemini-analyzer.ts` to `gemini-analyzer.ts.backup`
2. In `request-handler.ts`, change:
   ```typescript
   import { analyzeResumePDFWithGemini } from './gemini-analyzer.ts';
   ```
   to:
   ```typescript
   import { analyzeResumePDFWithOpenAI } from './openai-analyzer.ts';
   ```
3. Update environment variables back to `OPENAI_API_KEY`
4. Revert the manage-api-keys changes

## Additional Notes

- Gemini 1.5 Flash is optimized for speed and cost
- Using `gemini-2.5-flash` model (stable version)
- **v1beta API approach**:
  - Both file upload and content generation use **v1beta** API
  - v1beta supports advanced features like `file_data`, `responseMimeType`, and `responseSchema`
  - v1 API has limited feature support and different field naming
- **File API workflow** (based on official Gemini SDK):
  - Uploads PDF via FormData (simple and clean)
  - Supports files up to 10MB efficiently (no base64 overhead)
  - References files by URI using `fileData` structure
  - Files are temporarily cached on Google's servers
  - Includes 2-second wait for file processing before analysis
  - Uses `fileUri` and `mimeType` from upload response
- The model supports up to 1M token context window (we're using a small fraction)
- Gemini has built-in safety filters that may occasionally block content
- Rate limits for Gemini are generally more generous than OpenAI

## Support

For issues or questions:

- Gemini API Documentation: https://ai.google.dev/docs
- Gemini Pricing: https://ai.google.dev/pricing
- Google AI Studio: https://aistudio.google.com/
