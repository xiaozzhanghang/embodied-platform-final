import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://192.168.77.51:82';
const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/06bf42b1-87ce-41b9-9c84-c0d187e4aa4e/scratch';

async function testAllMenus() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1680,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1680, height: 1050 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({ type: 'CONSOLE_ERROR', url: page.url(), text: msg.text() });
    }
  });

  page.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      errors.push({ type: 'HTTP_ERROR', status: res.status(), url: res.url(), pageUrl: page.url() });
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

  // Get all menu items in sidebar
  const menuLinks = await page.evaluate(() => {
    const results = [];
    const elements = document.querySelectorAll('.ant-menu-item, .ant-menu-submenu-title');
    elements.forEach(el => {
      const text = el.innerText?.trim();
      const parent = el.closest('.ant-menu-submenu')?.querySelector('.ant-menu-submenu-title')?.innerText?.trim() || 'ROOT';
      if (text) {
        results.push({ text, parent });
      }
    });
    return results;
  });

  console.log('Discovered Menu Items:', JSON.stringify(menuLinks, null, 2));

  // Let's test each critical sub-menu under 任务管理
  const targetMenus = ['数据采集', '数据质检', '数据标注', '数据审核', '标注工作台', '模板中心', '任务书', '采集工作台', '设备列表', '设备类型', '物体库', '高质量数据集', '数据资产目录'];

  const results = [];

  for (const menuName of targetMenus) {
    console.log(`\nTesting click on menu: [${menuName}]`);
    try {
      // Find element containing this text
      const clicked = await page.evaluate((name) => {
        const items = Array.from(document.querySelectorAll('.ant-menu-item, .ant-menu-title-content, span, a'));
        const found = items.find(el => el.innerText?.trim() === name);
        if (found) {
          found.click();
          return true;
        }
        return false;
      }, menuName);

      await new Promise(r => setTimeout(r, 3000));
      const currentUrl = page.url();
      const title = await page.title();
      const isErrorPage = title.includes('Error') || (await page.$('.ant-result-404, .ant-result-500, .ant-result-403')) !== null;

      const pageButtons = await page.$$eval('button, .ant-btn', btns => btns.map(b => b.innerText.trim()).filter(Boolean));

      results.push({
        menu: menuName,
        url: currentUrl,
        title: title,
        isErrorPage: isErrorPage,
        buttons: pageButtons
      });

      console.log(`Result for [${menuName}]: URL=${currentUrl}, Title=${title}, isError=${isErrorPage}`);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, `menu_${menuName}.png`) });

    } catch (e) {
      console.error(`Error clicking menu [${menuName}]:`, e.message);
    }
  }

  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'menu_test_results.json'), JSON.stringify({ results, errors }, null, 2));
  console.log('\nMenu testing completed. Errors captured:', errors.length);

  await browser.close();
}

testAllMenus();
