/**
 * malas - Headless Playwright Runner
 * 
 * Demonstrates how to run the hosted GitHub Pages web app headlessly on a server/cron
 * using a persistent Chromium browser profile (--user-data-dir).
 * 
 * Setup:
 * 1. npm install -D playwright
 * 2. Run first time interactively to sign in and authorize:
 *    node scripts/headless-runner.js --interactive
 * 3. Schedule regular cron runs headlessly:
 *    node scripts/headless-runner.js --task=daily_digest
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_DATA_DIR = path.resolve(__dirname, '../.browser-profile');
const APP_URL = process.env.MALAS_APP_URL || 'https://maui2023.github.io/malas';

async function main() {
  const args = process.argv.slice(2);
  const isInteractive = args.includes('--interactive');
  const taskArg = args.find(a => a.startsWith('--task='));
  const task = taskArg ? taskArg.split('=')[1] : 'daily_digest';

  console.log(`[malas-runner] Profile path: ${USER_DATA_DIR}`);
  console.log(`[malas-runner] Target URL: ${APP_URL}`);

  if (isInteractive) {
    console.log('[malas-runner] Launching interactive browser for one-time Google OAuth & API Key setup...');
    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: false,
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();
    await page.goto(APP_URL);
    console.log('[malas-runner] Browser opened. Please:');
    console.log('  1. Add your Google OAuth Client ID & connect your Google Workspace.');
    console.log('  2. Configure your Gemini API key in Settings.');
    console.log('  3. Once connected, you can close the browser window.');
    
    // Wait until browser closed
    await page.waitForEvent('close', { timeout: 0 }).catch(() => {});
    await context.close();
    console.log('[malas-runner] Interactive setup saved to profile.');
    return;
  }

  // Headless Execution Mode
  console.log(`[malas-runner] Launching headless browser execution for task: "${task}"...`);
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await context.newPage();
  const runUrl = `${APP_URL}?headless=true&task=${encodeURIComponent(task)}`;
  
  await page.goto(runUrl, { waitUntil: 'networkidle' });

  console.log('[malas-runner] Waiting for AI agent completion in DOM (#headless-output)...');
  
  // Wait for #headless-output to receive completed status
  await page.waitForFunction(() => {
    const el = document.querySelector('#headless-output');
    if (!el) return false;
    const txt = el.innerText;
    return txt.includes('"status": "success"') || txt.includes('"status": "failed"') || txt.includes('"status": "unauthorized"');
  }, { timeout: 60000 });

  const rawOutput = await page.$eval('#headless-output', el => el.innerText);
  
  try {
    const parsed = JSON.parse(rawOutput);
    console.log('\n=================== MALAS DIGEST OUTPUT ===================\n');
    console.log(parsed.summary || rawOutput);
    console.log('\n===========================================================\n');
  } catch {
    console.log('[malas-runner] Raw Output:\n', rawOutput);
  }

  await context.close();
  console.log('[malas-runner] Task completed.');
}

main().catch(err => {
  console.error('[malas-runner] Error:', err);
  process.exit(1);
});
