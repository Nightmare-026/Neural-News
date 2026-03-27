import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const TELEGRAM_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

async function distribute() {
  console.log('📤 Starting Distribution to Telegram...');

  // 1. Get articles that have a summary but haven't been posted
  const { data: articles, error } = await supabase
    .from('news_articles')
    .select('*')
    .not('summary', 'is', null)
    .eq('posted_to_telegram', false)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching articles:', error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log('😴 No articles ready for distribution.');
    return;
  }

  for (const article of articles) {
    console.log(`📢 Posting: ${article.title}`);

    const message = `
🔥 *${article.title}*
_${article.source}_

${article.summary}

🔗 [Read Full Story](${article.url})
    `;

    try {
      const response = await fetch(TELEGRAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        })
      });

      const result = await response.json();

      if (result.ok) {
        // 2. Mark as posted in Supabase
        await supabase
          .from('news_articles')
          .update({ posted_to_telegram: true })
          .eq('id', article.id);
          
        console.log(`✅ Posted to Telegram: ${article.title}`);
      } else {
        console.error(`❌ Telegram Error: ${result.description}`);
      }
    } catch (err) {
      console.error(`❌ Distribution failed for ${article.title}:`, err);
    }
  }

  console.log('🏁 Distribution Complete.');
}

distribute().catch(console.error);
