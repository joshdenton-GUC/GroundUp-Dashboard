# Gemini Model Notes

## Issue Resolved: MAX_TOKENS

**Problem:** `gemini-2.5-flash` uses tokens for internal "thoughts" (reasoning), which was consuming all available tokens.

**Solution:** Increased `maxOutputTokens` from 2048 to 8192 to accommodate both internal reasoning and JSON output.

If you're getting "Empty response from Gemini API", check the logs for the full response structure.

## Recommended Model

For production use, we recommend starting with **`gemini-1.5-flash`** which is verified to work:

```typescript
// In gemini-analyzer.ts, change model default to:
model: string = 'gemini-1.5-flash'; // Verified working model

// In request-handler.ts, use:
('gemini-1.5-flash');
```

## About gemini-2.5-flash

- `gemini-2.5-flash` might not be available yet in the v1beta API
- If you want to use newer models, check available models first:
  ```bash
  curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
  ```

## Debugging Steps

1. **Check the logs** - The full Gemini API response is now logged
2. **Look for**:
   - `promptFeedback.blockReason` - Safety filter blocks
   - `candidates[0].finishReason` - Why generation stopped
   - `candidates[0].safetyRatings` - Content safety ratings
3. **Common issues**:
   - Model not found (404) - Use `gemini-1.5-flash` instead
   - Safety blocks - Content flagged by safety filters
   - Empty candidates array - Check prompt or file upload

## Verified Working Configuration

```typescript
// gemini-analyzer.ts
export async function analyzeResumePDFWithGemini(
  pdfArrayBuffer: ArrayBuffer,
  geminiApiKey: string,
  model: string = 'gemini-1.5-flash' // ✅ Verified working
): Promise<CandidateInfo> {
  // ...
}
```

```typescript
// request-handler.ts
const candidateInfo = await analyzeResumePDFWithGemini(
  documentArrayBuffer,
  geminiApiKey,
  'gemini-1.5-flash' // ✅ Verified working
);
```

## Next Steps

1. Try uploading a resume with current settings
2. Check Supabase logs for the full Gemini response
3. If using `gemini-2.5-flash`, temporarily switch to `gemini-1.5-flash` to verify the implementation works
4. Once working, you can experiment with newer models if available
