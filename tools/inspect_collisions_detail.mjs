import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://localhost:3001/';

async function inspect(step) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate((p) => {
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(slider, p);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, step);
  await new Promise(r => setTimeout(r, 600));

  const details = await page.evaluate(() => {
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
    boxMesh.geometry.computeBoundingBox();
    const boxBB = boxMesh.geometry.boundingBox.clone().applyMatrix4(boxMesh.matrixWorld);

    function getLinkBB(name) {
      const o = s.getObjectByName(name);
      if (!o) return null;
      const meshes = [];
      o.traverse(c => {
        if (c.isMesh && c.geometry) meshes.push(c);
      });
      const bbs = meshes.map(m => {
        m.geometry.computeBoundingBox();
        const bb = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
        const intersects = boxBB.intersectsBox(bb);
        return {
          mesh: m.name,
          min: [Number(bb.min.x.toFixed(4)), Number(bb.min.y.toFixed(4)), Number(bb.min.z.toFixed(4))],
          max: [Number(bb.max.x.toFixed(4)), Number(bb.max.y.toFixed(4)), Number(bb.max.z.toFixed(4))],
          intersects
        };
      });
      return { name, meshes: bbs };
    }

    const armNames = [
      'left_wrist_yaw_link', 'left_dex1_base_link', 'left_dex1_finger_link_1', 'left_dex1_finger_link_2',
      'right_wrist_yaw_link', 'right_dex1_base_link', 'right_dex1_finger_link_1', 'right_dex1_finger_link_2'
    ];

    return {
      boxBB: {
        min: [Number(boxBB.min.x.toFixed(4)), Number(boxBB.min.y.toFixed(4)), Number(boxBB.min.z.toFixed(4))],
        max: [Number(boxBB.max.x.toFixed(4)), Number(boxBB.max.y.toFixed(4)), Number(boxBB.max.z.toFixed(4))]
      },
      links: armNames.map(getLinkBB)
    };
  });

  console.log(`=== DETAILS FOR p=${step} ===`);
  console.log('BOX BB:', JSON.stringify(details.boxBB));
  for (const l of details.links) {
    const inter = l.meshes.filter(m => m.intersects);
    if (inter.length > 0) {
      console.log(`COLLISION on link ${l.name}:`, JSON.stringify(inter));
    }
  }

  await browser.close();
}

async function run() {
  await inspect(0.20);
  await inspect(0.38);
  await inspect(0.70);
}

run().catch(console.error);
