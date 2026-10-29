import { preview } from 'vite';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Đang khởi động preview server...');
  const server = await preview({
    preview: {
      port: 5192,
      host: true
    }
  });

  const baseUrl = server.resolvedUrls.local[0] || 'http://localhost:5192';
  console.log(`Server preview đang chạy tại: ${baseUrl}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: true
  });

  try {
    // 1. Chụp ảnh màn hình Desktop Kế hoạch điều trị (1280x850)
    console.log('Đang chụp ảnh màn hình Desktop Kế hoạch điều trị (hf_desktop_plan.png)...');
    const desktopPage = await browser.newPage({
      viewport: { width: 1280, height: 850 }
    });
    await desktopPage.goto(baseUrl, { waitUntil: 'networkidle' });

    // Mở modal preset và chọn BN 1 (ca mặc định HFrEF gdmt.org)
    const presetBtn = await desktopPage.$('button:has-text("Bệnh nhân mẫu")');
    if (presetBtn) {
      await presetBtn.click();
      await desktopPage.waitForTimeout(300);
      const bn1Btn = await desktopPage.$('button:has-text("BN 1: HFrEF")');
      if (bn1Btn) {
        await bn1Btn.click();
        await desktopPage.waitForTimeout(400);
      }
    }

    // Mở dòng Sacubitril/valsartan để xem gating và trích dẫn
    const planRows = await desktopPage.$$('.plan-row-header');
    for (const r of planRows) {
      const text = await r.innerText();
      if (text.includes('Sacubitril') || text.includes('ARNI')) {
        await r.click();
        break;
      }
    }
    await desktopPage.waitForTimeout(400);

    await desktopPage.screenshot({
      path: path.join(screenshotsDir, 'hf_desktop_plan.png'),
      fullPage: false
    });
    console.log('✓ Đã lưu hf_desktop_plan.png');

    // 2. Chụp ảnh màn hình Ma trận bằng chứng (hf_desktop_matrix.png)
    console.log('Đang chụp ảnh màn hình Ma trận bằng chứng (hf_desktop_matrix.png)...');
    const matrixTab = await desktopPage.$('button.tab-item:has-text("Bằng chứng")');
    if (matrixTab) {
      await matrixTab.click();
      await desktopPage.waitForTimeout(500);
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'hf_desktop_matrix.png'),
        fullPage: false
      });
      console.log('✓ Đã lưu hf_desktop_matrix.png');
    }

    // 3. Chụp ảnh màn hình Lộ trình điều trị (hf_pathway.png)
    console.log('Đang chụp ảnh màn hình Lộ trình điều trị (hf_pathway.png)...');
    const pathwayTab = await desktopPage.$('button.tab-item:has-text("Lộ trình")');
    if (pathwayTab) {
      await pathwayTab.click();
      await desktopPage.waitForTimeout(500);
      await desktopPage.screenshot({
        path: path.join(screenshotsDir, 'hf_pathway.png'),
        fullPage: false
      });
      console.log('✓ Đã lưu hf_pathway.png');
    }

    await desktopPage.close();

    // 4. Chụp ảnh màn hình Mobile Standard (390x844 - iPhone)
    console.log('Đang chụp ảnh màn hình Mobile (hf_mobile_plan.png)...');
    const mobilePage = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    await mobilePage.goto(baseUrl, { waitUntil: 'networkidle' });

    // Chụp màn hình Mobile
    const floatingBtn = await mobilePage.$('.floating-plan-btn');
    if (floatingBtn) {
      await floatingBtn.click();
      await mobilePage.waitForTimeout(400);
    }

    await mobilePage.screenshot({
      path: path.join(screenshotsDir, 'hf_mobile_plan.png'),
      fullPage: false
    });
    console.log('✓ Đã lưu hf_mobile_plan.png');

    await mobilePage.close();
  } finally {
    await browser.close();
    await server.close();
  }

  console.log('\n✔ Hoàn thành chụp tất cả ảnh màn hình module suy tim!');
}

main().catch((err) => {
  console.error('Lỗi chụp màn hình:', err);
  process.exit(1);
});
