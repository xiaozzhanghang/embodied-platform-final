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
  await new Promise(r => setTimeout(r, 2000));

  // Collect samples every 200ms for 3.5 seconds
  const samples = [];
  const start = Date.now();
  while (Date.now() - start < 3500) {
    const data = await page.evaluate(() => {
      const scene = window.__THREE_SCENE__;
      const leftHand = scene?.getObjectByName('left_dex1_base_link');
      const rightHand = scene?.getObjectByName('right_dex1_base_link');

      let foundBox = null;
      scene?.traverse(node => {
        if (node.isMesh && node.geometry?.type === 'BoxGeometry') {
          const p = node.geometry.parameters;
          if (p && Math.abs(p.width - 0.16) < 0.01) {
            foundBox = node;
          }
        }
      });

      function getWorldPos(obj) {
        if (!obj) return null;
        obj.updateWorldMatrix(true, false);
        const e = obj.matrixWorld.elements;
        return [Number(e[12].toFixed(3)), Number(e[13].toFixed(3)), Number(e[14].toFixed(3))];
      }

      const l = getWorldPos(leftHand);
      const r = getWorldPos(rightHand);
      const b = getWorldPos(foundBox);
      const slider = document.querySelector('input[type="range"]');
      const p = slider ? Number(slider.value) : 0;

      let mid = null;
      if (l && r) {
        mid = [
          Number(((l[0] + r[0]) / 2).toFixed(3)),
          Number(((l[1] + r[1]) / 2).toFixed(3)),
          Number(((l[2] + r[2]) / 2).toFixed(3))
        ];
      }
      return { p, l, r, mid, b };
    });

    samples.push(data);
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('Recorded live playback samples:');
  for (const s of samples) {
    console.log(
      `p=${s.p.toFixed(2)} | Hands Mid=[${s.mid}] | Box=[${s.b}] | DiffX=${s.mid && s.b ? (s.mid[0] - s.b[0]).toFixed(3) : 'N/A'}`
    );
  }

  await browser.close();
}

main().catch(console.error);
