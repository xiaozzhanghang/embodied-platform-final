import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = 'http://localhost:3001/';
const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/093a00b4-c00e-48d5-9b19-920b1183a829';

async function verifyWorkstations() {
  console.log('Testing BiGym Platform workstations at:', TARGET_URL);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const errors = [];
  page.on('pageerror', err => errors.push(err.toString()));

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Page loaded, waiting 3s...');
    await new Promise(r => setTimeout(r, 3000));

    // 1. Default (pick_box)
    const ssPickBox = path.join(ARTIFACTS_DIR, 'verify_01_pick_box.png');
    await page.screenshot({ path: ssPickBox });
    console.log('Screenshot 1 (pick_box):', ssPickBox);

    // 2. Switch to reach_target_single
    await page.evaluate(() => {
      const el = document.getElementById('task-item-reach_target_single');
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    const ssReach = path.join(ARTIFACTS_DIR, 'verify_02_reach_target.png');
    await page.screenshot({ path: ssReach });
    console.log('Screenshot 2 (reach_target):', ssReach);

    // 3. Switch to move_plate
    await page.evaluate(() => {
      const el = document.getElementById('task-item-move_plate');
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    const ssMovePlate = path.join(ARTIFACTS_DIR, 'verify_03_move_plate.png');
    await page.screenshot({ path: ssMovePlate });
    console.log('Screenshot 3 (move_plate):', ssMovePlate);

    // 4. Switch to drawer_top_open
    await page.evaluate(() => {
      const el = document.getElementById('task-item-drawer_top_open');
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    const ssDrawer = path.join(ARTIFACTS_DIR, 'verify_04_drawer_open.png');
    await page.screenshot({ path: ssDrawer });
    console.log('Screenshot 4 (drawer_top_open):', ssDrawer);

    // 5. Switch to wall_cupboard_open
    await page.evaluate(() => {
      const el = document.getElementById('task-item-wall_cupboard_open');
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    const ssCupboard = path.join(ARTIFACTS_DIR, 'verify_05_wall_cupboard.png');
    await page.screenshot({ path: ssCupboard });
    console.log('Screenshot 5 (wall_cupboard_open):', ssCupboard);

    // 6. Switch to flip_cutlery
    await page.evaluate(() => {
      const el = document.getElementById('task-item-flip_cutlery');
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    const ssCutlery = path.join(ARTIFACTS_DIR, 'verify_06_flip_cutlery.png');
    await page.screenshot({ path: ssCutlery });
    console.log('Screenshot 6 (flip_cutlery):', ssCutlery);

    // 7. Switch to sandwich_remove
    await page.evaluate(() => {
      const el = document.getElementById('task-item-sandwich_remove');
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    const ssSandwich = path.join(ARTIFACTS_DIR, 'verify_07_sandwich_remove.png');
    await page.screenshot({ path: ssSandwich });
    console.log('Screenshot 7 (sandwich_remove):', ssSandwich);

    console.log('Workstation verification completed successfully!');
    console.log('Errors:', errors);

  } catch (e) {
    console.error('Test execution error:', e);
  } finally {
    await browser.close();
  }
}

verifyWorkstations();
