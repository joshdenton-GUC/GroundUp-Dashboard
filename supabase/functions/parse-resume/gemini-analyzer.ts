// gemini-analyzer.ts
import { CandidateInfo } from './types.ts';

// Schema for Gemini JSON response
function getGeminiResponseSchema() {
  return {
    type: 'object',
    properties: {
      full_name: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
      skills: {
        type: 'array',
        items: { type: 'string' },
      },
      experience_years: {
        type: 'string',
        enum: ['0', '2', '4', '7', '10'],
        description:
          'Experience level: 0=Entry Level (0-1 years), 2=Junior (2-3 years), 4=Mid-level (4-6 years), 7=Senior (7-10 years), 10=Expert (10+ years)',
      },
      education: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            degree: { type: 'string' },
            institution: { type: 'string' },
            year: { type: 'string' },
            grade: { type: 'string' },
          },
          required: ['degree', 'institution', 'year', 'grade'],
        },
      },
      summary: { type: 'string' },
      certifications: {
        type: 'array',
        items: { type: 'string' },
      },
      experience: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            company: { type: 'string' },
            position: { type: 'string' },
            period: { type: 'string' },
            duration: { type: 'string' },
          },
          required: ['company', 'position', 'period', 'duration'],
        },
      },
    },
    required: [
      'full_name',
      'email',
      'phone',
      'skills',
      'experience_years',
      'education',
      'summary',
      'certifications',
      'experience',
    ],
  };
}

/**
 * Analyze a PDF directly using Google Gemini File API (multimodal)
 * Uses Gemini 1.5 Flash for cost-effective PDF analysis
 * Uploads file to Gemini File API for efficient handling of large PDFs (up to 10MB)
 */
