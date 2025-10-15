import { detectFileType } from './file-detector.ts';
import { extractTextFromPDF } from './pdf-extractor.ts';
import { extractTextFromDOCX } from './docx-extractor.ts';
import { TextExtractionResult } from './types.ts';

/**
 * Extract text from document based on file type
 */
export function extractTextFromDocument(
  arrayBuffer: ArrayBuffer
): TextExtractionResult {
  const fileType = detectFileType(arrayBuffer);
  console.log('Detected file type:', fileType);

  let text = '';

  switch (fileType) {
    case 'pdf':
      text = extractTextFromPDF(arrayBuffer);
      break;
    case 'docx':
      text = extractTextFromDOCX(arrayBuffer);
      break;
    default: {
      console.log(
        'Unknown file type, attempting PDF extraction as fallback...'
      );
      text = extractTextFromPDF(arrayBuffer);

      if (text.length > 10) {
        return { text, fileType: 'pdf' };
      }

      console.log(
        'PDF extraction failed, attempting DOCX extraction as fallback...'
      );
      text = extractTextFromDOCX(arrayBuffer);
      break;
    }
  }

  return { text, fileType };
}
