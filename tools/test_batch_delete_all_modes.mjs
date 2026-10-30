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

  // Test 1: Keyboard Delete key on 2 multi-selected steps
  console.log('--- Test 1: Keyboard Delete on 2 multi-selected cards ---');
  let cards = await page.$$('#cards .card .chd');
  await cards[0].click();
  await page.keyboard.down('Shift');
  await cards[1].click();
  await page.keyboard.up('Shift');
  await new Promise(r => setTimeout(r, 200));

  await page.keyboard.press('Delete');
  await new Promise(r => setTimeout(r, 300));
  let count = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  let toast = await page.evaluate(() => document.querySelector('#toast').textContent);
  console.log('Step count after Delete key:', count, '| Toast:', toast);
  if (count !== 1 || !toast.includes('已批量删除 2 个步骤')) {
    throw new Error('Test 1 failed: expected 1 card and toast with 2 deleted');
  }

  // Undo
  console.log('Undoing Test 1...');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyZ');
  await page.keyboard.up('Control');
  await new Promise(r => setTimeout(r, 300));
  count = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  console.log('Restored count:', count);

  // Test 2: Card trash can button on a multi-selected step
  console.log('--- Test 2: Click card 🗑 trash can on a multi-selected step ---');
  cards = await page.$$('#cards .card .chd');
  await cards[0].click();
  await page.keyboard.down('Shift');
  await cards[1].click();
  await page.keyboard.up('Shift');
  await new Promise(r => setTimeout(r, 200));

  // Click trash can on the first card
  const delBtn = await page.$('#cards .card[data-id="1"] [data-act="del"]');
  await delBtn.click();
  await new Promise(r => setTimeout(r, 300));
  count = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  toast = await page.evaluate(() => document.querySelector('#toast').textContent);
  console.log('Step count after card trash click:', count, '| Toast:', toast);
  if (count !== 1 || !toast.includes('已批量删除 2 个步骤')) {
    throw new Error('Test 2 failed');
  }

  // Undo
  console.log('Undoing Test 2 via toast "撤销" link...');
  await page.evaluate(() => {
    const undoLink = document.querySelector('#toast a');
    if (undoLink) undoLink.click();
  });
  await new Promise(r => setTimeout(r, 300));
  count = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  console.log('Restored count after toast undo:', count);

  // Test 3: Context menu on timeline block
  console.log('--- Test 3: Right click context menu on multi-selected timeline block ---');
  cards = await page.$$('#cards .card .chd');
  await cards[0].click();
  await page.keyboard.down('Shift');
  await cards[1].click();
  await page.keyboard.up('Shift');
  await new Promise(r => setTimeout(r, 200));

  // Right-click block 1
  const blk = await page.$('#lanes .blk[data-id="1"]');
  const box = await blk.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
  await new Promise(r => setTimeout(r, 200));

  const ctxDelText = await page.evaluate(() => {
    const ctx = document.querySelector('#ctx');
    const del = ctx ? ctx.querySelector('[data-c="del"]') : null;
    return del ? del.textContent : '';
  });
  console.log('Context menu delete button text:', ctxDelText);
  if (!ctxDelText.includes('批量删除选中的 2 个步骤')) {
    throw new Error('Test 3 failed: context menu label mismatch: ' + ctxDelText);
  }

  // Click the context menu delete button
  await page.evaluate(() => {
    document.querySelector('#ctx [data-c="del"]').click();
  });
  await new Promise(r => setTimeout(r, 300));
  count = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  toast = await page.evaluate(() => document.querySelector('#toast').textContent);
  console.log('Step count after context menu batch delete:', count, '| Toast:', toast);
  if (count !== 1 || !toast.includes('已批量删除 2 个步骤')) {
    throw new Error('Test 3 click failed');
  }

  // Undo back
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyZ');
  await page.keyboard.up('Control');
  await new Promise(r => setTimeout(r, 300));
  count = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  console.log('Restored count after undo:', count);

  // Test 4: Locked step protection
  console.log('--- Test 4: Locked step protection ---');
  // Lock step 1
  await page.evaluate(() => {
    const lockBtn = document.querySelector('#cards .card[data-id="1"] [data-act="lock"]');
    if (lockBtn) lockBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Multi-select step 1 and step 2
  cards = await page.$$('#cards .card .chd');
  await cards[0].click();
  await page.keyboard.down('Shift');
  await cards[1].click();
  await page.keyboard.up('Shift');
  await new Promise(r => setTimeout(r, 200));

  // Try to batch delete
  await page.keyboard.press('Delete');
  await new Promise(r => setTimeout(r, 200));
  count = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
  toast = await page.evaluate(() => document.querySelector('#toast').textContent);
  console.log('Count when attempting to delete locked step:', count, '| Toast:', toast);
  if (count !== 3 || !toast.includes('已锁定')) {
    throw new Error('Test 4 failed: locked step was deleted or wrong warning');
  }

  // Unlock step 1
  await page.evaluate(() => {
    const lockBtn = document.querySelector('#cards .card[data-id="1"] [data-act="lock"]');
    if (lockBtn) lockBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // Take final verified screenshot
  await page.screenshot({ path: '/Users/zhangxiaozhang/.gemini/antigravity-ide/brain/b7123775-e490-4410-9dd3-501c9ea6ca54/batch_delete_fully_verified.png' });

  console.log('Errors logged:', errors);
  await browser.close();
  console.log('ALL BATCH DELETE MODES VERIFIED PERFECTLY!');
})();
