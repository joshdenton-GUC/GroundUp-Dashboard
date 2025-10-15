# Resume Parser Function

This Supabase Edge Function parses resume documents (PDF and DOCX) and extracts structured candidate information using OpenAI's API.

## Architecture

The function is organized into modular components for better maintainability:

### Core Files

- **`index.ts`** - Main entry point, handles CORS and routes requests
- **`request-handler.ts`** - Main request processing logic
- **`types.ts`** - TypeScript type definitions

### Text Extraction Modules

- **`file-detector.ts`** - Detects file type (PDF/DOCX) from binary signatures
- **`pdf-extractor.ts`** - Extracts text from PDF files using pattern matching
- **`docx-extractor.ts`** - Extracts text from DOCX files using ZIP parsing
- **`text-extractor.ts`** - Coordinates text extraction based on file type

### Analysis & Error Handling

- **`openai-analyzer.ts`** - Analyzes extracted text using OpenAI API
- **`error-handler.ts`** - Centralized error handling with user-friendly messages
- **`constants.ts`** - Configuration constants and settings

## API Usage

### Request Format

```json
{
  "resumeUrl": "https://example.com/resume.pdf"
}
```

### Response Format

```json
{
  "candidateInfo": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "skills": ["JavaScript", "React", "Node.js"],
    "experience_years": 5,
    "education": "Bachelor's in Computer Science",
    "summary": "Experienced software developer..."
  }
}
```

### Error Response

```json
{
  "error": "User-friendly error message",
  "candidateInfo": {
    "full_name": "Processing Failed",
    // ... other fields with default values
    "summary": "Error: User-friendly error message"
  }
}
```

## Environment Variables

- `OPENAI_API_KEY` or `ADMIN_OPENAI_API_KEY` - OpenAI API key for text analysis

## Supported File Types

- **PDF** - Text-based PDFs (not scanned images)
- **DOCX** - Microsoft Word documents

## Error Handling

The function provides comprehensive error handling with user-friendly messages for common issues:

- Invalid file formats
- Network errors
- OpenAI API issues
- Text extraction failures
- Rate limiting

## Development

The modular structure makes it easy to:

- Test individual components
- Add new file format support
- Modify text extraction algorithms
- Update OpenAI integration
- Enhance error handling
