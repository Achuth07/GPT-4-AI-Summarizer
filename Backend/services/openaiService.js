import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const extractMetadataAndSummarize = async (text) => {
  try {
    const prompt = `
Please analyze the following research article and:

1. EXTRACT METADATA:
AUTHORS: [List of authors separated by commas]
PUBLICATION_YEAR: [Year of publication]
JOURNAL: [Journal or conference name]

2. PROVIDE A COMPREHENSIVE SUMMARY:
ABSTRACT: [Provide a concise summary of the abstract]
METHODOLOGY: [Describe the research methodology used]
KEY FINDINGS: [List the main findings and results]
PROPOSED WAY FORWARD: [Describe any recommendations or future work suggested]
ADDITIONAL INSIGHTS: [Any other relevant information or insights]

Here is the article text:
${text.substring(0, 12000)} // Limit text to avoid token limits
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a research assistant that extracts metadata and summarizes academic papers in a structured format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const responseText = completion.choices[0].message.content;
    
    // Parse the structured response
    return parseMetadataAndSummary(responseText);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to extract metadata and generate summary: " + error.message);
  }
};

const parseMetadataAndSummary = (text) => {
  const result = {
    metadata: {
      authors: [],
      publicationYear: null,
      journal: ""
    },
    summary: {
      abstract: "",
      methodology: "",
      keyFindings: "",
      proposedWayForward: "",
      additionalInsights: "",
      overallSummary: text // fallback
    }
  };

  const lines = text.split('\n');
  let currentSection = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('AUTHORS:')) {
      const authorsStr = trimmedLine.replace('AUTHORS:', '').trim();
      result.metadata.authors = authorsStr.split(',').map(author => author.trim());
    } else if (trimmedLine.startsWith('PUBLICATION_YEAR:')) {
      const yearStr = trimmedLine.replace('PUBLICATION_YEAR:', '').trim();
      result.metadata.publicationYear = parseInt(yearStr) || null;
    } else if (trimmedLine.startsWith('JOURNAL:')) {
      result.metadata.journal = trimmedLine.replace('JOURNAL:', '').trim();
    } else if (trimmedLine.startsWith('ABSTRACT:')) {
      currentSection = 'abstract';
      result.summary.abstract = trimmedLine.replace('ABSTRACT:', '').trim();
    } else if (trimmedLine.startsWith('METHODOLOGY:')) {
      currentSection = 'methodology';
      result.summary.methodology = trimmedLine.replace('METHODOLOGY:', '').trim();
    } else if (trimmedLine.startsWith('KEY FINDINGS:')) {
      currentSection = 'keyFindings';
      result.summary.keyFindings = trimmedLine.replace('KEY FINDINGS:', '').trim();
    } else if (trimmedLine.startsWith('PROPOSED WAY FORWARD:')) {
      currentSection = 'proposedWayForward';
      result.summary.proposedWayForward = trimmedLine.replace('PROPOSED WAY FORWARD:', '').trim();
    } else if (trimmedLine.startsWith('ADDITIONAL INSIGHTS:')) {
      currentSection = 'additionalInsights';
      result.summary.additionalInsights = trimmedLine.replace('ADDITIONAL INSIGHTS:', '').trim();
    } else if (currentSection && trimmedLine) {
      // Append to current section
      if (currentSection in result.summary) {
        result.summary[currentSection] += ' ' + trimmedLine;
      }
    }
  }

  return result;
};