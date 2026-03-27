import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openrouter/auto'; // Let OpenRouter choose a working model

async function processArticles() {
  console.log(`🤖 Starting AI Processing with OpenRouter (${MODEL})...`);

  // 1. Fetch pending articles from Supabase
  const { data: articles, error } = await supabase
    .from('news_articles')
    .select('*')
    .is('summary', null)
    .limit(5);

  if (error) {
    console.error('❌ Error fetching articles:', error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log('😴 No new articles to process.');
    return;
  }

  for (const article of articles) {
    console.log(`🧠 Processing: ${article.title}`);

    const prompt = `
      You are an elite sovereign-grade tech journalist. Analyze the following news item.
      
      Title: ${article.title}
      Snippet: ${article.metadata?.snippet || 'No snippet available'}
      Source: ${article.source}

      Tasks:
      1. Summarize the news in exactly 3 concise, high-impact bullet points.
      2. Provide a "Sovereign Take" (1 sentence) on why this matters for the future of tech or society.
      3. Categorize it (e.g., AI, Crypto, Policy, Gadgets).

      Output Format (Plain Text):
      SUMMARY:
      - [Bullet 1]
      - [Bullet 2]
      - [Bullet 3]

      TAKE: [Your Take]
      CATEGORY: [Category]
    `;

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/neural-news', // Required for OpenRouter
          'X-Title': 'Neural News Automation'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data: any = await response.json();
      
      if (!response.ok) {
        console.error(`❌ OpenRouter Error: ${data.error?.message || response.statusText}`);
        continue;
      }

      const text = data.choices[0]?.message?.content || '';

      // 2. Update Supabase with summary and take
      const { error: updateError } = await supabase
        .from('news_articles')
        .update({
          summary: text,
          category: text.split('CATEGORY:')[1]?.trim() || 'General'
        })
        .eq('id', article.id);

      if (updateError) {
        console.error(`❌ Error updating article: ${updateError.message}`);
      } else {
        console.log(`✅ AI Summary Generated for: ${article.title}`);
      }
    } catch (err) {
      console.error(`❌ AI processing failed for ${article.title}:`, err);
    }
  }

  console.log('🏁 AI Processing Complete.');
}

processArticles().catch(console.error);
