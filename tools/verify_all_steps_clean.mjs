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

  const result = await page.evaluate(() => {
    const s = window.__THREE_SCENE__;
    s.updateMatrixWorld(true);

    const lsp = s.getObjectByName('left_shoulder_pitch_link');
    const lsr = s.getObjectByName('left_shoulder_roll_link');
    const le = s.getObjectByName('left_elbow_link');
    const lwp = s.getObjectByName('left_wrist_pitch_link');
    const lf1 = s.getObjectByName('left_dex1_finger_link_1');
    const lf2 = s.getObjectByName('left_dex1_finger_link_2');

    const rsp = s.getObjectByName('right_shoulder_pitch_link');
    const rsr = s.getObjectByName('right_shoulder_roll_link');
    const re = s.getObjectByName('right_elbow_link');
    const rwp = s.getObjectByName('right_wrist_pitch_link');
    const rf1 = s.getObjectByName('right_dex1_finger_link_1');
    const rf2 = s.getObjectByName('right_dex1_finger_link_2');

    const wy = s.getObjectByName('waist_yaw_link');
    const torso = s.getObjectByName('torso_link');

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

    function lerp(a, b, t) { return a + (b - a) * t; }

    function applyPose(p) {
      const readyTorsoX = 0.06;

      let boxPos = [-0.10, 0.83, -0.30];

      if (p < 0.30) {
        // Phase 1: Torso angles forward, waist yaws left to face box
        const s = p / 0.30;
        torso.rotation.x = lerp(readyTorsoX, 0.12, s);
        if (wy) wy.rotation.z = lerp(0, 0.20, s);

        // Arms start wide/retracted and extend to outer walls of box
        // Left arm abducted outward (lsr: 0.22 -> 0.16)
        lsp.rotation.y = lerp(-0.25, -0.68, s);
        if (lsr) lsr.rotation.x = lerp(0.24, 0.16, s);
        if (le) le.rotation.y = lerp(0.60, 0.82, s);
        if (lwp) lwp.rotation.y = -0.18;

        // Right arm abducted outward (rsr: -0.24 -> -0.06)
        rsp.rotation.y = lerp(-0.25, -0.65, s);
        if (rsr) rsr.rotation.x = lerp(-0.24, -0.06, s);
        if (re) re.rotation.y = lerp(0.60, 0.78, s);
        if (rwp) rwp.rotation.y = -0.18;

        const fingerOpen = lerp(0.012, 0.022, s);
        if (rf1 && rf2) { rf1.position.y = fingerOpen; rf2.position.y = -fingerOpen; }
        if (lf1 && lf2) { lf1.position.y = fingerOpen; lf2.position.y = -fingerOpen; }

        boxPos = [-0.10, 0.83, -0.30];
      } else if (p < 0.44) {
        // Phase 2: Dual grippers clamp outer cardboard walls
        const s = (p - 0.30) / 0.14;
        torso.rotation.x = 0.12;
        if (wy) wy.rotation.z = 0.20;

        lsp.rotation.y = -0.68;
        if (lsr) lsr.rotation.x = lerp(0.16, 0.15, s);
        if (le) le.rotation.y = 0.82;
        if (lwp) lwp.rotation.y = -0.18;

        rsp.rotation.y = -0.65;
        if (rsr) rsr.rotation.x = lerp(-0.06, -0.06, s);
        if (re) re.rotation.y = 0.78;
        if (rwp) rwp.rotation.y = -0.18;

        const fingerGrip = lerp(0.022, 0.016, s);
        if (rf1 && rf2) { rf1.position.y = fingerGrip; rf2.position.y = -fingerGrip; }
        if (lf1 && lf2) { lf1.position.y = fingerGrip; lf2.position.y = -fingerGrip; }

        boxPos = [-0.10, 0.83, -0.30];
      } else if (p < 0.73) {
        // Phase 3: Lift box in arc and smoothly swing waist across to target tray
        const s = (p - 0.44) / 0.29;
        const lift = Math.sin(s * Math.PI) * 0.08;

        torso.rotation.x = 0.12;
        if (wy) wy.rotation.z = lerp(0.20, -0.28, s);

        lsp.rotation.y = lerp(-0.68, -0.62, s) - lift * 0.22;
        if (lsr) lsr.rotation.x = lerp(0.15, 0.12, s);
        if (le) le.rotation.y = lerp(0.82, 0.78, s) + lift * 0.18;
        if (lwp) lwp.rotation.y = -0.18;

        rsp.rotation.y = lerp(-0.65, -0.72, s) - lift * 0.22;
        if (rsr) rsr.rotation.x = lerp(-0.06, -0.14, s);
        if (re) re.rotation.y = lerp(0.78, 0.84, s) + lift * 0.18;
        if (rwp) rwp.rotation.y = -0.18;

        const fingerGrip = 0.016;
        if (rf1 && rf2) { rf1.position.y = fingerGrip; rf2.position.y = -fingerGrip; }
        if (lf1 && lf2) { lf1.position.y = fingerGrip; lf2.position.y = -fingerGrip; }

        boxPos = [
          lerp(-0.10, 0.14, s),
          0.83 + lift,
          -0.30
        ];
      } else if (p < 0.86) {
        // Phase 4: Touchdown on target tray & instant release & decisive body retraction
        const s = (p - 0.73) / 0.13;
        torso.rotation.x = lerp(0.12, readyTorsoX, s);
        if (wy) wy.rotation.z = lerp(-0.28, 0, s);

        lsp.rotation.y = lerp(-0.62, 0.05, s);
        if (lsr) lsr.rotation.x = lerp(0.12, 0.24, s);
        if (le) le.rotation.y = lerp(0.78, 0.60, s);
        if (lwp) lwp.rotation.y = lerp(-0.18, -0.10, s);

        rsp.rotation.y = lerp(-0.72, 0.05, s);
        if (rsr) rsr.rotation.x = lerp(-0.14, -0.28, s);
        if (re) re.rotation.y = lerp(0.84, 0.60, s);
        if (rwp) rwp.rotation.y = -0.18;

        const fingerOpen = lerp(0.016, 0.024, Math.min(1, s * 3));
        if (rf1 && rf2) { rf1.position.y = fingerOpen; rf2.position.y = -fingerOpen; }
        if (lf1 && lf2) { lf1.position.y = fingerOpen; lf2.position.y = -fingerOpen; }

        boxPos = [0.14, 0.84, -0.30];
      } else {
        // Phase 5: Poised standby
        const s = (p - 0.86) / 0.14;
        torso.rotation.x = readyTorsoX;
        if (wy) wy.rotation.z = 0;

        lsp.rotation.y = lerp(0.05, -0.20, s);
        if (lsr) lsr.rotation.x = lerp(0.24, 0.20, s);
        if (le) le.rotation.y = lerp(0.60, 0.65, s);
        if (lwp) lwp.rotation.y = -0.10;

        rsp.rotation.y = lerp(0.05, -0.20, s);
        if (rsr) rsr.rotation.x = lerp(-0.28, -0.25, s);
        if (re) re.rotation.y = lerp(0.60, 0.65, s);
        if (rwp) rwp.rotation.y = -0.10;

        boxPos = [0.14, 0.84, -0.30];
      }

      if (boxGroup) {
        boxGroup.position.set(boxPos[0], boxPos[1], boxPos[2]);
        boxGroup.rotation.set(0, 0, 0);
      }
    }

    const testSteps = [];
    for (let p = 0; p <= 1.001; p += 0.01) {
      testSteps.push(Number(p.toFixed(2)));
    }

    const collisions = [];
    for (const step of testSteps) {
      applyPose(step);
      s.updateMatrixWorld(true);

      boxMesh.geometry.computeBoundingBox();
      const boxBB = boxMesh.geometry.boundingBox.clone().applyMatrix4(boxMesh.matrixWorld);

      armMeshNodes.forEach(({ link, mesh }) => {
        mesh.geometry.computeBoundingBox();
        const mBB = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
        if (boxBB.intersectsBox(mBB)) {
          collisions.push({ step, link, mesh: mesh.name });
        }
      });
    }

    return { totalSteps: testSteps.length, collisions };
  });

  console.log(`Checked ${result.totalSteps} steps (0.00 to 1.00 with 0.01 resolution).`);
  console.log(`Total collisions detected: ${result.collisions.length}`);
  if (result.collisions.length > 0) {
    console.log('Collisions:', JSON.stringify(result.collisions.slice(0, 10)));
  } else {
    console.log('PERFECT! ZERO COLLISIONS ACROSS ALL 101 STEPS!');
  }

  await browser.close();
}

main().catch(console.error);
