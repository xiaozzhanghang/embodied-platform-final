import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://192.168.77.51:82';
const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/06bf42b1-87ce-41b9-9c84-c0d187e4aa4e/scratch';

const ACCOUNTS = [
  { role: '管理员', username: 'admin_zhou', password: 'Tqgf002009!' },
  { role: '质检员', username: 'qc_zhao', password: 'Tqgf002009!' },
  { role: '标注员', username: 'annotator_chen', password: 'Tqgf002009!' },
  { role: '审核员', username: 'reviewer_gu', password: 'Tqgf002009!' }
];

async function loginUser(page, username, password) {
  console.log(`\n=== Logging in as ${username} ===`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  if (page.url().includes('cas/login')) {
    const userInp = await page.$('#username, input[name="username"]');
    if (userInp) {
      await userInp.click({ clickCount: 3 });
      await userInp.type(username);
    }
    const pwdInp = await page.$('#password, input[name="password"]');
    if (pwdInp) {
      await pwdInp.click({ clickCount: 3 });
      await pwdInp.type(password);
    }
    const loginBtn = await page.$('input[name="submit"], button[type="submit"], .btn-submit');
    if (loginBtn) {
      await loginBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.log(`Logged in URL for ${username}:`, page.url());
}

async function runDeepSuite() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1680,1050']
  });

  const testReport = {
    accounts: {},
    discoveredMenus: {},
    networkErrors: [],
    consoleErrors: [],
    bugs: []
  };

  const page = await browser.newPage();
  await page.setViewport({ width: 1680, height: 1050 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      testReport.consoleErrors.push({ url: page.url(), error: msg.text() });
    }
  });

  page.on('response', res => {
    if (res.status() >= 400) {
      testReport.networkErrors.push({
        url: res.url(),
        status: res.status(),
        pageUrl: page.url()
      });
    }
  });

  try {
    // 1. Test Admin Account
    await loginUser(page, 'admin_zhou', 'Tqgf002009!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'admin_home.png') });

    // Extract menus for admin
    const adminMenus = await page.$$eval('.ant-menu-item, .ant-menu-submenu-title, a[href*="/"]', els => 
      els.map(el => ({ text: el.innerText.trim(), href: el.getAttribute('href') || '' })).filter(m => m.text)
    );
    testReport.discoveredMenus['admin_zhou'] = adminMenus;
    console.log('Admin Menus:', adminMenus.map(m => m.text).join(' | '));

    // Explore routes
    const routesToTest = [
      '/datacollection/tasktemplate/index',
      '/datacollection/task/index',
      '/datacollection/qualityinspection/index',
      '/datacollection/annotation/index',
      '/datacollection/audit/index',
      '/datacollection/device/index',
      '/datacollection/taskbook/index'
    ];

    for (const route of routesToTest) {
      console.log(`\nNavigating to ${BASE_URL}${route}`);
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        const routeName = route.replace(/\//g, '_');
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, `admin${routeName}.png`) });
        console.log(`Rendered ${route}, title:`, await page.title());

        // Check if there are buttons like 新建, 添加
        const buttons = await page.$$eval('button, .ant-btn', els => els.map(b => b.innerText.trim()).filter(Boolean));
        console.log(`Buttons on ${route}:`, buttons.join(', '));

        // If on tasktemplate, test clicking 新建
        if (route.includes('tasktemplate')) {
          const createBtn = await page.$('button.ant-btn-primary, button:has-text("新建"), button:has-text("添加")');
          if (createBtn) {
            console.log('Clicking create button on tasktemplate...');
            await createBtn.click();
            await new Promise(r => setTimeout(r, 1500));
            await page.screenshot({ path: path.join(ARTIFACTS_DIR, `admin_tasktemplate_create_modal.png`) });
          }
        }
      } catch (e) {
        console.error(`Error loading ${route}:`, e.message);
      }
    }

    // 2. Test QC Account
    // Logout first or clear cookies
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    await loginUser(page, 'qc_zhao', 'Tqgf002009!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'qc_home.png') });
    const qcMenus = await page.$$eval('.ant-menu-item, .ant-menu-submenu-title', els => els.map(e => e.innerText.trim()).filter(Boolean));
    testReport.discoveredMenus['qc_zhao'] = qcMenus;
    console.log('QC Menus:', qcMenus.join(' | '));

    // 3. Test Annotator Account
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    await loginUser(page, 'annotator_chen', 'Tqgf002009!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'annotator_home.png') });
    const annoMenus = await page.$$eval('.ant-menu-item, .ant-menu-submenu-title', els => els.map(e => e.innerText.trim()).filter(Boolean));
    testReport.discoveredMenus['annotator_chen'] = annoMenus;
    console.log('Annotator Menus:', annoMenus.join(' | '));

    // 4. Test Reviewer Account
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');

    await loginUser(page, 'reviewer_gu', 'Tqgf002009!');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'reviewer_home.png') });
    const revMenus = await page.$$eval('.ant-menu-item, .ant-menu-submenu-title', els => els.map(e => e.innerText.trim()).filter(Boolean));
    testReport.discoveredMenus['reviewer_gu'] = revMenus;
    console.log('Reviewer Menus:', revMenus.join(' | '));

    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'e2e_test_report.json'), JSON.stringify(testReport, null, 2));
    console.log('\n=== SUITE COMPLETE ===');

  } catch (err) {
    console.error('Suite error:', err);
  } finally {
    await browser.close();
  }
}

runDeepSuite();
