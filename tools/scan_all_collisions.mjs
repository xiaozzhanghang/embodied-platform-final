import puppeteer from 'puppeteer-core';

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

  const steps = [];
  for (let p = 0; p <= 1.001; p += 0.02) {
    steps.push(Number(p.toFixed(2)));
  }

  console.log(`Starting scan across ${steps.length} steps...`);

  for (const step of steps) {
    await page.evaluate((p) => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(slider, p);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, step);
    await new Promise(r => setTimeout(r, 80));

    const result = await page.evaluate((stepVal) => {
      const s = window.__THREE_SCENE__;
      s.updateMatrixWorld(true);
      let boxMesh = null;
      s.traverse(n => {
        if (n.isMesh && n.geometry?.type === 'BoxGeometry') {
          const p = n.geometry.parameters;
          if (p && Math.abs(p.width - 0.16) < 0.01) {
            boxMesh = n;
          }
        }
      });
      if (!boxMesh) return { error: 'Box mesh not found' };
      boxMesh.geometry.computeBoundingBox();
      const boxBB = boxMesh.geometry.boundingBox.clone().applyMatrix4(boxMesh.matrixWorld);

      function getNode(name) {
        return s.getObjectByName(name);
      }

      function getPos(node) {
        if (!node) return null;
        const m = node.matrixWorld.elements;
        return [Number(m[12].toFixed(3)), Number(m[13].toFixed(3)), Number(m[14].toFixed(3))];
      }

      const armNames = [
        'right_dex1_base_link', 'right_dex1_finger_link_1', 'right_dex1_finger_link_2',
        'left_dex1_base_link', 'left_dex1_finger_link_1', 'left_dex1_finger_link_2',
        'right_wrist_yaw_link', 'left_wrist_yaw_link'
      ];

      const collisions = [];
      armNames.forEach(name => {
        const node = getNode(name);
        if (!node) return;
        node.traverse(c => {
          if (c.isMesh && c.geometry) {
            c.geometry.computeBoundingBox();
            const cBB = c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld);
            if (boxBB.intersectsBox(cBB)) {
              // Calculate overlap
              const overlap = {
                x: Math.min(boxBB.max.x, cBB.max.x) - Math.max(boxBB.min.x, cBB.min.x),
                y: Math.min(boxBB.max.y, cBB.max.y) - Math.max(boxBB.min.y, cBB.min.y),
                z: Math.min(boxBB.max.z, cBB.max.z) - Math.max(boxBB.min.z, cBB.min.z)
              };
              collisions.push({
                link: name,
                mesh: c.name,
                overlap: [Number(overlap.x.toFixed(4)), Number(overlap.y.toFixed(4)), Number(overlap.z.toFixed(4))]
              });
            }
          }
        });
      });

      const rf = getPos(getNode('right_dex1_finger_link_1'));
      const rh = getPos(getNode('right_dex1_base_link'));
      const lf = getPos(getNode('left_dex1_finger_link_1'));
      const lh = getPos(getNode('left_dex1_base_link'));

      return {
        step: stepVal,
        boxBB: { min: [boxBB.min.x.toFixed(3), boxBB.min.y.toFixed(3), boxBB.min.z.toFixed(3)], max: [boxBB.max.x.toFixed(3), boxBB.max.y.toFixed(3), boxBB.max.z.toFixed(3)] },
        rf, rh, lf, lh,
        collisions
      };
    }, step);

    if (result.collisions && result.collisions.length > 0) {
      console.log(`[COLLISION] p=${step}:`, JSON.stringify(result.collisions), 'rf:', result.rf, 'lf:', result.lf, 'boxBB:', result.boxBB);
    } else {
      // console.log(`[OK] p=${step}`);
    }
  }

  await browser.close();
  console.log('Collision scan complete.');
}

main().catch(console.error);
