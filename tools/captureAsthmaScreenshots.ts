import { createServer } from 'vite';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots');

  console.log('Khởi động dev server...');
  const server = await createServer({
    server: { port: 5198, host: '127.0.0.1' }
  });
  await server.listen();

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: true
  });

  const baseUrl = 'http://127.0.0.1:5198';

  // 1. Desktop Kế hoạch điều trị
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Mở modal preset bệnh nhân mẫu
  const presetBtn = await page.$('button:has-text("Bệnh nhân mẫu")');
  if (presetBtn) {
    await presetBtn.click();
    await page.waitForTimeout(400);
    const asthmaPreset = await page.$('.preset-card:has-text("Hen"), button:has-text("Hen")');
    if (asthmaPreset) {
      await asthmaPreset.click();
      await page.waitForTimeout(400);
    }
    const closeBtn = await page.$('.modal-content button:has-text("✕")');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // Mở dòng Budesonide/formoterol
  const planRows = await page.$$('.plan-row-header');
  for (const r of planRows) {
    const text = await r.innerText();
    if (text.includes('Budesonide') || text.includes('Formoterol') || text.includes('Track 1')) {
      await r.click();
      break;
    }
  }
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(screenshotsDir, 'asthma_desktop_plan.png') });
  console.log('✓ Đã lưu asthma_desktop_plan.png');

  // 2. Chuyển sang Tab Bằng chứng (Ma trận)
  const tabs = await page.$$('.nav-tabs button, .tab-item');
  for (const t of tabs) {
    const txt = await t.innerText();
    if (txt.includes('Bằng chứng')) {
      await t.click();
      break;
    }
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, 'asthma_desktop_matrix.png') });
  console.log('✓ Đã lưu asthma_desktop_matrix.png');

  // 3. Chuyển sang Tab Lộ trình
  for (const t of tabs) {
    const txt = await t.innerText();
    if (txt.includes('Lộ trình')) {
      await t.click();
      break;
    }
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(screenshotsDir, 'asthma_pathway.png') });
  console.log('✓ Đã lưu asthma_pathway.png');

  await page.close();

  // 4. Mobile Screenshot
  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  await mobilePage.goto(baseUrl, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(600);

  // Chọn tab Phác đồ trên mobile nếu cần
  const mobileTabs = await mobilePage.$$('.mobile-tab-btn, button');
  for (const t of mobileTabs) {
    const txt = await t.innerText();
    if (txt.includes('Phác đồ')) {
      await t.click();
      break;
    }
  }
  await mobilePage.waitForTimeout(400);

  await mobilePage.screenshot({ path: path.join(screenshotsDir, 'asthma_mobile_plan.png') });
  console.log('✓ Đã lưu asthma_mobile_plan.png');

  await mobilePage.close();
  await browser.close();
  await server.close();
  console.log('Hoàn thành toàn bộ screenshots cho asthma!');
}

main().catch(console.error);
