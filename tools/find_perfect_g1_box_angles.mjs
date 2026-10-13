import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://localhost:3001/';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(() => {
    const s = window.__THREE_SCENE__;
    const lh = s?.getObjectByName('left_dex1_base_link');
    const rh = s?.getObjectByName('right_dex1_base_link');
    const lsp = s?.getObjectByName('left_shoulder_pitch_link');
    const lsr = s?.getObjectByName('left_shoulder_roll_link');
    const le = s?.getObjectByName('left_elbow_link');
    const rsp = s?.getObjectByName('right_shoulder_pitch_link');
    const rsr = s?.getObjectByName('right_shoulder_roll_link');
    const re = s?.getObjectByName('right_elbow_link');
    const wy = s?.getObjectByName('waist_yaw_link');
    const torso = s?.getObjectByName('torso_link');

    function evalPose(cfg) {
      torso.rotation.x = cfg.tx ?? 0.12;
      wy.rotation.z = cfg.wy;
      lsp.rotation.y = cfg.lsp;
      lsr.rotation.x = cfg.lsr;
      le.rotation.y = cfg.le;
      rsp.rotation.y = cfg.rsp;
      rsr.rotation.x = cfg.rsr;
      re.rotation.y = cfg.re;

      lh.updateWorldMatrix(true, false);
      rh.updateWorldMatrix(true, false);
      const eL = lh.matrixWorld.elements;
      const eR = rh.matrixWorld.elements;
      const l = [Number(eL[12].toFixed(3)), Number(eL[13].toFixed(3)), Number(eL[14].toFixed(3))];
      const r = [Number(eR[12].toFixed(3)), Number(eR[13].toFixed(3)), Number(eR[14].toFixed(3))];
      return {
        name: cfg.name,
        l,
        r,
        widthX: Number((r[0] - l[0]).toFixed(3)),
        midX: Number(((l[0] + r[0]) / 2).toFixed(3)),
        midZ: Number(((l[2] + r[2]) / 2).toFixed(3)),
        diffZ: Number((r[2] - l[2]).toFixed(3))
      };
    }

    const testPoses = [];

    // Let's test Grasp at -0.10: target l[0] ≈ -0.22, r[0] ≈ 0.02, both Z ≈ -0.30
    for (const wy of [0.18, 0.22]) {
      for (const lsr of [-0.02, 0.02, 0.06]) {
        for (const rsr of [0.14, 0.18, 0.22]) {
          const res = evalPose({
            name: `Grasp wy=${wy} lsr=${lsr} rsr=${rsr}`,
            wy,
            lsp: -0.74, lsr, le: 0.86,
            rsp: -0.70, rsr, re: 0.82
          });
          if (Math.abs(res.midX - (-0.10)) < 0.03 && Math.abs(res.widthX - 0.26) < 0.04) {
            testPoses.push(res);
          }
        }
      }
    }

    // Let's test Touchdown at tray 0.14: target l[0] ≈ 0.02, r[0] ≈ 0.26, both Z ≈ -0.30
    for (const wy of [-0.22, -0.26, -0.30]) {
      for (const lsr of [-0.14, -0.10, -0.06]) {
        for (const rsr of [0.02, 0.06, 0.10]) {
          const res = evalPose({
            name: `Touchdown wy=${wy} lsr=${lsr} rsr=${rsr}`,
            wy,
            lsp: -0.70, lsr, le: 0.82,
            rsp: -0.76, rsr, re: 0.88
          });
          if (Math.abs(res.midX - 0.14) < 0.03 && Math.abs(res.widthX - 0.26) < 0.04) {
            testPoses.push(res);
          }
        }
      }
    }

    return testPoses;
  });

  console.log('Fitted poses:\n', JSON.stringify(result, null, 2));
  await browser.close();
}

main().catch(console.error);
