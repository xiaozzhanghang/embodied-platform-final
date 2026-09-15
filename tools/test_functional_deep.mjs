import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://192.168.77.51:82';
const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/06bf42b1-87ce-41b9-9c84-c0d187e4aa4e/scratch';

async function testFunctionalDeep() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1680,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1680, height: 1050 });

  const deepBugs = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[PAGE CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('favicon') && !res.url().includes('illustration')) {
      deepBugs.push({
        type: 'API_ERROR_5XX_OR_4XX',
        url: res.url(),
        status: res.status(),
        method: res.request().method(),
        pageUrl: page.url()
      });
    }
  });

  // Login as admin_zhou
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  if (page.url().includes('cas/login')) {
    await page.type('#username', 'admin_zhou');
    await page.type('#password', 'Tqgf002009!');
    await page.click('input[name="submit"], button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  }
  await new Promise(r => setTimeout(r, 2000));

  // ==========================================
  // TEST 1: Template Center (模版中心) -> 新建模版
  // ==========================================
  console.log('\n--- TEST 1: Template Center ---');
  await page.goto(`${BASE_URL}/datacollection/tasktemplate/index`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Find and click "新建模版" button
  const createTplBtn = await page.$('button.ant-btn-primary, button');
  const btnHandles = await page.$$('button');
  for (const bh of btnHandles) {
    const txt = await (await bh.getProperty('innerText')).jsonValue();
    if (txt && txt.includes('新建模版')) {
      console.log('Clicking 新建模版...');
      await bh.click();
      await new Promise(r => setTimeout(r, 2000));
      break;
    }
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'func_01_template_modal.png') });

  // Inspect modal fields on online server
  const modalFields = await page.evaluate(() => {
    const modal = document.querySelector('.ant-modal, .vxe-modal--box');
    if (!modal) return { hasModal: false };
    const labels = Array.from(modal.querySelectorAll('.ant-form-item-label, label')).map(l => l.innerText.trim());
    const inputs = Array.from(modal.querySelectorAll('input, textarea, select, .ant-select')).map(i => ({
      placeholder: i.getAttribute('placeholder') || '',
      className: i.className
    }));
    return { hasModal: true, labels, inputs, modalText: modal.innerText };
  });
  console.log('Template Modal Structure on Online Server:', JSON.stringify(modalFields, null, 2));

  // ==========================================
  // TEST 2: Data Collection Tasks (数据采集) -> 创建任务
  // ==========================================
  console.log('\n--- TEST 2: Data Collection Tasks ---');
  await page.goto(`${BASE_URL}/datacollection/taskcenter/index`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  for (const bh of await page.$$('button')) {
    const txt = await (await bh.getProperty('innerText')).jsonValue();
    if (txt && txt.includes('创建任务')) {
      console.log('Clicking 创建任务...');
      await bh.click();
      await new Promise(r => setTimeout(r, 2000));
      break;
    }
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'func_02_task_create_modal.png') });

  const taskModalFields = await page.evaluate(() => {
    const modal = document.querySelector('.ant-modal, .vxe-modal--box');
    if (!modal) return { hasModal: false };
    return { hasModal: true, text: modal.innerText };
  });
  console.log('Task Create Modal on Online Server:', JSON.stringify(taskModalFields, null, 2));

  // ==========================================
  // TEST 3: Quality Inspection (数据质检)
  // ==========================================
  console.log('\n--- TEST 3: Quality Inspection ---');
  await page.goto(`${BASE_URL}/datacollection/qualityinspection/index`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'func_03_quality_inspection.png') });

  const qiTable = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('th, .vxe-header--column')).map(th => th.innerText.trim()).filter(Boolean);
    const firstRow = Array.from(document.querySelectorAll('tbody tr, .vxe-body--row'))[0]?.innerText || '';
    return { headers, firstRow };
  });
  console.log('QI Table:', JSON.stringify(qiTable, null, 2));

  // ==========================================
  // TEST 4: Annotation (数据标注 / 标注工作台)
  // ==========================================
  console.log('\n--- TEST 4: Annotation ---');
  await page.goto(`${BASE_URL}/datacollection/taskcenter/annoationIndex`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'func_04_annotation_tasks.png') });

  await page.goto(`${BASE_URL}/datacollection/annotation/index`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'func_05_annotation_workbench.png') });

  // ==========================================
  // TEST 5: Review (数据审核)
  // ==========================================
  console.log('\n--- TEST 5: Review ---');
  await page.goto(`${BASE_URL}/datacollection/review/index`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'func_06_review_page.png') });

  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'deep_bugs.json'), JSON.stringify(deepBugs, null, 2));

  await browser.close();
  console.log('\n--- FUNCTIONAL DEEP TEST COMPLETE ---');
}

testFunctionalDeep();
