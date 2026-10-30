import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/37029f3f-1d0b-4b55-910d-42bb165e6bac';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1920,1080', '--user-data-dir=/tmp/pup_screen_' + Date.now()]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to http://localhost:3000/screen...');
  await page.goto('http://localhost:3000/screen', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'screen_bigym_3d_overview.png') });
  console.log('Captured screen_bigym_3d_overview.png');

  await browser.close();
}

main().catch(console.error);
