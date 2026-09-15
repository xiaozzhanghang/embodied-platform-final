import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://192.168.77.51:82';
const ARTIFACTS_DIR = '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/06bf42b1-87ce-41b9-9c84-c0d187e4aa4e/scratch';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function runTest() {
  console.log('--- STARTING E2E TEST ON', BASE_URL, '---');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  try {
    console.log('Navigating to', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, '01_login_page.png') });
    console.log('Saved 01_login_page.png');

    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    console.log('Current URL:', page.url());

    // Inspect inputs on login page
    const inputs = await page.$$eval('input', els => els.map(el => ({
      name: el.name,
      type: el.type,
      placeholder: el.placeholder,
      id: el.id,
      className: el.className
    })));
    console.log('Found Inputs on login page:', JSON.stringify(inputs, null, 2));

    // Try to login with admin_zhou
    console.log('Attempting login as admin_zhou...');
    
    // Find username input
    const usernameInput = await page.$('input[placeholder*="账号"], input[placeholder*="用户名"], input[type="text"]');
    if (usernameInput) {
      await usernameInput.click({ clickCount: 3 });
      await usernameInput.type('admin_zhou');
    }

    // Find password input
    const passwordInput = await page.$('input[placeholder*="密码"], input[type="password"]');
    if (passwordInput) {
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type('Tqgf002009!');
    }

    // Check if captcha input exists
    const captchaInput = await page.$('input[placeholder*="验证码"]');
    const captchaImg = await page.$('img[src*="randomImage"], img[src*="captcha"], .captcha-img');
    
    if (captchaImg) {
      console.log('Captcha image found! Taking screenshot of captcha...');
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, '02_login_captcha.png') });
    }

    // Click Login Button
    const loginButton = await page.$('button[type="submit"], button.ant-btn-primary, .login-button');
    if (loginButton) {
      console.log('Clicking login button...');
      await loginButton.click();
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, '03_after_login_attempt.png') });
    }

    console.log('URL after login attempt:', page.url());
    console.log('Console Errors:', consoleErrors);

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
    console.log('--- TEST FINISHED ---');
  }
}

runTest();
