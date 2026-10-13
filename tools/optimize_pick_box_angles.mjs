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

  // Let's test custom joint angles directly on the scene to find perfect zero-collision parameters
  const testAngles = await page.evaluate(() => {
    const s = window.__THREE_SCENE__;
    s.updateMatrixWorld(true);

    const lsp = s.getObjectByName('left_shoulder_pitch_link');
    const lsr = s.getObjectByName('left_shoulder_roll_link');
    const le = s.getObjectByName('left_elbow_link');
    const lwp = s.getObjectByName('left_wrist_pitch_link');

    const rsp = s.getObjectByName('right_shoulder_pitch_link');
    const rsr = s.getObjectByName('right_shoulder_roll_link');
    const re = s.getObjectByName('right_elbow_link');
    const rwp = s.getObjectByName('right_wrist_pitch_link');

    const wy = s.getObjectByName('waist_yaw_link');
    const torso = s.getObjectByName('torso_link');

    const lf1 = s.getObjectByName('left_dex1_finger_link_1');
    const lf2 = s.getObjectByName('left_dex1_finger_link_2');
    const rf1 = s.getObjectByName('right_dex1_finger_link_1');
    const rf2 = s.getObjectByName('right_dex1_finger_link_2');

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
        if (c.isMesh && c.geometry) armMeshNodes.push(c);
      });
    });

    function checkCollision(boxPos) {
      if (boxMesh && boxMesh.parent) {
        boxMesh.parent.position.set(boxPos[0], boxPos[1], boxPos[2]);
      }
      s.updateMatrixWorld(true);
      boxMesh.geometry.computeBoundingBox();
      const boxBB = boxMesh.geometry.boundingBox.clone().applyMatrix4(boxMesh.matrixWorld);

      const colliding = [];
      for (const m of armMeshNodes) {
        m.geometry.computeBoundingBox();
        const mBB = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
        if (boxBB.intersectsBox(mBB)) {
          colliding.push(m.name);
        }
      }
      return { colliding, boxBB };
    }

    return { ok: true };
  });

  console.log('Test setup ready:', testAngles);
  await browser.close();
}

main().catch(console.error);
