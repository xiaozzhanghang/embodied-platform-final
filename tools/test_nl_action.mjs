import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to annotation workbench...');
  await page.goto('http://localhost:3000/annotation_workbench_interactive.html', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Verify task-level goal bar
  const taskGoal = await page.evaluate(() => {
    const el = document.querySelector('#taskGoalTxt');
    return el ? el.textContent.trim() : null;
  });
  console.log('Task Goal Text:', taskGoal);
  if (!taskGoal || !taskGoal.includes('乐事薯片')) {
    throw new Error('Task goal text missing or incorrect: ' + taskGoal);
  }

  // 2. Verify step 1 natural semantic action in expanded card
  const step1Nl = await page.evaluate(() => {
    const card = document.querySelector('.card.sel');
    const ta = card ? card.querySelector('textarea[data-k="nl"]') : null;
    return ta ? ta.value : null;
  });
  console.log('Step 1 NL Action in card:', step1Nl);
  if (!step1Nl || !step1Nl.includes('抓取')) {
    throw new Error('Step 1 NL text missing: ' + step1Nl);
  }

  // 3. Verify step 2 natural semantic badge in collapsed card
  const step2NlBadge = await page.evaluate(() => {
    const card = document.querySelector('.card[data-id="2"]');
    const nlSum = card ? card.querySelector('.nl-sum') : null;
    return nlSum ? nlSum.textContent.trim() : null;
  });
  console.log('Step 2 NL Badge in collapsed card:', step2NlBadge);
  if (!step2NlBadge || !step2NlBadge.includes('放置')) {
    throw new Error('Step 2 NL summary missing: ' + step2NlBadge);
  }

  // 4. Verify video subtitle HUD overlay
  const videoSub1 = await page.evaluate(() => {
    const el = document.querySelector('#vStepNl');
    return el ? { text: el.textContent, display: el.style.display } : null;
  });
  console.log('Video subtitle at frame 0:', videoSub1);
  if (!videoSub1 || !videoSub1.text.includes('抓取')) {
    throw new Error('Video subtitle missing at frame 0');
  }

  // Scrub to frame 500 (step 2: Place)
  await page.evaluate(() => {
    window.seek(500);
  });
  await new Promise(r => setTimeout(r, 300));
  const videoSub2 = await page.evaluate(() => {
    const el = document.querySelector('#vStepNl');
    return el ? { text: el.textContent, display: el.style.display } : null;
  });
  console.log('Video subtitle at frame 500:', videoSub2);
  if (!videoSub2 || !videoSub2.text.includes('放置')) {
    throw new Error('Video subtitle did not update to step 2 at frame 500');
  }

  // 5. Test "⚡️ 依据要素生成" button
  console.log('Testing auto-generate button after changing object...');
  await page.evaluate(() => {
    window.seek(0);
    window.selectStep(1, false);
    // Change object to 合味道泡面
    const objInput = document.querySelector('.card.sel input[data-k="obj"]');
    if (objInput) {
      objInput.value = '合味道泡面';
      objInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 300));

  const afterChangeNl = await page.evaluate(() => {
    const ta = document.querySelector('.card.sel textarea[data-k="nl"]');
    return ta ? ta.value : '';
  });
  console.log('Auto-updated NL Action after object change:', afterChangeNl);
  if (!afterChangeNl.includes('合味道泡面')) {
    throw new Error('NL text failed to auto-update with object change');
  }

  // 6. Test Quick Chip Click
  console.log('Testing quick chip click...');
  await page.evaluate(() => {
    const chip = document.querySelector('.card.sel [data-chip="平稳放置"]');
    if (chip) chip.click();
  });
  await new Promise(r => setTimeout(r, 200));

  const afterChipNl = await page.evaluate(() => {
    const ta = document.querySelector('.card.sel textarea[data-k="nl"]');
    return ta ? ta.value : '';
  });
  console.log('NL Action after chip click:', afterChipNl);
  if (!afterChipNl.includes('平稳放置')) {
    throw new Error('Quick chip failed to append text');
  }

  // Take screenshot of the card and video HUD
  await page.screenshot({ path: '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/b7123775-e490-4410-9dd3-501c9ea6ca54/nl_action_annotated.png' });

  // 7. Test task-level goal editing
  console.log('Testing task goal modal editing...');
  await page.evaluate(() => {
    const btn = document.querySelector('#btnEditGoal');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  await page.evaluate(() => {
    const inEl = document.querySelector('#goalIn');
    if (inEl) inEl.value = '从货架抓取合味道泡面并转移至购物车';
    const okBtn = document.querySelector('#goalOk');
    if (okBtn) okBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  const updatedGoal = await page.evaluate(() => document.querySelector('#taskGoalTxt').textContent.trim());
  console.log('Updated Task Goal:', updatedGoal);
  if (updatedGoal !== '从货架抓取合味道泡面并转移至购物车') {
    throw new Error('Task goal did not update');
  }

  console.log('Errors logged:', errors);
  await browser.close();
  console.log('NATURAL SEMANTIC ACTION ANNOTATION VERIFIED PERFECTLY!');
})();
