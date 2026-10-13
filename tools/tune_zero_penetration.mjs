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

  // We want to test different arm configurations at key milestones:
  // p = 0.20 (approach)
  // p = 0.38 (clamp on table)
  // p = 0.55 (carry)
  // p = 0.70 (arrival)
  // p = 0.80 (release & retract)
  
  const testP = [0.10, 0.20, 0.28, 0.35, 0.40, 0.45, 0.55, 0.65, 0.70, 0.72, 0.75, 0.80, 0.85, 0.90, 1.0];

  const results = await page.evaluate((pts) => {
    const s = window.__THREE_SCENE__;
    s.updateMatrixWorld(true);

    let boxMesh = null;
    s.traverse(n => {
      if (n.isMesh && n.geometry?.type === 'BoxGeometry') {
        const p = n.geometry.parameters;
        if (p && Math.abs(p.width - 0.16) < 0.01) boxMesh = n;
      }
    });

    const armMeshNodes = [];
    const armNames = [
      'right_wrist_yaw_link', 'right_dex1_base_link', 'right_dex1_finger_link_1', 'right_dex1_finger_link_2',
      'left_wrist_yaw_link', 'left_dex1_base_link', 'left_dex1_finger_link_1', 'left_dex1_finger_link_2'
    ];
    armNames.forEach(name => {
      const node = s.getObjectByName(name);
      if (!node) return;
      node.traverse(c => {
        if (c.isMesh && c.geometry) armMeshNodes.push({ link: name, mesh: c });
      });
    });

    const report = [];

    pts.forEach(pVal => {
      // simulate slider value
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(slider, pVal);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
      s.updateMatrixWorld(true);

      boxMesh.geometry.computeBoundingBox();
      const boxBB = boxMesh.geometry.boundingBox.clone().applyMatrix4(boxMesh.matrixWorld);

      const colliding = [];
      armMeshNodes.forEach(({ link, mesh }) => {
        mesh.geometry.computeBoundingBox();
        const mBB = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
        if (boxBB.intersectsBox(mBB)) {
          colliding.push({
            link,
            mesh: mesh.name,
            overlapX: Math.min(boxBB.max.x, mBB.max.x) - Math.max(boxBB.min.x, mBB.min.x),
            overlapY: Math.min(boxBB.max.y, mBB.max.y) - Math.max(boxBB.min.y, mBB.min.y),
            overlapZ: Math.min(boxBB.max.z, mBB.max.z) - Math.max(boxBB.min.z, mBB.min.z)
          });
        }
      });

      report.push({
        p: pVal,
        boxBB: [Number(boxBB.min.x.toFixed(3)), Number(boxBB.max.x.toFixed(3))],
        colliding
      });
    });

    return report;
  }, testP);

  console.log('Collision Report:');
  results.forEach(r => {
    if (r.colliding.length > 0) {
      console.log(`[COLLISION] p=${r.p} BoxX=[${r.boxBB[0]}, ${r.boxBB[1]}]:`, JSON.stringify(r.colliding));
    } else {
      console.log(`[CLEAN] p=${r.p} BoxX=[${r.boxBB[0]}, ${r.boxBB[1]}]`);
    }
  });

  await browser.close();
}

main().catch(console.error);
