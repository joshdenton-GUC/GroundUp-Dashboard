import { extractTextFromDocument } from './text-extractor.ts';
import { analyzeResumePDFWithOpenAI } from './openai-analyzer.ts';
import {
  validateExtractedText,
  getUserFriendlyErrorMessage,
  createErrorCandidateInfo,
} from './error-handler.ts';
import { CORS_HEADERS } from './constants.ts';
import { ResumeParseRequest, ResumeParseResponse } from './types.ts';

/**
 * Handle resume parsing request
 */
export async function handleResumeParseRequest(
  req: Request
): Promise<Response> {
  try {
    console.log('Parse resume function called');

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API key available:', !!openAIApiKey);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is required for resume parsing');
    }

    // Parse request body
    let requestBody: ResumeParseRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return createErrorResponse('Invalid request format');
    }

    const { resumeUrl } = requestBody;
    if (!resumeUrl) {
      console.error('No resume URL provided');
      return createErrorResponse('Resume URL is required', 'Missing URL');
    }

    console.log('Processing resume from URL:', resumeUrl);

    // Download document
    console.log('Downloading document...');
    const documentResponse = await fetch(resumeUrl);

    if (!documentResponse.ok) {
      throw new Error(
        `Failed to download document: ${documentResponse.status}`
      );
    }

    const documentArrayBuffer = await documentResponse.arrayBuffer();
    console.log(`Document downloaded: ${documentArrayBuffer.byteLength} bytes`);

    // Extract text from document
    const { text: extractedText, fileType } =
      extractTextFromDocument(documentArrayBuffer);

    // Validate extracted text
    validateExtractedText(extractedText);

    // Log text extraction quality with detailed analysis
    const hasEmail = /@/.test(extractedText);
    const hasPhone = /\d{3,}/.test(extractedText);
    const hasName = /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(extractedText);
    const hasSkills =
      /(?:HTML|CSS|JavaScript|React|Angular|Python|Java|Node)/i.test(
        extractedText
      );

    console.log('Successfully extracted text from document');
    console.log(
      `Text analysis: Length=${extractedText.length}, HasEmail=${hasEmail}, HasPhone=${hasPhone}, HasName=${hasName}, HasSkills=${hasSkills}, FileType=${fileType}`
    );

    // Log full extracted text for debugging (first 2000 chars)
    console.log('=== EXTRACTED TEXT DEBUG ===');
    console.log('Full extracted text (first 2000 chars):');
    console.log(extractedText.substring(0, 2000));
    console.log('=== END EXTRACTED TEXT ===');

    if (extractedText.length < 50) {
      console.warn(
        'Warning: Short text extracted, may not contain sufficient content'
      );
    }

    if (!hasEmail && !hasPhone) {
      console.warn('Warning: No contact information found');
    }

    if (!hasName) {
      console.warn('Warning: No clear name pattern detected');
    }

    // Use OpenAI Files API (multimodal) for PDF analysis with gpt-4o
    // Only PDF files are supported for now
    if (fileType !== 'pdf') {
      throw new Error(
        'Only PDF files are currently supported for resume parsing'
      );
    }

    console.log('Using OpenAI Files API (multimodal) for PDF with gpt-4o');
    const candidateInfo = await analyzeResumePDFWithOpenAI(
      documentArrayBuffer,
      openAIApiKey,
      'gpt-4o'
    );

    console.log('Successfully analyzed resume:', candidateInfo);

    const response: ResumeParseResponse = { candidateInfo };

    return new Response(JSON.stringify(response), {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Resume processing error:', error);

    const errorMessage = getUserFriendlyErrorMessage(error);
    return createErrorResponse(errorMessage);
  }
}

/**
 * Create error response with consistent format
 */
function createErrorResponse(
  errorMessage: string,
  candidateName = 'Processing Failed'
): Response {
  const response: ResumeParseResponse = {
    error: errorMessage,
    candidateInfo: createErrorCandidateInfo(errorMessage),
  };

  // Override candidate name if provided
  if (candidateName !== 'Processing Failed') {
    response.candidateInfo.full_name = candidateName;
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}
