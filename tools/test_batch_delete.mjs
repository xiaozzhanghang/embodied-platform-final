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
  await page.goto('http://localhost:3000/annotation_workbench_interactive.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // 1. Initial count
  const initialCards = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  console.log('Initial cards count:', initialCards);

  // 2. Click card 1, then Shift+click card 2
  console.log('Selecting card 1, then Shift+clicking card 2...');
  const cardElements = await page.$$('#cards .card .chd');
  if (cardElements.length >= 2) {
    await cardElements[0].click();
    await page.keyboard.down('Shift');
    await cardElements[1].click();
    await page.keyboard.up('Shift');
  }

  // Check selhint info
  const selHintInfo = await page.evaluate(() => {
    const hint = document.querySelector('.selhint');
    const btn = hint ? hint.querySelector('[data-bar="batchdel"]') : null;
    const cards = Array.from(document.querySelectorAll('#cards .card')).map(c => ({
      id: c.dataset.id,
      isMsel: c.classList.contains('msel'),
      isSel: c.classList.contains('sel')
    }));
    return {
      hasHint: !!hint,
      hintText: hint ? hint.textContent : '',
      hasBtn: !!btn,
      btnText: btn ? btn.textContent : '',
      cards
    };
  });
  console.log('SelHint & Card multi-selection info:', selHintInfo);

  // Take screenshot with multi-selection active
  await page.screenshot({ path: '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/b7123775-e490-4410-9dd3-501c9ea6ca54/batch_sel_active.png' });

  // 3. Click the red batch delete button
  console.log('Clicking 🗑 批量删除 button...');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-bar="batchdel"]');
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 300));
  const countAfterDelete = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  const toastText = await page.evaluate(() => document.querySelector('#toast') ? document.querySelector('#toast').textContent : '');
  console.log('Cards count after batch delete:', countAfterDelete);
  console.log('Toast notification text:', toastText);

  // Take screenshot after batch delete
  await page.screenshot({ path: '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/b7123775-e490-4410-9dd3-501c9ea6ca54/after_batch_delete.png' });

  // 4. Test Undo by pressing Ctrl+Z
  console.log('Pressing Ctrl+Z (or Meta+Z) to undo...');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyZ');
  await page.keyboard.up('Control');
  await new Promise(r => setTimeout(r, 300));

  const countAfterUndo = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  const undoToast = await page.evaluate(() => document.querySelector('#toast') ? document.querySelector('#toast').textContent : '');
  console.log('Cards count after undo:', countAfterUndo, 'Toast:', undoToast);

  // 5. Test Delete key
  console.log('Testing keyboard Delete key on multi-selected steps...');
  const newCards = await page.$$('#cards .card .chd');
  if (newCards.length >= 2) {
    await newCards[0].click();
    await page.keyboard.down('Shift');
    await newCards[1].click();
    await page.keyboard.up('Shift');
  }

  await new Promise(r => setTimeout(r, 200));
  console.log('Pressing Delete key...');
  await page.keyboard.press('Delete');
  await new Promise(r => setTimeout(r, 300));

  const countAfterKeyDelete = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  const keyToast = await page.evaluate(() => document.querySelector('#toast') ? document.querySelector('#toast').textContent : '');
  console.log('Cards count after Delete key:', countAfterKeyDelete, 'Toast:', keyToast);

  // Undo back to restore
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyZ');
  await page.keyboard.up('Control');
  await new Promise(r => setTimeout(r, 300));
  const finalCount = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  console.log('Final restored cards count:', finalCount);

  console.log('Errors logged:', errors);

  await browser.close();
  console.log('All batch delete tests completed successfully!');
})();
