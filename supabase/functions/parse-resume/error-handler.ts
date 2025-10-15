import { CandidateInfo } from './types.ts';

/**
 * Get user-friendly error message from error object
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Unknown error occurred';
  }

  const originalMessage = error.message;
  console.error('Processing error:', originalMessage);

  if (originalMessage.includes('Failed to download document')) {
    return 'Could not access the resume file. Please ensure the file was uploaded correctly.';
  }

  if (originalMessage.includes('Could not extract readable text')) {
    return 'Unable to extract text from document. The file may be image-based or corrupted.';
  }

  if (
    originalMessage.includes('limit exceeded') ||
    originalMessage.includes('billing limit')
  ) {
    return 'Resume analysis service is temporarily unavailable due to billing limits. Please contact support to resolve this issue.';
  }

  if (
    originalMessage.includes('OpenAI API') ||
    originalMessage.includes('authentication')
  ) {
    return 'Resume analysis service is temporarily unavailable. Please try again later.';
  }

  if (originalMessage.includes('Insufficient text content')) {
    return 'Not enough readable content found in the resume file.';
  }

  if (originalMessage.includes('rate limit')) {
    return 'Resume analysis service is busy. Please try again in a few minutes.';
  }

  return originalMessage;
}

/**
 * Create error candidate info for failed processing
 */
export function createErrorCandidateInfo(errorMessage: string): CandidateInfo {
  return {
    full_name: 'Processing Failed',
    email: '',
    phone: '',
    skills: [],
    experience_years: 0,
    education: '',
    summary: `Error: ${errorMessage}`,
  };
}

/**
 * Validate extracted text quality
 */
export function validateExtractedText(text: string): void {
  if (text.length < 10) {
    throw new Error(
      'Could not extract readable text from document - file may be image-based or corrupted. Please try uploading a text-based PDF or Word document.'
    );
  }

  const hasLetters = /[a-zA-Z]{3,}/.test(text);
  if (!hasLetters) {
    throw new Error(
      'The document does not appear to contain readable text. Please ensure you are uploading a text-based document, not a scanned image.'
    );
  }
}