export async function analyzeResumePDFWithGemini(
  pdfArrayBuffer: ArrayBuffer,
  geminiApiKey: string,
  model: string = 'gemini-2.5-flash'
): Promise<CandidateInfo> {
  // Step 1: Upload PDF to Gemini File API
  // Following official Gemini SDK pattern with simpler FormData approach
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiApiKey}`;

  // Create FormData with file (simpler than manual multipart construction)
  const formData = new FormData();
  const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
  formData.append('file', pdfBlob, 'resume.pdf');

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - let browser/Deno set it with boundary
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('Gemini file upload error:', errorText);
    throw new Error(
      `Gemini file upload failed: ${uploadResponse.status} - ${errorText}`
    );
  }

  const uploadData = await uploadResponse.json();
  const fileUri = uploadData?.file?.uri;
  const fileName = uploadData?.file?.name;
  const mimeType = uploadData?.file?.mimeType || 'application/pdf';

  if (!fileUri) {
    throw new Error('No file URI returned from Gemini File API');
  }

  console.log('File uploaded to Gemini successfully');

  // Step 2: Wait for file processing
  // Files need a moment to be processed before they can be used
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Generate content using the uploaded file
  // Following official SDK pattern with file reference
  const prompt = createGeminiPDFPrompt();

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: mimeType,
              fileUri: fileUri,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192, // Increased for gemini-2.5-flash (uses tokens for internal reasoning)
      responseMimeType: 'application/json',
      responseSchema: getGeminiResponseSchema(),
    },
  };

  // Use v1beta API for generateContent (supports file_data and JSON schema features)
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini generation error:', errorText);
    throw new Error(
      `Gemini API request failed: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();

  // Check for errors or safety blocks in response
  if (data?.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini blocked the request: ${
        data.promptFeedback.blockReason
      }. Reason: ${JSON.stringify(data.promptFeedback)}`
    );
  }

  // Extract the generated content from Gemini's response
  // Try different possible response structures
  let content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  // Alternative path for some API versions
  if (!content && data?.candidates?.[0]?.output) {
    content = data.candidates[0].output;
  }

  if (!content) {
    console.error('Empty response from Gemini API:', {
      finishReason: data?.candidates?.[0]?.finishReason,
      promptFeedback: data?.promptFeedback,
    });
    throw new Error('Empty response from Gemini API');
  }

  const parsed = safeParseJson(content);
  const result = transformToCandidateInfo(parsed);

  console.log('Successfully parsed resume:', {
    name: result.full_name,
    skillsCount: result.skills.length,
    experience: result.experience_years,
  });

  return result;
}

/**
 * Analyze extracted text using Gemini (for DOCX and non-PDF files)
 */
export async function analyzeResumeTextWithGemini(
  extractedText: string,
  geminiApiKey: string,
  model: string = 'gemini-2.5-flash'
): Promise<CandidateInfo> {
  const processedText = preprocessPDFText(extractedText);
  const prompt = createGeminiPDFPrompt();

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${prompt}\n\nRESUME TEXT:\n${processedText.substring(
              0,
              12000
            )}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192, // Increased for gemini-2.5-flash (uses tokens for internal reasoning)
      responseMimeType: 'application/json',
      responseSchema: getGeminiResponseSchema(),
    },
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiApiKey}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini API request failed: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('Empty response from Gemini API');
  }

  const parsed = safeParseJson(content);
  return transformToCandidateInfo(parsed);
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Specialized preprocessing for PDF-extracted text
 */
function preprocessPDFText(rawText: string): string {
  let processed = rawText;

  // Enhanced PDF extraction fixes
  processed = processed
    // Fix broken lines (words split across lines with hyphens)
    .replace(/([a-z])-\s*\n\s*([a-z])/gi, '$1$2')
    // Fix broken lines (words split without hyphens)
    .replace(/([a-z])\s*\n\s*([a-z])/gi, '$1 $2')
    // Fix spacing issues in contact info
    .replace(/(\w)\s?@\s?(\w)/g, '$1@$2')
    .replace(/(\d)\s?-\s?(\d)/g, '$1-$2')
    .replace(/(\w)\s?\.\s?(\w)/g, '$1.$2') // Fix domain names
    // Normalize section headers - handle various formats
    .replace(/([A-Z][A-Z\s]+\n)\s*([a-z])/g, '$1\n$2')
    .replace(/([A-Z][A-Z\s]+):\s*\n\s*([a-z])/g, '$1:\n\n$2')
    // Remove page numbers and headers/footers
    .replace(/\n\s*\d\s*\n/g, '\n')
    .replace(/^\s*resume\s*$/gim, '')
    .replace(/^\s*page\s*\d+\s*$/gim, '')
    // Fix date ranges for experience calculation
    .replace(/(\d{4})\s*-\s*(\d{4})/g, '$1-$2')
    .replace(/(\d{4})\s*to\s*(\d{4})/g, '$1-$2');

  // Enhanced paragraph reconstruction
  const lines = processed.split('\n');
  const reconstructed: string[] = [];
  let currentParagraph = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1]?.trim() || '';

    if (!line) {
      if (currentParagraph) {
        reconstructed.push(currentParagraph);
        currentParagraph = '';
      }
      reconstructed.push('');
    } else if (
      // Section header detection
      (line.length < 60 &&
        (line.toUpperCase() === line ||
          line.endsWith(':') ||
          /^(PROFILE|SKILLS|EXPERIENCE|EDUCATION|PROJECT|CERTIFICATION)/i.test(
            line
          ))) ||
      // Bullet points
      /^[-•·◦]\s/.test(line) ||
      // Short lines that are likely headers
      (line.length < 40 && nextLine && nextLine.length > 50)
    ) {
      // Likely a section header or short line
      if (currentParagraph) {
        reconstructed.push(currentParagraph);
        currentParagraph = '';
      }
      reconstructed.push(line);
    } else {
      // Continue paragraph
      if (currentParagraph) {
        // Check if we should start a new paragraph
        if (line.endsWith('.') || line.endsWith('!') || line.endsWith('?')) {
          currentParagraph += ' ' + line;
          reconstructed.push(currentParagraph);
          currentParagraph = '';
        } else {
          currentParagraph += ' ' + line;
        }
      } else {
        currentParagraph = line;
      }
    }
  }

  if (currentParagraph) {
    reconstructed.push(currentParagraph);
  }

  return reconstructed.join('\n');
}

/**
 * Maps numeric experience years to the dropdown string values
 */
function mapExperienceToDropdownValue(experience: any): string {
  // If it's already a valid dropdown value, return it
  const validValues = ['0', '2', '4', '7', '10'];
  if (typeof experience === 'string' && validValues.includes(experience)) {
    return experience;
  }

  // Convert to number if it's a string number
  const yearsNum =
    typeof experience === 'number' ? experience : parseFloat(experience);

  // If we can't parse it as a number, default to entry level
  if (isNaN(yearsNum)) {
    return '0';
  }

  // Map numeric years to dropdown values
  if (yearsNum <= 1) return '0'; // Entry Level (0-1 years)
  if (yearsNum <= 3) return '2'; // Junior (2-3 years)
  if (yearsNum <= 6) return '4'; // Mid-level (4-6 years)
  if (yearsNum <= 10) return '7'; // Senior (7-10 years)
  return '10'; // Expert (10+ years)
}

/**
 * Transform LLM response to CandidateInfo with validation
 */
function transformToCandidateInfo(finalData: any): CandidateInfo {
  // Basic contact info extraction as fallback
  const basicContactInfo = extractBasicContactInfo(JSON.stringify(finalData));

  const result: CandidateInfo = {
    full_name:
      finalData.full_name?.trim() ||
      basicContactInfo.full_name ||
      'Unknown Candidate',
    email: finalData.email?.includes('@')
      ? finalData.email.trim()
      : basicContactInfo.email || '',
    phone: finalData.phone?.trim() || basicContactInfo.phone || '',
    skills: Array.isArray(finalData.skills)
      ? finalData.skills
          .filter(
            (s: string) => s && typeof s === 'string' && s.trim().length > 0
          )
          .map((s: string) => s.trim())
          .filter(
            (s: string, index: number, arr: string[]) =>
              arr.indexOf(s) === index
          )
      : [],
    experience_years: mapExperienceToDropdownValue(finalData.experience_years),
    education: deriveEducationString(finalData.education),
    summary:
      typeof finalData.summary === 'string' &&
      finalData.summary.trim().length > 0
        ? finalData.summary.trim()
        : 'Professional summary not available',
  };

  // Post-processing validation
  if (result.skills.length === 0) {
    console.warn('No skills extracted from resume');
  }

  if (result.full_name === 'Unknown Candidate') {
    console.warn('Could not extract candidate name');
  }

  console.log('Successfully parsed resume:', {
    name: result.full_name,
    skillsCount: result.skills.length,
    experience: result.experience_years,
  });

  return result;
}

function deriveEducationString(education: any): string {
  if (!education) return '';
  if (typeof education === 'string') return education.trim();
  if (Array.isArray(education)) {
    const parts = education
      .map((e: any) => {
        if (typeof e === 'string') return e.trim();
        if (e && typeof e === 'object') {
          const degree = e.degree?.toString().trim();
          const institution = e.institution?.toString().trim();
          const year = e.year?.toString().trim();
          const grade = e.grade?.toString().trim();
          const main = [degree, institution].filter(Boolean).join(', ');
          const tail = [year, grade].filter(Boolean).join(' ');
          return [main, tail].filter(Boolean).join(' (') + (tail ? ')' : '');
        }
        return '';
      })
      .filter((s: string) => s && s.length > 0);
    return parts.join(' | ');
  }
  return '';
}

/**
 * Extract basic contact info as fallback
 */
function extractBasicContactInfo(text: string): {
  full_name?: string;
  email?: string;
  phone?: string;
} {
  const contactInfo: { full_name?: string; email?: string; phone?: string } =
    {};

  // Email extraction
  const emailMatch = text.match(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  );
  if (emailMatch) contactInfo.email = emailMatch[0];

  // Phone extraction
  const phoneMatch = text.match(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
  );
  if (phoneMatch) contactInfo.phone = phoneMatch[0].trim();

  return contactInfo;
}

function createGeminiPDFPrompt(): string {
  return `You will be given a resume as input. Extract structured information with high accuracy.

CRITICAL INSTRUCTIONS:
1. EXPERIENCE CALCULATION: Find ALL employment periods. Calculate total years excluding overlaps. Use month/year precision if available. Then map to experience level:
   - "0" = Entry Level (0-1 years of experience)
   - "2" = Junior (2-3 years of experience)
   - "4" = Mid-level (4-6 years of experience)
   - "7" = Senior (7-10 years of experience)
   - "10" = Expert (10+ years of experience)
   Return ONLY one of these exact string values: "0", "2", "4", "7", or "10"
   
2. SKILLS: Extract EVERY technical and professional skill mentioned anywhere in the document.
3. CONTACT INFO: Extract email and phone from header/footer/body.
4. EDUCATION: List ALL educational qualifications in order.
5. SUMMARY: Please output the Professional Summary section as three bullet points, each summarizing one of the last 3 job experiences from the Resume. Format each bullet point starting with "• " (bullet character followed by space). If there are fewer than 3 job experiences, provide bullet points for however many are available and if there are no job experiences, provide a bullet point for the professional summary.For example,
• Point number 1
• Point number 2
• Point number 3

Return STRICT JSON matching the provided schema exactly.`;
}

function safeParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    // Try to find JSON within markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch {
        // Continue to next attempt
      }
    }

    // Attempt to recover by trimming to first/last braces
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(text.slice(first, last + 1));
      } catch {
        console.error('Failed to parse JSON from response');
      }
    }

    return {};
  }
}
