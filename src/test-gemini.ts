import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function listModels() {
  try {
    const list = await genAI.listModels();
    console.log('Available Models:');
    for (const model of list.models) {
      console.log(`- ${model.name} (${model.displayName})`);
    }
  } catch (err) {
    console.error('❌ Failed to list models:', err);
  }
}

listModels();
