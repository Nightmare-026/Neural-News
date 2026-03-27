import { execSync } from 'child_process';

async function runPipeline() {
  console.log('🏁 Starting Neural News Pipeline...');
  
  try {
    console.log('\n--- Step 1: Scraping ---');
    execSync('npm run scrape', { stdio: 'inherit' });
    
    console.log('\n--- Step 2: AI Processing ---');
    // Using ts-node directly to avoid build step for simplicity
    execSync('npx ts-node src/process.ts', { stdio: 'inherit' });
    
    console.log('\n--- Step 3: Distribution ---');
    execSync('npx ts-node src/distribute.ts', { stdio: 'inherit' });
    
    console.log('\n🎉 Pipeline Finished Successfully.');
  } catch (err) {
    console.error('\n❌ Pipeline Failed:', err);
    process.exit(1);
  }
}

runPipeline();
