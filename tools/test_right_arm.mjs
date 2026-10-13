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

  const report = await page.evaluate(() => {
    const s = window.__THREE_SCENE__;
    s.updateMatrixWorld(true);

    const rsp = s.getObjectByName('right_shoulder_pitch_link');
    const rsr = s.getObjectByName('right_shoulder_roll_link');
    const re = s.getObjectByName('right_elbow_link');
    const rwp = s.getObjectByName('right_wrist_pitch_link');
    const wy = s.getObjectByName('waist_yaw_link');
    const torso = s.getObjectByName('torso_link');

    let boxMesh = null;
    s.traverse(n => {
      if (n.isMesh && n.geometry?.type === 'BoxGeometry') {
        const p = n.geometry.parameters;
        if (p && Math.abs(p.width - 0.16) < 0.01) boxMesh = n;
      }
    });

    function testRight(name, boxPos, rspY, rsrX, reY, wyZ, torsoX) {
      boxMesh.parent.position.set(boxPos[0], boxPos[1], boxPos[2]);
      rsp.rotation.y = rspY;
      rsr.rotation.x = rsrX;
      re.rotation.y = reY;
      wy.rotation.z = wyZ;
      torso.rotation.x = torsoX;
      s.updateMatrixWorld(true);

      boxMesh.geometry.computeBoundingBox();
      const boxBB = boxMesh.geometry.boundingBox.clone().applyMatrix4(boxMesh.matrixWorld);

      const armMeshNodes = [];
      ['right_wrist_yaw_link', 'right_dex1_base_link', 'right_dex1_finger_link_1', 'right_dex1_finger_link_2'].forEach(nm => {
        const node = s.getObjectByName(nm);
        if (node) node.traverse(c => { if (c.isMesh && c.geometry) armMeshNodes.push({ name: c.name || nm, mesh: c }); });
      });

      const colls = [];
      let minHandX = 999;
      let maxHandX = -999;

      armMeshNodes.forEach(({ name, mesh }) => {
        mesh.geometry.computeBoundingBox();
        const mBB = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
        if (mBB.min.x < minHandX) minHandX = mBB.min.x;
        if (mBB.max.x > maxHandX) maxHandX = mBB.max.x;

        if (boxBB.intersectsBox(mBB)) {
          colls.push(name);
        }
      });

      return {
        name,
        boxX: [Number(boxBB.min.x.toFixed(3)), Number(boxBB.max.x.toFixed(3))],
        colls: [...new Set(colls)],
        handX: [Number(minHandX.toFixed(3)), Number(maxHandX.toFixed(3))]
      };
    }

    const boxStart = [-0.10, 0.83, -0.30];
    const boxGoal = [0.14, 0.84, -0.30];

    return [
      testRight('start_ready_default', boxStart, -0.42, 0.10, 0.70, 0, 0.06),
      testRight('start_clamp_rsr_-0.04', boxStart, -0.65, -0.04, 0.78, 0.20, 0.12),
      testRight('start_clamp_rsr_-0.06', boxStart, -0.65, -0.06, 0.78, 0.20, 0.12),
      testRight('start_clamp_rsr_-0.08', boxStart, -0.65, -0.08, 0.78, 0.20, 0.12),
      testRight('goal_tray_ready_default', boxGoal, -0.42, 0.10, 0.70, 0, 0.06),
      testRight('goal_tray_retracted_0.05_-0.28', boxGoal, 0.05, -0.28, 0.60, 0, 0.06)
    ];
  });

  report.forEach(t => {
    console.log(`${t.name}: boxX=${JSON.stringify(t.boxX)} handX=${JSON.stringify(t.handX)} colls=${JSON.stringify(t.colls)}`);
  });

  await browser.close();
}

main().catch(console.error);
