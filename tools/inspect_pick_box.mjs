import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://localhost:3001/';
const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/093a00b4-c00e-48d5-9b19-920b1183a829';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  const data = await page.evaluate(() => {
    const scene = window.__THREE_SCENE__;
    if (!scene) return { error: 'No scene' };

    const leftHand = scene.getObjectByName('left_dex1_base_link');
    const rightHand = scene.getObjectByName('right_dex1_base_link');

    let foundBox = null;
    scene.traverse(node => {
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

    const lPos = getWorldPos(leftHand);
    const rPos = getWorldPos(rightHand);
    const bPos = getWorldPos(foundBox);

    return {
      leftHand: lPos,
      rightHand: rPos,
      box: bPos,
      hasLeftHand: !!leftHand,
      hasRightHand: !!rightHand,
      hasBox: !!foundBox
    };
  });

  console.log('Current scene state:', JSON.stringify(data, null, 2));

  const ss = path.join(ARTIFACTS_DIR, 'current_pick_box.png');
  await page.screenshot({ path: ss });
  console.log('Screenshot saved to:', ss);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
