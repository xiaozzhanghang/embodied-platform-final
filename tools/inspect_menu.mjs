import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://192.168.77.51:82';
const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/06bf42b1-87ce-41b9-9c84-c0d187e4aa4e/scratch';

async function inspectMenu() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1680,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1680, height: 1050 });

  // Login as admin_zhou
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  if (page.url().includes('cas/login')) {
    await page.type('#username', 'admin_zhou');
    await page.type('#password', 'Tqgf002009!');
    await page.click('input[name="submit"], button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  }
  await new Promise(r => setTimeout(r, 2000));

  // Inspect sidebar / navigation
  const menuInfo = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.innerText && (el.className.includes('menu') || el.className.includes('nav') || el.className.includes('sidebar') || el.className.includes('layout-sider'))) {
        // Collect links
        const links = el.querySelectorAll('a, div, span, li');
        links.forEach(l => {
          const txt = l.innerText?.trim();
          if (txt && txt.length < 30 && !items.includes(txt)) {
            items.push(txt);
          }
        });
      }
    });
    return items;
  });

  console.log('Extracted Nav Text elements:', menuInfo);

  // Take full page screenshot
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_full_dashboard.png'), fullPage: true });

  // Let's test the "新建模版" button on /datacollection/tasktemplate/index
  console.log('Going to template center...');
  await page.goto(`${BASE_URL}/datacollection/tasktemplate/index`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Find buttons
  const btns = await page.$$('button');
  for (const b of btns) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    console.log('Button found on template center:', text);
    if (text && text.includes('新建模版')) {
      console.log('Clicking 新建模版 button...');
      await b.click();
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'template_create_modal_opened.png') });
      break;
    }
  }

  // Let's check modal contents if opened
  const modalText = await page.evaluate(() => {
    const modal = document.querySelector('.ant-modal, .vxe-modal--box, .modal');
    return modal ? modal.innerText : 'NO_MODAL';
  });
  console.log('Modal Text Content:\n', modalText);

  await browser.close();
}

inspectMenu();
