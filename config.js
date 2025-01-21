import dotenv from 'dotenv';

dotenv.config();

const config = {
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModelForChunking: 'gpt-4', // or whichever model you prefer
  openAiModelForMetadata: 'gpt-4',
  temperature: 0.7,
  removeHtmlTags: process.env.REMOVE_HTML_TAGS === 'true',
  singlePromptForChunkAndMetadata: process.env.SINGLE_PROMPT === 'true',
  mongodbUri: process.env.MONGODB_URI,
  databaseName: process.env.DATABASE_NAME,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  supabaseTable: process.env.SUPABASE_TABLE,
};

export default config;
