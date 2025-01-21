// prompts.js

import Handlebars from 'handlebars';

// ------------------------------------
//   SINGLE-PROMPT APPROACH PROMPTS
// ------------------------------------
export const singlePromptSystemMessage = `
You are an expert at analyzing Hebrew texts and generating chunking + metadata.
Return ONLY valid JSON, with an array of objects, each object representing 
a chunk and its metadata.

Example JSON structure (pseudo):
[
  {
    "chunk_id": "1",
    "chunk_text": "...",
    "long_summary": "...",
    "short_summary": "...",
    "quiz_questions": [...],
    "tags_he": [...],
    "footnotes": [...],
    ...
  },
  {
    "chunk_id": "2",
    ...
  }
]
`;

export const singlePromptUserMessage = `
1) First remove any HTML tags.
2) Then chunk the text into coherent sections (for RAG).
3) For each chunk, provide all the metadata (long_summary, short_summary, etc.).
4) Return a JSON array. DO NOT add commentary outside of the JSON.

Text:
{{fullText}}
`;

export const singlePromptUserMessageTemplate = Handlebars.compile(`
1) First remove any HTML tags.
2) Then chunk the text into coherent sections (for RAG).
3) For each chunk, provide all the metadata (long_summary, short_summary, etc.).
4) Return a JSON array. DO NOT add commentary outside of the JSON.

Text:
{{fullText}}
`);

// ------------------------------------
//   TWO-PROMPT APPROACH PROMPTS
// ------------------------------------
export const chunkingSystemMessage = `
You are an expert chunker of Hebrew texts. Return only JSON with chunk boundaries.
`;

export const chunkingUserMessage = `
1) Remove any HTML tags.
2) Split the text into meaningful chunks for RAG.
3) Return an array of objects. Each object should have:
   - "chunk_id"
   - "start_index"
   - "end_index"
4) Do NOT return the entire text. Only the boundaries.

Text:
{{fullText}}
`;

export const metadataSystemMessage = `
You are an expert in analyzing Rabbinic Hebrew texts, returning metadata as JSON.
`;

export const metadataUserMessage = `
Please provide a JSON with:
{
  "long_summary": "...",
  "short_summary": "...",
  "quiz_questions": [...],
  "followup_thinking_questions": [...],
  "generated_title": "...",
  "tags_he": [...],
  "key_terms_he": [...],
  "key_phrases_he": [...],
  "key_phrases_en": [...],
  "bibliography_snippets": [...],
  "questions_explicit": [...],
  "questions_implied": [...],
  "reconciled_issues": [...],
  "qa_pair": {
      "question": "...",
      "answer": "..."
  }
}

Chunk Text:
{{chunkText}}
`; 