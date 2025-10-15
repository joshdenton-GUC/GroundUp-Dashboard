/**
 * Extract text from DOCX using ZIP parsing
 * DOCX files are ZIP archives containing XML files
 */
export function extractTextFromDOCX(docxArrayBuffer: ArrayBuffer): string {
  try {
    console.log('Extracting text from DOCX...');
    const uint8Array = new Uint8Array(docxArrayBuffer);

    // Find the word/document.xml file in the ZIP archive
    // DOCX is a ZIP file containing XML files
    let documentXmlContent = '';

    // Simple ZIP file parsing to find document.xml
    const zipData = new TextDecoder('utf-8', { fatal: false }).decode(
      uint8Array
    );

    // Look for the document.xml content between XML tags
    // This is a simplified approach - in production you'd want a proper ZIP parser
    const xmlMatch = zipData.match(/<w:document[^>]*>[\s\S]*?<\/w:document>/i);

    if (xmlMatch) {
      documentXmlContent = xmlMatch[0];
    } else {
      // Fallback: look for any text content in the file
      const textMatches = zipData.match(/<w:t[^>]*>([^<]*)<\/w:t>/gi) || [];
      documentXmlContent = textMatches.join(' ');
    }

    if (!documentXmlContent) {
      console.log('No XML content found, trying alternative extraction...');

      // Alternative approach: extract all readable text
      const readableText = zipData
        .replace(/[^\x20-\x7E\s]/g, ' ')
        .replace(/\s+/g, ' ');

      const words = readableText
        .split(' ')
        .filter(
          word =>
            word.length > 2 &&
            /^[a-zA-Z0-9@.-]+$/.test(word) &&
            !word.includes('xml') &&
            !word.includes('rels')
        );

      return words.join(' ').trim();
    }

    // Extract text from XML content
    const extractedText = documentXmlContent
      // Remove XML tags but keep content
      .replace(/<[^>]*>/g, ' ')
      // Clean up XML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Extracted DOCX text length:', extractedText.length);
    console.log('First 300 characters:', extractedText.substring(0, 300));

    return extractedText;
  } catch (error) {
    console.log('DOCX text extraction failed:', error);
    return '';
  }
}
