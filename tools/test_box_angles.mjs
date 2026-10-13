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

  // Pause playback
  await page.evaluate(() => {
    const playBtn = document.querySelector('button[title*="播放"], button[title*="暂停"]');
    // If playing, pause
  });

  // Test various angles at placement
  const res = await page.evaluate(() => {
    const scene = window.__THREE_SCENE__;
    const leftHand = scene?.getObjectByName('left_dex1_base_link');
    const rightHand = scene?.getObjectByName('right_dex1_base_link');
    const lsp = scene?.getObjectByName('left_shoulder_pitch_link');
    const lsr = scene?.getObjectByName('left_shoulder_roll_link');
    const le = scene?.getObjectByName('left_elbow_link');
    const rsp = scene?.getObjectByName('right_shoulder_pitch_link');
    const rsr = scene?.getObjectByName('right_shoulder_roll_link');
    const re = scene?.getObjectByName('right_elbow_link');
    const wy = scene?.getObjectByName('waist_yaw_link');

    function pos(o) {
      if (!o) return null;
      o.updateWorldMatrix(true, false);
      const e = o.matrixWorld.elements;
      return [Number(e[12].toFixed(3)), Number(e[13].toFixed(3)), Number(e[14].toFixed(3))];
    }

    const configs = [
      {
        desc: 'Current p=0.72 values',
        wy: -0.32,
        lsp: -0.82, lsr: -0.18, le: 0.96,
        rsp: -0.66, rsr: 0.14, re: 0.82
      },
      {
        desc: 'Compensated: right arm reaches forward & wider',
        wy: -0.32,
        lsp: -0.66, lsr: -0.22, le: 0.84,
        rsp: -0.82, rsr: 0.24, re: 0.96
      },
      {
        desc: 'Further tuned for Z=-0.30 alignment and width ~0.22',
        wy: -0.30,
        lsp: -0.64, lsr: -0.24, le: 0.82,
        rsp: -0.84, rsr: 0.26, re: 0.98
      },
      {
        desc: 'Wider roll for clearance',
        wy: -0.28,
        lsp: -0.65, lsr: -0.26, le: 0.84,
        rsp: -0.82, rsr: 0.28, re: 0.96
      }
    ];

    const out = [];
    for (const c of configs) {
      if (wy) wy.rotation.z = c.wy;
      if (lsp) lsp.rotation.y = c.lsp;
      if (lsr) lsr.rotation.x = c.lsr;
      if (le) le.rotation.y = c.le;
      if (rsp) rsp.rotation.y = c.rsp;
      if (rsr) rsr.rotation.x = c.rsr;
      if (re) re.rotation.y = c.re;

      const l = pos(leftHand);
      const r = pos(rightHand);
      out.push({
        desc: c.desc,
        l,
        r,
        widthX: Number((r[0] - l[0]).toFixed(3)),
        diffZ: Number((r[2] - l[2]).toFixed(3)),
        midX: Number(((l[0] + r[0]) / 2).toFixed(3)),
        midZ: Number(((l[2] + r[2]) / 2).toFixed(3))
      });
    }
    return out;
  });

  console.log('Angle tests:\n', JSON.stringify(res, null, 2));
  await browser.close();
}

main().catch(console.error);
