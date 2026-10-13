import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/093a00b4-c00e-48d5-9b19-920b1183a829';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1920,1080', '--user-data-dir=/tmp/pup_snap_' + Date.now()]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // 1. Capture 3D Viewer directly on 3001
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_3d_viewer_3001.png') });
  console.log('Saved live_3d_viewer_3001.png');

  // 2. Capture Next.js Dashboard on 3000/screen/
  await page.goto('http://localhost:3000/screen/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'live_platform_screen_3000.png') });
  console.log('Saved live_platform_screen_3000.png');

  await browser.close();
}

main().catch(console.error);
