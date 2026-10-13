import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://localhost:3001/';
const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/093a00b4-c00e-48d5-9b19-920b1183a829';

async function testBiGymPlatform() {
  console.log('Testing BiGym Platform at:', TARGET_URL);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const consoleLogs = [];
  const errors = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.toString()));

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Page loaded, waiting 4s for 3D shaders and MuJoCo WS...');
    await new Promise(r => setTimeout(r, 4000));

    // Screenshot 1: Default overview (reach_target_multi_modal MVP)
    const ss1 = path.join(ARTIFACTS_DIR, '01_mvp_reach_target.png');
    await page.screenshot({ path: ss1 });
    console.log('Saved Screenshot 1:', ss1);

    // Switch to drawer_top_open
    console.log('Clicking drawer_top_open task...');
    const drawerTaskEl = await page.evaluate(() => {
      const el = document.getElementById('task-item-drawer_top_open');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.click();
        return true;
      }
      return false;
    });
    console.log('drawer_top_open clicked:', drawerTaskEl);
    await new Promise(r => setTimeout(r, 2500));

    const ss2 = path.join(ARTIFACTS_DIR, '02_mvp_drawer_open.png');
    await page.screenshot({ path: ss2 });
    console.log('Saved Screenshot 2:', ss2);

    // Switch to pick_box
    console.log('Clicking pick_box task...');
    const pickBoxEl = await page.evaluate(() => {
      const el = document.getElementById('task-item-pick_box');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.click();
        return true;
      }
      return false;
    });
    console.log('pick_box clicked:', pickBoxEl);
    await new Promise(r => setTimeout(r, 2500));

    // Switch to Physical Simulation Mode (Mode B)
    console.log('Switching to Mode B (Physical Simulation Mode)...');
    const modeSwitched = await page.evaluate(() => {
      const simBtn = document.getElementById('mode-switch-sim-btn');
      if (simBtn) {
        simBtn.click();
        return true;
      }
      return false;
    });
    console.log('Mode B button clicked:', modeSwitched);
    await new Promise(r => setTimeout(r, 2500));

    const ss3 = path.join(ARTIFACTS_DIR, '03_mvp_pick_box_sim_mode.png');
    await page.screenshot({ path: ss3 });
    console.log('Saved Screenshot 3:', ss3);

    console.log('--- TEST RESULTS ---');
    console.log('Total Console Messages:', consoleLogs.length);
    console.log('Errors:', errors);

  } catch (e) {
    console.error('Test execution error:', e);
  } finally {
    await browser.close();
    console.log('Browser closed. Done!');
  }
}

testBiGymPlatform();
