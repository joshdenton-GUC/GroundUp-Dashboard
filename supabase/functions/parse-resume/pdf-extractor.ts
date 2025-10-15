/**
 * Extract text from PDF using enhanced pattern matching
 * This is an improved PDF parser that looks for multiple text patterns
 */
export function extractTextFromPDF(pdfArrayBuffer: ArrayBuffer): string {
  try {
    console.log('Extracting text from PDF...');
    const uint8Array = new Uint8Array(pdfArrayBuffer);
    let text = '';

    // Convert to string for text extraction
    for (let i = 0; i < uint8Array.length; i++) {
      text += String.fromCharCode(uint8Array[i]);
    }

    // Extract text using multiple PDF patterns
    const extractedTexts: string[] = [];
    const seenTexts = new Set<string>(); // Avoid duplicates

    // Helper function to clean and add text
    const addCleanText = (rawText: string) => {
      let cleanText = rawText
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\\\/g, ' ')
        .replace(/\\([0-9]{3})/g, ' ') // Octal sequences
        .replace(/\\(.)/g, '$1') // Other escaped characters
        .replace(/\s+/g, ' ')
        .trim();

      // Only include text that looks like real content and isn't duplicate
      if (
        cleanText.length > 0 &&
        /[a-zA-Z0-9@.]/.test(cleanText) &&
        cleanText.length < 300 &&
        !cleanText.includes('\x00') &&
        !seenTexts.has(cleanText.toLowerCase())
      ) {
        seenTexts.add(cleanText.toLowerCase());
        extractedTexts.push(cleanText);
      }
    };

    // Pattern 1: Extract text in parentheses (most common PDF text storage)
    const textInParens = text.match(/\(([^)]*)\)/g) || [];
    textInParens.forEach(match => {
      const innerText = match.slice(1, -1);
      addCleanText(innerText);
    });

    // Pattern 2: Extract text from BT/ET blocks (text blocks)
    const btMatches = text.match(/BT\s+(.*?)\s+ET/gs) || [];
    btMatches.forEach(match => {
      const textParts = match.match(/\(([^)]*)\)/g) || [];
      textParts.forEach(part => {
        const innerText = part.slice(1, -1);
        addCleanText(innerText);
      });
    });

    // Pattern 3: Extract text from Tj operators
    const tjMatches = text.match(/\(([^)]*)\)\s*Tj/g) || [];
    tjMatches.forEach(match => {
      const innerText = match.replace(/\(([^)]*)\)\s*Tj/, '$1');
      addCleanText(innerText);
    });

    // Pattern 4: Extract text from TJ operators (array of strings)
    const tjArrayMatches = text.match(/\[(.*?)\]\s*TJ/gs) || [];
    tjArrayMatches.forEach(match => {
      const arrayContent = match.replace(/\[(.*?)\]\s*TJ/, '$1');
      const stringMatches = arrayContent.match(/\(([^)]*)\)/g) || [];
      stringMatches.forEach(str => {
        const innerText = str.slice(1, -1);
        addCleanText(innerText);
      });
    });

    // Pattern 5: Extract text from show text operators with positioning
    const showTextMatches = text.match(/\(([^)]*)\)\s*[Tt][jd]/g) || [];
    showTextMatches.forEach(match => {
      const innerText = match.replace(/\(([^)]*)\)\s*[Tt][jd]/, '$1');
      addCleanText(innerText);
    });

    // Pattern 6: Extract from stream objects (more aggressive)
    const streamMatches = text.match(/stream[\s\S]*?endstream/g) || [];
    streamMatches.forEach(stream => {
      // Look for readable text within streams
      const readableText = stream.match(/[a-zA-Z0-9@.\-_+\s]{3,}/g) || [];
      readableText.forEach(readable => {
        if (readable.trim().length > 2 && !/^[0-9.\s]+$/.test(readable)) {
          addCleanText(readable.trim());
        }
      });
    });

    // Pattern 7: Extract any remaining readable text (fallback)
    if (extractedTexts.length < 10) {
      console.log('Low text extraction, trying fallback pattern...');
      const fallbackMatches =
        text.match(/[A-Za-z][A-Za-z0-9@.\-_+\s]{2,}/g) || [];
      fallbackMatches.forEach(match => {
        const cleaned = match.trim();
        if (
          cleaned.length > 2 &&
          cleaned.length < 100 &&
          /[a-zA-Z]/.test(cleaned) &&
          !cleaned.includes('obj') &&
          !cleaned.includes('endobj')
        ) {
          addCleanText(cleaned);
        }
      });
    }

    // Combine all extracted text with better formatting
    const combinedText = extractedTexts.join(' ').replace(/\s+/g, ' ').trim();

    console.log('Extracted text length:', combinedText.length);
    console.log('Unique text segments found:', extractedTexts.length);
    console.log('First 500 characters:', combinedText.substring(0, 500));

    // Log some sample extracted segments for debugging
    if (extractedTexts.length > 0) {
      console.log('Sample extracted segments:', extractedTexts.slice(0, 10));
    }

    return combinedText;
  } catch (error) {
    console.log('PDF text extraction failed:', error);
    return '';
  }
}
