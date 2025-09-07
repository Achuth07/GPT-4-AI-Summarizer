// Use the legacy build for Node.js
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

//Extract basic meta data.
export const extractBasicMetadata = async (dataBuffer) => {
  try {
    const pdfData = new Uint8Array(dataBuffer);
    
    // Use the same method as in the controller
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdfDocument = await loadingTask.promise;
    
    // Get metadata from the PDF document
    const metadata = await pdfDocument.getMetadata();
    
    // Extract text from first few pages for pattern matching
    let sampleText = '';
    const pagesToExtract = Math.min(3, pdfDocument.numPages);
    
    for (let i = 1; i <= pagesToExtract; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      sampleText += pageText + '\n';
    }
    
    // Clean up the document
    pdfDocument.destroy();
    
    // Extract metadata using pattern matching
    return {
      authors: extractAuthors(sampleText, metadata),
      publicationYear: extractPublicationYear(sampleText, metadata),
      journal: extractJournal(sampleText, metadata)
    };
  } catch (error) {
    console.error("Error extracting basic metadata:", error);
    return {
      authors: [],
      publicationYear: null,
      journal: ""
    };
  }
};

// Helper functions for metadata extraction
const extractAuthors = (text, metadata) => {
  // First try to get authors from PDF metadata
  if (metadata?.info?.Author) {
    return metadata.info.Author.split(/,\s*|\band\b/).map(author => author.trim());
  }
  
  // Fallback to pattern matching in text
  const authorPatterns = [
    /(?:By|Authors?|Byline|Written by)[:\s]*(.+?)(?:\n|\.|,)/i,
    /^(.+?)(?:\n|\.|,)(?=.*abstract|.*summary)/i
  ];
  
  for (const pattern of authorPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].split(/,\s*|\band\b/).map(author => author.trim());
    }
  }
  
  return [];
};

const extractPublicationYear = (text, metadata) => {
  // First try to get year from PDF metadata
  if (metadata?.info?.CreationDate) {
    const yearMatch = metadata.info.CreationDate.match(/(\d{4})/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
  }
  
  // Fallback to pattern matching in text
  const yearMatch = text.match(/(?:19|20)\d{2}/);
  return yearMatch ? parseInt(yearMatch[0]) : null;
};

const extractJournal = (text, metadata) => {
  // First try to get journal from PDF metadata if available
  if (metadata?.info?.Title && isLikelyJournal(metadata.info.Title)) {
    return metadata.info.Title;
  }
  
  if (metadata?.info?.Subject && isLikelyJournal(metadata.info.Subject)) {
    return metadata.info.Subject;
  }
  
  // Fallback to pattern matching in text
  const journalPatterns = [
    /Journal of\s+(.+?)(?:\n|\.|,)/i,
    /(?:Published in|Journal|Conference)[:\s]*(.+?)(?:\n|\.|,)/i,
    /(?:\bvol\.|\bvolume\b|\bissue\b|\bno\.).*?(\b(?:[A-Z][a-z]+\s+){1,3}(?:Journal|Review|Letters|Communications)\b)/i
  ];
  
  for (const pattern of journalPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return "";
};

const isLikelyJournal = (text) => {
  if (!text) return false;
  const journalIndicators = [
    'journal', 'review', 'proceedings', 'transactions', 
    'letters', 'bulletin', 'annals', 'communications'
  ];
  
  return journalIndicators.some(indicator => 
    text.toLowerCase().includes(indicator)
  );
};