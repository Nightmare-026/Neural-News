import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const parser = new Parser();
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('❌ Missing Supabase Environment Variables (SUPABASE_URL or SUPABASE_SERVICE_KEY). Check GitHub Secrets.');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const FEEDS = [
  'https://hnrss.org/frontpage', // Hacker News
  'https://www.theverge.com/rss/index.xml', // The Verge
  'https://techcrunch.com/feed/', // TechCrunch
];

async function scrape() {
  console.log('🚀 Starting News Scrape...');
  
  for (const url of FEEDS) {
    try {
      console.log(`📡 Fetching: ${url}`);
      const feed = await parser.parseURL(url);
      
      for (const item of feed.items) {
        const { title, link, contentSnippet, isoDate } = item;
        
        if (!link) continue;

        // 1. Check if we've seen this article before
        const { data: existing, error: checkError } = await supabase
          .from('news_articles')
          .select('id')
          .eq('url', link)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`❌ Error checking article: ${checkError.message}`);
          continue;
        }

        if (existing) {
          // console.log(`⏩ Skipping (already seen): ${title}`);
          continue;
        }

        // 2. Add to Supabase (Mark as pending AI processing)
        const { error: insertError } = await supabase
          .from('news_articles')
          .insert({
            title,
            url: link,
            source: feed.title,
            metadata: {
              snippet: contentSnippet,
              published_at: isoDate
            }
          });

        if (insertError) {
          console.error(`❌ Error inserting article: ${insertError.message}`);
        } else {
          console.log(`✅ New Article Saved: ${title}`);
        }
      }
    } catch (err) {
      console.error(`❌ Failed to fetch ${url}:`, err);
    }
  }
  
  console.log('🏁 Scrape Complete.');
}

scrape().catch(console.error);
