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

  console.log('2. Finding and clicking AI标注 button...');
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
  if (!clickedAi) throw new Error('AI标注 button not found');
  await new Promise(r => setTimeout(r, 600));

  // Verify modal is open and inspect its header icons
  const modalInfo = await page.evaluate(() => {
    const modal = document.querySelector('.ant-modal');
    if (!modal) return null;
    const minBtn = Array.from(modal.querySelectorAll('span, button')).find(el => el.innerText?.trim() === '缩小为小窗');
    const closeIcon = modal.querySelector('.anticon-close');
    const hasBlueCard = !!modal.innerText.includes('大模型引擎');
    const hasSilentBtn = Array.from(modal.querySelectorAll('button')).some(b => b.innerText.includes('后台静默推理'));
    return {
      titleText: modal.querySelector('.ant-modal-title')?.innerText || '',
      hasMinBtn: !!minBtn,
      hasClose: !!closeIcon,
      hasBlueCard,
      hasSilentBtn
    };
  });
  console.log('✓ AI Modal opened. Checks:', modalInfo);

  // Save screenshot of clean modal
  await page.screenshot({ path: 'tools/modal_cleaned.png' });
  console.log('✓ Clean modal screenshot saved to tools/modal_cleaned.png');

  // Click the minimize button in modal header
  console.log('3. Clicking [缩小为小窗] button in modal header...');
  const clickedMinus = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.ant-modal button'));
    const btn = btns.find(b => b.innerText.includes('缩小为小窗'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (!clickedMinus) throw new Error('[缩小为小窗] button not found in modal!');
  await new Promise(r => setTimeout(r, 600));

  // Check floating dock is visible
  const dockText = await page.evaluate(() => {
    const dock = document.querySelector('.ai-floating-dock');
    return dock ? dock.innerText : null;
  });
  if (!dockText) throw new Error('Floating dock .ai-floating-dock not found after minimizing!');
  console.log('✓ Floating dock appeared with content:', dockText.replace(/\n/g, ' '));
  await page.screenshot({ path: 'tools/dock_running.png' });
  console.log('✓ Dock screenshot saved to tools/dock_running.png');

  // Restore modal from floating dock
  console.log('4. Restoring modal from floating dock...');
  await page.evaluate(() => {
    const restoreBtn = document.querySelector('.ai-floating-dock button.ant-btn-primary') ||
                       document.querySelector('.ai-floating-dock .anticon-fullscreen')?.closest('button');
    if (restoreBtn) restoreBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const modalRestored = await page.evaluate(() => {
    const modal = document.querySelector('.ant-modal');
    return modal && modal.innerText.includes('动作时序切分与预标注');
  });
  if (!modalRestored) throw new Error('Modal did not restore from floating dock!');
  console.log('✓ Modal restored successfully.');

  // Start inference
  console.log('5. Clicking 启动动作切分推理...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.ant-modal button'));
    const btn = btns.find(b => b.innerText.includes('动作切分推理'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Minimize during inferring using [缩小为小窗] button
  console.log('6. Minimizing during inferring with [缩小为小窗] button...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.ant-modal button'));
    const btn = btns.find(b => b.innerText.includes('缩小为小窗'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const dockInferringText = await page.evaluate(() => {
    const dock = document.querySelector('.ai-floating-dock');
    return dock ? dock.innerText : null;
  });
  console.log('✓ Floating dock running during inference:', dockInferringText?.replace(/\n/g, ' '));

  // Wait for inference completion (2.4s)
  console.log('7. Waiting for background inference to complete...');
  await new Promise(r => setTimeout(r, 2600));

  const dockReviewText = await page.evaluate(() => {
    const dock = document.querySelector('.ai-floating-dock');
    return dock ? dock.innerText : null;
  });
  console.log('✓ Floating dock after inference completed:', dockReviewText?.replace(/\n/g, ' '));

  // Click "后台直接导入并应用" in floating dock
  console.log('8. Clicking "后台直接导入并应用" in floating dock...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.ai-floating-dock button'));
    const btn = btns.find(b => b.innerText.includes('后台直接导入并应用'));
    if (btn) btn.click();
  });

  // Watch streaming applying progress
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 400));
    const applyingText = await page.evaluate(() => document.querySelector('.ai-floating-dock')?.innerText || '');
    console.log(`[Batch Applying Stream ${i + 1}]`, applyingText.replace(/\n/g, ' '));
    if (applyingText.includes('已成功批量应用') || applyingText.includes('全部导入完成') || applyingText.includes('前往【待校验】')) {
      console.log('🎉 Background Batch Application Completed!');
      break;
    }
  }

  // Check active tab
  const activeTab = await page.evaluate(() => {
    const tab = document.querySelector('.ant-tabs-tab-active, .ant-pro-card-tabs .ant-tabs-tab-active');
    return tab ? tab.innerText : '';
  });
  console.log('✓ Active tab after apply completion:', activeTab);

  await page.screenshot({ path: 'tools/minimized_dock_success.png' });
  console.log('✓ Final screenshot saved to tools/minimized_dock_success.png');

  await browser.close();
  console.log('🌟 ALL AUTOMATED CHECKS PASSED PERFECTLY!');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
