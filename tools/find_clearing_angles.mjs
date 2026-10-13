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

    const lsp = s.getObjectByName('left_shoulder_pitch_link');
    const lsr = s.getObjectByName('left_shoulder_roll_link');
    const le = s.getObjectByName('left_elbow_link');
    const lwp = s.getObjectByName('left_wrist_pitch_link');
    const wy = s.getObjectByName('waist_yaw_link');
    const torso = s.getObjectByName('torso_link');

    let boxMesh = null;
    s.traverse(n => {
      if (n.isMesh && n.geometry?.type === 'BoxGeometry') {
        const p = n.geometry.parameters;
        if (p && Math.abs(p.width - 0.16) < 0.01) boxMesh = n;
      }
    });

    // Box at [-0.10, 0.83, -0.30]
    boxMesh.parent.position.set(-0.10, 0.83, -0.30);
    s.updateMatrixWorld(true);
    boxMesh.geometry.computeBoundingBox();
    const boxBB = boxMesh.geometry.boundingBox.clone().applyMatrix4(boxMesh.matrixWorld);

    function testPose(name, lspY, lsrX, leY, wyZ, torsoX) {
      lsp.rotation.y = lspY;
      lsr.rotation.x = lsrX;
      le.rotation.y = leY;
      wy.rotation.z = wyZ;
      torso.rotation.x = torsoX;
      s.updateMatrixWorld(true);

      const armMeshNodes = [];
      ['left_wrist_yaw_link', 'left_dex1_base_link', 'left_dex1_finger_link_1', 'left_dex1_finger_link_2'].forEach(nm => {
        const node = s.getObjectByName(nm);
        if (node) node.traverse(c => { if (c.isMesh && c.geometry) armMeshNodes.push({ name: c.name || nm, mesh: c }); });
      });

      const colls = [];
      let maxHandX = -999;
      let minHandZ = 999;
      let maxHandZ = -999;

      armMeshNodes.forEach(({ name, mesh }) => {
        mesh.geometry.computeBoundingBox();
        const mBB = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
        if (mBB.max.x > maxHandX) maxHandX = mBB.max.x;
        if (mBB.min.z < minHandZ) minHandZ = mBB.min.z;
        if (mBB.max.z > maxHandZ) maxHandZ = mBB.max.z;

        if (boxBB.intersectsBox(mBB)) {
          colls.push(name);
        }
      });

      return {
        name,
        colls: [...new Set(colls)],
        maxHandX: Number(maxHandX.toFixed(3)),
        handZ: [Number(minHandZ.toFixed(3)), Number(maxHandZ.toFixed(3))]
      };
    }

    return {
      boxX: [Number(boxBB.min.x.toFixed(3)), Number(boxBB.max.x.toFixed(3))],
      boxZ: [Number(boxBB.min.z.toFixed(3)), Number(boxBB.max.z.toFixed(3))],
      tests: [
        testPose('ready_default', -0.42, -0.10, 0.70, 0, 0.06),
        testPose('abduct_lsr_0.16', -0.42, 0.16, 0.70, 0, 0.06),
        testPose('abduct_lsr_0.22', -0.42, 0.22, 0.70, 0, 0.06),
        testPose('abduct_lsr_0.28', -0.42, 0.28, 0.70, 0, 0.06),
        testPose('retracted_lsp_-0.20_lsr_0.20', -0.20, 0.20, 0.60, 0, 0.06),
        testPose('retracted_lsp_0.05_lsr_0.20', 0.05, 0.20, 0.60, 0, 0.06)
      ]
    };
  });

  console.log('BOX:', report.boxX, report.boxZ);
  report.tests.forEach(t => {
    console.log(`${t.name}: colls=${JSON.stringify(t.colls)} maxHandX=${t.maxHandX} handZ=${JSON.stringify(t.handZ)}`);
  });

  await browser.close();
}

main().catch(console.error);
