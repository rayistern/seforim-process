// index.js

import config from './config.js';
import dotenv from 'dotenv';
import * as prompts from './prompts.js';
import Handlebars from 'handlebars';
import { Configuration, OpenAIApi } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { stripHtml } from 'string-strip-html';
import { MongoClient } from 'mongodb';
import winston from 'winston';

dotenv.config();

// ------------------------------------
//   SETUP: OPENAI + SUPABASE
// ------------------------------------
const openAiConfig = new Configuration({
  apiKey: config.openAiApiKey,
});
const openai = new OpenAIApi(openAiConfig);

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// MongoDB Client
const mongoClient = new MongoClient(config.mongodbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Configure Logger
const logger = winston.createLogger({
  level: 'debug', // Set to 'info' to reduce verbosity
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(), // Log to console
    new winston.transports.File({ filename: 'app.log' }), // Log to file
  ],
});

// ------------------------------------
//   EXAMPLE: GET SOURCE TEXT
// ------------------------------------
// Fetch source texts from MongoDB
async function fetchSourceTexts() {
  try {
    await mongoClient.connect();
    logger.info('Connected successfully to MongoDB');

    const db = mongoClient.db(config.databaseName);
    const collection = db.collection('your_collection_name'); // Replace with your collection name

    const cursor = collection.find({});

    const docs = [];
    await cursor.forEach((doc) => {
      docs.push({
        _id: doc._id,
        title: doc.title,
        body: doc.body,
        // Include any other fields you need
      });
    });

    logger.info(`Fetched ${docs.length} documents from MongoDB.`);
    return docs;
  } catch (err) {
    logger.error(`Error fetching source texts from MongoDB: ${err}`);
    return [];
  }
}

// ------------------------------------
//   HELPER: Remove HTML
// ------------------------------------
function removeHtmlTags(rawText) {
  const { result } = stripHtml(rawText);
  return result;
}

// ------------------------------------
//   SINGLE-PROMPT APPROACH
// ------------------------------------
async function chunkAndMetadataSinglePrompt(fullText) {
  const systemMessage = prompts.singlePromptSystemMessage;
  const template = Handlebars.compile(prompts.singlePromptUserMessage);
  const userMessage = template({ fullText });

  try {
    const response = await openai.createChatCompletion({
      model: config.openAiModelForChunking,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: config.temperature,
    });

    const raw = response.data.choices[0].message.content;
    logger.debug(`Received response from OpenAI: ${raw}`);
    // Attempt to parse as JSON
    return JSON.parse(raw);
  } catch (err) {
    logger.error(`Error in singlePrompt approach: ${err}`);
    return [];
  }
}

// ------------------------------------
//   TWO-PROMPT APPROACH
// ------------------------------------
async function getChunkBoundaries(fullText) {
  const systemMessage = prompts.chunkingSystemMessage;
  const template = Handlebars.compile(prompts.chunkingUserMessage);
  const userMessage = template({ fullText });

  try {
    const response = await openai.createChatCompletion({
      model: config.openAiModelForChunking,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: config.temperature,
    });
    const raw = response.data.choices[0].message.content;
    logger.debug(`Chunk boundaries response: ${raw}`);
    return JSON.parse(raw);
  } catch (err) {
    logger.error(`Error in getChunkBoundaries: ${err}`);
    return [];
  }
}

async function generateMetadataForChunk(chunkText) {
  const systemMessage = prompts.metadataSystemMessage;
  const template = Handlebars.compile(prompts.metadataUserMessage);
  const userMessage = template({ chunkText });

  try {
    const response = await openai.createChatCompletion({
      model: config.openAiModelForMetadata,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: config.temperature,
    });
    const raw = response.data.choices[0].message.content;
    logger.debug(`Metadata response: ${raw}`);
    return JSON.parse(raw);
  } catch (err) {
    logger.error(`Error in generateMetadataForChunk: ${err}`);
    return null;
  }
}

// ------------------------------------
//    MAIN PROCESSOR
// ------------------------------------
async function processDocuments() {
  const docs = await fetchSourceTexts();

  for (const doc of docs) {
    let { _id, title, body } = doc;

    // Remove HTML if config says so
    if (config.removeHtmlTags) {
      body = removeHtmlTags(body);
    }

    let finalData = [];

    // Approach 1: Single Prompt
    if (config.singlePromptForChunkAndMetadata) {
      logger.info(`[Doc ${_id}] Using SINGLE-PROMPT approach.`);
      const result = await chunkAndMetadataSinglePrompt(body);
      finalData = result;
    }
    // Approach 2: Two Prompts
    else {
      logger.info(`[Doc ${_id}] Using TWO-PROMPT approach.`);

      // Step 1: Get chunk boundaries
      const boundaries = await getChunkBoundaries(body);

      // Step 2: For each boundary, get metadata
      for (const b of boundaries) {
        const chunkText = body.slice(b.start_index, b.end_index);
        const metadata = await generateMetadataForChunk(chunkText);

        finalData.push({
          chunk_id: b.chunk_id,
          start_index: b.start_index,
          end_index: b.end_index,
          chunk_text: chunkText,
          ...metadata,
        });
      }
    }

    // Save to Supabase
    for (const chunkObj of finalData) {
      // Insert each chunk as a new row in your table
      const { data, error } = await supabase
        .from(config.supabaseTable)
        .insert({
          doc_id: _id,
          doc_title: title,
          chunk_id: chunkObj.chunk_id,
          chunk_text: chunkObj.chunk_text || null,
          metadata_json: JSON.stringify(chunkObj), // Or store fields individually
        });

      if (error) {
        logger.error(
          `Supabase insert error for doc ${_id}, chunk ${chunkObj.chunk_id}: ${error.message}`
        );
      } else {
        logger.info(`Inserted doc ${_id}, chunk ${chunkObj.chunk_id} into Supabase.`);
      }
    }
  }

  // Close the MongoDB connection when done
  await mongoClient.close();
  logger.info('MongoDB connection closed.');
}

// ------------------------------------
//  RUN!
// ------------------------------------
processDocuments()
  .then(() => {
    logger.info('All done.');
  })
  .catch((err) => {
    logger.error(`Unexpected error: ${err}`);
    mongoClient.close();
  });
