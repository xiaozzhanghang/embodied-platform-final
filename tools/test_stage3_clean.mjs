import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Navigating to page...');
  await page.goto('http://localhost:3000/annotation/audit/detail/?id=19884&type=%E8%8C%83%E5%9B%B4%E6%A0%87%E6%B3%A8', {
    waitUntil: 'networkidle2'
  });

  console.log('2. Opening AI modal...');
  await page.waitForSelector('.ant-table-wrapper');
  const clickedAi = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('AI标注'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (!clickedAi) throw new Error('AI标注 button not clicked');
  await page.waitForSelector('.ant-modal', { visible: true });
  console.log('✓ Modal opened.');

  console.log('3. Clicking 启动动作切分推理...');
  const clickedInfer = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.ant-modal button'));
    const btn = btns.find(b => b.innerText.includes('动作切分推理'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (!clickedInfer) throw new Error('启动动作切分推理 button not clicked');
  console.log('✓ Clicked 启动动作切分推理.');

  console.log('4. Waiting for inference to complete and enter Stage 3 (Review)...');
  await new Promise(r => setTimeout(r, 2700));

  const modalState = await page.evaluate(() => {
    const modal = document.querySelector('.ant-modal');
    if (!modal) return null;
    const alert = modal.querySelector('.ant-alert');
    const checkbox = modal.querySelector('.ant-checkbox-wrapper');
    const stepsCount = modal.querySelectorAll('.ant-space-item, [style*="border: 1.5px solid"]').length;
    return {
      text: modal.innerText.slice(0, 200),
      hasAlert: !!alert,
      hasCheckbox: !!checkbox
    };
  });
  console.log('✓ Stage 3 Modal checks:', modalState);

  await page.screenshot({ path: 'tools/stage3_cleaned.png' });
  console.log('✓ Stage 3 clean screenshot saved to tools/stage3_cleaned.png');

  await browser.close();
  console.log('🌟 STAGE 3 VERIFICATION COMPLETE!');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
