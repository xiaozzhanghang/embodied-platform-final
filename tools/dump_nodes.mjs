import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://localhost:3001/';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));

  const names = await page.evaluate(() => {
    const scene = window.__THREE_SCENE__;
    if (!scene) return 'no scene';
    const list = [];
    scene.traverse(n => {
      if (n.name) list.push(n.name);
    });
    return list.slice(0, 50);
  });

  console.log('Node names in scene:', names);
  await browser.close();
}

main().catch(console.error);
