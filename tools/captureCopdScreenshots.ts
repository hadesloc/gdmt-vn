import { createServer } from 'vite';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Đang khởi động Vite dev server...');
  const server = await createServer({
    server: {
      port: 5195,
      host: true,
    },
  });
  await server.listen();

  const baseUrl = 'http://localhost:5195';
  console.log(`Server dev đang chạy tại: ${baseUrl}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: true,
  });

  try {
    // 1. Desktop Plan
    console.log('Chụp ảnh màn hình Desktop Kế hoạch (copd_desktop_plan.png)...');
    const desktopPage = await browser.newPage({
      viewport: { width: 1280, height: 850 },
    });
    await desktopPage.goto(baseUrl, { waitUntil: 'networkidle' });

    // Chọn module COPD
    const copdChip = await desktopPage.$('button:has-text("COPD")');
    if (copdChip) {
      await copdChip.click();
      await desktopPage.waitForTimeout(300);
    }

    // Chọn BN mẫu COPD
    const presetBtn = await desktopPage.$('button:has-text("Bệnh nhân mẫu")');
    if (presetBtn) {
      await presetBtn.click();
      await desktopPage.waitForTimeout(400);
      const bnCopdBtn = await desktopPage.$('button:has-text("COPD Nhóm E")');
      if (bnCopdBtn) {
        await bnCopdBtn.click();
        await desktopPage.waitForTimeout(500);
      } else {
        const anyCopd = await desktopPage.$('button:has-text("COPD")');
        if (anyCopd) await anyCopd.click();
      }
    }

    // Mở rộng dòng khuyến cáo đầu tiên để xem trích dẫn
    const planRows = await desktopPage.$$('.plan-row-header');
    if (planRows.length > 0) {
      await planRows[0].click();
      await desktopPage.waitForTimeout(300);
    }

    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'copd_desktop_plan.png'),
      fullPage: false,
    });
    console.log('✓ Đã lưu copd_desktop_plan.png');

    // 2. Desktop Matrix
    console.log('Chụp ảnh Ma trận bằng chứng (copd_desktop_matrix.png)...');
    const matrixTab = await desktopPage.$('button.tab-item:has-text("Bằng chứng")');
    if (matrixTab) {
      await matrixTab.click();
      await desktopPage.waitForTimeout(500);
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'copd_desktop_matrix.png'),
        fullPage: false,
      });
      console.log('✓ Đã lưu copd_desktop_matrix.png');
    }

    // 3. Desktop Pathway
    console.log('Chụp ảnh Lộ trình điều trị (copd_pathway.png)...');
    const pathwayTab = await desktopPage.$('button.tab-item:has-text("Lộ trình")');
    if (pathwayTab) {
      await pathwayTab.click();
      await desktopPage.waitForTimeout(500);
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'copd_pathway.png'),
        fullPage: false,
      });
      console.log('✓ Đã lưu copd_pathway.png');
    }

    await desktopPage.close();

    // 4. Mobile Plan (iPhone 390x844)
    console.log('Chụp ảnh Mobile Kế hoạch (copd_mobile_plan.png)...');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await mobilePage.goto(baseUrl, { waitUntil: 'networkidle' });

    const mCopdChip = await mobilePage.$('button:has-text("COPD")');
    if (mCopdChip) {
      await mCopdChip.click();
      await mobilePage.waitForTimeout(300);
    }

    const floatingBtn = await mobilePage.$('.floating-plan-btn');
    if (floatingBtn) {
      await floatingBtn.click();
      await mobilePage.waitForTimeout(400);
    }

    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'copd_mobile_plan.png'),
      fullPage: false,
    });
    console.log('✓ Đã lưu copd_mobile_plan.png');

    await mobilePage.close();
  } finally {
    await browser.close();
    await server.close();
    console.log('Đã đóng server và browser.');
  }
}

main().catch((err) => {
  console.error('Lỗi chụp ảnh:', err);
  process.exit(1);
});
