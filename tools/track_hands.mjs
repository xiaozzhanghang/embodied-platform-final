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
  await new Promise(r => setTimeout(r, 3000));

  // Pause playback first so progress is static
  await page.evaluate(() => {
    // Find play/pause button (first button in slider controls)
    const playBtn = document.querySelector('button[title*="播放"], button[title*="暂停"]') ||
      document.querySelectorAll('div > button')[2];
    // We can also pause by clicking the play button if playing
  });

  const testPoints = [0.0, 0.20, 0.30, 0.35, 0.44, 0.55, 0.70, 0.75, 0.85, 0.95];
  const results = [];

  for (const pVal of testPoints) {
    const data = await page.evaluate((p) => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        slider.value = p;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const scene = window.__THREE_SCENE__;
      const leftHand = scene?.getObjectByName('left_dex1_base_link');
      const rightHand = scene?.getObjectByName('right_dex1_base_link');

      function getWorldPos(obj) {
        if (!obj) return null;
        obj.updateWorldMatrix(true, false);
        const e = obj.matrixWorld.elements;
        return [Number(e[12].toFixed(3)), Number(e[13].toFixed(3)), Number(e[14].toFixed(3))];
      }

      const l = getWorldPos(leftHand);
      const r = getWorldPos(rightHand);
      let mid = null;
      if (l && r) {
        mid = [
          Number(((l[0] + r[0]) / 2).toFixed(3)),
          Number(((l[1] + r[1]) / 2).toFixed(3)),
          Number(((l[2] + r[2]) / 2).toFixed(3))
        ];
      }
      return { p, l, r, mid };
    }, pVal);

    await new Promise(r => setTimeout(r, 100));
    results.push(data);
  }

  console.log('Hand tracking during pick_box:\n', JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch(console.error);
