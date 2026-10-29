import { preview } from 'vite';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const ROOT_DIR = process.cwd().endsWith('gdmt-vn') ? process.cwd() : path.join(process.cwd(), 'gdmt-vn');
  const screenshotsDir = path.resolve(ROOT_DIR, 'docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Khởi động preview server...');
  const server = await preview({
    preview: {
      port: 5182,
      host: true
    }
  });

  const baseUrl = server.resolvedUrls.local[0] || 'http://localhost:5182';
  console.log(`Server preview đang chạy tại: ${baseUrl}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: true
  });

  try {
    // 1. Chụp ảnh Mobile 390px (iPhone 14/15/16) - Kế hoạch CKD
    console.log('Đang chụp ảnh màn hình Mobile 390px - Kế hoạch CKD...');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    await mobilePage.goto(baseUrl, { waitUntil: 'networkidle' });

    // Chọn BN mẫu 1 (CKD G3bA3)
    const presetBtn = await mobilePage.$('button:has-text("BN mẫu")');
    if (presetBtn) {
      await presetBtn.click();
      await mobilePage.waitForTimeout(300);
      const firstPreset = await mobilePage.$('text=BN 1:');
      if (firstPreset) {
        await firstPreset.click();
        await mobilePage.waitForTimeout(500);
      } else {
        // Đóng modal nếu không tìm thấy
        await mobilePage.keyboard.press('Escape');
      }
    }

    // Bấm xem Kế hoạch trên mobile
    const floatingBtn = await mobilePage.$('.floating-plan-btn');
    if (floatingBtn) {
      await floatingBtn.click();
      await mobilePage.waitForTimeout(400);

      const firstRow = await mobilePage.$('.plan-row-header');
      if (firstRow) {
        await firstRow.click();
        await mobilePage.waitForTimeout(300);
      }

      await mobilePage.screenshot({
        path: path.join(screenshotsDir, 'ckd_mobile_plan_390.png'),
        fullPage: false
      });
      console.log('✓ Đã lưu ckd_mobile_plan_390.png');
    }

    await mobilePage.close();

    // 2. Chụp ảnh Desktop 1280x800 - Ma trận bằng chứng CKD
    console.log('Đang chụp ảnh Desktop - Ma trận bằng chứng CKD...');
    const desktopPage = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    });
    await desktopPage.goto(baseUrl, { waitUntil: 'networkidle' });

    // Chọn BN mẫu CKD
    const deskPresetBtn = await desktopPage.$('button:has-text("BN mẫu")');
    if (deskPresetBtn) {
      await deskPresetBtn.click();
      await desktopPage.waitForTimeout(300);
      const firstPreset = await desktopPage.$('text=BN 1:');
      if (firstPreset) {
        await firstPreset.click();
        await desktopPage.waitForTimeout(500);
      }
    }

    // Chuyển sang tab Bằng chứng (Ma trận)
    const evidenceTab = await desktopPage.$('button.tab-item:has-text("Bằng chứng")');
    if (evidenceTab) {
      await evidenceTab.click();
      await desktopPage.waitForTimeout(500);

      await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'ckd_matrix.png'),
        fullPage: false
      });
      console.log('✓ Đã lưu ckd_matrix.png');
    }

    // Chuyển sang tab Lộ trình
    const pathwayTab = await desktopPage.$('button.tab-item:has-text("Lộ trình")');
    if (pathwayTab) {
      await pathwayTab.click();
      await desktopPage.waitForTimeout(400);

      await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'ckd_pathway.png'),
        fullPage: false
      });
      console.log('✓ Đã lưu ckd_pathway.png');
    }

    await desktopPage.close();
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((err) => {
  console.error('Lỗi khi chụp ảnh màn hình:', err);
  process.exit(1);
});
