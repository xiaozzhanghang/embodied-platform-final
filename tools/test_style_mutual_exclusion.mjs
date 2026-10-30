import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function run() {
  console.log('--- Testing Style Mutual Exclusion in Workbench ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 960 });

  await page.goto('http://localhost:3000/annotation_workbench_interactive.html', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  await page.waitForSelector('#cards .card', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Verify Structured Mode (default)
  console.log('\n[1] Verifying Structured Mode...');
  const isStructuredClass = await page.evaluate(() => document.body.classList.contains('style-structured'));
  console.log('Body has style-structured:', isStructuredClass);

  const structuredVisibility = await page.evaluate(() => {
    const handSelect = document.querySelector('.card.sel select[data-k="hand"]');
    const skillSelect = document.querySelector('.card.sel select[data-k="skill"]');
    const objInput = document.querySelector('.card.sel input[data-k="obj"]');
    const frmSelect = document.querySelector('.card.sel select[data-k="from"]');
    const fNl = document.querySelector('.card.sel .f-nl');
    const taskNlBar = document.querySelector('.task-nl-bar');
    const vStepTxt = document.querySelector('#vStepTxt');
    const vStepNl = document.querySelector('#vStepNl');
    const tplRow = document.querySelector('#tplRow');
    const title = document.querySelector('.card.sel .ttl').textContent;

    const isVisible = el => el && el.offsetParent !== null && window.getComputedStyle(el).display !== 'none';

    return {
      handVisible: isVisible(handSelect),
      skillVisible: isVisible(skillSelect),
      objVisible: isVisible(objInput),
      frmVisible: isVisible(frmSelect),
      tplRowVisible: isVisible(tplRow),
      fNlVisible: isVisible(fNl),
      taskNlBarVisible: isVisible(taskNlBar),
      vStepTxtVisible: isVisible(vStepTxt),
      vStepNlVisible: isVisible(vStepNl),
      title
    };
  });

  console.log('Structured Mode checks:', structuredVisibility);

  if (!structuredVisibility.handVisible || !structuredVisibility.skillVisible || !structuredVisibility.objVisible) {
    throw new Error('Structured slots should be visible in structured mode!');
  }
  if (structuredVisibility.fNlVisible || structuredVisibility.taskNlBarVisible || structuredVisibility.vStepNlVisible) {
    throw new Error('Natural language elements should be HIDDEN in structured mode!');
  }

  await page.screenshot({ path: '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/b7123775-e490-4410-9dd3-501c9ea6ca54/workbench_style_structured.png' });
  console.log('Saved screenshot: workbench_style_structured.png');

  // 2. Switch to Natural Semantic Mode
  console.log('\n[2] Clicking Natural Semantic mode button...');
  await page.click('#styleSeg button[data-s="natural"]');
  await new Promise(r => setTimeout(r, 600));

  const isNaturalClass = await page.evaluate(() => document.body.classList.contains('style-natural'));
  console.log('Body has style-natural:', isNaturalClass);

  const naturalVisibility = await page.evaluate(() => {
    const handSelect = document.querySelector('.card.sel select[data-k="hand"]');
    const skillSelect = document.querySelector('.card.sel select[data-k="skill"]');
    const objInput = document.querySelector('.card.sel input[data-k="obj"]');
    const frmSelect = document.querySelector('.card.sel select[data-k="from"]');
    const fNl = document.querySelector('.card.sel .f-nl');
    const taskNlBar = document.querySelector('.task-nl-bar');
    const vStepTxt = document.querySelector('#vStepTxt');
    const vStepNl = document.querySelector('#vStepNl');
    const tplRow = document.querySelector('#tplRow');
    const title = document.querySelector('.card.sel .ttl').textContent;

    const isVisible = el => el && el.offsetParent !== null && window.getComputedStyle(el).display !== 'none';

    return {
      handVisible: isVisible(handSelect),
      skillVisible: isVisible(skillSelect),
      objVisible: isVisible(objInput),
      frmVisible: isVisible(frmSelect),
      tplRowVisible: isVisible(tplRow),
      fNlVisible: isVisible(fNl),
      taskNlBarVisible: isVisible(taskNlBar),
      vStepTxtVisible: isVisible(vStepTxt),
      vStepNlVisible: isVisible(vStepNl),
      title
    };
  });

  console.log('Natural Mode checks:', naturalVisibility);

  if (naturalVisibility.handVisible || naturalVisibility.skillVisible || naturalVisibility.objVisible || naturalVisibility.tplRowVisible) {
    throw new Error('Structured elements should be HIDDEN in natural mode!');
  }
  if (!naturalVisibility.fNlVisible || !naturalVisibility.taskNlBarVisible || !naturalVisibility.vStepNlVisible) {
    throw new Error('Natural language elements should be VISIBLE in natural mode!');
  }

  await page.screenshot({ path: '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/b7123775-e490-4410-9dd3-501c9ea6ca54/workbench_style_natural.png' });
  console.log('Saved screenshot: workbench_style_natural.png');

  // 3. Switch back to Structured Mode
  console.log('\n[3] Switching back to Structured Mode...');
  await page.click('#styleSeg button[data-s="structured"]');
  await new Promise(r => setTimeout(r, 600));

  const backStructuredVisibility = await page.evaluate(() => {
    const handSelect = document.querySelector('.card.sel select[data-k="hand"]');
    const fNl = document.querySelector('.card.sel .f-nl');
    const isVisible = el => el && window.getComputedStyle(el).display !== 'none';
    return {
      handVisible: isVisible(handSelect),
      fNlVisible: isVisible(fNl)
    };
  });
  console.log('Switched back to structured checks:', backStructuredVisibility);
  if (!backStructuredVisibility.handVisible || backStructuredVisibility.fNlVisible) {
    throw new Error('Failed to switch back cleanly to structured mode!');
  }

  console.log('\n✅ All mutual exclusion assertions PASSED successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
