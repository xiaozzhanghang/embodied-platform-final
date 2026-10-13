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
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  // Helper to seek slider and wait for render
  async function seekAndCapture(pVal, filename, desc) {
    await page.evaluate((val) => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        // Use native property setter so React registers state change
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(slider, val);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, pVal);

    await new Promise(r => setTimeout(r, 800));

    // Get info
    const info = await page.evaluate(() => {
      const scene = window.__THREE_SCENE__;
      const leftHand = scene?.getObjectByName('left_dex1_base_link');
      const rightHand = scene?.getObjectByName('right_dex1_base_link');
      let foundBox = null;
      scene?.traverse(node => {
        if (node.isMesh && node.geometry?.type === 'BoxGeometry') {
          const p = node.geometry.parameters;
          if (p && Math.abs(p.width - 0.16) < 0.01) foundBox = node;
        }
      });
      function pos(o) {
        if (!o) return null;
        o.updateWorldMatrix(true, false);
        const e = o.matrixWorld.elements;
        return [Number(e[12].toFixed(3)), Number(e[13].toFixed(3)), Number(e[14].toFixed(3))];
      }
      return { l: pos(leftHand), r: pos(rightHand), b: pos(foundBox) };
    });

    const file = path.join(ARTIFACTS_DIR, filename);
    await page.screenshot({ path: file });
    console.log(`[${desc}] (p=${pVal}) Saved: ${filename}`, info);
  }

  // 1. Pre-grasp / table rest (p=0.10)
  await seekAndCapture(0.10, 'pick_box_01_pre_grasp.png', 'Pre-grasp');

  // 2. Dual-hand grasp contact (p=0.38)
  await seekAndCapture(0.38, 'pick_box_02_grasp_contact.png', 'Grasp Contact');

  // 3. Air transfer between hands (p=0.55)
  await seekAndCapture(0.55, 'pick_box_03_air_transfer.png', 'Air Transfer');

  // 4. Placement on tray (p=0.80)
  await seekAndCapture(0.80, 'pick_box_04_placement.png', 'Placement on Tray');

  await browser.close();
}

main().catch(console.error);
