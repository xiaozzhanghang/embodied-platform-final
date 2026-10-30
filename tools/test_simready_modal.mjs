import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/37029f3f-1d0b-4b55-910d-42bb165e6bac';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1920,1080', '--user-data-dir=/tmp/pup_simready_' + Date.now()]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 960 });

  console.log('Navigating to http://localhost:3000/embodied-3d/index.html...');
  await page.goto('http://localhost:3000/embodied-3d/index.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 3500));

  // 1. Capture in-scene detailed view with the upgraded SimReady 3D model
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'simready_in_scene_detailed.png') });
  console.log('Captured simready_in_scene_detailed.png');

  // 2. Open SimReady modal
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text && text.includes('SimReady')) {
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1200));

  // 3. Click "OpenUSD 3D 原生检视" in the modal
  console.log('Looking for OpenUSD 3D 原生检视 button...');
  const modalButtons = await page.$$('button');
  for (const mb of modalButtons) {
    const text = await page.evaluate(el => el.innerText, mb);
    if (text && text.includes('OpenUSD 3D 原生检视')) {
      console.log('Clicking OpenUSD 3D 原生检视...');
      await mb.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'simready_openusd_modal.png') });
  console.log('Captured simready_openusd_modal.png');

  await browser.close();
}

main().catch(console.error);
