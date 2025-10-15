import { FileType } from './types.ts';

/**
 * Detects file type from array buffer by examining file signatures
 */
export function detectFileType(arrayBuffer: ArrayBuffer): FileType {
  const uint8Array = new Uint8Array(arrayBuffer);

  // Check for PDF signature (%PDF)
  if (
    uint8Array.length >= 4 &&
    uint8Array[0] === 0x25 &&
    uint8Array[1] === 0x50 &&
    uint8Array[2] === 0x44 &&
    uint8Array[3] === 0x46
  ) {
    return 'pdf';
  }

  // Check for DOCX signature (ZIP file starting with PK)
  if (
    uint8Array.length >= 2 &&
    uint8Array[0] === 0x50 &&
    uint8Array[1] === 0x4b
  ) {
    // Further check for DOCX by looking for word/document.xml in the ZIP
    const text = new TextDecoder('utf-8', { fatal: false }).decode(
      uint8Array.slice(0, 1000)
    );
    if (text.includes('word/') || text.includes('document.xml')) {
      return 'docx';
    }
  }

  return 'unknown';
}
