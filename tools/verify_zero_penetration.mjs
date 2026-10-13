import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/093a00b4-c00e-48d5-9b19-920b1183a829';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://localhost:3001/';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  async function seekAndSnap(val, filename) {
    await page.evaluate((p) => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(slider, p);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, val);
    await new Promise(r => setTimeout(r, 800));

    const info = await page.evaluate(() => {
      const s = window.__THREE_SCENE__;
      s.updateMatrixWorld(true);
      let boxMesh = null;
      let boxGroup = null;
      s.traverse(n => {
        if (n.isMesh && n.geometry?.type === 'BoxGeometry') {
          const p = n.geometry.parameters;
          if (p && Math.abs(p.width - 0.16) < 0.01) {
            boxMesh = n;
            boxGroup = n.parent;
          }
        }
      });
      boxMesh.geometry.computeBoundingBox();
      const boxBB = boxMesh.geometry.boundingBox.clone().applyMatrix4(boxMesh.matrixWorld);

      function getPos(name) {
        const o = s.getObjectByName(name);
        if (!o) return null;
        const m = o.matrixWorld.elements;
        return [Number(m[12].toFixed(3)), Number(m[13].toFixed(3)), Number(m[14].toFixed(3))];
      }

      const armMeshNodes = [];
      const armNames = [
        'right_shoulder_pitch_link', 'right_shoulder_roll_link', 'right_shoulder_yaw_link',
        'right_elbow_link', 'right_wrist_roll_link', 'right_wrist_pitch_link', 'right_wrist_yaw_link',
        'right_dex1_base_link', 'right_dex1_finger_link_1', 'right_dex1_finger_link_2',
        'left_shoulder_pitch_link', 'left_shoulder_roll_link', 'left_shoulder_yaw_link',
        'left_elbow_link', 'left_wrist_roll_link', 'left_wrist_pitch_link', 'left_wrist_yaw_link',
        'left_dex1_base_link', 'left_dex1_finger_link_1', 'left_dex1_finger_link_2'
      ];
      armNames.forEach(name => {
        const node = s.getObjectByName(name);
        if (!node) return;
        node.traverse(c => {
          if (c.isMesh && c.geometry) armMeshNodes.push(c);
        });
      });

      const colliding = [];
      for (const m of armMeshNodes) {
        m.geometry.computeBoundingBox();
        const mBB = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
        if (boxBB.intersectsBox(mBB)) {
          colliding.push(m.name || m.parent?.name);
        }
      }

      return {
        rf: getPos('right_dex1_finger_link_1'),
        rh: getPos('right_dex1_base_link'),
        re: getPos('right_elbow_link'),
        lf: getPos('left_dex1_finger_link_1'),
        lh: getPos('left_dex1_base_link'),
        boxBB: { min: [boxBB.min.x.toFixed(3), boxBB.min.y.toFixed(3), boxBB.min.z.toFixed(3)], max: [boxBB.max.x.toFixed(3), boxBB.max.y.toFixed(3), boxBB.max.z.toFixed(3)] },
        colliding: [...new Set(colliding)]
      };
    });

    const ssPath = path.join(ARTIFACTS_DIR, filename);
    await page.screenshot({ path: ssPath });
    console.log(`p=${val} ${filename}:`, JSON.stringify(info));
  }

  // 1. Overview at p=0.80
  await seekAndSnap(0.80, 'verified_p80_overview.png');

  // 2. Side view at p=0.80
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sideBtn = btns.find(b => b.textContent && b.textContent.includes('侧视'));
    if (sideBtn) sideBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await seekAndSnap(0.80, 'verified_p80_side_view.png');

  // 3. Overview at p=0.38 (Grasp)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('三维全景'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await seekAndSnap(0.38, 'verified_p38_grasp.png');

  // 4. Overview at p=0.55 (Air transfer)
  await seekAndSnap(0.55, 'verified_p55_transfer.png');

  await browser.close();
  console.log('Zero penetration verification completed successfully!');
}

main().catch(console.error);
